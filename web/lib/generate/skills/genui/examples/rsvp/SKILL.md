---
name: rsvp
description: A real form that collects one reply per person and totals the answers. Load for an RSVP, a sign-up, or a survey with a few questions.
---

# RSVP

The answers so far come first: a headcount table per night, then who has replied. Then the form, under a heavy "Your reply" line: a name field, a switch per night, a switch for kids, a note. Send and Can't make it are a column of bars. After sending, the form becomes a thank-you callout. The draft is local; the reply is shared.

## React

```json
{ "keys": { "replies": { "kind": "list", "fields": { "name": { "kind": "text" }, "coming": { "kind": "register", "value": "boolean" }, "nights": { "kind": "register", "value": "string" }, "kids": { "kind": "register", "value": "boolean" }, "note": { "kind": "text" } } } } }
```

```tsx
import { useState } from "react"
import { useList } from "sync"
import { Button, Buttons, Card, CardHeader, ListBlock, ListItem, Table, TextCallout, TextContent, Toggle } from "ui"

const field = "w-full rounded-2xl bg-muted px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
const nights = ["Friday", "Saturday", "Sunday"]

function standing(reply: Record<string, unknown> | undefined): string {
  if (reply?.coming !== true) return "Can't make it"
  return [`Coming ${String(reply.nights ?? "")}`, reply.kids === true ? "with kids" : "", String(reply.note ?? "")].filter(Boolean).join(" · ")
}

export default function App() {
  const [replies, list] = useList("replies")
  const [name, setName] = useState("")
  const [chosen, setChosen] = useState<string[]>([])
  const [kids, setKids] = useState(false)
  const [note, setNote] = useState("")
  const [sent, setSent] = useState<string | null>(null)
  const coming = replies.filter((reply) => reply.data?.coming === true)

  const send = (yes: boolean) => {
    const who = name.trim()
    if (!who) return
    list.insert(replies.length, {
      name: who,
      coming: yes && chosen.length > 0,
      nights: nights.filter((night) => chosen.includes(night)).join(", "),
      kids: yes && kids,
      note: note.trim(),
    })
    setSent(who)
  }

  return (
    <Card>
      <CardHeader title="Cabin weekend" />
      <TextContent text="Pine Lodge, Oct 23 to 25. Reply by Wednesday so we can book." style="small" />
      <Table columns={["Night", "Coming"]} rows={nights.map((night) => [night, coming.filter((reply) => String(reply.data?.nights ?? "").includes(night)).length])} />
      {replies.length > 0 && (
        <ListBlock header="So far">
          {replies.map((reply) => (
            <ListItem key={reply.id} title={String(reply.data?.name ?? "")} subtitle={standing(reply.data)} />
          ))}
        </ListBlock>
      )}
      {sent ? (
        <TextCallout variant="success" title={`Thanks, ${sent}`} description="Your reply is in. Everyone sees it now." />
      ) : (
        <>
          <TextContent text="Your reply" style="large-heavy" />
          <input className={field} value={name} placeholder="Your name" onChange={(event) => setName(event.target.value)} />
          <ListBlock header="Which nights work">
            {nights.map((night) => (
              <Toggle key={night} title={night} on={chosen.includes(night)} onChange={(on) => setChosen((current) => (on ? [...current, night] : current.filter((item) => item !== night)))} />
            ))}
          </ListBlock>
          <ListBlock>
            <Toggle title="Bringing kids" icon="baby" on={kids} onChange={setKids} />
          </ListBlock>
          <textarea className={`${field} min-h-20 resize-none`} value={note} placeholder="Allergies, arrival time" onChange={(event) => setNote(event.target.value)} />
          <Buttons direction="column">
            <Button label="Send" onClick={() => send(true)} />
            <Button label="Can't make it" variant="secondary" onClick={() => send(false)} />
          </Buttons>
        </>
      )}
    </Card>
  )
}
```
