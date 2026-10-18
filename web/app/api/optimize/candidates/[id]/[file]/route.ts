import { existsSync, readFileSync } from "node:fs"
import { isLocal, notFoundResponse } from "@/lib/optimize/local"
import { optimizeStore } from "@/lib/optimize/store"
import { candidateHtml } from "@/lib/optimize/view-html"

const TYPES: Record<string, string> = {
  "index.html": "text/html; charset=utf-8",
  "main.js": "text/javascript; charset=utf-8",
  "main.css": "text/css; charset=utf-8",
  "source.txt": "text/plain; charset=utf-8",
}

export async function GET(_request: Request, ctx: RouteContext<"/api/optimize/candidates/[id]/[file]">) {
  if (!isLocal()) return notFoundResponse()
  const { id, file } = await ctx.params
  const store = optimizeStore()
  if (!store.readCandidate(id)) return notFoundResponse()
  const headers = { "cache-control": "no-store" }
  if (file === "screenshot.png") {
    const path = store.screenshotFile(id)
    if (!existsSync(path)) return notFoundResponse()
    return new Response(readFileSync(path), { headers: { ...headers, "content-type": "image/png" } })
  }
  const type = TYPES[file]
  if (!type) return notFoundResponse()
  const body = file === "index.html" ? candidateHtml() : store.readCandidateFile(id, file)
  if (body === null) return notFoundResponse()
  return new Response(body, { headers: { ...headers, "content-type": type } })
}
