import type { DocState, Op } from "./doc"

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
      snapshot?: DocState
      batches?: LoggedBatch[]
      peers: PeerInfo[]
    }
  | { type: "batch"; entry: LoggedBatch }
  | { type: "presence"; clientId: string; user?: User; presence: PresenceState | null }
  | { type: "resync"; reason: string }
  | { type: "error"; message: string }

export const SERVER_CLIENT_ID = "server"
