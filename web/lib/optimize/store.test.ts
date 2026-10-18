import { appendFileSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { newId, optimizeStore, pendingPairs, type Candidate, type Judgment, type Pair } from "./store"

const dirs: string[] = []

function tempStore() {
  const dir = mkdtempSync(path.join(tmpdir(), "optimize-"))
  dirs.push(dir)
  return optimizeStore(dir)
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const candidate = (id: string): Candidate => ({
  id,
  task: "A shared todo list",
  mode: "react",
  lang: "react",
  title: "Todos",
  schema: { keys: {} },
  promptVersion: "abc123abc123",
  model: "model",
  createdAt: 1,
})

const pair = (id: string): Pair => ({ id, task: "A shared todo list", mode: "react", a: "cand_a", b: "cand_b", createdAt: 1 })

const side = { candidateId: "cand_a", lang: "react", title: "Todos", promptVersion: "v", model: "m", source: "", screenshotUrl: "" } as const

const judgment = (pairId: string): Judgment => ({ id: newId("judg_"), pairId, createdAt: 1, task: "t", a: side, b: side, choice: "tie", critique: "" })

describe("optimize store", () => {
  it("saves a candidate with only its view files", () => {
    const store = tempStore()
    store.saveCandidate(candidate("cand_one"), [
      { name: "main.js", body: "js", type: "text/javascript" },
      { name: "source.txt", body: "export default App", type: "text/plain" },
      { name: "other.txt", body: "ignored", type: "text/plain" },
    ])
    expect(store.readCandidate("cand_one")).toEqual(candidate("cand_one"))
    expect(store.readCandidateFile("cand_one", "source.txt")).toBe("export default App")
    expect(store.readCandidateFile("cand_one", "other.txt")).toBeNull()
    expect(store.readCandidateFile("cand_one", "candidate.json")).toBeNull()
  })

  it("rejects candidate ids that leave the store", () => {
    const store = tempStore()
    expect(store.readCandidate("../pairs")).toBeNull()
    expect(store.readCandidateFile("cand_x/../../y", "main.js")).toBeNull()
    expect(() => store.screenshotFile("../x")).toThrow()
  })

  it("round-trips pairs and judgments and skips a torn line", () => {
    const store = tempStore()
    store.appendPair(pair("pair_one"))
    appendFileSync(path.join(store.dir, "pairs.jsonl"), '{"id":"pair_\n')
    store.appendPair(pair("pair_two"))
    store.appendJudgment(judgment("pair_one"))
    expect(store.readPairs().map((item) => item.id)).toEqual(["pair_one", "pair_two"])
    expect(store.readJudgments().map((item) => item.pairId)).toEqual(["pair_one"])
  })

  it("keeps only the pairs nobody has judged", () => {
    const pairs = [pair("pair_one"), pair("pair_two"), pair("pair_three")]
    expect(pendingPairs(pairs, [judgment("pair_two")]).map((item) => item.id)).toEqual(["pair_one", "pair_three"])
  })
})
