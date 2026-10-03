import { parseSchema, type Schema } from "@shared/sync/schema"

export type Generation = { title: string; schema: Schema; source: string }

export function parseGeneration(value: unknown): Generation {
  if (!isRecord(value)) throw new Error("The model did not return a document.")
  const source = stripFences(typeof value.source === "string" ? value.source.trim() : "")
  if (!source.includes("export default")) throw new Error("The app needs a default export.")
  if (source.length > 60_000) throw new Error("The app source is too long.")
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : "Untitled"
  return { title, schema: parseSchema(value.schema), source }
}

function stripFences(source: string): string {
  const fenced = source.match(/^```(?:tsx|jsx|ts|js)?\s*\n([\s\S]*?)\n```$/)
  return fenced ? fenced[1].trim() : source
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
