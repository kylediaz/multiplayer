import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createConnection, DocumentManager } from "./documents"
import { HandRolledEngine } from "../client/handrolled-engine"
import type { TransportData } from "../client/transport"
import { REGISTERS, TEXTS, runScenario, viewOf } from "./fuzz"
import { rng, type Rng } from "./rng"
import { SimTransport, type ServerSide } from "./sim-transport"

const DOC = "bug-report~fuzz"

function syncServer(documents: DocumentManager): ServerSide {
  return {
    connect(toClient, close) {
      const conn = createConnection(documents, { send: (msg) => toClient(JSON.stringify(msg)), close })
      return {
        message: (data: TransportData) => conn.message(data as string),
        close: () => conn.close(),
      }
    },
  }
}

function setup(r: Rng, n: number, maxLatency = 40) {
  const documents = new DocumentManager(null)
  const server = syncServer(documents)
  const transports = Array.from({ length: n }, () => new SimTransport(server, r, maxLatency))
  const engines = transports.map(
    (transport, i) =>
      new HandRolledEngine({
        docId: DOC,
        user: { name: `u${i}`, color: "#000" },
        transport,
      })
  )
  return { document: documents.get(DOC)!, engines, transports }
}

describe("hand-rolled engine", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("syncs registers and presence between two clients", async () => {
    const { engines } = setup(rng(1), 2, 10)
    const [a, b] = engines
    a.connect()
    b.connect()
    await vi.advanceTimersByTimeAsync(200)

    a.setRegister("severity", "major")
    a.setPresence({ focus: "severity" })
    await vi.advanceTimersByTimeAsync(200)
    expect(b.getRegister("severity")).toBe("major")
    expect(b.getPeers().map((p) => p.presence.focus)).toEqual(["severity"])
  })

  it("keeps a pending local value until it is acked (no flicker)", async () => {
    const { engines, transports } = setup(rng(2), 2, 0)
    const [a, b] = engines
    a.connect()
    b.connect()
    await vi.advanceTimersByTimeAsync(100)
    transports[0].setLatency(500)

    b.setRegister("severity", "minor")
    a.setRegister("severity", "blocker")
    await vi.advanceTimersByTimeAsync(300)
    expect(a.getRegister("severity")).toBe("blocker")
    await vi.advanceTimersByTimeAsync(3000)
    expect(a.getRegister("severity")).toBe(b.getRegister("severity"))
  })

  it("merges concurrent typing in the same field", async () => {
    const { engines } = setup(rng(3), 2, 50)
    const [a, b] = engines
    a.connect()
    b.connect()
    await vi.advanceTimersByTimeAsync(300)
    a.editText("title", "hello", 5)
    await vi.advanceTimersByTimeAsync(300)
    a.editText("title", "hello world", 11)
    b.editText("title", "Oh hello", 3)
    await vi.advanceTimersByTimeAsync(1000)
    expect(a.getText("title")).toBe("Oh hello world")
    expect(b.getText("title")).toBe("Oh hello world")
  })

  it("keeps items two people insert at the same time", async () => {
    const { engines } = setup(rng(9), 2, 0)
    const [a, b] = engines
    a.connect()
    b.connect()
    await vi.advanceTimersByTimeAsync(100)
    a.listInsert("tasks", 0, { text: "one", done: false })
    b.listInsert("tasks", 0, { text: "two", done: false })
    await vi.advanceTimersByTimeAsync(200)
    const texts = (engine: (typeof engines)[number]) => engine.getList("tasks").map((item) => item.data.text).sort()
    expect(texts(a)).toEqual(["one", "two"])
    expect(texts(b)).toEqual(["one", "two"])
    b.listDelete("tasks", b.getList("tasks").find((item) => item.data.text === "one")!.id)
    await vi.advanceTimersByTimeAsync(200)
    expect(texts(a)).toEqual(["two"])
    expect(texts(b)).toEqual(["two"])
  })

  it("rejects values the spec does not allow, server-side", async () => {
    const { engines, document } = setup(rng(4), 1, 0)
    const [a] = engines
    a.connect()
    await vi.advanceTimersByTimeAsync(100)
    a.setRegister("severity", "catastrophic")
    a.setRegister("nonexistent", true)
    await vi.advanceTimersByTimeAsync(100)
    expect(document.state.registers).toEqual({})
    expect(a.getRegister("severity")).toBeUndefined()
  })

  it("converges under random latency and offline periods", async () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = rng(seed)
      const { engines, transports, document } = setup(r, 3)
      await runScenario(r, engines, transports, 250)

      expect(document.version, `seed ${seed} sequenced work`).toBeGreaterThan(20)
      const expected = {
        registers: Object.fromEntries(REGISTERS.map((k) => [k, document.state.registers[k] ?? null])),
        texts: Object.fromEntries(TEXTS.map((k) => [k, document.state.texts[k] ?? ""])),
      }
      for (const engine of engines) {
        expect(engine.getStatus().inflight + engine.getStatus().buffered, `seed ${seed} pending`).toBe(0)
        expect(viewOf(engine), `seed ${seed}`).toEqual(expected)
      }
      for (const engine of engines) engine.destroy()
    }
  })
})
