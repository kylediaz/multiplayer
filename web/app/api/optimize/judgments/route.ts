import { z } from "zod"
import { isLocal, notFoundResponse } from "@/lib/optimize/local"
import { captureScreenshot } from "@/lib/optimize/screenshot"
import { CHOICES, newId, optimizeStore, type JudgmentSide, type OptimizeStore } from "@/lib/optimize/store"

export const maxDuration = 120

const body = z.object({
  pairId: z.string(),
  choice: z.enum(CHOICES),
  critique: z.string(),
})

export async function POST(request: Request) {
  if (!isLocal()) return notFoundResponse()
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Pick A, B, tie, or both bad." }, { status: 400 })
  const store = optimizeStore()
  const pair = store.readPairs().find((item) => item.id === parsed.data.pairId)
  if (!pair) return notFoundResponse()
  if (store.readJudgments().some((judgment) => judgment.pairId === pair.id)) {
    return Response.json({ error: "This pair is already judged." }, { status: 409 })
  }
  const origin = new URL(request.url).origin
  try {
    const [a, b] = await Promise.all([side(store, pair.a, origin), side(store, pair.b, origin)])
    const judgment = {
      id: newId("judg_"),
      pairId: pair.id,
      createdAt: Date.now(),
      task: pair.task,
      a,
      b,
      choice: parsed.data.choice,
      critique: parsed.data.critique.trim(),
    }
    store.appendJudgment(judgment)
    return Response.json({ id: judgment.id })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "The judgment could not be saved." }, { status: 502 })
  }
}

async function side(store: OptimizeStore, candidateId: string, origin: string): Promise<JudgmentSide> {
  const candidate = store.readCandidate(candidateId)
  if (!candidate) throw new Error(`Candidate ${candidateId} is missing.`)
  const screenshotUrl = await captureScreenshot({ origin, candidateId, lang: candidate.lang }, store)
  return {
    candidateId,
    lang: candidate.lang,
    title: candidate.title,
    promptVersion: candidate.promptVersion,
    model: candidate.model,
    source: store.readCandidateFile(candidateId, "source.txt") ?? "",
    screenshotUrl,
  }
}
