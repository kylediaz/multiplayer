"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import { dataplaneSocketUrl, dataplaneUrl, type DataplaneDocument } from "@/lib/dataplane"
import { cn } from "@/lib/utils"
import { HandRolledEngine } from "@shared/sync/client/handrolled-engine"
import { WebSocketTransport } from "@shared/sync/client/transport"
import type { SyncEngine } from "@shared/sync/client/engine"
import { EngineProvider, useEngine, useStatus } from "@/components/doc/engine"
import type { JSONValue } from "@shared/sync/doc"
import { resolveKey } from "@shared/sync/schema"
import type { ShellMessage } from "@/lib/shell-messages"

const emptySubscribe = () => () => {}

export function ApiDocClient({ document }: { document: DataplaneDocument }) {
  const engine = useEngineInstance(document.id)
  if (!engine) return <DocSkeleton />
  return (
    <EngineProvider engine={engine}>
      <Shell document={document} />
    </EngineProvider>
  )
}

function useEngineInstance(docId: string): SyncEngine | null {
  const current = useRef<SyncEngine | null>(null)
  const subscribe = useCallback(
    (notify: () => void) => {
      const engine = new HandRolledEngine({
        docId,
        user: { name: "viewer", color: "#888" },
        transport: new WebSocketTransport(dataplaneSocketUrl(docId)),
      })
      engine.connect()
      current.current = engine
      notify()
      return () => {
        engine.destroy()
        if (current.current === engine) current.current = null
      }
    },
    [docId]
  )
  return useSyncExternalStore(subscribe, () => current.current, () => null)
}

function Shell({ document }: { document: DataplaneDocument }) {
  const status = useStatus()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/" aria-label="All documents" className="inline-flex size-6 items-center justify-center rounded-md text-sm text-muted-foreground">
          ←
        </Link>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{document.title}</span>
          <span className="truncate font-mono text-[10px] text-muted-foreground">{document.id}</span>
        </div>
        <ConnectionBadge />
        <ViewerCount />
      </header>
      {status.synced ? (
        document.viewRevision ? (
          <CodeFrame document={document} />
        ) : (
          <p className="text-sm text-muted-foreground">This document has no app yet.</p>
        )
      ) : (
        <FormSkeleton />
      )}
    </div>
  )
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
      style={{ height: "calc(100vh - 7.5rem)" }}
      className="w-full rounded-lg border bg-white"
    />
  )
}

function ViewerCount() {
  const engine = useEngine()
  const status = useStatus()
  const peers = useSyncExternalStore(engine.subscribePeers, engine.getPeers, engine.getPeers)
  if (!status.connected) return null
  const count = peers.length + 1
  return (
    <span className="text-[10px] text-muted-foreground">
      {count} {count === 1 ? "viewer" : "viewers"}
    </span>
  )
}

function ConnectionBadge() {
  const status = useStatus()
  const pending = status.inflight + status.buffered
  const [label, tone] = status.connected
    ? pending
      ? [`Syncing ${pending}`, "bg-amber-500"]
      : ["Live", "bg-emerald-500"]
    : [pending ? `Reconnecting · ${pending} queued` : "Connecting", "bg-amber-500"]

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", tone)} />
      {label}
    </span>
  )
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg p-4 ring-1 ring-foreground/10">
      <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-3 w-72 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-8 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}

function DocSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6">
      <FormSkeleton />
    </div>
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
