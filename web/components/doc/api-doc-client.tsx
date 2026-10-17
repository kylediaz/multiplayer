"use client"

import { useCallback, useRef, useSyncExternalStore, type ReactNode } from "react"
import { dataplaneSocketUrl, type DataplaneDocument } from "@/lib/dataplane"
import { HandRolledEngine } from "@shared/sync/client/handrolled-engine"
import { WebSocketTransport } from "@shared/sync/client/transport"
import type { SyncEngine } from "@shared/sync/client/engine"
import { EngineProvider, useStatus } from "@/components/doc/engine"
import { CodeBlock, CodeBlockContent, CodeBlockCopyButton, CodeBlockHeader } from "@/components/ui/code-block"
import { modeRenderer } from "@/lib/modes/render"

export function ApiDocClient({ document, source }: { document: DataplaneDocument; source: string | null }) {
  const engine = useEngineInstance(document.id)
  if (!engine) return <DocSkeleton source={source} />
  return (
    <EngineProvider engine={engine}>
      <Shell document={document} source={source} />
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

function Shell({ document, source }: { document: DataplaneDocument; source: string | null }) {
  const status = useStatus()
  const View = modeRenderer(document.type)
  const view = status.synced ? (
    document.viewRevision ? (
      <View document={document} source={source} />
    ) : (
      <p className="p-6 text-sm text-muted-foreground">This document has no app yet.</p>
    )
  ) : (
    <FormSkeleton />
  )
  return (
    <PhoneStage source={source}>
      {view}
    </PhoneStage>
  )
}

function PhoneStage({ source, children }: { source: string | null; children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <div className="min-h-0 flex-1 md:flex md:items-center md:justify-center md:bg-muted md:p-6">
        <div className="flex h-full w-full md:h-[min(844px,100%)] md:w-full md:max-w-6xl md:gap-4">
          <div className="h-full min-w-0 flex-1 bg-white md:w-[390px] md:flex-none md:overflow-hidden md:rounded-[2.5rem] md:border md:bg-white md:shadow-lg">
            <div className="h-full">{children}</div>
          </div>
          <SourcePanel source={source} />
        </div>
      </div>
    </div>
  )
}

function SourcePanel({ source }: { source: string | null }) {
  return (
    <CodeBlock className="hidden h-full min-w-0 flex-1 rounded-xl bg-background shadow-lg md:flex">
      <CodeBlockHeader className="justify-end">
        {source ? <CodeBlockCopyButton value={source} /> : null}
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers className="min-h-0 flex-1">
        {source ?? "This view has no saved source."}
      </CodeBlockContent>
    </CodeBlock>
  )
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg p-4">
      <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-3 w-72 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-8 w-full animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}

function DocSkeleton({ source }: { source: string | null }) {
  return (
    <PhoneStage source={source}>
      <FormSkeleton />
    </PhoneStage>
  )
}
