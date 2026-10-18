import { createParser } from "@openuidev/lang-core"
import { describe, expect, it } from "vitest"
import { openuiLibrary } from "@/lib/modes/openui/library"
import { openuiMode } from "@/lib/modes/openui/mode"
import { openuiShowcase } from "./data"
import { openuiSources } from "./openui-apps"

const parser = createParser(openuiLibrary.toJSONSchema(), openuiLibrary.root)

describe("showcase openui", () => {
  it.each(openuiShowcase.map((app) => app.kind))("%s parses", async (kind) => {
    const result = await openuiMode.publish(openuiSources[kind])
    if (!result.ok) throw new Error(result.problems.join("\n"))
    const parsed = parser.parse(openuiSources[kind])
    expect(parsed.meta.errors.map((error) => `${error.statementId}: ${error.message}`)).toEqual([])
    expect(parsed.meta.unresolved).toEqual([])
    expect(parsed.meta.orphaned).toEqual([])
  })
})
