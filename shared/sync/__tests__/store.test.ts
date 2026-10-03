import { describe, expect, it } from "vitest"
import { DataplaneRoom, type Conn } from "../../../api/room"
import type { ServerMessage } from "../protocol"
import { parseSchema } from "../schema"
import { MemoryStore } from "./rooms"

const schema = parseSchema({ keys: { title: { kind: "text" } } })

function fakeConn() {
  const received: ServerMessage[] = []
  const conn: Conn = { send: (msg) => received.push(msg), close: () => {} }
  return { conn, received }
}

const hello = (clientId: string, lastVersion: number | null) =>
  ({ type: "hello", docId: "notes", clientId, user: { name: clientId, color: "#000" }, presence: {}, lastVersion }) as const

describe("persistence", () => {
  it("rebuilds a room from snapshot + op log and catches clients up from the log", () => {
    const store = new MemoryStore()
    const room = new DataplaneRoom({ docId: "notes", schema, store })
    const { conn } = fakeConn()
    room.join(conn, hello("a", null))
    for (let seq = 1; seq <= 150; seq++) {
      room.receive(conn, "a", {
        type: "batch",
        batch: { seq, baseVersion: seq - 1, ops: [{ t: "text", key: "title", op: [seq - 1, "x"] }] },
      })
    }
    room.receive(conn, "a", { type: "batch", batch: { seq: 150, baseVersion: 150, ops: [{ t: "text", key: "title", op: ["dup"] }] } })
    expect(room.version).toBe(150)

    const reloaded = new DataplaneRoom({ docId: "notes", schema, store })
    expect(reloaded.version).toBe(150)
    expect(reloaded.state.texts.title).toBe("x".repeat(150))

    const late = fakeConn()
    reloaded.join(late.conn, hello("b", 120))
    const welcome = late.received[0]
    expect(welcome.type === "welcome" && welcome.batches?.map((b) => b.version)).toEqual(
      Array.from({ length: 30 }, (_, i) => 121 + i)
    )
  })
})
