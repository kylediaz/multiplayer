---
name: recipe
description: A recipe with its ingredients and method. Load for a recipe, cooking instructions, or anything with quantities that scale or a timer.
---

# Recipe

A recipe is ingredients, then numbered steps, then the one tip that matters. The ingredients and the steps are written in the source, never stored. The steps are numbered 01, 02 in the trailing text, so the sentence gets the whole row.

## React

React makes it a kitchen tool for everyone cooking: one shared simmer timer and a shared shopping check-off. The timer stores only its end time, so every phone counts down the same seconds. A tick is one item in a list, so two people ticking at once both land.

```json
{ "keys": { "simmerEndsAt": { "kind": "register", "value": "number" }, "bought": { "kind": "list", "fields": { "name": { "kind": "register", "value": "string" } } } } }
```

```tsx
import { useEffect, useState } from "react"
import { useList, useRegister } from "sync"
import { Button, Buttons, Card, CardHeader, ListBlock, ListItem, TextCallout, Toggle } from "ui"

const SIMMER = 30 * 60 * 1000
const ingredients = ["2 lb ground beef", "1 onion", "4 cloves garlic", "28 oz crushed tomatoes", "2 cups beef stock", "15 oz kidney beans"]
const steps = [
  "Brown the beef in batches, hard, so it takes color.",
  "Soften the onion and garlic in the fat, then the spices for a minute.",
  "Add the tomatoes and stock; simmer 30 minutes.",
  "Beans in for the last 10. Salt at the end.",
]

function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [running])
  return now
}

function clock(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

export default function App() {
  const [endsAt, setEndsAt] = useRegister<number>("simmerEndsAt")
  const [bought, list] = useList("bought")
  const now = useNow(endsAt !== null)
  const left = endsAt === null ? null : Math.min(SIMMER, Math.max(0, endsAt - now))

  const tick = (name: string, on: boolean) => {
    if (on) list.insert(bought.length, { name })
    else for (const item of bought.filter((entry) => entry.data?.name === name)) list.remove(item.id)
  }

  return (
    <Card>
      <CardHeader title="Dad's chili" />
      {left === null ? (
        <Buttons>
          <Button label="Start the 30-minute simmer" onClick={() => setEndsAt(Date.now() + SIMMER)} />
        </Buttons>
      ) : left > 0 ? (
        <>
          <div className="rounded-2xl bg-muted px-4 pt-5 pb-4 text-center">
            <p className="font-mono text-5xl font-light text-foreground tabular-nums">{clock(left)}</p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{left > 10 * 60 * 1000 ? "Beans in at 10:00" : "Beans in now"}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(1 - left / SIMMER) * 100}%` }} />
            </div>
          </div>
          <Buttons>
            <Button label="Stop the timer" variant="secondary" onClick={() => setEndsAt(null)} />
          </Buttons>
        </>
      ) : (
        <>
          <TextCallout variant="success" title="The simmer is done" description="Salt it, taste it, and turn off the heat." />
          <Buttons>
            <Button label="Reset the timer" variant="tertiary" onClick={() => setEndsAt(null)} />
          </Buttons>
        </>
      )}
      <ListBlock header="What to buy">
        {ingredients.map((name) => (
          <Toggle key={name} title={name} on={bought.some((item) => item.data?.name === name)} onChange={(on) => tick(name, on)} />
        ))}
      </ListBlock>
      <ListBlock header="Method">
        {steps.map((step, index) => (
          <ListItem key={step} title={step} trailing={String(index + 1).padStart(2, "0")} />
        ))}
      </ListBlock>
      <TextCallout variant="info" title="Dad's one rule" description="Chili is better the second day, so make it the day before." />
    </Card>
  )
}
```

## OpenUI

OpenUI makes it a calculator: steppers for how many people and a US or metric switch, and every amount recomputes. Each ingredient carries its unit, its metric unit, and how many decimals each needs. An ingredient with no metric unit, like an onion, stays as written.

```openui
$serves = 6
$metric = false
root = Card([header, pot, adjust, units, shopping, method, rule])
header = CardHeader("Dad's chili")
pot = KVList([{label: "Serves", value: @Plural($serves, "person", "people")}, {label: "Time", value: "45 min"}, {label: "Pot", value: $serves > 8 ? "The big one" : "The usual"}], "The pot")
adjust = Buttons([Button("Fewer", @Set($serves, @Clamp($serves - 2, 2, 16)), "secondary"), Button("More", @Set($serves, @Clamp($serves + 2, 2, 16)), "secondary")])
units = Buttons([Button("US", @Set($metric, false), $metric ? "tertiary" : "primary", "normal", "small"), Button("Metric", @Set($metric, true), $metric ? "primary" : "tertiary", "normal", "small")])
pantry = [{"name":"Ground beef","amount":2,"unit":"lb","places":1,"metric":"kg","metricPlaces":1},{"name":"Onion","amount":1,"unit":"","places":0,"metric":"","metricPlaces":0},{"name":"Garlic","amount":4,"unit":"cloves","places":0,"metric":"","metricPlaces":0},{"name":"Crushed tomatoes","amount":28,"unit":"oz","places":0,"metric":"g","metricPlaces":0},{"name":"Beef stock","amount":2,"unit":"cup","places":1,"metric":"ml","metricPlaces":0},{"name":"Kidney beans","amount":15,"unit":"oz","places":0,"metric":"g","metricPlaces":0}]
scale = $serves / 6
shopping = ListBlock(@Each(pantry, "i", ListItem(i.name, null, null, $metric && i.metric != "" ? @Format(@Convert(i.amount * scale, i.unit, i.metric), "number", i.metricPlaces) + " " + i.metric : @Trim(@Format(i.amount * scale, "number", i.places) + " " + i.unit))), "Shopping for " + $serves)
steps = ["Brown the beef in batches, hard, so it takes color.", "Soften the onion and garlic in the fat, then the spices for a minute.", "Add the tomatoes and stock; simmer 30 minutes.", "Beans in for the last 10. Salt at the end."]
method = ListBlock(@Each(@Range(0, @Count(steps)), "n", ListItem(steps[n], null, null, @Pad(n + 1, 2))), "Method")
rule = TextCallout("info", "Dad's one rule", "Chili is better the second day, so make it the day before.")
```
