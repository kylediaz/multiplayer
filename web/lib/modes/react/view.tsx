"use client"

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import { dataplaneUrl, type DataplaneDocument } from "@/lib/dataplane"
import { useEngine } from "@/components/doc/engine"
import type { JSONValue } from "@shared/sync/doc"
import { resolveKey } from "@shared/sync/schema"
import type { ShellMessage } from "@/lib/shell-messages"

type ReactViewProps = {
  document: DataplaneDocument
}

const emptySubscribe = () => () => {}

export function ReactView({ document }: ReactViewProps) {
  return <CodeFrame document={document} />
}

function CodeFrame({ document }: { document: DataplaneDocument }) {
  const engine = useEngine()
  const frame = useRef<HTMLIFrameElement>(null)
  const keys = useRef(new Set<string>())
  const parentOrigin = useSyncExternalStore(emptySubscribe, () => window.location.origin, () => null)

  const post = useCallback(
    (message: ShellMessage) => {
      frame.current?.contentWindow?.postMessage({ ...message, source: "shell" }, dataplaneUrl)
    },
    []
  )

  const readKey = useCallback(
    (key: string): JSONValue => {
      const resolved = resolveKey(document.schema, key)
      if (!resolved) return null
      if (resolved.kind === "text") return engine.getText(key)
      if (resolved.kind === "list") return engine.getList(key)
      return engine.getRegister(key) ?? null
    },
    [document.schema, engine]
  )

  const push = useCallback(
    (names: Iterable<string>) => {
      const values: Record<string, JSONValue> = {}
      for (const key of names) values[key] = readKey(key)
      post({ type: "keys", values })
    },
    [post, readKey]
  )

  const postPeers = useCallback(() => {
    post({
      type: "peers",
      peers: engine.getPeers().flatMap((peer) =>
        typeof peer.presence.focus === "string" ? [{ focus: peer.presence.focus, color: peer.user.color }] : []
      ),
    })
  }, [engine, post])

  useEffect(() => engine.subscribePeers(postPeers), [engine, postPeers])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== dataplaneUrl) return
      const data = viewMessage(event.data)
      if (!data) return
      switch (data.type) {
        case "subscribe":
          if (keys.current.has(data.key)) {
            push([data.key])
            return
          }
          keys.current.add(data.key)
          engine.subscribe(data.key, () => push([data.key]))
          push([data.key])
          return
        case "set":
          engine.setRegister(data.key, data.value)
          return
        case "text":
          engine.editText(data.key, data.next, data.cursor)
          return
        case "list":
          switch (data.action) {
            case "insert":
              engine.listInsert(data.key, data.index, data.data)
              return
            case "delete":
              engine.listDelete(data.key, data.id)
              return
            case "move":
              engine.listMove(data.key, data.id, data.index)
              return
            case "update":
              engine.listUpdate(data.key, data.id, data.patch)
              return
          }
          return
        case "presence":
          engine.setPresence({ focus: data.presence.focus })
          return
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [engine, push])

  return (
    <iframe
      ref={frame}
      title={document.title}
      sandbox="allow-scripts allow-same-origin"
      onLoad={() => {
        post({ type: "ready" })
        postPeers()
      }}
      src={
        parentOrigin
          ? `${dataplaneUrl}/v1/documents/${document.id}/views/current/index.html?parent=${encodeURIComponent(parentOrigin)}`
          : undefined
      }
      className="block h-full w-full border-0 bg-white"
    />
  )
}

type ViewMessage =
  | { type: "subscribe"; key: string }
  | { type: "set"; key: string; value: JSONValue }
  | { type: "text"; key: string; next: string; cursor?: number }
  | { type: "list"; key: string; action: "insert"; index: number; data: Record<string, JSONValue> }
  | { type: "list"; key: string; action: "delete"; id: string }
  | { type: "list"; key: string; action: "move"; id: string; index: number }
  | { type: "list"; key: string; action: "update"; id: string; patch: Record<string, JSONValue> }
  | { type: "presence"; presence: { focus: string | null } }

function viewMessage(value: unknown): ViewMessage | null {
  if (!isRecord(value) || value.source !== "view" || typeof value.type !== "string") return null
  const key = typeof value.key === "string" ? value.key : null
  switch (value.type) {
    case "subscribe":
      return key ? { type: "subscribe", key } : null
    case "set":
      return key && isJSONValue(value.value) ? { type: "set", key, value: value.value } : null
    case "text":
      if (!key || typeof value.next !== "string") return null
      return { type: "text", key, next: value.next, ...(typeof value.cursor === "number" ? { cursor: value.cursor } : {}) }
    case "list":
      return key ? listMessage(key, value) : null
    case "presence": {
      if (!isRecord(value.presence)) return null
      const focus = value.presence.focus
      return typeof focus === "string" || focus === null ? { type: "presence", presence: { focus } } : null
    }
    default:
      return null
  }
}

function listMessage(key: string, value: Record<string, unknown>): ViewMessage | null {
  switch (value.action) {
    case "insert":
      return typeof value.index === "number" && isJSONObject(value.data)
        ? { type: "list", key, action: "insert", index: value.index, data: value.data }
        : null
    case "delete":
      return typeof value.id === "string" ? { type: "list", key, action: "delete", id: value.id } : null
    case "move":
      return typeof value.id === "string" && typeof value.index === "number"
        ? { type: "list", key, action: "move", id: value.id, index: value.index }
        : null
    case "update":
      return typeof value.id === "string" && isJSONObject(value.patch)
        ? { type: "list", key, action: "update", id: value.id, patch: value.patch }
        : null
    default:
      return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isJSONObject(value: unknown): value is Record<string, JSONValue> {
  return isRecord(value) && Object.values(value).every(isJSONValue)
}

function isJSONValue(value: unknown): value is JSONValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isJSONValue)
  return isJSONObject(value)
}
