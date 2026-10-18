import { z } from "zod"
import { isLocal, notFoundResponse } from "@/lib/optimize/local"
import { captureScreenshot } from "@/lib/optimize/screenshot"
import { optimizeStore } from "@/lib/optimize/store"

export const maxDuration = 120

const body = z.object({ candidateId: z.string() })

export async function POST(request: Request) {
  if (!isLocal()) return notFoundResponse()
  const parsed = body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "The request is invalid." }, { status: 400 })
  const store = optimizeStore()
  const candidate = store.readCandidate(parsed.data.candidateId)
  if (!candidate) return notFoundResponse()
  try {
    const url = await captureScreenshot({ origin: new URL(request.url).origin, candidateId: candidate.id, lang: candidate.lang }, store)
    return Response.json({ url })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "The screenshot failed." }, { status: 502 })
  }
}
