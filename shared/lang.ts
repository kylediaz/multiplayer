export type DocumentLang = "react" | "openui"

export type GenerationMode = DocumentLang | "decide"

export function isDocumentLang(value: unknown): value is DocumentLang {
  return value === "react" || value === "openui"
}

export function isGenerationMode(value: unknown): value is GenerationMode {
  return isDocumentLang(value) || value === "decide"
}
