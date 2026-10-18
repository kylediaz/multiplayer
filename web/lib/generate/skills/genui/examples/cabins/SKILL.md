---
name: cabins
description: Options side by side so people can pick, with nothing else to read. Load for a comparison grid of places, products, or choices.
---

# Cabins

A table, and nothing around it. Options are the columns. Facts are the rows. No paragraph, no pick, and no buttons. When the ask wants the reasoning, use the brief example. schema.keys is empty. Copy this page.

```tsx
import { Card, CardHeader, Table } from "ui"

export default function App() {
  return (
    <Card>
      <CardHeader title="Tahoe cabins" />
      <Table
        columns={["", "Pine Lodge", "Creekside", "Ridge House"]}
        rows={[
          ["Where", "North Shore", "Truckee", "South Lake"],
          ["Per night", "$640", "$520", "$790"],
          ["Beds", "8", "6", "10"],
          ["Hot tub", "Yes", "No", "Yes"],
          ["To the lift", "12 min", "25 min", "8 min"],
        ]}
      />
    </Card>
  )
}
```

OpenUI is the same table. When the language has a map and the options are places, add a marker for each. React has no map.
