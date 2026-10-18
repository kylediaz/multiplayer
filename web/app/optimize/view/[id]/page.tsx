import { notFound } from "next/navigation"
import { isLocal } from "@/lib/optimize/local"
import { optimizeStore } from "@/lib/optimize/store"
import { OpenUICandidate } from "./openui"

export default async function CandidateView({ params }: PageProps<"/optimize/view/[id]">) {
  if (!isLocal()) notFound()
  const { id } = await params
  const store = optimizeStore()
  const candidate = store.readCandidate(id)
  if (!candidate) notFound()
  const source = store.readCandidateFile(id, "source.txt")
  return (
    <main className="flex min-h-dvh justify-center md:items-center md:bg-muted md:p-6">
      <div
        data-phone
        className="h-dvh w-full max-w-[390px] bg-white md:h-[min(844px,calc(100dvh-3rem))] md:overflow-hidden md:rounded-[2.5rem] md:border md:shadow-lg"
      >
        {candidate.lang === "react" ? (
          <iframe
            title={candidate.title}
            sandbox="allow-scripts"
            src={`/api/optimize/candidates/${id}/index.html`}
            className="block h-full w-full border-0 bg-white"
          />
        ) : (
          <OpenUICandidate source={source ?? ""} />
        )}
      </div>
    </main>
  )
}
