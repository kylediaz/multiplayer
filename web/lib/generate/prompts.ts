import type { GenerationMode } from "@shared/lang"
import { skillsPrompt } from "./skills"

function languageLine(mode: GenerationMode): string {
  if (mode === "react") return "This app is React. source is one TSX file, and schema lists every sync id."
  if (mode === "openui") return 'This app is OpenUI. source is an openui-lang program and schema is { "keys": {} }.'
  return `Choose React or OpenUI, then call submit with lang set to that choice. Set lang to "openui" when a screen of headers, text, lists, media, maps, tables, drawings, and buttons can express the app. source is an openui-lang program and schema is { "keys": {} }. Set lang to "react" when the app needs shared collaborative state or behavior the OpenUI library cannot express. source is one TSX file, and schema lists every sync id.`
}

function principles(mode: GenerationMode): string {
  return `You build an app. Call submit with the finished app. If submit returns problems, fix the app and call submit again. Do not reply with the source as text.

${languageLine(mode)}

Build the smallest Card that does what was asked. Start with CardHeader. Do not add filters, counts, or a control on every row unless the user asked for them.

font-sans is Inter and font-mono is Geist Mono. Those faces are already loaded. Do not import font files. Do not hardcode a hex color.`
}

export function instructions(mode: GenerationMode): string {
  return `${principles(mode)}\n\n${skillsPrompt(mode)}`
}
