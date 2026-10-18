import type { GenerationMode } from "@shared/lang"
import { openuiLibrary } from "../modes/openui/library"

let openuiPrompt: string | undefined

function openuiComponentPrompt(): string {
  openuiPrompt ??= openuiLibrary.prompt({
    preamble:
      "The submitted source is an openui-lang program. The root is Card. Do not write React, do not use the shadcn components, and do not wrap the program in markdown fences.",
    additionalRules: [
      "The page is one Card. Start with CardHeader.",
      "There are no form fields or charts.",
    ],
  })
  return openuiPrompt
}

const REACT = `You build a collaborative React app. Call submit with the finished app. If submit returns problems, fix the app and call submit again. Do not reply with the source as text.
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

From "ui", use the shared screen components. The page is one Card. Do not invent a second design system, and do not hardcode hex.
- Card. The page root. Children stack. Its type is set from a 16px root.
- CardHeader. title: string. The large title.
- TextContent. text: string. style: "small" | "default" | "large" | "small-heavy" | "large-heavy".
- TextCallout. variant: "neutral" | "info" | "success" | "warning" | "danger". title: string. description?: string.
- ListBlock. header?: string. children are ListItem and Toggle rows.
- ListItem. title: string. subtitle?: string. leading?: an icon name or { src, alt }. trailing?: string. onClick?: () => void. A row with onClick shows a navigation affordance.
- Toggle. title: string. on: boolean. onChange?: (on: boolean) => void. icon?: string. subtitle?: string.
- KVList. rows: { label, value }[]. header?: string.
- Buttons. direction?: "row" | "column". children are Button.
- Button. label: string. onClick?: () => void. variant?: "primary" | "secondary" | "tertiary". type?: "normal" | "destructive". size?: "extra-small" | "small" | "medium" | "large".
- Table. columns: string[]. rows: cells in column order. A cell is a string, a number, or a node. Number columns align right.
- Tabs. tabs: { label, children }[]. One segmented bar. The selected tab's children show below it.
There are no form fields, charts, maps, or drawings. A list of records is a ListBlock of ListItem rows. Edit a list item with useList, and pass onClick or Toggle onChange for the interaction.
const [items, tasks] = useList("tasks")
<Card>
  <CardHeader title="Tasks" />
  <ListBlock>
    {items.map((item) => <ListItem key={item.id} title={String(item.data?.title ?? "")} onClick={() => tasks.update(item.id, { done: item.data?.done !== true })} />)}
  </ListBlock>
</Card>
font-sans is Inter and font-mono is Geist Mono. Those faces are already loaded. Do not import font files.

Build the smallest Card that does what was asked. Start with CardHeader. Do not add filters, counts, or a control on every row unless the user asked for them.`

const OPENUI = `You build an app with the OpenUI component library. Call submit with the finished app. If submit returns problems, fix the program and call submit again. Do not reply with the source as text.
{
  "title": string,
  "source": "<openui-lang program>"
}
The program does not share state and has no form fields.`

const DECIDE = `You build an app. Choose React or OpenUI, then call submit with lang set to that choice. If submit returns problems, fix the app and call submit again. Do not reply with the source as text.

Set lang to "openui" when a screen of headers, text, lists, media, maps, tables, drawings, and buttons can express the app. source is an openui-lang program and schema is { "keys": {} }.
Set lang to "react" when the app needs shared collaborative state or behavior the OpenUI library cannot express. source is one TSX file, and schema lists every sync id. React uses the same structural and text components, plus onClick and onChange.

When lang is "react", follow this contract.

`

export function instructions(mode: GenerationMode): string {
  if (mode === "react") return REACT
  const openui = `${OPENUI}\n\n${openuiComponentPrompt()}`
  if (mode === "openui") return openui
  return `${DECIDE}${REACT}\n\nWhen lang is "openui", schema.keys is empty and source is the openui-lang program described next.\n\n${openui}`
}
