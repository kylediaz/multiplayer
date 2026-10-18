import { readFileSync } from "node:fs"
import { parseArgs } from "node:util"
import { isGenerationMode, type GenerationMode } from "@shared/lang"
import { generatePair } from "./generate"

const USAGE = `Usage: pnpm optimize [--mode react|openui|decide] [--pairs N] [--concurrency N] [--file tasks.txt] [task ...]

Generates N pairs per task with the current prompt, running up to --concurrency pairs at once (default 4). A tasks file has one task per line; blank lines and lines starting with # are skipped.`

;(globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    mode: { type: "string", default: "react" },
    pairs: { type: "string", default: "1" },
    concurrency: { type: "string", default: "4" },
    file: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
})

const mode = values.mode
const pairs = Number(values.pairs)
const concurrency = Number(values.concurrency)
const tasks = [
  ...(values.file
    ? readFileSync(values.file, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
    : []),
  ...positionals.map((task) => task.trim()).filter(Boolean),
]

if (
  values.help ||
  !tasks.length ||
  !isGenerationMode(mode) ||
  !Number.isInteger(pairs) ||
  pairs < 1 ||
  !Number.isInteger(concurrency) ||
  concurrency < 1
) {
  console.log(USAGE)
  process.exit(values.help ? 0 : 1)
}

const generationMode: GenerationMode = mode
const jobs = tasks.flatMap((task) => Array.from({ length: pairs }, () => task))
let next = 0
let done = 0
let failed = 0

async function worker() {
  while (next < jobs.length) {
    const task = jobs[next++]
    const started = Date.now()
    try {
      const pair = await generatePair(task, generationMode)
      console.log(`[${++done}/${jobs.length}] ${pair.id}  ${((Date.now() - started) / 1000).toFixed(0)}s  ${task.slice(0, 80)}`)
    } catch (err) {
      failed++
      console.error(`[${++done}/${jobs.length}] failed  ${task.slice(0, 80)}: ${err instanceof Error ? err.message : err}`)
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker))
console.log(`${jobs.length - failed} pairs generated, ${failed} failed`)
process.exit(failed ? 1 : 0)
