import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { GenerationMode } from "@shared/lang"
import { openuiLibrary } from "../../modes/openui/library"
import { repoRoot } from "../../repo-root"

export type Skill = {
  name: string
  description: string
  body: string
}

const ORDER = ["react", "openui", "groceries", "books", "schedule", "brief", "recipe", "tonight", "rsvp", "cabins", "heater"]

let catalog: Skill[] | undefined
let openuiPrompt: string | undefined

function genuiDir(): string {
  const beside = path.join(path.dirname(fileURLToPath(import.meta.url)), "genui")
  if (existsSync(path.join(beside, "react", "SKILL.md"))) return beside
  return path.join(repoRoot(), "web/lib/generate/skills/genui")
}

function parseSkill(content: string): Skill {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match?.[1]) throw new Error("A skill is missing frontmatter.")
  let name = ""
  let description = ""
  for (const line of match[1].split("\n")) {
    const found = line.match(/^(name|description):\s*(.*)$/)
    if (!found) continue
    if (found[1] === "name") name = found[2].trim()
    else description = found[2].trim()
  }
  if (!name || !description) throw new Error("A skill needs a name and a description.")
  return { name, description, body: content.slice(match[0].length).trim() }
}

function readDirSkills(dir: string): Skill[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, "SKILL.md")))
    .map((entry) => parseSkill(readFileSync(path.join(dir, entry.name, "SKILL.md"), "utf8")))
}

function allSkills(): Skill[] {
  if (catalog) return catalog
  const root = genuiDir()
  catalog = [...readDirSkills(root), ...readDirSkills(path.join(root, "examples"))]
  return catalog
}

function allowed(mode: GenerationMode, skills: Skill[]): Set<string> {
  const names = new Set(skills.map((skill) => skill.name))
  if (mode === "react") names.delete("openui")
  if (mode === "openui") names.delete("react")
  return names
}

export function listedSkills(mode: GenerationMode): Skill[] {
  const skills = allSkills()
  const names = allowed(mode, skills)
  const rank = new Map(ORDER.map((name, index) => [name, index]))
  return skills.filter((skill) => names.has(skill.name)).sort((a, b) => (rank.get(a.name) ?? 99) - (rank.get(b.name) ?? 99))
}

function openuiLibraryPrompt(): string {
  openuiPrompt ??= openuiLibrary.prompt({
    preamble:
      "The submitted source is an openui-lang program. The root is Card. Do not write React, do not use the shadcn components, and do not wrap the program in markdown fences.",
    additionalRules: ["The page is one Card. Start with CardHeader.", "There are no form fields or charts."],
  })
  return openuiPrompt
}

export function readSkill(mode: GenerationMode, name: string): { content: string } | { error: string } {
  const skill = listedSkills(mode).find((item) => item.name === name)
  if (!skill) return { error: `Skill '${name}' is not available.` }
  const content = skill.name === "openui" ? `${skill.body}\n\n${openuiLibraryPrompt()}` : skill.body
  return { content }
}

export function skillsPrompt(mode: GenerationMode): string {
  const list = listedSkills(mode)
    .map((skill) => `- ${skill.name}: ${skill.description}`)
    .join("\n")
  return `## Skills

Use the loadSkill tool to load a skill when the request would benefit from specialized instructions.

Available skills:
${list}`
}
