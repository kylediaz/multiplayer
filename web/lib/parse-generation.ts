import { isDocumentLang, type DocumentLang } from "@shared/lang"
import type { Schema } from "@shared/sync/schema"
import { viewMode } from "./modes"

export type Generation = { title: string; schema: Schema; source: string; lang: DocumentLang }

export function parseGeneration(value: unknown): Generation {
  if (!isRecord(value)) throw new Error("The model did not return a document.")
  const source = stripFences(typeof value.source === "string" ? value.source.trim() : "")
  if (source.length > 60_000) throw new Error("The app source is too long.")
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : "Untitled"
  const lang = isDocumentLang(value.lang) ? value.lang : "react"
  const mode = viewMode(lang)
  return { title, schema: mode.schema(value.schema), source, lang }
}

function stripFences(source: string): string {
  const fenced = source.match(/^```(?:tsx|jsx|ts|js|openui)?\s*\n([\s\S]*?)\n```$/)
  return fenced ? fenced[1].trim() : source
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
