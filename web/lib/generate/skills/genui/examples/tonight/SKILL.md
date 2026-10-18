---
name: tonight
description: One plan on one screen, meant to be sent. Load for a dinner, a meetup, or a single event card.
---

# Tonight

One event. The time is one heavy line. The facts are a KVList. One small line on how to change it. No list of alternatives and no buttons. schema.keys is empty. Copy this page.

```tsx
import { Card, CardHeader, KVList, TextContent } from "ui"

export default function App() {
  return (
    <Card>
      <CardHeader title="Dinner at Nopa" />
      <TextContent text="7:30 PM, table for six" style="large-heavy" />
      <KVList header="The table" rows={[{ label: "Where", value: "560 Divisadero St" }, { label: "Under", value: "Rajiv" }, { label: "Who", value: "Maya, Jon, Priya, Sam, Alex, Rajiv" }]} />
      <TextContent text="Text to move it." style="small" />
    </Card>
  )
}
```

OpenUI is the same card. When the language has a map, add one marker for the place. React has no map.
