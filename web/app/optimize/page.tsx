import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isLocal } from "@/lib/optimize/local"
import { optimizeStore, pendingPairs } from "@/lib/optimize/store"
import { Optimize, type ReviewSide } from "./review"

export const metadata: Metadata = {
  title: "Optimize",
  description: "Pairwise preferences for generated apps",
}

export default async function OptimizePage({ searchParams }: PageProps<"/optimize">) {
  if (!isLocal()) notFound()
  const { pair: wanted } = await searchParams
  const store = optimizeStore()
  const pairs = store.readPairs()
  const judgments = store.readJudgments()
  const pending = pendingPairs(pairs, judgments)
  const current = pending.find((pair) => pair.id === wanted) ?? pending[0] ?? null

  const side = (id: string): ReviewSide | null => {
    const candidate = store.readCandidate(id)
    if (!candidate) return null
    return {
      id,
      title: candidate.title,
      lang: candidate.lang,
      promptVersion: candidate.promptVersion,
      source: store.readCandidateFile(id, "source.txt") ?? "",
    }
  }
  const a = current ? side(current.a) : null
  const b = current ? side(current.b) : null
  return (
    <Optimize
      pending={pending.length}
      judged={judgments.length}
      review={current && a && b ? { pairId: current.id, task: current.task, a, b } : null}
    />
  )
}
