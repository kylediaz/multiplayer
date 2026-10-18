---
name: groceries
description: A shared list people add to and check off, with a price on each row. Load for a grocery list, a packing list, or a checklist with amounts.
---

# Groceries

A list to check off. Open rows and done rows are separate groups. The price is the toggle's subtitle. Adding is two fields on their own lines, then a full-width Add bar. Copy this page. Change the title and the fields to the ask.

schema.keys.items is a list. name is text, price is a number register, done is a boolean register.

```tsx
import { useState } from "react"
import { useList } from "sync"
import { Button, Buttons, Card, CardHeader, ListBlock, TextContent, Toggle } from "ui"

export default function App() {
  const [items, list] = useList("items")
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const open = items.filter((item) => item.data?.done !== true)
  const done = items.filter((item) => item.data?.done === true)
  const add = () => {
    const next = name.trim()
    if (!next) return
    const amount = Number(price)
    list.insert(items.length, { name: next, price: price.trim() && Number.isFinite(amount) ? amount : null, done: false })
    setName("")
    setPrice("")
  }
  return (
    <Card>
      <CardHeader title="Tahoe groceries" />
      {open.length === 0 ? <TextContent text="Nothing on the list yet." style="small" /> : (
        <ListBlock header="To get">
          {open.map((item) => (
            <Toggle key={item.id} title={String(item.data?.name ?? "")} subtitle={typeof item.data?.price === "number" ? `$${item.data.price}` : undefined} on={false} onChange={() => list.update(item.id, { done: true })} />
          ))}
        </ListBlock>
      )}
      {done.length > 0 && (
        <ListBlock header="Done">
          {done.map((item) => (
            <Toggle key={item.id} title={String(item.data?.name ?? "")} subtitle={typeof item.data?.price === "number" ? `$${item.data.price}` : undefined} on onChange={() => list.update(item.id, { done: false })} />
          ))}
        </ListBlock>
      )}
      <input value={name} placeholder="Oat milk" onChange={(event) => setName(event.target.value)} />
      <input value={price} placeholder="$" inputMode="decimal" onChange={(event) => setPrice(event.target.value)} />
      <Buttons direction="column">
        <Button label="Add" onClick={add} />
      </Buttons>
    </Card>
  )
}
```

OpenUI has no shared state. Write the open rows and the done rows out as Toggle rows, with the price as the subtitle, and no Add button.
