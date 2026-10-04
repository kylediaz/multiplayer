import type { DocState, JSONValue, Op } from "./doc"
import type { TextOp } from "./text-ot"

export type User = { name: string; color: string }

export type PresenceState = {
  focus?: string | null
}

export type PeerInfo = { clientId: string; user: User; presence: PresenceState }

/** A client's unit of work. One batch is in flight per client at a time (the Jupiter model). */
export type Batch = { seq: number; baseVersion: number; ops: Op[] }

/** A batch as sequenced by the server. `ops` are the canonical, transformed ops. */
export type LoggedBatch = { version: number; clientId: string; seq: number; ops: Op[] }

export type ClientMessage =
  | {
      type: "hello"
      docId: string
      clientId: string
      user: User
      presence: PresenceState
      lastVersion: number | null
    }
  | { type: "batch"; batch: Batch }
  | { type: "presence"; presence: PresenceState }

export type ServerMessage =
  | {
      type: "welcome"
      version: number
      /** Highest seq the server has applied from this client. */
      lastSeq: number
      snapshot: DocState
      peers: PeerInfo[]
    }
  | {
      type: "welcome"
      version: number
      /** Highest seq the server has applied from this client. */
      lastSeq: number
      batches: LoggedBatch[]
      peers: PeerInfo[]
    }
  | { type: "batch"; entry: LoggedBatch }
  | { type: "presence"; clientId: string; user: User; presence: PresenceState }
  | { type: "presence"; clientId: string; presence: null }
  | { type: "resync"; reason: string }
  | { type: "error"; message: string }

export const SERVER_CLIENT_ID = "server"

export function parseClientMessage(value: unknown): ClientMessage | null {
  if (!isRecord(value)) return null
  switch (value.type) {
    case "hello": {
      const user = parseUser(value.user)
      const presence = parsePresence(value.presence)
      const lastVersion = value.lastVersion
      if (typeof value.docId !== "string" || typeof value.clientId !== "string" || !user || !presence) return null
      if (typeof lastVersion !== "number" && lastVersion !== null) return null
      if (typeof lastVersion === "number" && !Number.isFinite(lastVersion)) return null
      return { type: "hello", docId: value.docId, clientId: value.clientId, user, presence, lastVersion }
    }
    case "batch": {
      const batch = parseBatch(value.batch)
      return batch && { type: "batch", batch }
    }
    case "presence": {
      const presence = parsePresence(value.presence)
      return presence && { type: "presence", presence }
    }
    default:
      return null
  }
}

export function parseServerMessage(value: unknown): ServerMessage | null {
  if (!isRecord(value)) return null
  switch (value.type) {
    case "welcome": {
      if (!isFiniteNumber(value.version) || !isFiniteNumber(value.lastSeq)) return null
      const peers = parsePeers(value.peers)
      if (!peers) return null
      if (value.snapshot !== undefined) {
        const snapshot = parseState(value.snapshot)
        return snapshot && { type: "welcome", version: value.version, lastSeq: value.lastSeq, snapshot, peers }
      }
      const batches = parseLoggedBatches(value.batches)
      return batches && { type: "welcome", version: value.version, lastSeq: value.lastSeq, batches, peers }
    }
    case "batch": {
      const entry = parseLoggedBatch(value.entry)
      return entry && { type: "batch", entry }
    }
    case "presence": {
      if (typeof value.clientId !== "string") return null
      if (value.presence === null) return { type: "presence", clientId: value.clientId, presence: null }
      const user = parseUser(value.user)
      const presence = parsePresence(value.presence)
      return user && presence ? { type: "presence", clientId: value.clientId, user, presence } : null
    }
    case "resync":
      return typeof value.reason === "string" ? { type: "resync", reason: value.reason } : null
    case "error":
      return typeof value.message === "string" ? { type: "error", message: value.message } : null
    default:
      return null
  }
}

function parseState(value: unknown): DocState | null {
  if (!isRecord(value)) return null
  const registers = jsonObject(value.registers)
  const texts = stringRecord(value.texts)
  const lists = parseLists(value.lists)
  if (!registers || !texts || !lists) return null
  return { registers, texts, lists }
}

function parseLists(value: unknown): DocState["lists"] | null {
  if (!isRecord(value)) return null
  const lists: DocState["lists"] = {}
  for (const [key, list] of Object.entries(value)) {
    const parsed = parseList(list)
    if (!parsed) return null
    lists[key] = parsed
  }
  return lists
}

function parseList(value: unknown): DocState["lists"][string] | null {
  if (!isRecord(value)) return null
  const list: DocState["lists"][string] = {}
  for (const [id, item] of Object.entries(value)) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.pos !== "string" || typeof item.deleted !== "boolean") return null
    const data = jsonObject(item.data)
    if (!data) return null
    list[id] = { id: item.id, pos: item.pos, deleted: item.deleted, data }
  }
  return list
}

function parseLoggedBatches(value: unknown): LoggedBatch[] | null {
  if (!Array.isArray(value)) return null
  const batches: LoggedBatch[] = []
  for (const batch of value) {
    const parsed = parseLoggedBatch(batch)
    if (!parsed) return null
    batches.push(parsed)
  }
  return batches
}

function parseLoggedBatch(value: unknown): LoggedBatch | null {
  if (!isRecord(value) || !isFiniteNumber(value.version) || typeof value.clientId !== "string" || !isFiniteNumber(value.seq)) return null
  const ops = parseOps(value.ops)
  return ops && { version: value.version, clientId: value.clientId, seq: value.seq, ops }
}

function parseBatch(value: unknown): Batch | null {
  if (!isRecord(value) || !isFiniteNumber(value.seq) || !isFiniteNumber(value.baseVersion)) return null
  const ops = parseOps(value.ops)
  return ops && { seq: value.seq, baseVersion: value.baseVersion, ops }
}

function parseOps(value: unknown): Op[] | null {
  if (!Array.isArray(value)) return null
  const ops: Op[] = []
  for (const op of value) {
    const parsed = parseOp(op)
    if (!parsed) return null
    ops.push(parsed)
  }
  return ops
}

function parseOp(value: unknown): Op | null {
  if (!isRecord(value) || typeof value.key !== "string") return null
  switch (value.t) {
    case "set":
      return isJSONValue(value.value) ? { t: "set", key: value.key, value: value.value } : null
    case "text":
      return isTextOp(value.op) ? { t: "text", key: value.key, op: value.op } : null
    case "list.insert": {
      const data = jsonObject(value.data)
      return typeof value.id === "string" && typeof value.pos === "string" && data
        ? { t: "list.insert", key: value.key, id: value.id, pos: value.pos, data }
        : null
    }
    case "list.delete":
      return typeof value.id === "string" ? { t: "list.delete", key: value.key, id: value.id } : null
    case "list.restore":
      return typeof value.id === "string" ? { t: "list.restore", key: value.key, id: value.id } : null
    case "list.move":
      return typeof value.id === "string" && typeof value.pos === "string"
        ? { t: "list.move", key: value.key, id: value.id, pos: value.pos }
        : null
    case "list.update": {
      const patch = jsonObject(value.patch)
      return typeof value.id === "string" && patch ? { t: "list.update", key: value.key, id: value.id, patch } : null
    }
    default:
      return null
  }
}

function parsePeers(value: unknown): PeerInfo[] | null {
  if (!Array.isArray(value)) return null
  const peers: PeerInfo[] = []
  for (const peer of value) {
    if (!isRecord(peer) || typeof peer.clientId !== "string") return null
    const user = parseUser(peer.user)
    const presence = parsePresence(peer.presence)
    if (!user || !presence) return null
    peers.push({ clientId: peer.clientId, user, presence })
  }
  return peers
}

function parseUser(value: unknown): User | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.color !== "string") return null
  return { name: value.name, color: value.color }
}

function parsePresence(value: unknown): PresenceState | null {
  if (!isRecord(value)) return null
  if (value.focus === undefined) return {}
  return typeof value.focus === "string" || value.focus === null ? { focus: value.focus } : null
}

function stringRecord(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null
  const out: Record<string, string> = {}
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== "string") return null
    out[key] = item
  }
  return out
}

function jsonObject(value: unknown): Record<string, JSONValue> | null {
  if (!isRecord(value)) return null
  const out: Record<string, JSONValue> = {}
  for (const [key, item] of Object.entries(value)) {
    if (!isJSONValue(item)) return null
    out[key] = item
  }
  return out
}

function isJSONValue(value: unknown): value is JSONValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isJSONValue)
  return jsonObject(value) !== null
}

function isTextOp(value: unknown): value is TextOp {
  return Array.isArray(value) && value.every((part) => typeof part === "string" || (typeof part === "number" && Number.isFinite(part)))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
