import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { DocumentLang, GenerationMode } from "@shared/lang"
import { openuiLibrary } from "../../modes/openui/library"
import { repoRoot } from "../../repo-root"

export type Skill = {
  name: string
  description: string
  intro: string
  sections: Partial<Record<DocumentLang, string>>
}

const LANGS: DocumentLang[] = ["react", "openui"]
const LABELS: Record<DocumentLang, string> = { react: "React", openui: "OpenUI" }

const ORDER = [
  "react",
  "openui",
  "groceries",
  "books",
  "poll",
  "rsvp",
  "kitty",
  "tonight",
  "drive",
  "cabins",
  "brief",
  "split",
  "recipe",
  "heater",
  "schedule",
  "dishes",
]

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
  const [intro = "", ...rest] = content.slice(match[0].length).split(/^## (React|OpenUI)[ \t]*$/m)
  const sections: Skill["sections"] = {}
  for (let index = 0; index < rest.length; index += 2) {
    sections[rest[index] === "React" ? "react" : "openui"] = rest[index + 1]?.trim() ?? ""
  }
  return { name, description, intro: intro.trim(), sections }
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

export function skillLangs(skill: Skill): DocumentLang[] {
  if (skill.name === "react" || skill.name === "openui") return [skill.name]
  return LANGS.filter((lang) => skill.sections[lang] !== undefined)
}

export function listedSkills(mode: GenerationMode): Skill[] {
  const rank = new Map(ORDER.map((name, index) => [name, index]))
  return allSkills()
    .filter((skill) => mode === "decide" || skillLangs(skill).includes(mode))
    .sort((a, b) => (rank.get(a.name) ?? 99) - (rank.get(b.name) ?? 99))
}

function openuiLibraryPrompt(): string {
  openuiPrompt ??= openuiLibrary.prompt({
    preamble:
      "The submitted source is an openui-lang program. The root is Card. Do not write React, do not use the shadcn components, and do not wrap the program in markdown fences.",
    bindings: true,
    additionalRules: [
      "The page is one Card. Start with CardHeader, or with an ImageBlock and then CardHeader.",
      "There are no form fields. A choice is a row of Buttons that @Set a $variable.",
      "Toggle flips on its own and binds no state.",
      "Every Button and every tappable ListItem has an action: @Set or @OpenUrl. There is no assistant to send a message to.",
      "Draw a chart or a diagram with Svg shapes.",
    ],
  })
  return openuiPrompt
}

function exampleContent(mode: GenerationMode, skill: Skill): string {
  const langs = mode === "decide" ? skillLangs(skill) : [mode]
  const parts = langs.map((lang) => (mode === "decide" ? `## ${LABELS[lang]}\n\n${skill.sections[lang]}` : (skill.sections[lang] ?? "")))
  return [skill.intro, ...parts].filter(Boolean).join("\n\n")
}

export function readSkill(mode: GenerationMode, name: string): { content: string } | { error: string } {
  const skill = listedSkills(mode).find((item) => item.name === name)
  if (!skill) return { error: `Skill '${name}' is not available.` }
  if (skill.name === "openui") return { content: `${skill.intro}\n\n${openuiLibraryPrompt()}` }
  if (skill.name === "react") return { content: skill.intro }
  return { content: exampleContent(mode, skill) }
}

export function skillsPrompt(mode: GenerationMode): string {
  const list = listedSkills(mode)
    .map((skill) => {
      const langs = skillLangs(skill)
      const tag = mode === "decide" && skill.name !== "react" && skill.name !== "openui" ? ` (${langs.map((lang) => LABELS[lang]).join(", ")})` : ""
      return `- ${skill.name}${tag}: ${skill.description}`
    })
    .join("\n")
  return `## Skills

Use the loadSkill tool to load a skill when the request would benefit from specialized instructions.

Available skills:
${list}`
}
