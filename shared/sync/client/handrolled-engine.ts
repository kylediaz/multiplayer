import { applyOp, emptyState, type DocState, type JSONValue, type Op } from "../doc"
import type { Batch, ClientMessage, LoggedBatch, PresenceState, ServerMessage, User } from "../protocol"
import { apply as applyText, compose, fromDiff, isNoop, transform, type TextOp } from "../text-ot"
import { Emitter, KeyedEmitter, randomId, type EngineStatus, type NetworkControls, type Peer, type SyncEngine } from "./engine"
import type { Transport, TransportData } from "./transport"

const same = (a: JSONValue | undefined, b: JSONValue | undefined) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/**
 * Client half of the server-authoritative engine.
 *
 *   view = confirmed (server state at `version`) + inflight batch + buffer
 *
 * Only one batch is in flight at a time; edits made meanwhile are buffered and
 * coalesced (sets on the same key collapse, text ops on the same key compose).
 * When a remote batch arrives, its text ops are transformed past our inflight
 * and buffered ops (the ot.js client state machine, generalized to a doc of
 * many keys). Registers need no transform: re-deriving the view
 * from the new confirmed state replays them, and pending local values win
 * until acked, so remote updates never cause flicker.
 */
export class HandRolledEngine implements SyncEngine {
  readonly kind = "handrolled" as const
  readonly clientId = randomId(12)
  readonly user: User
  readonly network: NetworkControls

  private docId: string
  private transport: Transport
  private confirmed: DocState = emptyState()
  private version: number | null = null
  private inflight: Batch | null = null
  private buffer: Op[] = []
  private seq = 0
  private socketOpen = false
  private welcomed = false
  private synced = false
  private flushScheduled = false

  private presence: PresenceState = {}
  private presenceTimer: ReturnType<typeof setTimeout> | null = null

  private keys = new KeyedEmitter()
  private registerCache = new Map<string, JSONValue | undefined>()
  private textCache = new Map<string, string>()

  private peers = new Map<string, Peer>()
  private peerList: Peer[] = []
  private peerEmitter = new Emitter()
  private status: EngineStatus = {
    connected: false,
    synced: false,
    version: null,
    inflight: 0,
    buffered: 0,
  }
  private statusEmitter = new Emitter()

  constructor({ docId, user, transport }: { docId: string; user: User; transport: Transport }) {
    this.docId = docId
    this.user = user
    this.transport = transport
    this.network = transport
    transport.setHandlers({
      open: () => this.onOpen(),
      message: (data) => this.onMessage(data),
      close: () => this.onClose(),
    })
  }

  connect() {
    this.transport.connect()
  }

  destroy() {
    if (this.presenceTimer) clearTimeout(this.presenceTimer)
    this.transport.destroy()
  }

  private get live() {
    return this.socketOpen && this.welcomed
  }

  // ---------------------------------------------------------------- network

  private send(msg: ClientMessage) {
    this.transport.send(JSON.stringify(msg))
  }

  private hello(lastVersion: number | null) {
    this.send({
      type: "hello",
      docId: this.docId,
      clientId: this.clientId,
      user: this.user,
      presence: this.presence,
      lastVersion,
    })
  }

  private onOpen() {
    this.socketOpen = true
    this.welcomed = false
    this.hello(this.version)
    this.updateStatus()
  }

  private onClose() {
    this.socketOpen = false
    this.welcomed = false
    this.peers.clear()
    this.emitPeers()
    this.updateStatus()
  }

  private onMessage(data: TransportData) {
    const msg = JSON.parse(typeof data === "string" ? data : new TextDecoder().decode(data)) as ServerMessage
    switch (msg.type) {
      case "welcome":
        this.onWelcome(msg)
        break
      case "batch":
        this.onEntry(msg.entry)
        break
      case "presence":
        this.onPresence(msg)
        break
      case "resync":
        this.onResync()
        break
      case "error":
        break
    }
  }

  private onWelcome(msg: Extract<ServerMessage, { type: "welcome" }>) {
    if (msg.snapshot) {
      this.confirmed = msg.snapshot
      this.version = msg.version
      if (this.inflight) {
        if (msg.lastSeq < this.inflight.seq) this.buffer = [...this.inflight.ops, ...this.buffer]
        this.inflight = null
      }
      const textOps = this.buffer.filter((op) => op.t === "text").length
      if (textOps) this.buffer = this.buffer.filter((op) => op.t !== "text")
      this.invalidateAll()
    } else {
      const batches = msg.batches ?? []
      for (const entry of batches) this.onEntry(entry)
      if (this.inflight) this.sendInflight()
    }
    this.peers = new Map(msg.peers.map((p) => [p.clientId, p]))
    this.emitPeers()
    this.welcomed = true
    this.synced = true
    this.updateStatus()
    this.flush()
  }

  private onResync() {
    if (this.inflight) this.buffer = [...this.inflight.ops, ...this.buffer]
    this.inflight = null
    this.buffer = this.buffer.filter((op) => op.t !== "text")
    this.version = null
    this.welcomed = false
    this.hello(null)
    this.updateStatus()
  }

  private onEntry(entry: LoggedBatch) {
    if (this.version === null || entry.version <= this.version) return
    if (entry.version !== this.version + 1) {
      this.welcomed = false
      this.hello(this.version)
      return
    }

    const touched = new Set<string>()
    if (this.inflight && entry.clientId === this.clientId && entry.seq === this.inflight.seq) {
      for (const op of entry.ops) {
        applyOp(this.confirmed, op)
        touched.add(op.key)
      }
      for (const op of this.inflight.ops) touched.add(op.key)
      this.inflight = null
    } else {
      for (const op of entry.ops) {
        applyOp(this.confirmed, op)
        touched.add(op.key)
        if (op.t !== "text") continue
        let r = op.op
        if (this.inflight) r = transformPast(this.inflight.ops, op.key, r)
        transformPast(this.buffer, op.key, r)
      }
      if (this.inflight) this.inflight.baseVersion = entry.version
    }
    this.version = entry.version
    this.invalidate(touched)
    this.updateStatus()
    if (!this.inflight) this.flush()
  }

  private onPresence(msg: Extract<ServerMessage, { type: "presence" }>) {
    if (msg.presence === null) {
      this.peers.delete(msg.clientId)
    } else {
      const user = msg.user ?? this.peers.get(msg.clientId)?.user
      if (!user) return
      this.peers.set(msg.clientId, { clientId: msg.clientId, user, presence: msg.presence })
    }
    this.emitPeers()
  }

  private scheduleFlush() {
    if (this.flushScheduled) return
    this.flushScheduled = true
    setTimeout(() => {
      this.flushScheduled = false
      this.flush()
    }, 0)
  }

  private flush() {
    if (!this.live || this.version === null || this.inflight || !this.buffer.length) return
    this.inflight = { seq: ++this.seq, baseVersion: this.version, ops: this.buffer }
    this.buffer = []
    this.sendInflight()
  }

  /** On resend, baseVersion and text ops have been advanced past everything received since the first send. */
  private sendInflight() {
    const b = this.inflight!
    this.send({ type: "batch", batch: { seq: b.seq, baseVersion: b.baseVersion, ops: b.ops } })
    this.updateStatus()
  }

  // ------------------------------------------------------------------- view

  private *pending(): Generator<Op> {
    if (this.inflight) yield* this.inflight.ops
    yield* this.buffer
  }

  subscribe = (key: string, cb: () => void) => this.keys.subscribe(key, cb)

  getRegister = (key: string): JSONValue | undefined => {
    if (this.registerCache.has(key)) return this.registerCache.get(key)
    let value = this.confirmed.registers[key]
    for (const op of this.pending()) if (op.t === "set" && op.key === key) value = op.value
    this.registerCache.set(key, value)
    return value
  }

  getText = (key: string): string => {
    const cached = this.textCache.get(key)
    if (cached !== undefined) return cached
    let text = this.confirmed.texts[key] ?? ""
    for (const op of this.pending()) if (op.t === "text" && op.key === key) text = applyText(op.op, text)
    this.textCache.set(key, text)
    return text
  }

  private invalidate(keys: Iterable<string>) {
    for (const key of keys) {
      this.registerCache.delete(key)
      this.textCache.delete(key)
      this.keys.emit(key, undefined)
    }
  }

  private invalidateAll() {
    this.registerCache.clear()
    this.textCache.clear()
    this.keys.emitAll(undefined)
  }

  // -------------------------------------------------------------- mutations

  private pushLocal(op: Op) {
    if (op.t === "set") {
      this.buffer = this.buffer.filter((o) => !(o.t === "set" && o.key === op.key))
      this.buffer.push(op)
    } else if (op.t === "text") {
      const i = this.buffer.findIndex((o) => o.t === "text" && o.key === op.key)
      if (i >= 0) {
        const prev = this.buffer[i] as Extract<Op, { t: "text" }>
        this.buffer[i] = { ...op, op: compose(prev.op, op.op) }
      } else {
        this.buffer.push(op)
      }
    }
    this.invalidate([op.key])
    this.updateStatus()
    this.scheduleFlush()
  }

  setRegister(key: string, value: JSONValue) {
    if (!this.synced) return
    const prev = this.getRegister(key)
    if (same(prev, value)) return
    this.pushLocal({ t: "set", key, value })
  }

  editText(key: string, next: string, cursor?: number) {
    if (!this.synced) return
    const op = fromDiff(this.getText(key), next, cursor)
    if (isNoop(op)) return
    this.pushLocal({ t: "text", key, op })
  }

  // --------------------------------------------------------------- presence

  getPresence = () => this.presence

  setPresence = (patch: Partial<PresenceState>) => {
    this.presence = { ...this.presence, ...patch }
    if (this.presenceTimer) return
    this.presenceTimer = setTimeout(() => {
      this.presenceTimer = null
      if (this.live) this.send({ type: "presence", presence: this.presence })
    }, 50)
  }

  getPeers = () => this.peerList
  subscribePeers = (cb: () => void) => this.peerEmitter.subscribe(cb)

  private emitPeers() {
    this.peerList = [...this.peers.values()].sort((a, b) => a.user.name.localeCompare(b.user.name))
    this.peerEmitter.emit()
  }

  // ---------------------------------------------------------------- status

  getStatus = () => this.status
  subscribeStatus = (cb: () => void) => this.statusEmitter.subscribe(cb)

  private updateStatus() {
    const next: EngineStatus = {
      connected: this.live,
      synced: this.synced,
      version: this.version,
      inflight: this.inflight?.ops.length ?? 0,
      buffered: this.buffer.length,
    }
    const prev = this.status
    if ((Object.keys(next) as (keyof EngineStatus)[]).every((k) => next[k] === prev[k])) return
    this.status = next
    this.statusEmitter.emit()
  }
}

/** Transform remote op `r` past each pending text op on `key`, rewriting those ops in place. */
function transformPast(ops: Op[], key: string, r: TextOp): TextOp {
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    if (op.t !== "text" || op.key !== key) continue
    const [pending, remote] = transform(op.op, r)
    ops[i] = { ...op, op: pending }
    r = remote
  }
  return r
}
