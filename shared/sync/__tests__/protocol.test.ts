import { describe, expect, it } from "vitest"
import { parseClientMessage, parseServerMessage } from "../protocol"

const user = { name: "A", color: "#000" }

describe("parseClientMessage", () => {
  it("reads a hello and drops one with no user", () => {
    expect(
      parseClientMessage({ type: "hello", docId: "doc", clientId: "a", user, presence: { focus: "title" }, lastVersion: null })
    ).toEqual({ type: "hello", docId: "doc", clientId: "a", user, presence: { focus: "title" }, lastVersion: null })
    expect(parseClientMessage({ type: "hello", docId: "doc", clientId: "a", presence: {}, lastVersion: null })).toBeNull()
  })

  it("reads a list insert and drops a batch whose op is missing its value", () => {
    const op = { t: "list.insert", key: "tasks", id: "a", pos: "a0", data: { text: "one" } }
    expect(parseClientMessage({ type: "batch", batch: { seq: 1, baseVersion: 0, ops: [op] } })?.type).toBe("batch")
    expect(parseClientMessage({ type: "batch", batch: { seq: 1, baseVersion: 0, ops: [{ t: "set", key: "open" }] } })).toBeNull()
  })
})

describe("parseServerMessage", () => {
  it("requires a user when a peer's presence is set", () => {
    expect(parseServerMessage({ type: "presence", clientId: "a", presence: null })).toEqual({
      type: "presence",
      clientId: "a",
      presence: null,
    })
    expect(parseServerMessage({ type: "presence", clientId: "a", user, presence: { focus: "title" } })?.type).toBe("presence")
    expect(parseServerMessage({ type: "presence", clientId: "a", presence: { focus: "title" } })).toBeNull()
  })

  it("requires registers, texts, and lists on a welcome snapshot", () => {
    const snapshot = { registers: { open: true }, texts: { title: "hi" }, lists: {} }
    const message = parseServerMessage({ type: "welcome", version: 1, lastSeq: 1, snapshot, peers: [] })
    expect(message && message.type === "welcome" && "snapshot" in message && message.snapshot).toEqual(snapshot)
    expect(
      parseServerMessage({
        type: "welcome",
        version: 1,
        lastSeq: 1,
        snapshot: { registers: { open: true }, texts: { title: "hi" } },
        peers: [],
      })
    ).toBeNull()
  })
})
