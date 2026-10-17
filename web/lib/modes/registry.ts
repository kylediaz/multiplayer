import type { DocumentLang } from "@shared/lang"
import type { ViewMode } from "./mode"
import { openuiMode } from "./openui/mode"
import { reactMode } from "./react/mode"

const modes = { react: reactMode, openui: openuiMode } satisfies Record<DocumentLang, ViewMode>

export function viewMode(lang: DocumentLang): ViewMode {
  return modes[lang]
}
