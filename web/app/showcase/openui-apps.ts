import {
  apartmentRows,
  apartments,
  cabinRows,
  dinnerFacts,
  heater,
  games,
  groceryItems,
  nights,
  readingList,
  recipeItems,
  recipeSteps,
  rsvpSeed,
  weeks,
  type ShowcaseKind,
} from "./data"

function q(value: string): string {
  return JSON.stringify(value)
}

function refs(names: readonly string[]): string {
  return `[${names.join(", ")}]`
}

function call(name: string, component: string, args: readonly string[] = []): string {
  return `${name} = ${component}(${args.join(", ")})`
}

function program(lines: string[]): string {
  return lines.join("\n")
}

function listItem(name: string, title: string, subtitle?: string, trailing?: string): string {
  const args = [q(title)]
  if (subtitle !== undefined || trailing !== undefined) args.push(subtitle === undefined ? "null" : q(subtitle))
  if (trailing !== undefined) args.push("null", q(trailing))
  return call(name, "ListItem", args)
}

function kv(name: string, header: string, rows: readonly (readonly [string, string])[]): string {
  const body = rows.map(([label, value]) => `{ label: ${q(label)}, value: ${q(value)} }`).join(", ")
  return call(name, "KVList", [`[${body}]`, q(header)])
}

function groceries(): string {
  const open = groceryItems.filter((item) => !item.done)
  const done = groceryItems.filter((item) => item.done)
  const lines: string[] = []
  const openNames = open.map((item, index) => {
    const name = `open${index}`
    lines.push(listItem(name, item.name, undefined, `$${item.price}`))
    return name
  })
  const doneNames = done.map((item, index) => {
    const name = `done${index}`
    lines.push(listItem(name, item.name, undefined, `$${item.price}`))
    return name
  })
  lines.push(
    call("root", "Card", [refs(["header", "openList", "doneList", "send"])]),
    call("header", "CardHeader", [q("Tahoe groceries")]),
    call("openList", "ListBlock", [refs(openNames), q("To get")]),
    call("doneList", "ListBlock", [refs(doneNames), q("Done")]),
    call("send", "Buttons", [refs(["sendButton"])]),
    call("sendButton", "Button", [q("Text me the list")]),
  )
  return program(lines)
}

function books(): string {
  const lines: string[] = []
  const names = readingList.map((book, index) => {
    const name = `book${index}`
    lines.push(listItem(name, book.title, book.author, book.read ? "Read" : undefined))
    return name
  })
  lines.push(
    call("root", "Card", [refs(["header", "list"])]),
    call("header", "CardHeader", [q("Books to read")]),
    call("list", "ListBlock", [refs(names), q("The list")]),
  )
  return program(lines)
}

function schedule(): string {
  const lines: string[] = []
  const weekNames = weeks.map((week) => {
    const name = `week${week}`
    const weekGames = games.filter((game) => game.week === week)
    const days = [...new Set(weekGames.map((game) => game.day))]
    const dayNames = days.map((day, dayIndex) => {
      const dayName = `${name}Day${dayIndex}`
      const gameNames = weekGames
        .filter((game) => game.day === day)
        .map((game, gameIndex) => {
          const gameName = `${dayName}Game${gameIndex}`
          lines.push(listItem(gameName, `${game.away} at ${game.home}`, game.time, game.tv))
          return gameName
        })
      lines.push(call(dayName, "ListBlock", [refs(gameNames), q(day)]))
      return dayName
    })
    lines.push(call(name, "TabItem", [q(`Week ${week}`), refs(dayNames)]))
    return name
  })
  lines.push(
    call("root", "Card", [refs(["header", "tabs"])]),
    call("header", "CardHeader", [q("2026 NFL Schedule")]),
    call("tabs", "Tabs", [refs(weekNames)]),
  )
  return program(lines)
}

function brief(): string {
  const lines: string[] = []
  const compareNames = apartments.map((place, index) => {
    const name = `compare${index}`
    const outdoor = apartmentRows[2]?.[index + 1] ?? ""
    lines.push(listItem(name, place.heading, outdoor === "No" ? "No outdoor space" : outdoor, place.facts[0]?.value))
    return name
  })
  const placeNames = apartments.map((place) => {
    const name = place.id
    lines.push(call(`${name}Title`, "TextContent", [q(place.heading), q("large-heavy")]))
    lines.push(kv(`${name}Facts`, place.name, place.facts.map((fact) => [fact.label, fact.value])))
    lines.push(call(`${name}Body`, "TextContent", [q(place.body)]))
    return name
  })
  const sections = placeNames.flatMap((name) => [`${name}Title`, `${name}Facts`, `${name}Body`])
  lines.push(
    call("root", "Card", [refs(["header", "lede", "compare", ...sections, "before"])]),
    call("header", "CardHeader", [q("Three West Village one-bedrooms")]),
    call("lede", "TextContent", [q("Leroy Street is the pick: the only one with outdoor space and a fireplace, and the laundry is in the unit. Morton is the cheapest at $5,200, but its photos are of another unit, staged.")]),
    call("compare", "ListBlock", [refs(compareNames), q("Side by side")]),
    call("before", "TextCallout", [q("neutral"), q("Before you go"), q("None of the three lists a floor plan, so ask each agent for one. Confirm availability before applying.")]),
  )
  return program(lines)
}

function recipe(): string {
  const lines: string[] = []
  const itemNames = recipeItems.map((item, index) => {
    const name = `item${index}`
    lines.push(listItem(name, item.name, undefined, item.done ? "Got" : undefined))
    return name
  })
  const stepNames = recipeSteps.map((step, index) => {
    const name = `step${index}`
    lines.push(listItem(name, step, undefined, String(index + 1).padStart(2, "0")))
    return name
  })
  lines.push(
    call("root", "Card", [refs(["header", "facts", "lede", "buy", "method", "rule"])]),
    call("header", "CardHeader", [q("Dad's chili")]),
    kv("facts", "The pot", [
      ["Serves", "6"],
      ["Time", "45 min"],
      ["Heat", "Medium"],
    ]),
    call("lede", "TextContent", [q("The Sunday pot, the way Dad makes it: brown the beef hard, let the beans go in late, and give it the full simmer.")]),
    call("buy", "ListBlock", [refs(itemNames), q("What to buy")]),
    call("method", "ListBlock", [refs(stepNames), q("Method")]),
    call("rule", "TextCallout", [q("info"), q("Dad's one rule"), q("Chili is better the second day, so make it the day before.")]),
  )
  return program(lines)
}

function tonight(): string {
  const lines: string[] = [
    call("nopa", "MapMarker", [q("Nopa"), "37.7749", "-122.4376"]),
    call("root", "Card", [refs(["header", "when", "facts", "map", "foot"])]),
    call("header", "CardHeader", [q("Dinner at Nopa")]),
    call("when", "TextContent", [q("7:30 PM, table for six"), q("large-heavy")]),
    kv("facts", "The table", dinnerFacts),
    call("map", "Map", [refs(["nopa"])]),
    call("foot", "TextContent", [q("Text Caddy to move it."), q("small")]),
  ]
  return program(lines)
}

function standing(response: (typeof rsvpSeed)[number]): string {
  if (!response.coming) return "Can't make it"
  return [`Coming`, response.nights, response.kids ? "with kids" : ""].filter(Boolean).join(", ")
}

function rsvp(): string {
  const lines: string[] = []
  const responseNames = rsvpSeed.map((response, index) => {
    const name = `who${index}`
    lines.push(listItem(name, response.name, standing(response)))
    return name
  })
  const nightNames = nights.map((night, index) => {
    const name = `night${index}`
    lines.push(call(name, "Toggle", [q(night), "false"]))
    return name
  })
  lines.push(
    call("root", "Card", [refs(["header", "intro", "soFar", "nights", "note"])]),
    call("header", "CardHeader", [q("Cabin weekend")]),
    call("intro", "TextContent", [q("Two quick questions so we can book."), q("small")]),
    call("soFar", "ListBlock", [refs(responseNames), q("So far")]),
    call("nights", "ListBlock", [refs(nightNames), q("Which nights work")]),
    call("note", "TextCallout", [q("neutral"), q("Bring the kids?"), q("Say so when you reply. Allergies and arrival time too.")]),
  )
  return program(lines)
}

function cabins(): string {
  const lines: string[] = []
  const names = ["Pine Lodge", "Creekside", "Ridge House"].map((name, index) => {
    const id = `cabin${index}`
    const details = cabinRows.map((row) => `${row[0]} ${row[index + 1]}`).join(" · ")
    lines.push(listItem(id, name, details, cabinRows[1]?.[index + 1]))
    return id
  })
  lines.push(
    call("pine", "MapMarker", [q("Pine Lodge"), "39.242", "-120.028"]),
    call("creek", "MapMarker", [q("Creekside"), "39.328", "-120.183"]),
    call("ridge", "MapMarker", [q("Ridge House"), "38.940", "-119.960"]),
    call("root", "Card", [refs(["header", "list", "map"])]),
    call("header", "CardHeader", [q("Tahoe cabins")]),
    call("list", "ListBlock", [refs(names), q("The three")]),
    call("map", "Map", [refs(["pine", "creek", "ridge"])]),
  )
  return program(lines)
}

function heaterNote(): string {
  const body = [
    "The boiler at Pine Lodge short-cycles if it chases the set point. It doesn't. It holds a deadband and keeps doing what it was already doing.",
    "",
    "Call the set point $S$ and the gap $g$. Heat starts below the band and stops above it.",
    "",
    "$$",
    heater.on,
    "$$",
    "",
    "$$",
    heater.off,
    "$$",
    "",
    "```",
    heater.code,
    "```",
    "",
    "At $S = 68$ and $g = 2$, the boiler kicks on at 67°F and cuts out at 69°F.",
    "",
    "The coast back down takes about",
    "",
    "$$",
    heater.coast,
    "$$",
    "",
    "where $C$ is the heat the room holds and $P$ is how fast the boiler puts it back. A wider gap means fewer starts, and a longer wait.",
  ].join("\n")
  return program([
    call("root", "Card", [refs(["header", "body"])]),
    call("header", "CardHeader", [q("The cabin heater")]),
    call("body", "Markdown", [q(body)]),
  ])
}

export const openuiSources: Record<ShowcaseKind, string> = {
  groceries: groceries(),
  books: books(),
  schedule: schedule(),
  brief: brief(),
  recipe: recipe(),
  tonight: tonight(),
  rsvp: rsvp(),
  cabins: cabins(),
  heater: heaterNote(),
}
