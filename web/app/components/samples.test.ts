import { createParser } from "@openuidev/lang-core"
import { describe, expect, it } from "vitest"
import { openuiLibrary } from "@/lib/modes/openui/library"
import { samples } from "./samples"

const parser = createParser(openuiLibrary.toJSONSchema(), openuiLibrary.root)

describe("component samples", () => {
  it.each(samples.map((sample) => sample.name))("%s parses", (name) => {
    const sample = samples.find((item) => item.name === name)
    if (!sample) throw new Error(name)
    const result = parser.parse(sample.source)
    const errors = result.meta.errors.filter((error) => error.severity !== "warning")
    expect(errors.map((error) => `${error.statementId ?? ""}: ${error.message}`)).toEqual([])
    expect(result.meta.orphaned).toEqual([])
    expect(result.meta.unresolved).toEqual([])
    expect(result.root).not.toBeNull()
  })
})
