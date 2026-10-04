import type { JSONValue } from "../doc"
import type { ListEntry } from "../list"
import type { PeerInfo, PresenceState, User } from "../protocol"

type EngineKind = "handrolled"

export type Peer = PeerInfo

export type EngineStatus = {
  connected: boolean
  synced: boolean
  /** Server version of the document. */
  version: number | null
  inflight: number
  buffered: number
}

/** Everything the React layer knows about sync. */
export interface SyncEngine {
  readonly kind: EngineKind
  readonly clientId: string
  readonly user: User

  connect(): void
  destroy(): void

  subscribe(key: string, cb: () => void): () => void

  getRegister(key: string): JSONValue | undefined
  setRegister(key: string, value: JSONValue): void

  getText(key: string): string
  editText(key: string, next: string, cursor?: number): void

  getList(key: string): ListEntry[]
  listInsert(key: string, index: number, data?: Record<string, JSONValue>): string
  listDelete(key: string, id: string): void
  listMove(key: string, id: string, toIndex: number): void
  listUpdate(key: string, id: string, patch: Record<string, JSONValue>): void

  getPresence(): PresenceState
  setPresence(patch: Partial<PresenceState>): void
  getPeers(): Peer[]
  subscribePeers(cb: () => void): () => void

  getStatus(): EngineStatus
  subscribeStatus(cb: () => void): () => void
}

export class Emitter {
  private listeners = new Set<() => void>()
  subscribe = (cb: () => void) => {
    this.listeners.add(cb)
    return () => {
      this.listeners.delete(cb)
    }
  }
  emit() {
    for (const cb of [...this.listeners]) cb()
  }
}

export class KeyedEmitter<T = void> {
  private listeners = new Map<string, Set<(arg: T) => void>>()
  subscribe(key: string, cb: (arg: T) => void) {
    let set = this.listeners.get(key)
    if (!set) this.listeners.set(key, (set = new Set()))
    set.add(cb)
    return () => {
      set.delete(cb)
      if (!set.size) this.listeners.delete(key)
    }
  }
  emit(key: string, arg: T) {
    const set = this.listeners.get(key)
    if (set) for (const cb of [...set]) cb(arg)
  }
  emitAll(arg: T) {
    for (const key of [...this.listeners.keys()]) this.emit(key, arg)
  }
}

export function randomId(length = 10): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}
