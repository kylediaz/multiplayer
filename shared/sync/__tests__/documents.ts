import { Document, type Conn, type OpStore, type Snapshot } from "../../../api/document"
import { parseClientMessage, type ClientMessage, type LoggedBatch } from "../protocol"
import { parseSchema, type Schema } from "../schema"

const bugReport = parseSchema({
  keys: {
    severity: { kind: "register", value: "string", enum: ["blocker", "major", "minor", "cosmetic"] },
    frequency: { kind: "register", value: "string", enum: ["always", "sometimes", "rarely"] },
    regression: { kind: "register", value: "boolean" },
    seen: { kind: "register", value: "string", maxLength: 10 },
    title: { kind: "text" },
    expected: { kind: "text" },
    tasks: { kind: "list", fields: { text: { kind: "text" }, done: { kind: "register", value: "boolean" } } },
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

export class DocumentManager {
  private documents = new Map<string, Document>()

  constructor(private store: OpStore | null = null) {}

  get(docId: string): Document | null {
    const schema = schemaFor(docId)
    if (!schema) return null
    let document = this.documents.get(docId)
    if (!document) {
      document = new Document({ docId, schema, store: this.store })
      this.documents.set(docId, document)
    }
    return document
  }
}

export function createConnection(documents: DocumentManager, conn: Conn) {
  let document: Document | null = null
  let clientId: string | null = null

  return {
    message(raw: string) {
      let msg: ClientMessage | null
      try {
        msg = parseClientMessage(JSON.parse(raw))
      } catch {
        conn.send({ type: "error", message: "invalid JSON" })
        return
      }
      if (!msg) {
        conn.send({ type: "error", message: "invalid message" })
        return
      }
      if (!document) {
        if (msg.type !== "hello") {
          conn.send({ type: "error", message: "expected hello" })
          return
        }
        document = documents.get(msg.docId)
        if (!document) {
          conn.send({ type: "error", message: `unknown doc ${msg.docId}` })
          conn.close()
          return
        }
        clientId = msg.clientId
        document.join(conn, msg)
        return
      }
      document.receive(conn, clientId!, msg)
    },
    close() {
      if (document && clientId) document.leave(conn, clientId)
    },
  }
}
