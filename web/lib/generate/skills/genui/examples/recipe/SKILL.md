---
name: recipe
description: A recipe people read, with a shopping list they can tick off. Load for a recipe, a how-to, or notes with a checklist inside.
---

# Recipe

A document, with one list people tick. Facts, one sentence, the shopping toggles, the method as rows numbered on the right, and one callout. No other buttons. Copy this page.

schema.keys.items is a list. name is text. done is a boolean register. The method is written in the source.

```tsx
import { useList } from "sync"
import { Card, CardHeader, KVList, ListBlock, ListItem, TextCallout, TextContent, Toggle } from "ui"

const steps = [
  "Brown 2 lb of beef in batches, hard, so it takes color.",
  "Soften the onion and garlic in the fat, then the spices for a minute.",
  "Add the tomatoes and stock; simmer 30 minutes.",
  "Beans in for the last 10. Salt at the end.",
]

export default function App() {
  const [items, list] = useList("items")
  return (
    <Card>
      <CardHeader title="Dad's chili" />
      <KVList header="The pot" rows={[{ label: "Serves", value: "6" }, { label: "Time", value: "45 min" }, { label: "Heat", value: "Medium" }]} />
      <TextContent text="The Sunday pot: brown the beef hard, let the beans go in late, and give it the full simmer." />
      <ListBlock header="What to buy">
        {items.map((item) => (
          <Toggle key={item.id} title={String(item.data?.name ?? "")} on={item.data?.done === true} onChange={(done) => list.update(item.id, { done })} />
        ))}
      </ListBlock>
      <ListBlock header="Method">
        {steps.map((step, index) => <ListItem key={step} title={step} trailing={String(index + 1).padStart(2, "0")} />)}
      </ListBlock>
      <TextCallout variant="info" title="Dad's one rule" description="Chili is better the second day, so make it the day before." />
    </Card>
  )
}
```

OpenUI writes the ingredients out. A bought row trails "Got". The method rows trail the step number.
