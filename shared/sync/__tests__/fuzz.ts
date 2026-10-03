import { vi } from "vitest"
import type { SyncEngine } from "../client/engine"
import type { Rng } from "./rng"

export const REGISTERS = ["severity", "frequency", "regression", "seen"] as const
export const TEXTS = ["title", "expected"] as const

const REGISTER_VALUES: Record<(typeof REGISTERS)[number], unknown[]> = {
  severity: ["blocker", "major", "minor", "cosmetic", null],
  frequency: ["always", "sometimes", "rarely"],
  regression: [true, false],
  seen: ["2026-01-01", "2026-02-14", ""],
}

function randomEdit(r: Rng, text: string): { next: string; cursor: number } {
  const pos = r.int(text.length + 1)
  if (text.length && r.chance(0.35)) {
    const end = Math.min(text.length, pos + 1 + r.int(4))
    return { next: text.slice(0, pos) + text.slice(end), cursor: pos }
  }
  const word = r.word()
  return { next: text.slice(0, pos) + word + text.slice(pos), cursor: pos + word.length }
}

/** One random user action against a register or a text field. */
function randomAction(r: Rng, engine: SyncEngine) {
  if (r.chance(0.4)) {
    const key = r.pick(REGISTERS)
    engine.setRegister(key, r.pick(REGISTER_VALUES[key]) as never)
    return
  }
  const key = r.pick(TEXTS)
  const { next, cursor } = randomEdit(r, engine.getText(key))
  engine.editText(key, next, cursor)
}

export function viewOf(engine: SyncEngine) {
  return {
    registers: Object.fromEntries(REGISTERS.map((k) => [k, engine.getRegister(k) ?? null])),
    texts: Object.fromEntries(TEXTS.map((k) => [k, engine.getText(k)])),
  }
}

/**
 * Drive N clients through random actions with random latency and offline
 * periods, then heal the network and let everything settle.
 */
export async function runScenario(r: Rng, engines: SyncEngine[], steps: number) {
  for (const e of engines) e.connect()
  await vi.advanceTimersByTimeAsync(500)
  for (let i = 0; i < steps; i++) {
    const engine = r.pick(engines)
    if (r.chance(0.03)) engine.network.setOffline(!engine.network.isOffline())
    else randomAction(r, engine)
    await vi.advanceTimersByTimeAsync(r.int(30))
  }
  for (const e of engines) e.network.setOffline(false)
  await vi.advanceTimersByTimeAsync(5_000)
}
