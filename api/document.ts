import { applyOp, cloneState, emptyState, TextMismatchError, type DocState, type Op } from "../shared/sync/doc"
import {
  SERVER_CLIENT_ID,
  type Batch,
  type ClientMessage,
  type LoggedBatch,
  type PresenceState,
  type ServerMessage,
  type User,
} from "../shared/sync/protocol"
import { validateSchemaOp, type Schema } from "../shared/sync/schema"
import { baseLength, transform } from "../shared/sync/text-ot"

export type Snapshot = { version: number; state: DocState; lastSeq: Record<string, number> }

export interface Conn {
  send(msg: ServerMessage): void
  close(): void
}

export type OpStore = {
  loadSnapshot(docId: string): Snapshot | null
  saveSnapshot(docId: string, snapshot: Snapshot): void
  appendBatch(docId: string, entry: LoggedBatch): void
  opsSince(docId: string, version: number): LoggedBatch[]
}

type Member = { conn: Conn; clientId: string; user: User; presence: PresenceState }

const SNAPSHOT_EVERY = 100
const MEMORY_LOG_MAX = 1000
const CATCH_UP_MAX = 2000

/**
 * The live document. Registers and list items are applied in version order.
 * Text ops are transformed against anything sequenced after the client's baseVersion.
 */
export class Document {
  readonly docId: string
  private schema: Schema
  private store: OpStore | null
  state: DocState
  version: number
  private lastSeq = new Map<string, number>()
  private log: LoggedBatch[] = []
  private logStart: number
  private members = new Map<string, Member>()
  onEmpty?: () => void

  constructor({ docId, schema, store }: { docId: string; schema: Schema; store?: OpStore | null }) {
    this.docId = docId
    this.schema = schema
    this.store = store ?? null
    const snapshot = this.store?.loadSnapshot(docId)
    this.state = snapshot ? snapshot.state : emptyState()
    this.version = snapshot?.version ?? 0
    this.logStart = this.version
    for (const [clientId, seq] of Object.entries(snapshot?.lastSeq ?? {})) this.lastSeq.set(clientId, seq)
    for (const entry of this.store?.opsSince(docId, this.version) ?? []) {
      for (const op of entry.ops) applyOp(this.state, op)
      this.version = entry.version
      this.lastSeq.set(entry.clientId, entry.seq)
      this.log.push(entry)
    }
  }

  get size() {
    return this.members.size
  }

  setSchema(schema: Schema) {
    this.schema = schema
  }

  join(conn: Conn, hello: Extract<ClientMessage, { type: "hello" }>) {
    const existing = this.members.get(hello.clientId)
    if (existing && existing.conn !== conn) existing.conn.close()

    const member: Member = { conn, clientId: hello.clientId, user: hello.user, presence: hello.presence }
    this.members.set(hello.clientId, member)

    const peers = [...this.members.values()]
      .filter((m) => m.clientId !== hello.clientId)
      .map((m) => ({ clientId: m.clientId, user: m.user, presence: m.presence }))
    const lastSeq = this.lastSeq.get(hello.clientId) ?? 0
    const { lastVersion } = hello
    const canCatchUp =
      lastVersion !== null && lastVersion >= 0 && lastVersion <= this.version && this.version - lastVersion <= CATCH_UP_MAX
    if (canCatchUp) {
      conn.send({ type: "welcome", version: this.version, lastSeq, batches: this.opsSince(lastVersion), peers })
    } else {
      conn.send({ type: "welcome", version: this.version, lastSeq, snapshot: cloneState(this.state), peers })
    }
    this.broadcastPresence(member, conn)
  }

  receive(conn: Conn, clientId: string, msg: ClientMessage) {
    const member = this.members.get(clientId)
    if (!member || member.conn !== conn) return
    switch (msg.type) {
      case "hello":
        this.join(conn, msg)
        return
      case "presence":
        member.presence = msg.presence
        this.broadcastPresence(member, conn)
        return
      case "batch":
        this.receiveBatch(conn, clientId, msg.batch)
        return
    }
  }

  leave(conn: Conn, clientId: string) {
    const member = this.members.get(clientId)
    if (!member || member.conn !== conn) return
    this.members.delete(clientId)
    for (const m of this.members.values()) m.conn.send({ type: "presence", clientId, presence: null })
    if (!this.members.size) this.onEmpty?.()
  }

  private receiveBatch(conn: Conn, clientId: string, batch: Batch) {
    if (batch.seq <= (this.lastSeq.get(clientId) ?? 0)) return
    if (batch.baseVersion > this.version || batch.baseVersion < 0) {
      conn.send({ type: "resync", reason: `baseVersion ${batch.baseVersion} is ahead of server ${this.version}` })
      return
    }
    let ops: Op[]
    try {
      ops = this.rebase(batch)
    } catch (err) {
      if (!(err instanceof TextMismatchError)) throw err
      conn.send({ type: "resync", reason: err.message })
      return
    }
    const applied: Op[] = []
    for (const op of ops) {
      const canonical = validateSchemaOp(this.schema, this.state, op)
      if (!canonical) continue
      applyOp(this.state, canonical)
      applied.push(canonical)
    }
    this.commit(clientId, batch.seq, applied)
  }

  private rebase(batch: Batch): Op[] {
    const history = this.opsSince(batch.baseVersion)
    const lengths = new Map<string, number>()
    return batch.ops.map((op) => {
      if (op.t !== "text") return op
      let textOp = op.op
      for (const entry of history) {
        for (const other of entry.ops) {
          if (other.t === "text" && other.key === op.key) textOp = transform(textOp, other.op)[0]
        }
      }
      const len = lengths.get(op.key) ?? (this.state.texts[op.key] ?? "").length
      if (baseLength(textOp) > len) {
        throw new TextMismatchError(`text op on ${op.key} covers ${baseLength(textOp)} chars, doc has ${len}`)
      }
      lengths.set(op.key, len + textLengthDelta(textOp))
      return { ...op, op: textOp }
    })
  }

  private commit(clientId: string, seq: number, ops: Op[]) {
    this.version++
    if (clientId !== SERVER_CLIENT_ID) this.lastSeq.set(clientId, seq)
    const entry: LoggedBatch = { version: this.version, clientId, seq, ops }
    this.log.push(entry)
    if (this.log.length > MEMORY_LOG_MAX && this.store) {
      this.log = this.log.slice(-MEMORY_LOG_MAX / 2)
      this.logStart = this.log[0].version - 1
    }
    this.store?.appendBatch(this.docId, entry)
    if (this.version % SNAPSHOT_EVERY === 0) this.snapshot()
    for (const member of this.members.values()) member.conn.send({ type: "batch", entry })
  }

  opsSince(version: number): LoggedBatch[] {
    if (version >= this.logStart) return this.log.slice(version - this.logStart)
    return this.store?.opsSince(this.docId, version) ?? []
  }

  snapshot() {
    this.store?.saveSnapshot(this.docId, {
      version: this.version,
      state: this.state,
      lastSeq: Object.fromEntries(this.lastSeq),
    })
  }

  private broadcastPresence(member: Member, except: Conn) {
    for (const other of this.members.values()) {
      if (other.conn === except) continue
      other.conn.send({ type: "presence", clientId: member.clientId, user: member.user, presence: member.presence })
    }
  }
}

function textLengthDelta(op: (number | string)[]): number {
  let delta = 0
  for (const part of op) {
    if (typeof part === "string") delta += part.length
    else if (part < 0) delta += part
  }
  return delta
}
