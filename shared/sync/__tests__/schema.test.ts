import { describe, expect, it } from "vitest"
import { emptyState } from "../doc"
import { parseSchema, validateSchemaOp } from "../schema"
import { DataplaneRoom, type Conn } from "../../../api/room"
import type { ServerMessage, User } from "../protocol"

const schema = parseSchema({
  keys: {
    open: { kind: "register", value: "boolean" },
    severity: { kind: "register", value: "string", enum: ["minor", "major"] },
    amount: { kind: "register", value: "number", min: 0, max: 10, step: 1 },
    title: { kind: "text", maxLength: 8 },
  },
})

describe("validateSchemaOp", () => {
  it("snaps a number register and drops an illegal enum", () => {
    const state = emptyState()
    expect(validateSchemaOp(schema, state, { t: "set", key: "amount", value: 3.2 })).toEqual({
      t: "set",
      key: "amount",
      value: 3,
    })
    expect(validateSchemaOp(schema, state, { t: "set", key: "severity", value: "cosmetic" })).toBeNull()
    expect(validateSchemaOp(schema, state, { t: "set", key: "missing", value: true })).toBeNull()
  })

  it("rejects a text op on a register and a set on a text key", () => {
    const state = emptyState()
    expect(validateSchemaOp(schema, state, { t: "text", key: "open", op: ["hi"] })).toBeNull()
    expect(validateSchemaOp(schema, state, { t: "set", key: "title", value: "hello" })).toBeNull()
  })
})

describe("DataplaneRoom registers", () => {
  it("orders concurrent sets and keeps the later one", () => {
    const room = new DataplaneRoom({ docId: "doc_test", schema })
    const alice = fakeConn()
    const bob = fakeConn()
    const user: User = { name: "A", color: "#000" }
    room.join(alice, { type: "hello", docId: "doc_test", clientId: "alice", user, presence: {}, lastVersion: null })
    room.join(bob, { type: "hello", docId: "doc_test", clientId: "bob", user: { name: "B", color: "#fff" }, presence: {}, lastVersion: null })
    room.receive(alice, "alice", { type: "batch", batch: { seq: 1, baseVersion: 0, ops: [{ t: "set", key: "open", value: true }] } })
    room.receive(bob, "bob", { type: "batch", batch: { seq: 1, baseVersion: 0, ops: [{ t: "set", key: "open", value: false }] } })
    expect(room.state.registers.open).toBe(false)
    expect(room.version).toBe(2)
    const logged = bob.messages.filter((message) => message.type === "batch")
    expect(logged.map((message) => (message.type === "batch" ? message.entry.ops : []))).toEqual([
      [{ t: "set", key: "open", value: true }],
      [{ t: "set", key: "open", value: false }],
    ])
  })

  it("omits a set the schema rejects and still advances the version", () => {
    const room = new DataplaneRoom({ docId: "doc_test", schema })
    const conn = fakeConn()
    room.join(conn, { type: "hello", docId: "doc_test", clientId: "alice", user: { name: "A", color: "#000" }, presence: {}, lastVersion: null })
    room.receive(conn, "alice", {
      type: "batch",
      batch: { seq: 1, baseVersion: 0, ops: [{ t: "set", key: "open", value: "yes" }] },
    })
    expect(room.state.registers.open).toBeUndefined()
    expect(room.version).toBe(1)
    const ack = conn.messages.find((message) => message.type === "batch")
    expect(ack && ack.type === "batch" && ack.entry.ops).toEqual([])
  })
})

function fakeConn(): Conn & { messages: ServerMessage[] } {
  const messages: ServerMessage[] = []
  return { messages, send: (message) => messages.push(message), close() {} }
}
