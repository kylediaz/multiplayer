import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { optimizeStore } from "../optimize/store"
import { instructions } from "./prompts"
import { listedSkills, readSkill } from "./skills"
import { promptText, promptVersion, versionOf } from "./version"

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("prompt version", () => {
  it("covers the instructions and every skill the model can load", () => {
    const text = promptText("react")
    expect(text).toContain(instructions("react"))
    for (const skill of listedSkills("react")) {
      const loaded = readSkill("react", skill.name)
      expect("content" in loaded && text.includes(loaded.content)).toBe(true)
    }
  })

  it("is stable for the same prompt and changes with the prompt, mode, or model", () => {
    const react = promptText("react")
    expect(versionOf(react)).toBe(versionOf(react))
    expect(versionOf(react)).toMatch(/^[0-9a-f]{12}$/)
    expect(versionOf(`${react}\nOne more rule.`)).not.toBe(versionOf(react))
    expect(versionOf(promptText("openui"))).not.toBe(versionOf(react))
    expect(versionOf(promptText("react", "another-model"))).not.toBe(versionOf(react))
  })

  it("saves the prompt text under its version", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "optimize-"))
    dirs.push(dir)
    const version = promptVersion("react", optimizeStore(dir))
    expect(version).toBe(versionOf(promptText("react")))
    expect(readFileSync(path.join(dir, "prompts", `${version}.txt`), "utf8")).toBe(promptText("react"))
  })
})
