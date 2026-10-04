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
- {"kind":"list","fields":{"<field>": {"kind":"text"} or {"kind":"register","value":"boolean"|"string"|"number"}}}

The source is one TSX file. It may import from "react", "sync", and "ui". Do not import anything else.
From "sync":
- useText(id) returns [string, (next: string, cursor?: number) => void]. From an input onChange, pass event.target.value and event.target.selectionEnd so an edit inside repeated characters lands at the caret.
- useRegister(id) returns [value | null, (value) => void]
- useList(id) returns [items, { insert(index, data?), remove(id), move(id, index), update(id, patch) }]. Each item is { id, data }.
Every id passed to those hooks must exist in schema.keys.
A list is an ordered collection of items, such as tasks. Do not store a collection as JSON in a text key.
insert adds an item and keeps it when someone else inserts at the same time. remove deletes one item. move reorders. update merges a patch into that item: updates to different fields both stay, and two updates of the same field keep the later one.
Edit a text field on an item with useText(\`\${listId}/\${item.id}/\${field}\`) so typing merges. Edit a register field with useRegister on that same path.

From "ui", these are the shadcn components. Style with their props and Tailwind className. Do not invent a second design system.
- Button. onClick, variant ("default"|"outline"|"secondary"|"ghost"|"destructive"), size ("default"|"sm"|"lg"|"icon").
- Input and Textarea. value, onChange, placeholder, field. onChange calls the useText setter with event.target.value and event.target.selectionEnd.
- Label, Separator, Skeleton.
- Checkbox and Switch. checked, onCheckedChange(checked: boolean), field.
- Slider. value is a number array, onValueChange(next: number[]), min, max, step, field.
- RadioGroup and RadioGroupItem. RadioGroup takes value, onValueChange, and field. RadioGroupItem takes value.
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem. Select takes value and onValueChange. SelectTrigger takes field. SelectItem takes value.
- Toggle and ToggleGroup take field.
Pass field on the control that edits a schema key, set to that key. Focusing it shows other people that this control is in use.
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
