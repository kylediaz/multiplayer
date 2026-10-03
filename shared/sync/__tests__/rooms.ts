import { DataplaneRoom, type Conn, type OpStore, type Snapshot } from "../../../api/room"
import type { ClientMessage, LoggedBatch } from "../protocol"
import { parseSchema, type Schema } from "../schema"

const bugReport = parseSchema({
  keys: {
    severity: { kind: "register", value: "string", enum: ["blocker", "major", "minor", "cosmetic"] },
    frequency: { kind: "register", value: "string", enum: ["always", "sometimes", "rarely"] },
    regression: { kind: "register", value: "boolean" },
    seen: { kind: "register", value: "string", maxLength: 10 },
    title: { kind: "text" },
    expected: { kind: "text" },
  },
})

const schemas: Record<string, Schema> = { "bug-report": bugReport }

function schemaFor(docId: string): Schema | null {
  return schemas[docId.split("~")[0]] ?? null
}

export class MemoryStore implements OpStore {
  private snapshots = new Map<string, Snapshot>()
  private log: LoggedBatch[] = []

  loadSnapshot(docId: string): Snapshot | null {
    const snapshot = this.snapshots.get(docId)
    return snapshot ? structuredClone(snapshot) : null
  }

  saveSnapshot(docId: string, snapshot: Snapshot) {
    this.snapshots.set(docId, structuredClone(snapshot))
  }

  appendBatch(_docId: string, entry: LoggedBatch) {
    this.log.push(structuredClone(entry))
  }

  opsSince(_docId: string, version: number): LoggedBatch[] {
    return this.log.filter((entry) => entry.version > version).map((entry) => structuredClone(entry))
  }
}

export class RoomManager {
  private rooms = new Map<string, DataplaneRoom>()

  constructor(private store: OpStore | null = null) {}

  get(docId: string): DataplaneRoom | null {
    const schema = schemaFor(docId)
    if (!schema) return null
    let room = this.rooms.get(docId)
    if (!room) {
      room = new DataplaneRoom({ docId, schema, store: this.store })
      this.rooms.set(docId, room)
    }
    return room
  }
}

export function createConnection(rooms: RoomManager, conn: Conn) {
  let room: DataplaneRoom | null = null
  let clientId: string | null = null

  return {
    message(raw: string) {
      let msg: ClientMessage
      try {
        msg = JSON.parse(raw)
      } catch {
        conn.send({ type: "error", message: "invalid JSON" })
        return
      }
      if (!room) {
        if (msg.type !== "hello") {
          conn.send({ type: "error", message: "expected hello" })
          return
        }
        room = rooms.get(msg.docId)
        if (!room) {
          conn.send({ type: "error", message: `unknown doc ${msg.docId}` })
          conn.close()
          return
        }
        clientId = msg.clientId
        room.join(conn, msg)
        return
      }
      room.receive(conn, clientId!, msg)
    },
    close() {
      if (room && clientId) room.leave(conn, clientId)
    },
  }
}
