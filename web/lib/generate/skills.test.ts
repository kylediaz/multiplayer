import { describe, expect, it } from "vitest"
import { instructions } from "./prompts"
import { listedSkills, readSkill } from "./skills"

describe("generation skills", () => {
  it("keeps principles in the prompt and the component contract in the skill", () => {
    const prompt = instructions("react")
    expect(prompt).toContain("smallest Card")
    expect(prompt).toContain("react:")
    expect(prompt).toContain("groceries:")
    expect(prompt).not.toContain("useText")
    expect(prompt).not.toContain("openui:")
  })

  it("advertises both languages when the agent chooses", () => {
    const names = listedSkills("decide").map((skill) => skill.name)
    expect(names.slice(0, 2)).toEqual(["react", "openui"])
    expect(names).toContain("heater")
    expect(instructions("decide")).toContain('Set lang to "openui"')
  })

  it("loads a skill by name", () => {
    const react = readSkill("react", "react")
    const openui = readSkill("openui", "openui")
    const groceries = readSkill("decide", "groceries")
    expect("content" in react && react.content).toContain("fills the width")
    expect("content" in react && react.content).toContain("useList")
    expect("content" in openui && openui.content).toContain("openui-lang")
    expect("content" in openui && openui.content).toContain("CardHeader")
    expect("content" in groceries && groceries.content).toContain("schema.keys.items")
    expect(readSkill("react", "openui")).toEqual({ error: "Skill 'openui' is not available." })
  })
})
