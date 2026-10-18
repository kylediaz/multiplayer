---
name: heater
description: A document that explains a mechanism, with the formula and the code. Load for an explanation, a spec, or notes that include a formula or a snippet.
---

# Heater

A document. Prose, then the formulas as text, then the code in a pre with font-mono. No buttons and no list. schema.keys is empty. Copy this page.

```tsx
import { Card, CardHeader, TextContent } from "ui"

const code = `function step(temp, set, gap, heating) {
  if (temp < set - gap / 2) return true
  if (temp > set + gap / 2) return false
  return heating
}`

export default function App() {
  return (
    <Card>
      <CardHeader title="The cabin heater" />
      <TextContent text="The boiler short-cycles if it chases the set point. It holds a deadband and keeps doing what it was already doing." />
      <TextContent text="Call the set point S and the gap g. Heat starts below the band and stops above it." />
      <TextContent text="on(T) = T < S − g/2" />
      <TextContent text="off(T) = T > S + g/2" />
      <pre className="m-0 overflow-x-auto rounded-md bg-muted px-4 py-3.5 font-mono text-[13px] leading-[1.6]"><code>{code}</code></pre>
      <TextContent text="At S = 68 and g = 2, the boiler kicks on at 67°F and cuts out at 69°F." />
    </Card>
  )
}
```

OpenUI puts the prose, the formulas, and a fenced copy of the code in one Markdown block.
