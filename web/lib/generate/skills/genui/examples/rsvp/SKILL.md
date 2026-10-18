---
name: rsvp
description: A form that collects who can make it and which nights. Load for an RSVP, a poll, or one answer per person.
---

# RSVP

One answer per person. Who has answered is a list. The nights are toggle rows. Yes and No are two equal bars, because a row of buttons splits the width. Send is its own full-width bar under the fields, not beside the name. Copy this page.

schema.keys.responses is a list. name is text. coming and kids are boolean registers. nights is a string register.

```tsx
import { useState } from "react"
import { useList } from "sync"
import { Button, Buttons, Card, CardHeader, ListBlock, ListItem, TextContent, Toggle } from "ui"

const nights = ["Friday", "Saturday", "Sunday"]

function standing(data: { coming?: boolean; nights?: string; kids?: boolean } | undefined): string {
  if (!data?.coming) return "Can't make it"
  return ["Coming", data.nights, data.kids ? "with kids" : ""].filter(Boolean).join(", ")
}

export default function App() {
  const [responses, list] = useList("responses")
  const [name, setName] = useState("")
  const [chosen, setChosen] = useState<string[]>([])
  const [kids, setKids] = useState(false)
  const send = (coming: boolean) => {
    const next = name.trim()
    if (!next) return
    list.insert(responses.length, { name: next, coming, nights: chosen.join(", "), kids })
    setName("")
    setChosen([])
    setKids(false)
  }
  return (
    <Card>
      <CardHeader title="Cabin weekend" />
      <TextContent text="Two quick questions so we can book." style="small" />
      {responses.length > 0 && (
        <ListBlock header="So far">
          {responses.map((response) => <ListItem key={response.id} title={String(response.data?.name ?? "")} subtitle={standing(response.data)} />)}
        </ListBlock>
      )}
      <input value={name} placeholder="Your name" onChange={(event) => setName(event.target.value)} />
      <ListBlock header="Which nights work">
        {nights.map((night) => (
          <Toggle key={night} title={night} on={chosen.includes(night)} onChange={(on) => setChosen((current) => on ? [...current, night] : current.filter((item) => item !== night))} />
        ))}
      </ListBlock>
      <ListBlock>
        <Toggle title="Bringing kids" on={kids} onChange={setKids} />
      </ListBlock>
      <Buttons>
        <Button label="Yes" onClick={() => send(true)} />
        <Button label="Can't" variant="secondary" onClick={() => send(false)} />
      </Buttons>
    </Card>
  )
}
```

OpenUI writes the answers out and uses Toggle rows for the nights. The yes and no buttons are a Buttons row, so they split the width.
