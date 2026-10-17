import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { createOpenAI, type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai"
import { APICallError, isStepCount, ToolLoopAgent, tool } from "ai"
import { z } from "zod"
import { isDocumentLang, type DocumentLang, type GenerationMode } from "@shared/lang"
import { viewMode } from "../modes"
import { parseGeneration, type Generation } from "../parse-generation"
import type { RevisionFile } from "../modes/mode"
import { repoRoot } from "../repo-root"
import { instructions } from "./prompts"

const MODEL = "gpt-6.1-sol"

const textKey = z.object({ kind: z.literal("text") })
const registerKey = z.object({
  kind: z.literal("register"),
  value: z.enum(["boolean", "string", "number"]),
})
const field = z.discriminatedUnion("kind", [textKey, registerKey])
const keyDef = z.discriminatedUnion("kind", [
  textKey,
  registerKey,
  z.object({
    kind: z.literal("list"),
    fields: z.record(z.string(), field),
  }),
])

const reactInput = z.object({
  title: z.string().describe("Short document title"),
  schema: z
    .object({ keys: z.record(z.string(), keyDef) })
    .describe("Shared state. Every id passed to a sync hook is a key."),
  source: z.string().describe("One TSX module with a default export. It may import from react, sync, and ui."),
})

const openuiInput = z.object({
  title: z.string().describe("Short document title"),
  source: z.string().describe("An openui-lang program whose root is Card. No markdown fences."),
})

const decideInput = reactInput.extend({
  lang: z
    .enum(["react", "openui"])
    .describe("openui when the Cupertino components can express the app. react when it needs shared state or behavior those components cannot express."),
})

type SubmitInput = { title: string; source: string; schema?: unknown; lang?: DocumentLang }

export async function generateDocument(prompt: string, mode: GenerationMode): Promise<Generation & { files: RevisionFile[] }> {
  let accepted: (Generation & { files: RevisionFile[] }) | null = null
  let failure = "The model did not produce a valid app."
  const openai = createOpenAI({ apiKey: openAiKey() })
  const agent = new ToolLoopAgent({
    model: openai(MODEL),
    instructions: instructions(mode),
    toolChoice: "required",
    toolCallConcurrency: 1,
    providerOptions: {
      openai: {
        parallelToolCalls: false,
        reasoningSummary: null,
      } satisfies OpenAILanguageModelResponsesOptions,
    },
    tools: {
      submit: tool({
        description: "Submit the finished app. If the result lists problems, fix the app and submit again.",
        inputSchema: mode === "decide" ? decideInput : mode === "openui" ? openuiInput : reactInput,
        execute: async (input: SubmitInput) => {
          const lang = chosenLang(mode, input.lang)
          if (!lang) {
            failure = "Choose lang react or openui."
            return { ok: false as const, problems: [failure] }
          }
          try {
            const result = await accept(lang, input)
            if (!result.ok) {
              failure = result.problems.join("\n")
              return { ok: false as const, problems: result.problems }
            }
            accepted = result
            return { ok: true as const }
          } catch (err) {
            const problem = clean(err)
            failure = problem
            return { ok: false as const, problems: [problem] }
          }
        },
      }),
    },
    stopWhen: [
      ({ steps }) => steps.at(-1)?.toolResults.some((result) => submitted(result.output)) ?? false,
      isStepCount(4),
    ],
  })

  try {
    await agent.generate({ prompt })
  } catch (err) {
    throw modelFailure(err)
  }
  if (!accepted) throw new Error(failure)
  return accepted
}

async function accept(
  lang: DocumentLang,
  input: SubmitInput
): Promise<(Generation & { ok: true; files: RevisionFile[] }) | { ok: false; problems: string[] }> {
  const generation = parseGeneration({
    title: input.title,
    lang,
    source: input.source,
    schema: input.schema,
  })
  const revision = await viewMode(lang).publish(generation.source)
  if (!revision.ok) return revision
  return { ok: true, ...generation, files: revision.files }
}

function chosenLang(mode: GenerationMode, lang: DocumentLang | undefined): DocumentLang | null {
  if (mode !== "decide") return mode
  return isDocumentLang(lang) ? lang : null
}

function submitted(output: unknown): boolean {
  return typeof output === "object" && output !== null && "ok" in output && output.ok === true
}

function clean(err: unknown): string {
  const message = err instanceof Error ? err.message : "The app failed."
  return message.replace(/\u001b\[[0-9;]*m/g, "").slice(0, 800)
}

function modelFailure(err: unknown): Error {
  if (APICallError.isInstance(err)) {
    if (err.statusCode === 401) return new Error("The OpenAI key was rejected.")
    const detail = (err.responseBody ?? err.message).replace(/\s+/g, " ").slice(0, 180)
    return new Error(`The model request failed (${err.statusCode ?? "unknown"}). ${detail}`)
  }
  return err instanceof Error ? err : new Error("The document could not be generated.")
}

function openAiKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const file = path.join(repoRoot(), ".env")
  if (!existsSync(file)) throw new Error("OPENAI_API_KEY is not set.")
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed.startsWith("OPENAI_API_KEY=")) continue
    const value = trimmed.slice("OPENAI_API_KEY=".length).trim().replace(/^["']|["']$/g, "")
    if (value) return value
  }
  throw new Error("OPENAI_API_KEY is not set.")
}
