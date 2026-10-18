---
name: brief
description: A document that compares a few options and names a pick. Load for a short researched comparison that includes the reasoning.
---

# Brief

A document. The first lines name the pick. Then one row per option. Then each option: a heading, its facts, a short paragraph. A callout for the caveat. No buttons. A fact that is not in the ask does not appear. schema.keys is empty. When the ask is only the grid, use the cabins example. Copy this page.

```tsx
import { Card, CardHeader, KVList, ListBlock, ListItem, TextCallout, TextContent } from "ui"

const places = [
  { name: "Leroy Street", fact: "Private balcony", rent: "$5,395", rows: [{ label: "Rent", value: "$5,395" }, { label: "Fee", value: "None" }, { label: "Laundry", value: "In unit" }], body: "The only one with outdoor space and a fireplace." },
  { name: "Morton Street", fact: "No outdoor space", rent: "$5,200", rows: [{ label: "Rent", value: "$5,200" }, { label: "Size", value: "523 sq ft" }], body: "The cheapest. Its photos are of another unit, staged." },
]

export default function App() {
  return (
    <Card>
      <CardHeader title="Three West Village one-bedrooms" />
      <TextContent text="Leroy Street is the pick: the only one with outdoor space. Morton is cheaper, and its photos are staged." />
      <ListBlock header="Side by side">
        {places.map((place) => <ListItem key={place.name} title={place.name} subtitle={place.fact} trailing={place.rent} />)}
      </ListBlock>
      {places.map((place) => (
        <section key={place.name} className="contents">
          <TextContent text={place.name} style="large-heavy" />
          <KVList rows={place.rows} />
          <TextContent text={place.body} />
        </section>
      ))}
      <TextCallout variant="neutral" title="Before you go" description="None of them lists a floor plan. Confirm availability before applying." />
    </Card>
  )
}
```

OpenUI is the same screen, with the sentences and the rows written out.
