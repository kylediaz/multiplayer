---
name: react
description: How to write the React app, including the schema, the sync hooks, the screen components, and the patterns that make it good. Load this when the app is React.
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

## What React is for

Everyone with the link opens the same document, and every change shows on every phone at once. React is the app for things people do together: add to a list, check it off, vote, reply, log what they spent, edit the same notes, watch the same timer. It also has what OpenUI lacks: text fields, sliders, selects, timers, and real code that can simulate, settle, sort, and count.

Use that. A shared list has a field to add to it. A poll counts the votes and draws them. An RSVP is a real form that adds a reply. A kitty works out who pays whom. A thermostat runs the rule and plots it. Do not hand back a static page in React.

## Shared state

From "sync":

- useText(id) returns [string, (next: string, cursor?: number) => void]. From an input onChange, pass event.target.value and event.target.selectionEnd so an edit inside repeated characters lands at the caret.
- useRegister(id) returns [value | null, (value) => void]
- useList(id) returns [items, { insert(index, data?), remove(id), move(id, index), update(id, patch) }]. Each item is { id, data }.

Every id passed to those hooks must exist in schema.keys. A list is an ordered collection of items, such as tasks. Do not store a collection as JSON in a text key. insert adds an item and keeps it when someone else inserts at the same time. remove deletes one item. move reorders. update merges a patch into that item: updates to different fields both stay, and two updates of the same field keep the later one. Edit a text field on an item with useText(`${listId}/${item.id}/${field}`) so typing merges. Edit a register field with useRegister on that same path.

Shared state is already persisted. Never seed a list in an effect, in a loop, or during render. A draft someone is typing is local state. What they committed is shared. Counts and totals are derived. Call hooks once at the top of a component, never in a map or a condition. To edit one item with hooks, render a child component for it and call the hooks there.

- Every list starts empty. Rows the ask already knows, like ingredients or restaurants, are written in the source. What people do to them is shared: a list holding one item per ticked row or per vote.
- A vote, a claim, or anything that is "mine" is a list item with a voter field. The device's id is `const [me] = useState(() => crypto.randomUUID())`. Never use useId for this: it is the same on every phone.
- Two people bumping one number at once lose a count. Insert one item per vote and count the items.
- A shared timer is a number register holding the time it ends, `Date.now() + minutes * 60000`. Every phone counts down to the same moment. Tick a local `now` with setInterval in an effect while it runs.
- A decision is a register. When it is set, the screen shows the result for everyone, with a quiet way to undo it.

## Screen components

From "ui", use these components. Do not invent a second design system, and do not wrap them in a flex row of your own. Card already stacks its children in a column with a gap. Each child is the width of the card.

- Card. The page root. A vertical stack.
- CardHeader. title: string. One large light title. It is not a toolbar.
- TextContent. text: string. style: "small" | "default" | "large" | "small-heavy" | "large-heavy". small is the muted line. large-heavy is a bold line. An empty list is this, not a blank control.
- TextCallout. variant: "neutral" | "info" | "success" | "warning" | "danger". title: string. description?: string. A muted rounded row with an icon. It does not contain a button. It is the place for a result, a confirmation, or a warning.
- ListBlock. header?: string. A rounded group. Children are ListItem and Toggle rows, full width, with a hairline between them. header is a small label above the group.
- ListItem. title: string. subtitle?: string. leading?: an icon name or { src, alt }. trailing?: string. onClick?: () => void. A full-width row. onClick adds a chevron and means navigation. It is not a checkbox, and it is not a place to put a Button.
- Toggle. title: string. on: boolean. onChange?: (on: boolean) => void. icon?: string. subtitle?: string. A full-width row with the switch on the right. This is the check. There is no checkbox component.
- KVList. rows: { label, value }[]. header?: string. Label on the left, value on the right. Totals and summaries go here.
- Table. columns: string[]. rows: cells in column order. A cell is a string, a number, or a node. The table is the width of the card. Number columns align right.
- Tabs. tabs: { label, children }[]. A full-width segmented bar. Each segment takes an equal share. The selected tab's children show below it. Selection stays on the page.
- Buttons. direction?: "row" | "column". children are Button. row (the default) gives each child an equal share of the width. column stacks them.
- Button. label: string. onClick?: () => void. variant?: "primary" | "secondary" | "tertiary". type?: "normal" | "destructive". size?: "extra-small" | "small" | "medium" | "large". A Button fills the width of its share. One button is a bar across the card. Two buttons in a row are two equal bars. primary is the filled bar, secondary is the muted bar, tertiary is text but still full width. It does not shrink to its label. Never place a Button beside an input, a checkbox, or a list row.

## Fields

There are no field components. Use native elements, each on its own line, above the button that commits them, never beside it. Give every field this class so it matches the rows:

```tsx
const field = "w-full rounded-2xl bg-muted px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
```

- input for a word or a number. A number uses inputMode="decimal". Enter commits.
- textarea with `${field} min-h-24 resize-none` for a note.
- select with the same class for picking a person or a category.
- A slider is `<input type="range" className="w-full accent-primary" />` under a line with the label on the left and the value on the right.

## Pages

A row that opens something is a ListItem with onClick that sets a local id. When the id is set, return a different Card for that item: its fields bound with useText on the item path, then a column of Buttons with Done first, and Remove as a tertiary destructive bar last.

## Drawing

There are no chart or map components, but the source can draw. Use theme classes, never hex.

- A bar is a div: a `h-2 rounded-full bg-background` track holding a `bg-primary` fill whose width is a percentage. Put a set of bars in one `rounded-2xl bg-muted px-4 py-4` block, a row per bar with the label, the track, and the count.
- A chart is an inline svg with a viewBox about 320 wide, `className="w-full rounded-2xl bg-muted"`. Lines use `fill-none stroke-primary`. Bands use `fill-foreground/10`. Labels use `fill-muted-foreground text-[10px]`.
- A big number, like a countdown, is `font-mono text-5xl font-light tabular-nums` centered in a muted rounded block.
- Code is `<pre className="m-0 overflow-x-auto rounded-2xl bg-muted px-4 py-3.5 font-mono text-[13px] leading-[1.6]"><code>{code}</code></pre>`. There is no math renderer. Write a formula as plain text.

Money is `value.toLocaleString("en-US", { style: "currency", currency: "USD" })`.

## A shared list

```tsx
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
  <input className={field} value={draft} placeholder="Add a task" onChange={(event) => setDraft(event.target.value)} />
  <Buttons>
    <Button label="Add" onClick={() => { const title = draft.trim(); if (!title) return; list.insert(items.length, { title, done: false }); setDraft("") }} />
  </Buttons>
</Card>
```
