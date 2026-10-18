import { createParser } from "@openuidev/lang-core"
import { describe, expect, it } from "vitest"
import { parseSchema } from "@shared/sync/schema"
import { openuiLibrary } from "../modes/openui/library"
import { reactMode } from "../modes/react/mode"
import { instructions } from "./prompts"
import { listedSkills, readSkill, skillLangs } from "./skills"

const examples = listedSkills("decide").filter((skill) => skill.name !== "react" && skill.name !== "openui")
const fenced = (text: string | undefined, lang: string) => text?.match(new RegExp("```" + lang + "\\n([\\s\\S]*?)\\n```"))?.[1]

describe("generation skills", () => {
  it("keeps principles in the prompt and the component contract in the skill", () => {
    const prompt = instructions("react")
    expect(prompt).toContain("smallest Card")
    expect(prompt).toContain("react:")
    expect(prompt).toContain("groceries:")
    expect(prompt).not.toContain("useText")
    expect(prompt).not.toContain("openui:")
  })

  it("lists only the examples written for the mode", () => {
    const react = listedSkills("react").map((skill) => skill.name)
    const openui = listedSkills("openui").map((skill) => skill.name)
    expect(react).toEqual(expect.arrayContaining(["groceries", "poll", "recipe", "heater"]))
    expect(react).not.toContain("drive")
    expect(openui).toEqual(expect.arrayContaining(["drive", "cabins", "recipe", "heater"]))
    expect(openui).not.toContain("groceries")
  })

  it("advertises both languages when the agent chooses", () => {
    const names = listedSkills("decide").map((skill) => skill.name)
    expect(names.slice(0, 2)).toEqual(["react", "openui"])
    expect(names).toContain("heater")
    expect(instructions("decide")).toContain('Set lang to "openui"')
    expect(instructions("decide")).toContain("recipe (React, OpenUI)")
  })

  it("loads a skill by name", () => {
    const react = readSkill("react", "react")
    const openui = readSkill("openui", "openui")
    expect("content" in react && react.content).toContain("fills the width")
    expect("content" in react && react.content).toContain("useList")
    expect("content" in openui && openui.content).toContain("openui-lang")
    expect("content" in openui && openui.content).toContain("$variable")
    expect(readSkill("react", "openui")).toEqual({ error: "Skill 'openui' is not available." })
  })

  it("loads only the mode's half of an example", () => {
    const react = readSkill("react", "recipe")
    const openui = readSkill("openui", "recipe")
    const decide = readSkill("decide", "recipe")
    expect("content" in react && react.content).toContain("```tsx")
    expect("content" in react && react.content).not.toContain("```openui")
    expect("content" in openui && openui.content).toContain("```openui")
    expect("content" in openui && openui.content).not.toContain("```tsx")
    expect("content" in decide && decide.content).toContain("## React")
    expect("content" in decide && decide.content).toContain("## OpenUI")
  })
})

describe("example skills", () => {
  const react = examples.filter((skill) => skill.sections.react !== undefined)
  const openui = examples.filter((skill) => skill.sections.openui !== undefined)
  const parser = createParser(openuiLibrary.toJSONSchema(), openuiLibrary.root)

  it("every example has code for each language it lists", () => {
    for (const skill of examples) {
      expect(skillLangs(skill).length, skill.name).toBeGreaterThan(0)
    }
  })

  it.each(react.map((skill) => [skill.name, skill] as const))("%s compiles as a React app", async (_, skill) => {
    const source = fenced(skill.sections.react, "tsx")
    const schemaText = fenced(skill.sections.react, "json")
    if (!source || !schemaText) throw new Error("missing tsx or json block")
    const schema = parseSchema(JSON.parse(schemaText))
    for (const [, key] of source.matchAll(/use(?:Text|Register|List)(?:<[^>]+>)?\(\s*[`"]([a-zA-Z0-9_]+)/g)) {
      expect(Object.keys(schema.keys), `${skill.name} uses ${key}`).toContain(key)
    }
    const result = await reactMode.publish(source)
    if (!result.ok) throw new Error(result.problems.join("\n"))
  }, 20_000)

  it.each(openui.map((skill) => [skill.name, skill] as const))("%s parses as an OpenUI program", (_, skill) => {
    const source = fenced(skill.sections.openui, "openui")
    if (!source) throw new Error("missing openui block")
    const parsed = parser.parse(source)
    expect(parsed.meta.errors.map((error) => `${error.statementId}: ${error.message}`)).toEqual([])
    expect(parsed.meta.unresolved).toEqual([])
    expect(parsed.meta.orphaned).toEqual([])
  })
})
