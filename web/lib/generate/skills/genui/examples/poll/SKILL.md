---
name: poll
description: A group vote that tallies live and then locks in a winner. Load for a poll, a vote on where or when, or picking one option together.
---

# Poll

The tally is the screen: one bar per option, drawn in a muted block, longest bar for the most votes. Under it, a switch per option for the places you would go, so you can vote for several. One bar locks in the leader for everyone, and the result replaces the poll with a quiet way to reopen it. The options are written in the source. Each vote is its own item, so two people voting at once both count.

## React

```json
{ "keys": { "votes": { "kind": "list", "fields": { "option": { "kind": "register", "value": "string" }, "voter": { "kind": "register", "value": "string" } } }, "pick": { "kind": "register", "value": "string" } } }
```

```tsx
import { useState } from "react"
import { useList, useRegister } from "sync"
import { Button, Buttons, Card, CardHeader, ListBlock, TextCallout, Toggle } from "ui"

const options = ["Nopa", "Zuni Café", "Kin Khao", "Delfina"]

export default function App() {
  const [votes, list] = useList("votes")
  const [pick, setPick] = useRegister<string>("pick")
  const [me] = useState(() => crypto.randomUUID())
  const tally = options.map((option) => ({
    option,
    count: votes.filter((vote) => vote.data?.option === option).length,
    mine: votes.find((vote) => vote.data?.option === option && vote.data?.voter === me),
  }))
  const most = Math.max(1, ...tally.map((entry) => entry.count))
  const leader = tally.reduce((best, entry) => (entry.count > best.count ? entry : best))

  if (pick) {
    return (
      <Card>
        <CardHeader title="Tonight" />
        <TextCallout variant="success" title={`${pick} it is`} description="Locked in for everyone." />
        <Buttons>
          <Button label="Reopen the vote" variant="tertiary" onClick={() => setPick(null)} />
        </Buttons>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Where tonight?" />
      <div className="flex flex-col gap-3 rounded-2xl bg-muted px-4 py-4">
        {tally.map((entry) => (
          <div key={entry.option} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-sm font-medium text-foreground">{entry.option}</span>
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-background">
              <span className="block h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(entry.count / most) * 100}%` }} />
            </span>
            <span className="w-4 text-right text-sm text-muted-foreground tabular-nums">{entry.count}</span>
          </div>
        ))}
      </div>
      <ListBlock header="Where you'd go">
        {tally.map((entry) => (
          <Toggle
            key={entry.option}
            title={entry.option}
            on={entry.mine !== undefined}
            onChange={(on) => {
              if (on) list.insert(votes.length, { option: entry.option, voter: me })
              else if (entry.mine) list.remove(entry.mine.id)
            }}
          />
        ))}
      </ListBlock>
      {leader.count > 0 && (
        <Buttons>
          <Button label={`Lock in ${leader.option}`} onClick={() => setPick(leader.option)} />
        </Buttons>
      )}
    </Card>
  )
}
```
