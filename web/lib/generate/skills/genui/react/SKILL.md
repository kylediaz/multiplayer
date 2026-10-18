---
name: react
description: How to write the React app, including the schema, the sync hooks, and the screen components. Load this when the app is React.
---

# React

submit takes this shape.

{
  "title": string,
  "schema": { "keys": { "<id>": Key } },
  "source": "export default function App() { ... }"
}

Key is one of:

- {"kind":"text"}
- {"kind":"register","value":"boolean"|"string"|"number"}
- {"kind":"list","fields":{"<field>": {"kind":"text"} or {"kind":"register","value":"boolean"|"string"|"number"}}}

When submit also asks for lang, set it to "react".

The source is one TSX file. It may import from "react", "sync", and "ui". Do not import anything else.

From "sync":

- useText(id) returns [string, (next: string, cursor?: number) => void]. From an input onChange, pass event.target.value and event.target.selectionEnd so an edit inside repeated characters lands at the caret.
- useRegister(id) returns [value | null, (value) => void]
- useList(id) returns [items, { insert(index, data?), remove(id), move(id, index), update(id, patch) }]. Each item is { id, data }.

Every id passed to those hooks must exist in schema.keys. A list is an ordered collection of items, such as tasks. Do not store a collection as JSON in a text key. insert adds an item and keeps it when someone else inserts at the same time. remove deletes one item. move reorders. update merges a patch into that item: updates to different fields both stay, and two updates of the same field keep the later one. Edit a text field on an item with useText(`${listId}/${item.id}/${field}`) so typing merges. Edit a register field with useRegister on that same path.

Shared state is already persisted. Never seed a list in an effect, in a loop, or during render. A draft someone is typing is local state. What they committed is shared. Counts and totals are derived. Call hooks once at the top of a component, never in a map or a condition.

From "ui", use these components. Do not invent a second design system, and do not wrap them in a flex row of your own. Card already stacks its children in a column with a gap. Each child is the width of the card.

- Card. The page root. A vertical stack.
- CardHeader. title: string. One large light title. It is not a toolbar.
- TextContent. text: string. style: "small" | "default" | "large" | "small-heavy" | "large-heavy". small is the muted line. large-heavy is a bold line. An empty list is this, not a blank control.
- TextCallout. variant: "neutral" | "info" | "success" | "warning" | "danger". title: string. description?: string. A muted rounded row with an icon. It does not contain a button.
- ListBlock. header?: string. A rounded group. Children are ListItem and Toggle rows, full width, with a hairline between them. header is a small label above the group.
- ListItem. title: string. subtitle?: string. leading?: an icon name or { src, alt }. trailing?: string. onClick?: () => void. A full-width row. onClick adds a chevron and means navigation. It is not a checkbox, and it is not a place to put a Button.
- Toggle. title: string. on: boolean. onChange?: (on: boolean) => void. icon?: string. subtitle?: string. A full-width row with the switch on the right. This is the check. There is no checkbox component.
- KVList. rows: { label, value }[]. header?: string. Label on the left, value on the right.
- Table. columns: string[]. rows: cells in column order. A cell is a string, a number, or a node. The table is the width of the card. Number columns align right.
- Tabs. tabs: { label, children }[]. A full-width segmented bar. Each segment takes an equal share. The selected tab's children show below it. Selection stays on the page.
- Buttons. direction?: "row" | "column". children are Button. row (the default) gives each child an equal share of the width. column stacks them.
- Button. label: string. onClick?: () => void. variant?: "primary" | "secondary" | "tertiary". type?: "normal" | "destructive". size?: "extra-small" | "small" | "medium" | "large". A Button fills the width of its share. One button is a bar across the card. Two buttons in a row are two equal bars. primary is the filled bar, secondary is the muted bar, tertiary is text but still full width. It does not shrink to its label. Never place a Button beside an input, a checkbox, or a list row.

There are no form fields, charts, maps, or drawings. A native input is its own line, above the button, never beside it. A list of records is a ListBlock of Toggle rows when each row is a boolean, and ListItem rows when each row is something to read.

const [items, list] = useList("tasks")
const [draft, setDraft] = useState("")
const open = items.filter((item) => item.data?.done !== true)
<Card>
  <CardHeader title="Tasks" />
  {open.length === 0 ? <TextContent text="Nothing yet." style="small" /> : (
    <ListBlock>
      {open.map((item) => <Toggle key={item.id} title={String(item.data?.title ?? "")} on={false} onChange={() => list.update(item.id, { done: true })} />)}
    </ListBlock>
  )}
  <input value={draft} placeholder="Add a task" onChange={(event) => setDraft(event.target.value)} />
  <Buttons>
    <Button label="Add" onClick={() => { const title = draft.trim(); if (!title) return; list.insert(items.length, { title, done: false }); setDraft("") }} />
  </Buttons>
</Card>
