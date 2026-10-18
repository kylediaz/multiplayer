import { readFileSync } from "node:fs"
import { parseArgs } from "node:util"
import { isGenerationMode } from "@shared/lang"
import { generatePair } from "./generate"

const USAGE = `Usage: pnpm optimize [--mode react|openui|decide] [--pairs N] [--file tasks.txt] [task ...]

Generates N pairs per task with the current prompt. A tasks file has one task per line; blank lines and lines starting with # are skipped.`

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    mode: { type: "string", default: "react" },
    pairs: { type: "string", default: "1" },
    file: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
})

const mode = values.mode
const pairs = Number(values.pairs)
const tasks = [
  ...(values.file
    ? readFileSync(values.file, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
    : []),
  ...positionals.map((task) => task.trim()).filter(Boolean),
]

if (values.help || !tasks.length || !isGenerationMode(mode) || !Number.isInteger(pairs) || pairs < 1) {
  console.log(USAGE)
  process.exit(values.help ? 0 : 1)
}

let failed = 0
for (const task of tasks) {
  for (let index = 1; index <= pairs; index++) {
    const started = Date.now()
    try {
      const pair = await generatePair(task, mode)
      console.log(`${pair.id}  ${((Date.now() - started) / 1000).toFixed(0)}s  ${task}`)
    } catch (err) {
      failed++
      console.error(`failed  ${task}: ${err instanceof Error ? err.message : err}`)
    }
  }
}
process.exit(failed ? 1 : 0)
