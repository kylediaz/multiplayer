import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { parseGeneration, type Generation } from "./parse-generation"

const SYSTEM = `You build a collaborative React app. Reply with one JSON object and nothing else.
{
  "title": string,
  "schema": { "keys": { "<id>": Key } },
  "source": "export default function App() { ... }"
}
Key is one of:
- {"kind":"text"}
- {"kind":"register","value":"boolean"|"string"|"number"}

The source is one TSX file. It may import from "react", "sync", and "ui". Do not import anything else.
From "sync":
- useText(id) returns [string, (next: string) => void]
- useRegister(id) returns [value | null, (value) => void]
Every id passed to those hooks must exist in schema.keys.

From "ui", these are the shadcn components. Style with their props and Tailwind className. Do not invent a second design system.
- Button. onClick, variant ("default"|"outline"|"secondary"|"ghost"|"destructive"), size ("default"|"sm"|"lg"|"icon").
- Input and Textarea. value, onChange, placeholder.
- Label, Separator, Skeleton.
- Checkbox and Switch. checked, onCheckedChange(checked: boolean).
- Slider. value is a number array, onValueChange(next: number[]), min, max, step.
- RadioGroup and RadioGroupItem. RadioGroup takes value and onValueChange. RadioGroupItem takes value.
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem. Select takes value and onValueChange. SelectItem takes value.
- Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
- Field, FieldLabel, FieldDescription, FieldGroup, FieldSet.
- Toggle, ToggleGroup, ToggleGroupItem.
- Avatar, AvatarFallback, AvatarGroup.
Put fields inside Field and cards inside Card. Layout with Tailwind on divs (flex, grid, gap, p-6).
font-sans is Inter and font-mono is Geist Mono. Those faces are already loaded. Do not import font files.`

export async function generateDocument(prompt: string): Promise<Generation> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${openAiKey()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(response.status === 401 ? "The OpenAI key was rejected." : `The model request failed (${response.status}). ${detail.slice(0, 180)}`)
  }
  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const content = body.choices?.[0]?.message?.content
  if (!content) throw new Error("The model returned an empty document.")
  return parseGeneration(JSON.parse(content))
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

function repoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "..")]
  return candidates.find((dir) => existsSync(path.join(dir, "api", "index.ts"))) ?? process.cwd()
}
