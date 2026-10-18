import { describe, expect, it } from "vitest"
import { openuiMode } from "@/lib/modes/openui/mode"
import { showcaseMeta } from "./data"
import { openuiSources } from "./openui-apps"

describe("showcase openui", () => {
  it.each(showcaseMeta.map((app) => app.kind))("%s parses", async (kind) => {
    const result = await openuiMode.publish(openuiSources[kind])
    if (!result.ok) throw new Error(result.problems.join("\n"))
    expect(result.ok).toBe(true)
  })
})
