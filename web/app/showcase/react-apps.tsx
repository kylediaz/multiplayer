"use client"

import { useState } from "react"
import { Button, Buttons, Card, CardHeader, KVList, ListBlock, ListItem, Tabs, TextCallout, TextContent, Toggle } from "@/lib/modes/common/kit"
import {
  apartmentRows,
  apartments,
  cabinRows,
  dinnerFacts,
  games,
  groceryItems,
  heater,
  nights,
  readingList,
  recipeItems,
  recipeSteps,
  rsvpSeed,
  weeks,
} from "./data"

export function GroceriesApp() {
  const open = groceryItems.filter((item) => !item.done)
  const done = groceryItems.filter((item) => item.done)
  return (
    <Card>
      <CardHeader title="Tahoe groceries" />
      <ListBlock header="To get">
        {open.map((item) => (
          <ListItem key={item.name} title={item.name} trailing={`$${item.price}`} />
        ))}
      </ListBlock>
      <ListBlock header="Done">
        {done.map((item) => (
          <ListItem key={item.name} title={item.name} trailing={`$${item.price}`} />
        ))}
      </ListBlock>
      <Buttons>
        <Button label="Text me the list" />
      </Buttons>
    </Card>
  )
}

export function BooksApp() {
  return (
    <Card>
      <CardHeader title="Books to read" />
      <ListBlock header="The list">
        {readingList.map((book) => (
          <ListItem key={book.title} title={book.title} subtitle={book.author} trailing={book.read ? "Read" : undefined} />
        ))}
      </ListBlock>
    </Card>
  )
}

export function ScheduleApp() {
  return (
    <Card>
      <CardHeader title="2026 NFL Schedule" />
      <Tabs
        tabs={weeks.map((week) => {
          const weekGames = games.filter((game) => game.week === week)
          const days = [...new Set(weekGames.map((game) => game.day))]
          return {
            label: `Week ${week}`,
            children: days.map((day) => (
              <ListBlock key={day} header={day}>
                {weekGames
                  .filter((game) => game.day === day)
                  .map((game) => (
                    <ListItem key={`${game.away}-${game.home}-${game.time}`} title={`${game.away} at ${game.home}`} subtitle={game.time} trailing={game.tv} />
                  ))}
              </ListBlock>
            )),
          }
        })}
      />
    </Card>
  )
}

export function BriefApp() {
  return (
    <Card>
      <CardHeader title="Three West Village one-bedrooms" />
      <TextContent text="Leroy Street is the pick: the only one with outdoor space and a fireplace, and the laundry is in the unit. Morton is the cheapest at $5,200, but its photos are of another unit, staged." />
      <ListBlock header="Side by side">
        {apartments.map((place, index) => {
          const outdoor = apartmentRows[2]?.[index + 1] ?? ""
          return <ListItem key={place.id} title={place.heading} subtitle={outdoor === "No" ? "No outdoor space" : outdoor} trailing={place.facts[0]?.value} />
        })}
      </ListBlock>
      {apartments.map((place) => (
        <section key={place.id} className="contents">
          <TextContent text={place.heading} style="large-heavy" />
          <KVList header={place.name} rows={place.facts.map((fact) => ({ label: fact.label, value: fact.value }))} />
          <TextContent text={place.body} />
        </section>
      ))}
      <TextCallout variant="neutral" title="Before you go" description="None of the three lists a floor plan, so ask each agent for one. Confirm availability before applying." />
    </Card>
  )
}

export function RecipeApp() {
  return (
    <Card>
      <CardHeader title="Dad's chili" />
      <KVList
        header="The pot"
        rows={[
          { label: "Serves", value: "6" },
          { label: "Time", value: "45 min" },
          { label: "Heat", value: "Medium" },
        ]}
      />
      <TextContent text="The Sunday pot, the way Dad makes it: brown the beef hard, let the beans go in late, and give it the full simmer." />
      <ListBlock header="What to buy">
        {recipeItems.map((item) => (
          <ListItem key={item.name} title={item.name} trailing={item.done ? "Got" : undefined} />
        ))}
      </ListBlock>
      <ListBlock header="Method">
        {recipeSteps.map((step, index) => (
          <ListItem key={step} title={step} trailing={String(index + 1).padStart(2, "0")} />
        ))}
      </ListBlock>
      <TextCallout variant="info" title="Dad's one rule" description="Chili is better the second day, so make it the day before." />
    </Card>
  )
}

export function TonightApp() {
  return (
    <Card>
      <CardHeader title="Dinner at Nopa" />
      <TextContent text="7:30 PM, table for six" style="large-heavy" />
      <KVList header="The table" rows={dinnerFacts.map(([label, value]) => ({ label, value }))} />
      <TextContent text="Text Caddy to move it." style="small" />
    </Card>
  )
}

function standing(response: (typeof rsvpSeed)[number]): string {
  if (!response.coming) return "Can't make it"
  return ["Coming", response.nights, response.kids ? "with kids" : ""].filter(Boolean).join(", ")
}

export function RsvpApp() {
  const [chosen, setChosen] = useState<string[]>([])

  function toggleNight(night: string) {
    setChosen((current) => (current.includes(night) ? current.filter((item) => item !== night) : [...current, night]))
  }

  return (
    <Card>
      <CardHeader title="Cabin weekend" />
      <TextContent text="Two quick questions so we can book." style="small" />
      <ListBlock header="So far">
        {rsvpSeed.map((response) => (
          <ListItem key={response.name} title={response.name} subtitle={standing(response)} />
        ))}
      </ListBlock>
      <ListBlock header="Which nights work">
        {nights.map((night) => (
          <Toggle key={night} title={night} on={chosen.includes(night)} onChange={() => toggleNight(night)} />
        ))}
      </ListBlock>
      <TextCallout variant="neutral" title="Bring the kids?" description="Say so when you reply. Allergies and arrival time too." />
    </Card>
  )
}

const cabins = ["Pine Lodge", "Creekside", "Ridge House"] as const

export function CabinsApp() {
  return (
    <Card>
      <CardHeader title="Tahoe cabins" />
      <ListBlock header="The three">
        {cabins.map((name, index) => (
          <ListItem
            key={name}
            title={name}
            subtitle={cabinRows.map((row) => `${row[0]} ${row[index + 1]}`).join(" · ")}
            trailing={cabinRows[1]?.[index + 1]}
          />
        ))}
      </ListBlock>
    </Card>
  )
}

export function HeaterApp() {
  return (
    <Card>
      <CardHeader title="The cabin heater" />
      <TextContent text="The boiler at Pine Lodge short-cycles if it chases the set point. It doesn't. It holds a deadband and keeps doing what it was already doing." />
      <TextContent text="Call the set point S and the gap g. Heat starts below the band and stops above it." />
      <TextContent text="on(T) = T < S − g/2" />
      <TextContent text="off(T) = T > S + g/2" />
      <pre className="m-0 overflow-x-auto rounded-md bg-muted px-4 py-3.5 font-mono text-[13px] leading-[1.6]">
        <code>{heater.code}</code>
      </pre>
      <TextContent text="At S = 68 and g = 2, the boiler kicks on at 67°F and cuts out at 69°F." />
      <TextContent text="The coast back down takes about t = (C/P)(S + g/2 − T), where C is the heat the room holds and P is how fast the boiler puts it back. A wider gap means fewer starts, and a longer wait." />
    </Card>
  )
}
