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

From "ui", use the canvas components. Style with their props and the style prop. Do not use Tailwind className, and do not invent a second design system.
Layout: Stack (vertical, gap), Row (horizontal, gap, align, justify), Grid (columns as a number or a template string, gap), Divider, Spacer.
Type: H1, H2, H3, Text (tone "primary"|"secondary"|"tertiary"|"quaternary", size "body"|"small"), Code, Link.
Surfaces: Card with CardHeader (plain text, optional trailing) and CardBody. Table (headers, rows). Callout (tone "info"|"success"|"warning"|"danger"|"neutral"). Stat (value, label). Pill. Button (variant "primary"|"secondary"|"ghost", onClick).
Forms. onChange receives the value, not a DOM event.
- TextInput and TextArea. value, placeholder, field, onChange(value, cursor). For a text key, pass both arguments to the useText setter: onChange={(value, cursor) => setName(value, cursor)}.
- Checkbox. checked, label, field, onChange(checked: boolean).
- Toggle. checked, field, onChange(checked: boolean).
- Select. value, field, options as { value, label }[], onChange(value: string).
Pass field on the control that edits a schema key, set to that key. Focusing it shows other people that this control is in use.
Charts: BarChart (categories, series of { name, data }), LineChart, PieChart (data of { label, value }).
Also CollapsibleSection, DiffView, UsageBar, TodoList, Swatch, IconButton.
font-sans is Inter and font-mono is Geist Mono. Those faces are already loaded. Do not import font files.

Build the smallest layout that does what was asked. The page is one Stack. The title is an H1, not a Card. Controls that act on the page go in one Row under the title. The main content sits in the open, under that row.
Do not wrap the page in a Card. Do not put a Card inside a Card. Do not put a Callout or a TodoList inside a Card.
Do not add filters, counts, reorder buttons, clear buttons, or a control on every row unless the user asked for them. For a list of tasks, use TodoList. Do not rebuild a task row out of Checkbox, TextInput, and Button.
TodoList takes the list items directly. Each item is { id, data }, and data holds registers: a string register named title or content, and a boolean register named done or a string register named status ("pending" | "in_progress" | "completed" | "cancelled"). Do not map the items into another shape, and do not pass listId.
const [items, tasks] = useList("tasks")
<TodoList todos={items} onTodoClick={(todo) => tasks.update(todo.id, { done: todo.data?.done !== true })} />
When adding, store the registers on the item: tasks.insert(items.length, { title: draft.trim(), done: false }).
A task app is an H1, one Row with a TextInput and an Add Button, then that TodoList. Nothing else.

## Design guidance

Be creative. The SDK gives you expressive building blocks — use them in whatever combination best serves the content. But avoid slop: no gradients, no emojis, no box-shadows, no rainbow coloring. Cursor canvases are flat, minimal, and purposeful.

### Visual hierarchy

Not everything deserves equal treatment. Primary content gets more space, larger headings, and accent color. Supporting content stays compact. Squint test: blur your eyes — can you tell what matters?

**Color.** All colors from \`useHostTheme()\` tokens — read its JSDoc in the SDK declarations for the return shape and usage pattern. No hardcoded hex. Use accent color deliberately, not on everything.

### Slop patterns — forbidden

These specific patterns produce low-quality output. If 2+ are present, redesign.

- **Gradients** — no \`linear-gradient\`, \`radial-gradient\`, \`background-clip: text\`.
- **Emojis** — no emoji as icons, status indicators, bullets, or section markers.
- **Box shadows** — no \`box-shadow\`. Flat surfaces only.
- **Wall of identical cards** — every section wrapped in the same card style with no variation. Mix open sections with cards.
- **Rainbow coloring** — a different color on every element. Most elements are neutral; color is used sparingly with purpose.
- **Giant text** — font sizes above H1 (24px), or bold text stuffed in CardHeader.
- **Decorative borders** — colored borders on every element. Borders are structural (subtle stroke tokens), not decorative.

### Pre-delivery self-check

Before returning canvas code, verify:
1. Does the layout have visual hierarchy? One thing should stand out.
2. Is there variety in the composition? Not just a single column of uniform blocks.
3. Slop check: scan for the forbidden patterns above.

Key constraints:
- Colors from \`useHostTheme()\` tokens (\`theme.bg.editor\`, not \`theme.colors.bg.primary\`). No hardcoded hex.
- Literal props are component-specific: \`Pill.tone\` has no \`"danger"\` and is ignored; \`Card.variant\` is only \`"default"\` | \`"borderless"\`.
- No gradients, no box-shadows, no emojis as decoration.
- Don't wrap every section in Card — mix open sections with cards.
- Run that skill's Pre-delivery self-check before returning code.

Be creative with layout — use Grid, Row, cards, charts, tables, and raw SVG in whatever combination serves the content.

Bordered surface for a **labeled, self-contained unit** — a file, a service, a config block, or a table with a title. Compose with \`CardHeader\` + \`CardBody\`.

**When to use Card:**
- Displaying a named entity (file path, service name, resource).
- Wrapping a \`<Table>\` or \`<DiffView>\` that needs a title.
- A distinct, bounded section the user might scan by header label.

**When NOT to use Card:**
- General text sections — use \`<H2>\` + \`<Text>\` instead. Not every section needs a border.
- Page-level layout — use \`<Stack>\` with headings. A canvas should not be a wall of stacked cards.
- Nesting — do not put cards inside cards. Use \`<Divider>\` within a card body.

Pass **plain text** as \`CardHeader\` children — the header provides its own 12px font. Do **not** put \`<H1>\` or \`<H2>\` inside a card header.

**\`children\`** — plain text only. This is a 12px label, not a toolbar. Do **not** pass \`<H1>\`, \`<H2>\`, \`<Text weight="bold">\`, \`<Pill>\`, \`<Button>\`, \`<Row>\`, or any interactive/layout elements as children.

**\`trailing\`** — optional right-aligned slot for small status indicators (a short label, a single \`<Pill>\`, a metadata string like a timestamp).

Action button (24px height, sized to its label). **Never stretch to full width** — buttons are always inline and hug their text.

Data table with column headers and rows. Framed by default with its own bordered container — **do not wrap in a Card** unless the card itself is a named entity that happens to contain a table. Render directly under a heading in the normal case.

Single metric display — a large value with a compact label beneath it. Best as compact supporting context beside a primary artifact (e.g. one or two Stats in a \`<Row>\`); reserve a \`<Grid>\` of equal Stats for when the data truly calls for a summary strip.

Pills are always neutral — \`tone\` is ignored and is not a shared semantic vocabulary with Stat / Callout / Chart.

Prefer built-in components (\`Card\`, \`Button\`, \`Text\`, etc.) over raw token usage. Reach for tokens only when no component covers the case, and stick to flat solid colors — no gradients, no box-shadows.

Stable paths for \`style={{ ... }}\` usage:
- \`text.primary / secondary / tertiary / quaternary\` — text hierarchy
- \`bg.editor / chrome / elevated\` — surface backgrounds
- \`fill.primary / secondary / tertiary / quaternary\` — tinted fills
- \`stroke.primary / secondary / tertiary\` — borders and dividers
- \`accent.primary / control\` — accent blue and button background
- \`text.link\` — link color
- \`text.onAccent\` — text on accent-colored surfaces

Use for small tweaks on built-in components (e.g. extra padding or width). **Do not** use this to build elaborate custom chrome — prefer the built-in components and flat solid token colors. No gradients, no box-shadows.

The design guidance describes what to avoid. It is not a request to add sections, cards, or controls. Ship the smallest layout that does what was asked.`

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
