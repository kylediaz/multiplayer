import { createParser } from "@openuidev/lang-core"
import { parseSchema } from "@shared/sync/schema"
import type { Published, ViewMode } from "../mode"
import { library } from "./library"

const parser = createParser(library.toJSONSchema(), library.root)

function problemsFor(source: string): string[] {
  if (!source) return ["The app needs an OpenUI program."]
  const result = parser.parse(source)
  const problems = result.meta.errors.flatMap((error) =>
    error.severity === "warning" ? [] : [error.statementId ? `${error.statementId}: ${error.message}` : error.message]
  )
  if (problems.length) return problems
  if (!result.root || result.meta.incomplete) return ["The OpenUI program needs a root."]
  return []
}

export const openuiMode: ViewMode = {
  lang: "openui",
  schema() {
    return parseSchema({ keys: {} })
  },
  async publish(source): Promise<Published> {
    const problems = problemsFor(source)
    if (problems.length) return { ok: false, problems }
    return { ok: true, files: [{ name: "source.txt", body: source, type: "text/plain" }] }
  },
}
