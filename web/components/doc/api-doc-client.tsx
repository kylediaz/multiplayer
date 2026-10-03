"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { dataplaneSocketUrl, dataplaneUrl, type DataplaneDocument } from "@/lib/dataplane"
import { cn } from "@/lib/utils"
import { HandRolledEngine } from "@shared/sync/client/handrolled-engine"
import { WebSocketTransport } from "@shared/sync/client/transport"
import type { SyncEngine } from "@shared/sync/client/engine"
import { EngineProvider, useEngine, useStatus } from "@shared/sync/react/hooks"
import type { JSONValue } from "@shared/sync/doc"
import { resolveKey } from "@shared/sync/schema"

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
        <Button nativeButton={false} variant="ghost" size="icon-sm" render={<Link href="/" aria-label="All documents" />}>
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
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
    (message: Record<string, unknown>) => {
      frame.current?.contentWindow?.postMessage({ ...message, source: "shell" }, dataplaneUrl)
    },
    []
  )

  const readKey = useCallback(
    (key: string): JSONValue => {
      const resolved = resolveKey(document.schema, key)
      if (!resolved) return null
      if (resolved.kind === "text") return engine.getText(key)
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

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== dataplaneUrl) return
      const data = event.data as {
        source?: string
        type?: string
        key?: string
        value?: JSONValue
        next?: string
        cursor?: number
      }
      if (!data || data.source !== "guest" || typeof data.type !== "string") return
      if (data.type === "subscribe" && data.key) {
        if (keys.current.has(data.key)) {
          push([data.key])
          return
        }
        keys.current.add(data.key)
        engine.subscribe(data.key, () => push([data.key!]))
        push([data.key])
        return
      }
      if (data.type === "set" && data.key) engine.setRegister(data.key, data.value ?? null)
      if (data.type === "text" && data.key && typeof data.next === "string") engine.editText(data.key, data.next, data.cursor)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [engine, push])

  return (
    <iframe
      ref={frame}
      title={document.title}
      sandbox="allow-scripts allow-same-origin"
      onLoad={() => post({ type: "ready" })}
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
  const engine = useEngine()
  const status = useStatus()
  const offline = engine.network.isOffline()
  const pending = status.inflight + status.buffered
  const [label, tone] = status.connected
    ? pending
      ? [`Syncing ${pending}`, "bg-amber-500"]
      : ["Live", "bg-emerald-500"]
    : offline
      ? [pending ? `Offline · ${pending} queued` : "Offline", "bg-zinc-400"]
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
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-3 w-72" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
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
