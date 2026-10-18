import {
  apartmentRows,
  apartments,
  cabinHeaders,
  cabinRows,
  dinnerFacts,
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

function strs(values: readonly string[]): string {
  return `[${values.map(q).join(", ")}]`
}

function call(name: string, component: string, args: readonly string[] = []): string {
  return `${name} = ${component}(${args.join(", ")})`
}

function program(lines: string[]): string {
  return lines.join("\n")
}

function groceries(): string {
  const open = groceryItems.filter((item) => !item.done)
  const done = groceryItems.filter((item) => item.done)
  const total = groceryItems.reduce((sum, item) => sum + item.price, 0)
  const lines: string[] = []
  const openNames = open.map((item, index) => {
    const name = `open${index}`
    lines.push(`$${name} = false`)
    lines.push(call(name, "Row", [refs([`${name}Check`, `${name}Price`]), "2", q("center"), q("between")]))
    lines.push(call(`${name}Check`, "Checkbox", [`$${name}`, q(item.name), "true"]))
    lines.push(call(`${name}Price`, "Text", [q(`$${item.price}`), q("sm"), q("muted")]))
    return name
  })
  const doneNames = done.map((item, index) => {
    const name = `done${index}`
    lines.push(`$${name} = true`)
    lines.push(call(name, "Checkbox", [`$${name}`, q(item.name), "true"]))
    return name
  })
  lines.push(
    "$draft = \"\"",
    "$price = \"\"",
    call("root", "Col", [refs(["title", "status", "listCard", "doneTitle", "doneList", "send"])]),
    call("title", "Title", [q("Tahoe groceries"), q("lg")]),
    call("status", "Caption", [q(`${open.length} left, $${total} estimated`)]),
    call("listCard", "Card", [refs(["openList", "addName", "addPriceRow"])]),
    call("openList", "Col", [refs(openNames), "2"]),
    call("addName", "Input", ["$draft", "null", q("text"), q("Add something")]),
    call("addPriceRow", "Row", [refs(["addPrice", "addBtn"]), "2"]),
    call("addPrice", "Input", ["$price", "null", q("number"), q("Price")]),
    call("addBtn", "Button", [q("Add"), "null", q("outline")]),
    call("doneTitle", "Title", [q("Done"), q("md")]),
    call("doneList", "Col", [refs(doneNames), "2"]),
    call("send", "Button", [q("Text me the list"), "null", q("outline")]),
  )
  return program(lines)
}

function books(): string {
  const unread = readingList.filter((book) => !book.read).length
  const lines: string[] = []
  const names = readingList.map((book, index) => {
    const name = `book${index}`
    lines.push(`$${name} = ${book.read ? "true" : "false"}`)
    lines.push(call(name, "Col", [refs([`${name}Check`, `${name}Author`]), "0"]))
    lines.push(call(`${name}Check`, "Checkbox", [`$${name}`, q(book.title), "true"]))
    lines.push(call(`${name}Author`, "Caption", [q(book.author)]))
    return name
  })
  lines.push(
    "$titleDraft = \"\"",
    "$authorDraft = \"\"",
    call("root", "Col", [refs(["title", "status", "listCard"])]),
    call("title", "Title", [q("Books to read"), q("lg")]),
    call("status", "Caption", [q(`${unread} to go`)]),
    call("listCard", "Card", [refs(["list", "addTitle", "addAuthorRow"])]),
    call("list", "Col", [refs(names), "3"]),
    call("addTitle", "Input", ["$titleDraft", "null", q("text"), q("Add a book")]),
    call("addAuthorRow", "Row", [refs(["addAuthor", "addBtn"]), "2"]),
    call("addAuthor", "Input", ["$authorDraft", "null", q("text"), q("Author")]),
    call("addBtn", "Button", [q("Add"), "null", q("outline")]),
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
      const dayGames = weekGames.filter((game) => game.day === day)
      const gameNames = dayGames.map((game, gameIndex) => {
        const gameName = `${dayName}Game${gameIndex}`
        lines.push(call(gameName, "Row", [refs([`${gameName}Copy`, `${gameName}Tv`]), "2", q("center"), q("between")]))
        lines.push(call(`${gameName}Copy`, "Col", [refs([`${gameName}Match`, `${gameName}Time`]), "0"]))
        lines.push(call(`${gameName}Match`, "Text", [q(`${game.away} at ${game.home}`), q("sm")]))
        lines.push(call(`${gameName}Time`, "Caption", [q(game.time)]))
        lines.push(call(`${gameName}Tv`, "Badge", [q(game.tv)]))
        return gameName
      })
      lines.push(call(dayName, "Col", [refs([`${dayName}Title`, ...gameNames]), "2"]))
      lines.push(call(`${dayName}Title`, "Label", [q(day)]))
      return dayName
    })
    lines.push(call(name, "Col", [refs([`${name}Title`, `${name}Count`, ...dayNames]), "2"]))
    lines.push(call(`${name}Title`, "Title", [q(`Week ${week}`), q("md")]))
    lines.push(call(`${name}Count`, "Caption", [q(`${weekGames.length} games`)]))
    return name
  })
  lines.push(
    call("root", "Col", [refs(["title", "status", ...weekNames])]),
    call("title", "Title", [q("2026 NFL Schedule"), q("lg")]),
    call("status", "Caption", [q("Week by week")]),
  )
  return program(lines)
}

function brief(): string {
  const lines: string[] = []
  const placeNames = apartments.map((place) => {
    const name = place.id
    const factNames = place.facts.map((fact, index) => {
      const factName = `${name}Fact${index}`
      lines.push(call(factName, "Card", [refs([`${factName}Value`, `${factName}Label`]), q("soft"), "3", "1"]))
      lines.push(call(`${factName}Value`, "Title", [q(fact.value), q("md")]))
      lines.push(call(`${factName}Label`, "Caption", [q(fact.label)]))
      return factName
    })
    const heading = place.pick ? `${name}Heading` : `${name}Title`
    if (place.pick) {
      lines.push(call(heading, "Row", [refs([`${name}Title`, `${name}Pick`]), "2", q("center")]))
      lines.push(call(`${name}Pick`, "Badge", [q("Pick"), q("success")]))
    }
    lines.push(call(`${name}Title`, "Title", [q(place.heading), q("md")]))
    lines.push(call(`${name}Facts`, "Grid", [refs(factNames), "3", "90", "2"]))
    lines.push(call(`${name}Body`, "Text", [q(place.body), q("sm")]))
    lines.push(call(`${name}Link`, "Link", [q("Listing on RentHop"), q(place.href)]))
    lines.push(call(name, "Col", [refs([heading, `${name}Facts`, `${name}Body`, `${name}Link`]), "2"]))
    return name
  })
  lines.push(
    call("root", "Col", [refs(["title", "byline", "lede", "sideTitle", "compare", ...placeNames, "beforeTitle", "beforeBody"])]),
    call("title", "Title", [q("Three West Village one-bedrooms"), q("lg")]),
    call("byline", "Caption", [q("All no fee, all available now, checked on RentHop Oct 12")]),
    call("lede", "Text", [q("Leroy Street is the pick: the only one with outdoor space and a fireplace, and the laundry is in the unit. Morton is the cheapest at $5,200, but its photos are of another unit, staged.")]),
    call("sideTitle", "Title", [q("Side by side"), q("md")]),
    call("compare", "Table", [strs(["", ...apartments.map((place) => place.name)]), `[${apartmentRows.map((row) => strs(row)).join(", ")}]`]),
    call("beforeTitle", "Title", [q("Before you go"), q("md")]),
    call("beforeBody", "Text", [q("None of the three lists a floor plan, so ask each agent for one. Confirm availability before applying; listing sites lag.")]),
  )
  return program(lines)
}

function recipe(): string {
  const lines: string[] = []
  const itemNames = recipeItems.map((item, index) => {
    const name = `item${index}`
    lines.push(`$${name} = ${item.done ? "true" : "false"}`)
    lines.push(call(name, "Checkbox", [`$${name}`, q(item.name), "true"]))
    return name
  })
  const stepNames = recipeSteps.map((step, index) => {
    const name = `step${index}`
    lines.push(call(name, "ListItem", [q(step)]))
    return name
  })
  lines.push(
    call("root", "Col", [refs(["title", "byline", "stats", "lede", "buyTitle", "buyList", "methodTitle", "method", "rule"])]),
    call("title", "Title", [q("Dad's chili"), q("lg")]),
    call("byline", "Caption", [q("Serves 6, about 45 minutes")]),
    call("stats", "Grid", [refs(["serves", "time", "heat"]), "3", "80", "2"]),
    call("serves", "Card", [refs(["servesValue", "servesLabel"]), q("soft"), "3", "1"]),
    call("servesValue", "Title", [q("6"), q("md")]),
    call("servesLabel", "Caption", [q("Serves")]),
    call("time", "Card", [refs(["timeValue", "timeLabel"]), q("soft"), "3", "1"]),
    call("timeValue", "Title", [q("45 min"), q("md")]),
    call("timeLabel", "Caption", [q("Time")]),
    call("heat", "Card", [refs(["heatValue", "heatLabel"]), q("soft"), "3", "1"]),
    call("heatValue", "Title", [q("Medium"), q("md")]),
    call("heatLabel", "Caption", [q("Heat")]),
    call("lede", "Text", [q("The Sunday pot, the way Dad makes it: brown the beef hard, let the beans go in late, and give it the full simmer.")]),
    call("buyTitle", "Title", [q("What to buy"), q("md")]),
    call("buyList", "Col", [refs(itemNames), "2"]),
    call("methodTitle", "Title", [q("Method"), q("md")]),
    call("method", "List", [refs(stepNames), q("number")]),
    call("rule", "Card", [refs(["ruleTitle", "ruleBody"]), q("soft")]),
    call("ruleTitle", "Title", [q("Dad's one rule"), q("sm")]),
    call("ruleBody", "Text", [q("Chili is better the second day, so make it the day before."), q("sm")]),
  )
  return program(lines)
}

function tonight(): string {
  const lines: string[] = []
  const factNames = dinnerFacts.map(([label, value], index) => {
    const name = `fact${index}`
    lines.push(call(name, "Row", [refs([`${name}Label`, `${name}Value`]), "2", q("center"), q("between")]))
    lines.push(call(`${name}Label`, "Caption", [q(label)]))
    lines.push(call(`${name}Value`, "Text", [q(value), q("sm")]))
    return name
  })
  lines.push(
    call("root", "Col", [refs(["kicker", "title", "when", "who", "rule", "facts", "foot"])]),
    call("kicker", "Caption", [q("Tonight")]),
    call("title", "Title", [q("Dinner at Nopa"), q("lg")]),
    call("when", "Title", [q("7:30 PM"), q("2xl")]),
    call("who", "Caption", [q("Table for six")]),
    call("rule", "Divider"),
    call("facts", "Col", [refs(factNames), "2"]),
    call("foot", "Caption", [q("Text Caddy to move it.")]),
  )
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
    lines.push(call(name, "ListItem", [q(response.name), q(standing(response))]))
    return name
  })
  const nightNames = nights.map((night, index) => {
    const name = `night${index}`
    lines.push(`$${name} = false`)
    lines.push(call(name, "Checkbox", [`$${name}`, q(night)]))
    return name
  })
  lines.push(
    "$name = \"\"",
    "$coming = \"Yes\"",
    "$kids = \"No\"",
    "$note = \"\"",
    call("root", "Col", [refs(["title", "intro", "form", "soFar"])]),
    call("title", "Title", [q("Cabin weekend"), q("lg")]),
    call("intro", "Caption", [q("Two quick questions so we can book.")]),
    call("form", "Col", [refs(["nameField", "comingField", "nightsLabel", "nightsFields", "kidsField", "noteField", "send"]), "3"]),
    call("nameField", "Input", ["$name", q("Your name"), q("text"), q("So we know who answered")]),
    call("comingField", "RadioGroup", ["$coming", `["Yes", "No"]`, q("Can you make it?"), q("pills")]),
    call("nightsLabel", "Label", [q("Which nights work?")]),
    call("nightsFields", "Col", [refs(nightNames), "2"]),
    call("kidsField", "RadioGroup", ["$kids", `["Yes", "No"]`, q("Bringing kids?"), q("pills")]),
    call("noteField", "TextArea", ["$note", q("Anything we should know?"), q("Allergies, arrival time")]),
    call("send", "Button", [q("Send")]),
    call("soFar", "Card", [refs(["soFarTitle", "soFarList"])]),
    call("soFarTitle", "Title", [q("So far"), q("sm")]),
    call("soFarList", "List", [refs(responseNames), q("none")]),
  )
  return program(lines)
}

function cabins(): string {
  return program([
    call("root", "Col", [refs(["title", "status", "compare"])]),
    call("title", "Title", [q("Tahoe cabins"), q("lg")]),
    call("status", "Text", [q("The Pine Lodge: a hot tub, eight beds, and twelve minutes to the lift."), q("sm"), q("muted")]),
    call("compare", "Table", [strs(cabinHeaders), `[${cabinRows.map((row) => strs(row)).join(", ")}]`]),
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
}
