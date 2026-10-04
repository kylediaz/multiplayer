import { describe, expect, it } from "vitest"
import { emptyState } from "../doc"
import { sortedItems } from "../list"
import { parseSchema, validateSchemaOp } from "../schema"
import { Document, type Conn } from "../../../api/document"
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

describe("document registers", () => {
  it("orders concurrent sets and keeps the later one", () => {
    const document = new Document({ docId: "doc_test", schema })
    const alice = fakeConn()
    const bob = fakeConn()
    const user: User = { name: "A", color: "#000" }
    document.join(alice, { type: "hello", docId: "doc_test", clientId: "alice", user, presence: {}, lastVersion: null })
    document.join(bob, { type: "hello", docId: "doc_test", clientId: "bob", user: { name: "B", color: "#fff" }, presence: {}, lastVersion: null })
    document.receive(alice, "alice", { type: "batch", batch: { seq: 1, baseVersion: 0, ops: [{ t: "set", key: "open", value: true }] } })
    document.receive(bob, "bob", { type: "batch", batch: { seq: 1, baseVersion: 0, ops: [{ t: "set", key: "open", value: false }] } })
    expect(document.state.registers.open).toBe(false)
    expect(document.version).toBe(2)
    const logged = bob.messages.filter((message) => message.type === "batch")
    expect(logged.map((message) => (message.type === "batch" ? message.entry.ops : []))).toEqual([
      [{ t: "set", key: "open", value: true }],
      [{ t: "set", key: "open", value: false }],
    ])
  })

  it("omits a set the schema rejects and still advances the version", () => {
    const document = new Document({ docId: "doc_test", schema })
    const conn = fakeConn()
    document.join(conn, { type: "hello", docId: "doc_test", clientId: "alice", user: { name: "A", color: "#000" }, presence: {}, lastVersion: null })
    document.receive(conn, "alice", {
      type: "batch",
      batch: { seq: 1, baseVersion: 0, ops: [{ t: "set", key: "open", value: "yes" }] },
    })
    expect(document.state.registers.open).toBeUndefined()
    expect(document.version).toBe(1)
    const ack = conn.messages.find((message) => message.type === "batch")
    expect(ack && ack.type === "batch" && ack.entry.ops).toEqual([])
  })
})

describe("document lists", () => {
  const tasks = parseSchema({
    keys: {
      tasks: {
        kind: "list",
        fields: {
          text: { kind: "text" },
          done: { kind: "register", value: "boolean" },
        },
      },
    },
  })

  it("rejects a nested list and a text op aimed at the list itself", () => {
    expect(() =>
      parseSchema({ keys: { tasks: { kind: "list", fields: { children: { kind: "list", fields: {} } } } } })
    ).toThrow(/nested lists/)
    const state = emptyState()
    expect(validateSchemaOp(tasks, state, { t: "text", key: "tasks", op: ["hi"] })).toBeNull()
  })

  it("keeps both items when two clients insert, and a delete removes only its own", () => {
    const document = new Document({ docId: "doc_test", schema: tasks })
    const alice = fakeConn()
    const bob = fakeConn()
    const user: User = { name: "A", color: "#000" }
    document.join(alice, { type: "hello", docId: "doc_test", clientId: "alice", user, presence: {}, lastVersion: null })
    document.join(bob, { type: "hello", docId: "doc_test", clientId: "bob", user: { name: "B", color: "#fff" }, presence: {}, lastVersion: null })
    const insert = (id: string, text: string) =>
      ({ t: "list.insert", key: "tasks", id, pos: "a0", data: { text, done: false } }) as const
    document.receive(alice, "alice", { type: "batch", batch: { seq: 1, baseVersion: 0, ops: [insert("a", "one")] } })
    document.receive(bob, "bob", { type: "batch", batch: { seq: 1, baseVersion: 0, ops: [insert("b", "two")] } })
    document.receive(alice, "alice", {
      type: "batch",
      batch: { seq: 2, baseVersion: 1, ops: [{ t: "list.delete", key: "tasks", id: "a" }] },
    })
    expect(sortedItems(document.state.lists.tasks).map((item) => item.data.text)).toEqual(["two"])
  })

  it("merges patches to different fields and edits a text field with text ops", () => {
    const document = new Document({ docId: "doc_test", schema: tasks })
    const conn = fakeConn()
    document.join(conn, { type: "hello", docId: "doc_test", clientId: "alice", user: { name: "A", color: "#000" }, presence: {}, lastVersion: null })
    document.receive(conn, "alice", {
      type: "batch",
      batch: { seq: 1, baseVersion: 0, ops: [{ t: "list.insert", key: "tasks", id: "a", pos: "a0", data: { text: "one", done: false } }] },
    })
    document.receive(conn, "alice", {
      type: "batch",
      batch: {
        seq: 2,
        baseVersion: 1,
        ops: [
          { t: "list.update", key: "tasks", id: "a", patch: { done: true, extra: "nope" } },
          { t: "text", key: "tasks/a/text", op: ["one more"] },
        ],
      },
    })
    expect(document.state.lists.tasks.a.data).toEqual({ text: "one", done: true })
    expect(document.state.texts["tasks/a/text"]).toBe("one more")
  })
})

function fakeConn(): Conn & { messages: ServerMessage[] } {
  const messages: ServerMessage[] = []
  return { messages, send: (message) => messages.push(message), close() {} }
}
