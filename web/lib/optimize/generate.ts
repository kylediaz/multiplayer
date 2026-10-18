import type { GenerationMode } from "@shared/lang"
import { generateDocument, MODEL } from "../generate/agent"
import { promptVersion } from "../generate/version"
import { newId, optimizeStore, type Candidate, type OptimizeStore, type Pair } from "./store"

export async function generatePair(task: string, mode: GenerationMode, store: OptimizeStore = optimizeStore()): Promise<Pair> {
  const [a, b] = await Promise.all([generateCandidate(task, mode, store), generateCandidate(task, mode, store)])
  const pair: Pair = { id: newId("pair_"), task, mode, a: a.id, b: b.id, createdAt: Date.now() }
  store.appendPair(pair)
  return pair
}

async function generateCandidate(task: string, mode: GenerationMode, store: OptimizeStore): Promise<Candidate> {
  const version = promptVersion(mode, store)
  const generated = await generateDocument(task, mode)
  const candidate: Candidate = {
    id: newId("cand_"),
    task,
    mode,
    lang: generated.lang,
    title: generated.title,
    schema: generated.schema,
    promptVersion: version,
    model: MODEL,
    createdAt: Date.now(),
  }
  store.saveCandidate(candidate, generated.files)
  return candidate
}
