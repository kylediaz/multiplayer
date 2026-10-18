"use client"

import { useState, type ReactNode } from "react"
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Grid,
  H1,
  H2,
  H3,
  Link,
  Row,
  Separator,
  Stack,
  Stat,
  Table,
  Tabs,
  Text,
  TextArea,
  TextInput,
} from "@/lib/modes/common/kit"
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
} from "./data"

function Contents({ items }: { items: readonly string[] }) {
  return (
    <Stack gap={0}>
      {items.map((item, index) => (
        <Row key={item} gap={16} className="border-b border-border py-2.5">
          <Text tone="muted" size="small" className="w-6 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </Text>
          <Text>{item}</Text>
        </Row>
      ))}
    </Stack>
  )
}

type GroceryItem = { id: string; name: string; price: number | null; done: boolean }

export function GroceriesApp() {
  const [items, setItems] = useState<GroceryItem[]>(() => groceryItems.map((item, index) => ({ ...item, id: String(index) })))
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [sent, setSent] = useState(false)
  const open = items.filter((item) => !item.done)
  const done = items.filter((item) => item.done)
  const total = items.reduce((sum, item) => sum + (item.price ?? 0), 0)

  function toggle(id: string, checked: boolean) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, done: checked } : item)))
  }

  function add() {
    const next = name.trim()
    if (!next) return
    const parsed = price.trim() ? Number(price) : null
    setItems((current) => [
      ...current,
      { id: crypto.randomUUID(), name: next, price: parsed != null && Number.isFinite(parsed) ? parsed : null, done: false },
    ])
    setName("")
    setPrice("")
  }

  return (
    <Stack gap={20}>
      <Stack gap={4}>
        <H1>Tahoe groceries</H1>
        <Text tone="muted">{items.length ? `${open.length} left, $${total} estimated` : "Nothing on the list yet"}</Text>
      </Stack>
      <Card>
        <CardHeader>To get</CardHeader>
        <CardBody>
          <Stack gap={12}>
            <Stack gap={10}>
              {open.map((item) => (
                <Row key={item.id} justify="space-between">
                  <Checkbox label={item.name} checked={false} onChange={() => toggle(item.id, true)} />
                  {item.price != null ? <Text tone="muted">${item.price}</Text> : null}
                </Row>
              ))}
            </Stack>
            <TextInput value={name} onChange={setName} placeholder="Add something" aria-label="Item" />
            <Row gap={8}>
              <TextInput value={price} onChange={setPrice} placeholder="Price" type="number" aria-label="Price" className="w-24" />
              <Button variant="secondary" disabled={!name.trim()} onClick={add}>
                Add
              </Button>
            </Row>
          </Stack>
        </CardBody>
      </Card>
      {done.length > 0 ? (
        <Stack gap={8}>
          <H2>Done</H2>
          {done.map((item) => (
            <Checkbox key={item.id} label={item.name} checked className="text-muted-foreground" onChange={() => toggle(item.id, false)} />
          ))}
        </Stack>
      ) : null}
      {sent ? (
        <Alert title="Sent" variant="success">
          The list is on its way.
        </Alert>
      ) : (
        <Button variant="secondary" onClick={() => setSent(true)}>
          Text me the list
        </Button>
      )}
    </Stack>
  )
}

type Book = { id: string; title: string; author: string; read: boolean }

export function BooksApp() {
  const [books, setBooks] = useState<Book[]>(() => readingList.map((book, index) => ({ ...book, id: String(index) })))
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const unread = books.filter((book) => !book.read).length

  function add() {
    const next = title.trim()
    if (!next) return
    setBooks((current) => [...current, { id: crypto.randomUUID(), title: next, author: author.trim(), read: false }])
    setTitle("")
    setAuthor("")
  }

  return (
    <Stack gap={20}>
      <Row justify="space-between" align="end">
        <Stack gap={4}>
          <H1>Books to read</H1>
          <Text tone="muted">{books.length ? `${unread} to go` : "Add the first one"}</Text>
        </Stack>
        <Button variant="ghost" onClick={() => setEditing((current) => !current)}>
          {editing ? "Done" : "Edit"}
        </Button>
      </Row>
      <Card>
        <CardHeader>The list</CardHeader>
        <CardBody>
          <Stack gap={12}>
            {books.map((book) => (
              <Row key={book.id} gap={12} align="start">
                <Checkbox checked={book.read} onChange={(read) => setBooks((current) => current.map((item) => (item.id === book.id ? { ...item, read } : item)))} />
                <Stack gap={0} className="min-w-0 flex-1">
                  <Text tone={book.read ? "muted" : "primary"} className={book.read ? "line-through" : undefined}>
                    {book.title}
                  </Text>
                  {book.author ? (
                    <Text tone="muted" size="small">
                      {book.author}
                    </Text>
                  ) : null}
                </Stack>
                {editing ? (
                  <Button variant="ghost" onClick={() => setBooks((current) => current.filter((item) => item.id !== book.id))}>
                    Remove
                  </Button>
                ) : null}
              </Row>
            ))}
            <TextInput value={title} onChange={setTitle} placeholder="Add a book" aria-label="Title" />
            <Row gap={8}>
              <TextInput value={author} onChange={setAuthor} placeholder="Author" aria-label="Author" className="min-w-0 flex-1" />
              <Button variant="secondary" disabled={!title.trim()} onClick={add}>
                Add
              </Button>
            </Row>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  )
}

function Week({ week }: { week: string }) {
  const weekGames = games.filter((game) => game.week === week)
  const days = [...new Set(weekGames.map((game) => game.day))]
  return (
    <Stack gap={16}>
      <Text tone="muted">{weekGames.length} games</Text>
      {days.map((day) => (
        <Stack key={day} gap={8}>
          <H3>{day}</H3>
          {weekGames
            .filter((game) => game.day === day)
            .map((game) => (
              <Row key={`${game.away}-${game.home}-${game.time}`} gap={12} justify="space-between">
                <Text weight="medium" className="w-[4.75rem] shrink-0 tabular-nums">
                  {game.time}
                </Text>
                <Text className="min-w-0 flex-1">
                  {game.away} at {game.home}
                </Text>
                <Badge variant="secondary">{game.tv}</Badge>
              </Row>
            ))}
        </Stack>
      ))}
    </Stack>
  )
}

export function ScheduleApp() {
  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <H1>2026 NFL Schedule</H1>
        <Text tone="muted">Week by week</Text>
      </Stack>
      <Tabs
        defaultValue="1"
        tabs={weeks.map((week) => ({
          value: week,
          label: `Week ${week}`,
          content: <Week week={week} />,
        }))}
      />
    </Stack>
  )
}

function Listing({ title, pick, facts, body, href }: { title: string; pick?: boolean; facts: readonly { value: string; label: string }[]; body: string; href: string }) {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <H2>{title}</H2>
        {pick ? <Badge>Pick</Badge> : null}
      </Row>
      <Grid columns={3} gap={12}>
        {facts.map((fact) => (
          <Stat key={fact.label} value={fact.value} label={fact.label} />
        ))}
      </Grid>
      <Text>{body}</Text>
      <Link href={href}>Listing on RentHop</Link>
    </Stack>
  )
}

export function BriefApp() {
  return (
    <Stack gap={20}>
      <H1>Three West Village one-bedrooms</H1>
      <Text tone="muted">All no fee, all available now, checked on RentHop Oct 12</Text>
      <Text>
        Leroy Street is the pick: the only one with outdoor space and a fireplace, and the laundry is in the unit. Morton is the cheapest at $5,200, but its photos are of another unit, staged.
      </Text>
      <Contents items={["Side by side", ...apartments.map((place) => place.heading), "Before you go"]} />
      <Stack gap={12}>
        <H2>Side by side</H2>
        <Table headers={["", ...apartments.map((place) => place.name)]} rows={apartmentRows.map((row) => [...row])} />
      </Stack>
      {apartments.map((place) => (
        <Listing key={place.id} title={place.heading} pick={place.pick} facts={place.facts} body={place.body} href={place.href} />
      ))}
      <Stack gap={12}>
        <H2>Before you go</H2>
        <Text>None of the three lists a floor plan, so ask each agent for one. Confirm availability before applying; listing sites lag.</Text>
      </Stack>
    </Stack>
  )
}

type Ingredient = { id: string; name: string; done: boolean }

export function RecipeApp() {
  const [items, setItems] = useState<Ingredient[]>(() => recipeItems.map((item, index) => ({ ...item, id: String(index) })))
  return (
    <Stack gap={20}>
      <H1>Dad&apos;s chili</H1>
      <Text tone="muted">Serves 6, about 45 minutes</Text>
      <Grid columns={3} gap={12}>
        <Stat value="6" label="Serves" />
        <Stat value="45 min" label="Time" />
        <Stat value="Medium" label="Heat" />
      </Grid>
      <Text>The Sunday pot, the way Dad makes it: brown the beef hard, let the beans go in late, and give it the full simmer.</Text>
      <Contents items={["What to buy", "Method", "Dad's one rule"]} />
      <Stack gap={12}>
        <H2>What to buy</H2>
        <Stack gap={8}>
          {items.map((item) => (
            <Checkbox
              key={item.id}
              label={item.name}
              checked={item.done}
              className={item.done ? "text-muted-foreground" : undefined}
              onChange={(done) => setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, done } : entry)))}
            />
          ))}
        </Stack>
      </Stack>
      <Stack gap={12}>
        <H2>Method</H2>
        <Stack gap={12}>
          {recipeSteps.map((step, index) => (
            <Row key={step} gap={12} align="start">
              <Text tone="muted" size="small" className="w-6 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text>{step}</Text>
            </Row>
          ))}
        </Stack>
      </Stack>
      <Alert title="Dad's one rule">Chili is better the second day, so make it the day before.</Alert>
      <Text tone="muted">He is right about this, and about very little else in the kitchen.</Text>
    </Stack>
  )
}

export function TonightApp() {
  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <Text tone="muted" size="small">
          Tonight
        </Text>
        <H1>Dinner at Nopa</H1>
      </Stack>
      <Stat value="7:30 PM" label="Table for six" />
      <Separator />
      <Grid columns="auto minmax(0, 1fr)" gap={12}>
        {dinnerFacts.map(([label, value]) => (
          <Fact key={label} label={label} value={value} />
        ))}
      </Grid>
      <Text tone="muted" size="small">
        Text Caddy to move it.
      </Text>
    </Stack>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Text tone="muted">{label}</Text>
      <Text>{value}</Text>
    </>
  )
}

type Reply = { id: string; name: string; coming: boolean; nights: string; kids: boolean; note: string }

function replyLine(reply: Reply): string {
  if (!reply.coming) return "Can't make it"
  return ["Coming", reply.nights, reply.kids ? "with kids" : ""].filter(Boolean).join(", ")
}

export function RsvpApp() {
  const [replies, setReplies] = useState<Reply[]>(() => rsvpSeed.map((reply, index) => ({ ...reply, id: String(index), note: "" })))
  const [name, setName] = useState("")
  const [coming, setComing] = useState("")
  const [chosen, setChosen] = useState<string[]>([])
  const [kids, setKids] = useState("")
  const [note, setNote] = useState("")

  function toggleNight(night: string) {
    setChosen((current) => (current.includes(night) ? current.filter((item) => item !== night) : [...current, night]))
  }

  function send() {
    const trimmed = name.trim()
    if (!trimmed || !coming) return
    const next = { name: trimmed, coming: coming === "yes", nights: chosen.join(", "), kids: kids === "yes", note: note.trim() }
    setReplies((current) => {
      const existing = current.find((reply) => reply.name.toLowerCase() === trimmed.toLowerCase())
      if (!existing) return [...current, { id: crypto.randomUUID(), ...next }]
      return current.map((reply) => (reply.id === existing.id ? { ...reply, ...next } : reply))
    })
    setNote("")
  }

  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <H1>Cabin weekend</H1>
        <Text tone="muted">Two quick questions so we can book.</Text>
      </Stack>
      <Field label="Your name">
        <TextInput value={name} onChange={setName} placeholder="So we know who answered" aria-label="Your name" />
      </Field>
      <Field label="Can you make it?">
        <Row gap={8}>
          <Choice pressed={coming === "yes"} onClick={() => setComing("yes")}>
            Yes
          </Choice>
          <Choice pressed={coming === "no"} onClick={() => setComing("no")}>
            No
          </Choice>
        </Row>
      </Field>
      <Field label="Which nights work?">
        <Row gap={8} wrap>
          {nights.map((night) => (
            <Choice key={night} pressed={chosen.includes(night)} onClick={() => toggleNight(night)}>
              {night}
            </Choice>
          ))}
        </Row>
      </Field>
      <Field label="Bringing kids?">
        <Row gap={8}>
          <Choice pressed={kids === "yes"} onClick={() => setKids("yes")}>
            Yes
          </Choice>
          <Choice pressed={kids === "no"} onClick={() => setKids("no")}>
            No
          </Choice>
        </Row>
      </Field>
      <Field label="Anything we should know?">
        <TextArea value={note} onChange={setNote} placeholder="Allergies, arrival time" aria-label="Note" />
      </Field>
      <Button disabled={!name.trim() || !coming} onClick={send}>
        Send
      </Button>
      <Card>
        <CardHeader>So far</CardHeader>
        <CardBody>
          <Stack gap={12}>
            {replies.map((reply) => (
              <Stack key={reply.id} gap={2}>
                <Text weight="medium">{reply.name}</Text>
                <Text tone="muted" size="small">
                  {replyLine(reply)}
                </Text>
                {reply.note ? <Text size="small">{reply.note}</Text> : null}
              </Stack>
            ))}
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={6}>
      <Text tone="muted" size="small">
        {label}
      </Text>
      {children}
    </Stack>
  )
}

function Choice({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <Button variant={pressed ? "default" : "outline"} pressed={pressed} onClick={onClick}>
      {children}
    </Button>
  )
}

export function CabinsApp() {
  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <H1>Tahoe cabins</H1>
        <Text tone="muted">The Pine Lodge: a hot tub, eight beds, and twelve minutes to the lift.</Text>
      </Stack>
      <Table headers={[...cabinHeaders]} rows={cabinRows.map((row) => [...row])} />
    </Stack>
  )
}
