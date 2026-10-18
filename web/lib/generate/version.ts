import { createHash } from "node:crypto"
import type { GenerationMode } from "@shared/lang"
import { optimizeStore } from "../optimize/store"
import { MODEL } from "./agent"
import { instructions } from "./prompts"
import { listedSkills, readSkill } from "./skills"

export function promptText(mode: GenerationMode, model = MODEL): string {
  const skills = listedSkills(mode).map((skill) => {
    const loaded = readSkill(mode, skill.name)
    return `# skill: ${skill.name}\n\n${"content" in loaded ? loaded.content : loaded.error}`
  })
  return [`# model: ${model}`, `# mode: ${mode}`, instructions(mode), ...skills].join("\n\n")
}

export function versionOf(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 12)
}

export function promptVersion(mode: GenerationMode, store = optimizeStore()): string {
  const text = promptText(mode)
  const version = versionOf(text)
  store.savePrompt(version, text)
  return version
}
