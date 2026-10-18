---
name: groceries
description: A shared list people add to and check off, with an amount on each row. Load for a grocery list, a packing list, or a checklist with prices.
---

# Groceries

A list the group fills and checks off together. The summary up top answers "how much is left". Open rows and checked rows are separate groups, and the price is the toggle's subtitle. Adding is two fields on their own lines, then a full-width Add bar. Change the title and the fields to the ask.

## React

```json
{ "keys": { "items": { "kind": "list", "fields": { "name": { "kind": "text" }, "price": { "kind": "register", "value": "number" }, "done": { "kind": "register", "value": "boolean" } } } } }
```

```tsx
import { useState } from "react"
import { useList } from "sync"
import { Button, Buttons, Card, CardHeader, KVList, ListBlock, TextContent, Toggle } from "ui"

const field = "w-full rounded-2xl bg-muted px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" })

export default function App() {
  const [items, list] = useList("items")
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const open = items.filter((item) => item.data?.done !== true)
  const done = items.filter((item) => item.data?.done === true)
  const left = open.reduce((sum, item) => sum + Number(item.data?.price ?? 0), 0)

  const add = () => {
    const next = name.trim()
    if (!next) return
    list.insert(items.length, { name: next, price: Number(price) || 0, done: false })
    setName("")
    setPrice("")
  }

  return (
    <Card>
      <CardHeader title="Tahoe groceries" />
      {items.length > 0 && (
        <KVList
          rows={[
            { label: "Left to buy", value: money(left) },
            { label: "In the cart", value: `${done.length} of ${items.length}` },
          ]}
        />
      )}
      {open.length === 0 ? (
        <TextContent text={items.length ? "Everything is in the cart." : "Nothing on the list yet."} style="small" />
      ) : (
        <ListBlock header="To get">
          {open.map((item) => (
            <Toggle key={item.id} title={String(item.data?.name ?? "")} subtitle={money(Number(item.data?.price ?? 0))} on={false} onChange={() => list.update(item.id, { done: true })} />
          ))}
        </ListBlock>
      )}
      {done.length > 0 && (
        <ListBlock header="In the cart">
          {done.map((item) => (
            <Toggle key={item.id} title={String(item.data?.name ?? "")} on onChange={() => list.update(item.id, { done: false })} />
          ))}
        </ListBlock>
      )}
      <input className={field} value={name} placeholder="Add something" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} />
      <input className={field} value={price} inputMode="decimal" placeholder="Rough price" onChange={(event) => setPrice(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} />
      <Buttons>
        <Button label="Add" onClick={add} />
      </Buttons>
    </Card>
  )
}
```
