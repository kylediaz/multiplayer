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
    lines.push(call(name, "Row", [refs([`${name}Check`, `${name}Price`]), "12", q("center"), q("space-between")]))
    lines.push(call(`${name}Check`, "Checkbox", [q(item.name)]))
    lines.push(call(`${name}Price`, "Text", [q(`$${item.price}`), q("muted")]))
    return name
  })
  const doneNames = done.map((item, index) => {
    const name = `done${index}`
    lines.push(call(name, "Checkbox", [q(item.name), "true"]))
    return name
  })
  lines.push(
    call("root", "Stack", [refs(["header", "listCard", "doneTitle", "doneList", "send"]), "20"]),
    call("header", "Stack", [refs(["title", "status"]), "4"]),
    call("title", "H1", [q("Tahoe groceries")]),
    call("status", "Text", [q(`${open.length} left, $${total} estimated`), q("muted")]),
    call("listCard", "Card", [refs(["listHead", "listBody"])]),
    call("listHead", "CardHeader", [q("To get")]),
    call("listBody", "CardBody", [refs(["listStack"])]),
    call("listStack", "Stack", [refs(["openList", "addName", "addPriceRow"]), "12"]),
    call("openList", "Stack", [refs(openNames), "10"]),
    call("addName", "TextInput", [q("Add something")]),
    call("addPriceRow", "Row", [refs(["addPrice", "addBtn"]), "8"]),
    call("addPrice", "TextInput", [q("Price"), "null", q("number")]),
    call("addBtn", "Button", [q("Add"), q("secondary")]),
    call("doneTitle", "H2", [q("Done")]),
    call("doneList", "Stack", [refs(doneNames), "8"]),
    call("send", "Button", [q("Text me the list"), q("secondary")]),
  )
  return program(lines)
}

function books(): string {
  const unread = readingList.filter((book) => !book.read).length
  const lines: string[] = []
  const names = readingList.map((book, index) => {
    const name = `book${index}`
    lines.push(call(name, "Row", [refs([`${name}Check`, `${name}Copy`]), "12", q("start")]))
    lines.push(call(`${name}Check`, "Checkbox", book.read ? ["null", "true"] : []))
    lines.push(call(`${name}Copy`, "Stack", [refs([`${name}Title`, `${name}Author`]), "0"]))
    lines.push(call(`${name}Title`, "Text", book.read ? [q(book.title), q("muted")] : [q(book.title)]))
    lines.push(call(`${name}Author`, "Text", [q(book.author), q("muted"), q("small")]))
    return name
  })
  lines.push(
    call("root", "Stack", [refs(["header", "listCard"]), "20"]),
    call("header", "Stack", [refs(["title", "status"]), "4"]),
    call("title", "H1", [q("Books to read")]),
    call("status", "Text", [q(`${unread} to go`), q("muted")]),
    call("listCard", "Card", [refs(["listHead", "listBody"])]),
    call("listHead", "CardHeader", [q("The list")]),
    call("listBody", "CardBody", [refs(["listStack"])]),
    call("listStack", "Stack", [refs([...names, "addTitle", "addAuthorRow"]), "12"]),
    call("addTitle", "TextInput", [q("Add a book")]),
    call("addAuthorRow", "Row", [refs(["addAuthor", "addBtn"]), "8"]),
    call("addAuthor", "TextInput", [q("Author")]),
    call("addBtn", "Button", [q("Add"), q("secondary")]),
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
        lines.push(call(gameName, "Row", [refs([`${gameName}Time`, `${gameName}Match`, `${gameName}Tv`]), "12", q("center"), q("space-between")]))
        lines.push(call(`${gameName}Time`, "Text", [q(game.time)]))
        lines.push(call(`${gameName}Match`, "Text", [q(`${game.away} at ${game.home}`)]))
        lines.push(call(`${gameName}Tv`, "Badge", [q(game.tv), q("secondary")]))
        return gameName
      })
      lines.push(call(dayName, "Stack", [refs([`${dayName}Title`, `${dayName}Games`]), "8"]))
      lines.push(call(`${dayName}Title`, "H3", [q(day)]))
      lines.push(call(`${dayName}Games`, "Stack", [refs(gameNames), "8"]))
      return dayName
    })
    lines.push(call(name, "TabItem", [q(week), q(`Week ${week}`), refs([`${name}Body`])]))
    lines.push(call(`${name}Body`, "Stack", [refs([`${name}Count`, ...dayNames]), "16"]))
    lines.push(call(`${name}Count`, "Text", [q(`${weekGames.length} games`), q("muted")]))
    return name
  })
  lines.push(
    call("root", "Stack", [refs(["header", "weekTabs"]), "16"]),
    call("header", "Stack", [refs(["title", "status"]), "4"]),
    call("title", "H1", [q("2026 NFL Schedule")]),
    call("status", "Text", [q("Week by week"), q("muted")]),
    call("weekTabs", "Tabs", [refs(weekNames), q("1")]),
  )
  return program(lines)
}

function brief(): string {
  const lines: string[] = []
  const sections = ["Side by side", ...apartments.map((place) => place.heading), "Before you go"]
  const contentNames = sections.map((section, index) => {
    const name = `nav${index}`
    lines.push(call(name, "Row", [refs([`${name}N`, `${name}T`]), "16", q("center")]))
    lines.push(call(`${name}N`, "Text", [q(String(index + 1).padStart(2, "0")), q("muted"), q("small")]))
    lines.push(call(`${name}T`, "Text", [q(section)]))
    return name
  })
  const placeNames = apartments.map((place) => {
    const name = place.id
    const factNames = place.facts.map((fact, index) => {
      const factName = `${name}Fact${index}`
      lines.push(call(factName, "Stat", [q(fact.value), q(fact.label)]))
      return factName
    })
    const heading = place.pick ? `${name}Heading` : `${name}Title`
    if (place.pick) {
      lines.push(call(heading, "Row", [refs([`${name}Title`, `${name}Pick`]), "8", q("center")]))
      lines.push(call(`${name}Pick`, "Badge", [q("Pick")]))
    }
    lines.push(call(`${name}Title`, "H2", [q(place.heading)]))
    lines.push(call(`${name}Facts`, "Grid", [refs(factNames), "3", "12"]))
    lines.push(call(`${name}Body`, "Text", [q(place.body)]))
    lines.push(call(`${name}Link`, "Link", [q("Listing on RentHop"), q(place.href)]))
    lines.push(call(name, "Stack", [refs([heading, `${name}Facts`, `${name}Body`, `${name}Link`]), "12"]))
    return name
  })
  lines.push(
    call("root", "Stack", [refs(["title", "byline", "lede", "nav", "sideTitle", "compare", ...placeNames, "beforeTitle", "beforeBody"]), "20"]),
    call("title", "H1", [q("Three West Village one-bedrooms")]),
    call("byline", "Text", [q("All no fee, all available now, checked on RentHop Oct 12"), q("muted")]),
    call("lede", "Text", [q("Leroy Street is the pick: the only one with outdoor space and a fireplace, and the laundry is in the unit. Morton is the cheapest at $5,200, but its photos are of another unit, staged.")]),
    call("nav", "Stack", [refs(contentNames), "4"]),
    call("sideTitle", "H2", [q("Side by side")]),
    call("compare", "Table", [strs(["", ...apartments.map((place) => place.name)]), `[${apartmentRows.map((row) => strs(row)).join(", ")}]`]),
    call("beforeTitle", "H2", [q("Before you go")]),
    call("beforeBody", "Text", [q("None of the three lists a floor plan, so ask each agent for one. Confirm availability before applying; listing sites lag.")]),
  )
  return program(lines)
}

function recipe(): string {
  const lines: string[] = []
  const itemNames = recipeItems.map((item, index) => {
    const name = `item${index}`
    lines.push(call(name, "Checkbox", item.done ? [q(item.name), "true"] : [q(item.name)]))
    return name
  })
  const stepNames = recipeSteps.map((step, index) => {
    const name = `step${index}`
    lines.push(call(name, "Row", [refs([`${name}N`, `${name}T`]), "12", q("start")]))
    lines.push(call(`${name}N`, "Text", [q(String(index + 1).padStart(2, "0")), q("muted"), q("small")]))
    lines.push(call(`${name}T`, "Text", [q(step)]))
    return name
  })
  const contents = ["What to buy", "Method", "Dad's one rule"]
  const navNames = contents.map((section, index) => {
    const name = `nav${index}`
    lines.push(call(name, "Row", [refs([`${name}N`, `${name}T`]), "16"]))
    lines.push(call(`${name}N`, "Text", [q(String(index + 1).padStart(2, "0")), q("muted"), q("small")]))
    lines.push(call(`${name}T`, "Text", [q(section)]))
    return name
  })
  lines.push(
    call("root", "Stack", [refs(["title", "byline", "stats", "lede", "nav", "buyTitle", "buyList", "methodTitle", "method", "rule"]), "20"]),
    call("title", "H1", [q("Dad's chili")]),
    call("byline", "Text", [q("Serves 6, about 45 minutes"), q("muted")]),
    call("stats", "Grid", [refs(["serves", "time", "heat"]), "3", "12"]),
    call("serves", "Stat", [q("6"), q("Serves")]),
    call("time", "Stat", [q("45 min"), q("Time")]),
    call("heat", "Stat", [q("Medium"), q("Heat")]),
    call("lede", "Text", [q("The Sunday pot, the way Dad makes it: brown the beef hard, let the beans go in late, and give it the full simmer.")]),
    call("nav", "Stack", [refs(navNames), "4"]),
    call("buyTitle", "H2", [q("What to buy")]),
    call("buyList", "Stack", [refs(itemNames), "8"]),
    call("methodTitle", "H2", [q("Method")]),
    call("method", "Stack", [refs(stepNames), "12"]),
    call("rule", "Alert", [q("Dad's one rule"), q("Chili is better the second day, so make it the day before.")]),
  )
  return program(lines)
}

function tonight(): string {
  const lines: string[] = []
  const factNames = dinnerFacts.map(([label, value], index) => {
    const name = `fact${index}`
    lines.push(call(`${name}Label`, "Text", [q(label), q("muted")]))
    lines.push(call(`${name}Value`, "Text", [q(value)]))
    return [`${name}Label`, `${name}Value`]
  })
  lines.push(
    call("root", "Stack", [refs(["kicker", "title", "when", "rule", "facts", "foot"]), "16"]),
    call("kicker", "Text", [q("Tonight"), q("muted"), q("small")]),
    call("title", "H1", [q("Dinner at Nopa")]),
    call("when", "Stat", [q("7:30 PM"), q("Table for six")]),
    call("rule", "Separator"),
    call("facts", "Grid", [refs(factNames.flat()), q("auto minmax(0, 1fr)"), "12"]),
    call("foot", "Text", [q("Text Caddy to move it."), q("muted"), q("small")]),
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
    lines.push(call(name, "Stack", [refs([`${name}Name`, `${name}Detail`]), "2"]))
    lines.push(call(`${name}Name`, "Text", [q(response.name)]))
    lines.push(call(`${name}Detail`, "Text", [q(standing(response)), q("muted"), q("small")]))
    return name
  })
  const nightNames = nights.map((night, index) => {
    const name = `night${index}`
    lines.push(call(name, "Checkbox", [q(night)]))
    return name
  })
  lines.push(
    call("root", "Stack", [refs(["title", "intro", "nameLabel", "nameField", "comingLabel", "comingField", "nightsLabel", "nightsFields", "kidsLabel", "kidsField", "noteLabel", "noteField", "send", "soFar"]), "16"]),
    call("title", "H1", [q("Cabin weekend")]),
    call("intro", "Text", [q("Two quick questions so we can book."), q("muted")]),
    call("nameLabel", "Text", [q("Your name"), q("muted"), q("small")]),
    call("nameField", "TextInput", [q("So we know who answered")]),
    call("comingLabel", "Text", [q("Can you make it?"), q("muted"), q("small")]),
    call("comingField", "Select", [`[${option("yes", "Yes")}, ${option("no", "No")}]`, q("Yes or no")]),
    call("nightsLabel", "Text", [q("Which nights work?"), q("muted"), q("small")]),
    call("nightsFields", "Stack", [refs(nightNames), "8"]),
    call("kidsLabel", "Text", [q("Bringing kids?"), q("muted"), q("small")]),
    call("kidsField", "Select", [`[${option("yes", "Yes")}, ${option("no", "No")}]`, q("Yes or no")]),
    call("noteLabel", "Text", [q("Anything we should know?"), q("muted"), q("small")]),
    call("noteField", "TextArea", [q("Allergies, arrival time")]),
    call("send", "Button", [q("Send")]),
    call("soFar", "Card", [refs(["soFarHead", "soFarBody"])]),
    call("soFarHead", "CardHeader", [q("So far")]),
    call("soFarBody", "CardBody", [refs(["soFarList"])]),
    call("soFarList", "Stack", [refs(responseNames), "12"]),
  )
  return program(lines)
}

function option(value: string, label: string): string {
  return `{ value: ${q(value)}, label: ${q(label)} }`
}

function cabins(): string {
  return program([
    call("root", "Stack", [refs(["header", "compare"]), "16"]),
    call("header", "Stack", [refs(["title", "status"]), "4"]),
    call("title", "H1", [q("Tahoe cabins")]),
    call("status", "Text", [q("The Pine Lodge: a hot tub, eight beds, and twelve minutes to the lift."), q("muted")]),
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
