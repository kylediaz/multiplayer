import type { DocumentLang } from "@shared/lang"
import type { Schema } from "@shared/sync/schema"

export type RevisionFile = { name: string; body: string; type: string }

export type Published = { ok: true; files: RevisionFile[] } | { ok: false; problems: string[] }

/** How one document language checks source and stores a revision. The phone mounts the matching component from `render.tsx`. */
export type ViewMode = {
  lang: DocumentLang
  /** Shared state schema for this language. */
  schema(value: unknown): Schema
  /** Files to store, or the problems that kept this source from being stored. */
  publish(source: string): Promise<Published>
}
