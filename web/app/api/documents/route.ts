import { dataplaneUrl } from "@/lib/dataplane"
import { generateDocument } from "@/lib/generate/agent"
import type { RevisionFile } from "@/lib/modes/mode"
import { isGenerationMode, type DocumentLang, type GenerationMode } from "@shared/lang"
import type { Schema } from "@shared/sync/schema"

export const maxDuration = 300

export async function POST(request: Request) {
  let prompt = ""
  let mode: GenerationMode = "react"
  try {
    const body = (await request.json()) as { prompt?: unknown; mode?: unknown }
    if (typeof body.prompt === "string") prompt = body.prompt.trim()
    if (isGenerationMode(body.mode)) mode = body.mode
  } catch {
    return Response.json({ error: "The prompt is missing." }, { status: 400 })
  }
  if (!prompt) return Response.json({ error: "Enter a prompt." }, { status: 400 })

  let generated
  try {
    generated = await generateDocument(prompt, mode)
  } catch (err) {
    const message = err instanceof Error ? err.message : "The document could not be generated."
    return Response.json({ error: message }, { status: 502 })
  }

  const doc = await createDocument(generated.title, generated.schema, generated.lang)
  if ("error" in doc) return Response.json({ error: doc.error }, { status: doc.status })
  const published = await publishApp(doc.id, generated.files)
  if (published) return Response.json({ error: published }, { status: 502 })
  return Response.json({ id: doc.id })
}

async function createDocument(title: string, schema: Schema, type: DocumentLang): Promise<{ id: string } | { error: string; status: number }> {
  let created: Response
  try {
    created = await fetch(`${dataplaneUrl}/v1/documents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, schema, type }),
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

async function publishApp(id: string, files: RevisionFile[]): Promise<string | null> {
  const body = new FormData()
  for (const file of files) body.append(file.name, new File([file.body], file.name, { type: file.type }))
  let response: Response
  try {
    response = await fetch(`${dataplaneUrl}/v1/documents/${id}/views`, { method: "POST", body, cache: "no-store" })
  } catch {
    return "The dataplane is not running."
  }
  if (!response.ok) return "The app could not be published."
  return null
}
