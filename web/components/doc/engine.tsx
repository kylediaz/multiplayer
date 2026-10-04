"use client"

import { createContext, useContext, useSyncExternalStore } from "react"
import type { SyncEngine } from "@shared/sync/client/engine"

const EngineContext = createContext<SyncEngine | null>(null)

export function EngineProvider({ engine, children }: { engine: SyncEngine; children: React.ReactNode }) {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}

export function useEngine(): SyncEngine {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error("useEngine must be used inside <EngineProvider>")
  return engine
}

export function useStatus() {
  const engine = useEngine()
  return useSyncExternalStore(engine.subscribeStatus, engine.getStatus, engine.getStatus)
}
