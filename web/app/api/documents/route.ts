import { dataplaneUrl } from "@/lib/dataplane"
import { compileView } from "@/lib/compile-view"
import { generateDocument } from "@/lib/generate-spec"
import type { Schema } from "@shared/sync/schema"

export async function POST(request: Request) {
  let prompt = ""
  try {
    const body = (await request.json()) as { prompt?: unknown }
    if (typeof body.prompt === "string") prompt = body.prompt.trim()
  } catch {
    return Response.json({ error: "The prompt is missing." }, { status: 400 })
  }
  if (!prompt) return Response.json({ error: "Enter a prompt." }, { status: 400 })
  if (prompt.length > 4000) return Response.json({ error: "The prompt is too long." }, { status: 400 })

  let generated
  try {
    generated = await generateDocument(prompt)
  } catch (err) {
    const message = err instanceof Error ? err.message : "The document could not be generated."
    return Response.json({ error: message }, { status: 502 })
  }

  let bundled
  try {
    bundled = await compileView(generated.source)
  } catch (err) {
    const message = err instanceof Error ? err.message : "The app failed to compile."
    return Response.json({ error: message.replace(/\u001b\[[0-9;]*m/g, "").slice(0, 500) }, { status: 502 })
  }
  const doc = await createDocument(generated.title, generated.schema)
  if ("error" in doc) return Response.json({ error: doc.error }, { status: doc.status })
  const published = await publishApp(doc.id, bundled.js, bundled.css)
  if (published) return Response.json({ error: published }, { status: 502 })
  return Response.json({ id: doc.id })
}

async function createDocument(title: string, schema: Schema): Promise<{ id: string } | { error: string; status: number }> {
  let created: Response
  try {
    created = await fetch(`${dataplaneUrl}/v1/documents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, schema }),
      cache: "no-store",
    })
  } catch {
    return { error: "The dataplane is not running.", status: 503 }
  }
  if (!created.ok) return { error: "The dataplane rejected the document.", status: 502 }
  const body: unknown = await created.json()
  if (typeof body !== "object" || body === null || !("id" in body) || typeof body.id !== "string") {
    return { error: "The dataplane rejected the document.", status: 502 }
  }
  return { id: body.id }
}

async function publishApp(id: string, js: string, css: string): Promise<string | null> {
  const body = new FormData()
  body.append("main", new File([js], "main.js", { type: "text/javascript" }))
  body.append("styles", new File([css], "main.css", { type: "text/css" }))
  let response: Response
  try {
    response = await fetch(`${dataplaneUrl}/v1/documents/${id}/views`, { method: "POST", body, cache: "no-store" })
  } catch {
    return "The dataplane is not running."
  }
  if (!response.ok) return "The app could not be published."
  return null
}
