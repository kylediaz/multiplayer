"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Button, Buttons, Card, CardHeader, KVList, ListBlock, ListItem, Table, Tabs, TextCallout, TextContent, Toggle } from "@/lib/modes/common/kit"
import { boughtSeed, groceryItems, heater, kittySeed, nights, people, readingList, recipeItems, recipeSteps, restaurants, rsvpSeed, votesSeed, type ReactKind } from "./data"
import { seed, useList, useRegister, useText } from "./sync"

seed({
  groceries: groceryItems,
  books: readingList,
  votes: votesSeed,
  rsvps: rsvpSeed,
  bought: boughtSeed,
  simmerEndsAt: Date.now() + 21 * 60 * 1000 + 40 * 1000,
  kitty: kittySeed,
})

const field = "w-full rounded-2xl bg-muted px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"

function text(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

function GroceriesApp() {
  const [items, list] = useList("groceries")
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const open = items.filter((item) => item.data.done !== true)
  const done = items.filter((item) => item.data.done === true)
  const left = open.reduce((sum, item) => sum + Number(item.data.price ?? 0), 0)

  function add() {
    const title = name.trim()
    if (!title) return
    list.insert(items.length, { name: title, price: Number(price) || 0, done: false })
    setName("")
    setPrice("")
  }

  return (
    <Card>
      <CardHeader title="Tahoe groceries" />
      <KVList
        rows={[
          { label: "Left to buy", value: money(left) },
          { label: "In the cart", value: `${done.length} of ${items.length}` },
        ]}
      />
      {open.length === 0 ? (
        <TextContent text="Everything is in the cart." style="small" />
      ) : (
        <ListBlock header="To get">
          {open.map((item) => (
            <Toggle key={item.id} title={text(item.data.name)} subtitle={money(Number(item.data.price ?? 0))} on={false} onChange={() => list.update(item.id, { done: true })} />
          ))}
        </ListBlock>
      )}
      {done.length > 0 ? (
        <ListBlock header="In the cart">
          {done.map((item) => (
            <Toggle key={item.id} title={text(item.data.name)} on onChange={() => list.update(item.id, { done: false })} />
          ))}
        </ListBlock>
      ) : null}
      <input className={field} value={name} placeholder="Add something" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} />
      <input className={field} value={price} inputMode="decimal" placeholder="Rough price" onChange={(event) => setPrice(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} />
      <Buttons>
        <Button label="Add" onClick={add} />
      </Buttons>
    </Card>
  )
}

function BooksApp() {
  const [items, list] = useList("books")
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const book = items.find((item) => item.id === openId)

  if (book) {
    return (
      <BookPage
        id={book.id}
        first={items[0]?.id === book.id}
        onTop={() => list.move(book.id, 0)}
        onRemove={() => {
          list.remove(book.id)
          setOpenId(null)
        }}
        onBack={() => setOpenId(null)}
      />
    )
  }

  function add() {
    const title = draft.trim()
    if (!title) return
    list.insert(0, { title, author: "", note: "", read: false })
    setDraft("")
  }

  const shelf = (books: typeof items) =>
    books.length === 0 ? (
      <TextContent text="Nothing here yet." style="small" />
    ) : (
      <ListBlock>
        {books.map((item) => (
          <ListItem key={item.id} title={text(item.data.title) || "Untitled"} subtitle={text(item.data.author) || null} onClick={() => setOpenId(item.id)} />
        ))}
      </ListBlock>
    )

  return (
    <Card>
      <CardHeader title="Books to read" />
      <Tabs
        tabs={[
          { label: "To read", children: shelf(items.filter((item) => item.data.read !== true)) },
          { label: "Read", children: shelf(items.filter((item) => item.data.read === true)) },
        ]}
      />
      <input className={field} value={draft} placeholder="Add a book" onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} />
      <Buttons>
        <Button label="Add" onClick={add} />
      </Buttons>
    </Card>
  )
}

function BookPage({ id, first, onTop, onRemove, onBack }: { id: string; first: boolean; onTop: () => void; onRemove: () => void; onBack: () => void }) {
  const [title, setTitle] = useText(`books/${id}/title`)
  const [author, setAuthor] = useText(`books/${id}/author`)
  const [note, setNote] = useText(`books/${id}/note`)
  const [read, setRead] = useRegister<boolean>(`books/${id}/read`)

  return (
    <Card>
      <CardHeader title={title || "Untitled"} />
      <input className={field} value={title} placeholder="Title" onChange={(event) => setTitle(event.target.value, event.target.selectionEnd ?? undefined)} />
      <input className={field} value={author} placeholder="Author" onChange={(event) => setAuthor(event.target.value, event.target.selectionEnd ?? undefined)} />
      <textarea className={`${field} min-h-28 resize-none`} value={note} placeholder="Why this one?" onChange={(event) => setNote(event.target.value, event.target.selectionEnd)} />
      <ListBlock>
        <Toggle title="Read it" on={read === true} onChange={setRead} />
      </ListBlock>
      <Buttons direction="column">
        <Button label="Done" onClick={onBack} />
        {first ? null : <Button label="Move to the top" variant="secondary" onClick={onTop} />}
        <Button label="Remove" variant="tertiary" type="destructive" onClick={onRemove} />
      </Buttons>
    </Card>
  )
}

function PollApp() {
  const [votes, list] = useList("votes")
  const [pick, setPick] = useRegister<string>("pick")
  const [me] = useState(() => crypto.randomUUID())
  const tally = restaurants.map((place) => ({
    place,
    count: votes.filter((vote) => vote.data.place === place).length,
    mine: votes.find((vote) => vote.data.place === place && vote.data.voter === me),
  }))
  const most = Math.max(1, ...tally.map((entry) => entry.count))
  const leader = tally.reduce((best, entry) => (entry.count > best.count ? entry : best))

  if (pick) {
    return (
      <Card>
        <CardHeader title="Tonight" />
        <TextCallout variant="success" title={`${pick} it is`} description="Locked in for everyone. Rajiv is booking for 7:30." />
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
          <div key={entry.place} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-sm font-medium text-foreground">{entry.place}</span>
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
            key={entry.place}
            title={entry.place}
            on={entry.mine !== undefined}
            onChange={(on) => {
              if (on) list.insert(votes.length, { place: entry.place, voter: me })
              else if (entry.mine) list.remove(entry.mine.id)
            }}
          />
        ))}
      </ListBlock>
      <Buttons>
        <Button label={`Lock in ${leader.place}`} onClick={() => setPick(leader.place)} />
      </Buttons>
    </Card>
  )
}

function standing(reply: Record<string, unknown>): string {
  if (reply.coming !== true) return "Can't make it"
  return [`Coming ${text(reply.nights)}`, reply.kids === true ? "with kids" : "", text(reply.note)].filter(Boolean).join(" · ")
}

function RsvpApp() {
  const [replies, list] = useList("rsvps")
  const [name, setName] = useState("")
  const [chosen, setChosen] = useState<string[]>([])
  const [kids, setKids] = useState(false)
  const [note, setNote] = useState("")
  const [sent, setSent] = useState<string | null>(null)
  const coming = replies.filter((reply) => reply.data.coming === true)

  function send(yes: boolean) {
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
      <Table columns={["Night", "Coming"]} rows={nights.map((night) => [night, coming.filter((reply) => text(reply.data.nights).includes(night)).length])} />
      <ListBlock header="So far">
        {replies.map((reply) => (
          <ListItem key={reply.id} title={text(reply.data.name)} subtitle={standing(reply.data)} />
        ))}
      </ListBlock>
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

const SIMMER = 30 * 60 * 1000

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

function RecipeApp() {
  const [bought, list] = useList("bought")
  const [endsAt, setEndsAt] = useRegister<number>("simmerEndsAt")
  const now = useNow(endsAt !== null)
  const left = endsAt === null ? null : Math.min(SIMMER, Math.max(0, endsAt - now))

  function tick(name: string, on: boolean) {
    if (on) list.insert(bought.length, { name })
    else for (const item of bought.filter((entry) => entry.data.name === name)) list.remove(item.id)
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
            <p className="mt-1.5 text-[13px] text-muted-foreground">{left > 10 * 60 * 1000 ? `Beans in at 10:00` : "Beans in now"}</p>
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
        {recipeItems.map((name) => (
          <Toggle key={name} title={name} on={bought.some((item) => item.data.name === name)} onChange={(on) => tick(name, on)} />
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

type Transfer = { from: string; to: string; amount: number }

function settle(balances: { name: string; balance: number }[]): Transfer[] {
  const owes = balances.filter((entry) => entry.balance < -0.005).map((entry) => ({ name: entry.name, amount: -entry.balance }))
  const gets = balances.filter((entry) => entry.balance > 0.005).map((entry) => ({ name: entry.name, amount: entry.balance }))
  const transfers: Transfer[] = []
  for (const debtor of owes) {
    for (const creditor of gets) {
      const amount = Math.min(debtor.amount, creditor.amount)
      if (amount < 0.005) continue
      transfers.push({ from: debtor.name, to: creditor.name, amount })
      debtor.amount -= amount
      creditor.amount -= amount
    }
  }
  return transfers
}

function KittyApp() {
  const [spends, list] = useList("kitty")
  const [what, setWhat] = useState("")
  const [amount, setAmount] = useState("")
  const [payer, setPayer] = useState<string>(people[0])
  const total = spends.reduce((sum, spend) => sum + Number(spend.data.amount ?? 0), 0)
  const share = total / people.length
  const balances = people.map((name) => {
    const paid = spends.filter((spend) => spend.data.paidBy === name).reduce((sum, spend) => sum + Number(spend.data.amount ?? 0), 0)
    return { name, paid, balance: paid - share }
  })
  const transfers = settle(balances)

  function add() {
    const value = Number(amount)
    if (!what.trim() || !(value > 0)) return
    list.insert(spends.length, { what: what.trim(), amount: value, paidBy: payer })
    setWhat("")
    setAmount("")
  }

  return (
    <Card>
      <CardHeader title="Tahoe kitty" />
      <KVList
        rows={[
          { label: "Spent", value: money(total) },
          { label: "Each", value: money(share) },
        ]}
      />
      <ListBlock header="Settle up">
        {transfers.length === 0 ? (
          <ListItem title="Everyone is square" leading="circle-check" />
        ) : (
          transfers.map((transfer) => <ListItem key={`${transfer.from}-${transfer.to}`} title={`${transfer.from} pays ${transfer.to}`} leading="arrow-right-left" trailing={money(transfer.amount)} />)
        )}
      </ListBlock>
      <Table columns={["", "Paid", "Balance"]} rows={balances.map((entry) => [entry.name, money(entry.paid), `${entry.balance >= 0 ? "+" : "−"}${money(Math.abs(entry.balance))}`])} />
      <ListBlock header="Spent">
        {spends.map((spend) => (
          <ListItem key={spend.id} title={text(spend.data.what)} subtitle={text(spend.data.paidBy)} trailing={money(Number(spend.data.amount ?? 0))} />
        ))}
      </ListBlock>
      <input className={field} value={what} placeholder="What was it" onChange={(event) => setWhat(event.target.value)} />
      <input className={field} value={amount} inputMode="decimal" placeholder="How much" onChange={(event) => setAmount(event.target.value)} />
      <select className={field} value={payer} onChange={(event) => setPayer(event.target.value)}>
        {people.map((name) => (
          <option key={name} value={name}>
            Paid by {name}
          </option>
        ))}
      </select>
      <Buttons>
        <Button label="Add" onClick={add} />
      </Buttons>
    </Card>
  )
}

function step(temp: number, set: number, gap: number, heating: boolean): boolean {
  if (temp < set - gap / 2) return true
  if (temp > set + gap / 2) return false
  return heating
}

const OUTSIDE = 30
const LOSS = 0.012
const POWER = 0.75
const MINUTES = 120
const TICK = 0.25

function simulate(set: number, gap: number) {
  let temp = set
  let heating = false
  let starts = 0
  let coast = 0
  let longest = 0
  const points: { minute: number; temp: number; heating: boolean }[] = []
  for (let minute = 0; minute <= MINUTES; minute += TICK) {
    const next = step(temp, set, gap, heating)
    if (next && !heating) starts++
    coast = next ? 0 : coast + TICK
    longest = Math.max(longest, coast)
    heating = next
    points.push({ minute, temp, heating })
    temp += ((heating ? POWER : 0) - LOSS * (temp - OUTSIDE)) * TICK
  }
  return { points, startsPerHour: starts / (MINUTES / 60), longest }
}

function Range({ label, value, unit, min, max, step: stepBy, onChange }: { label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="flex flex-col gap-2 px-0.5">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground tabular-nums">
          {value}
          {unit}
        </span>
      </span>
      <input type="range" className="w-full accent-primary" min={min} max={max} step={stepBy} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function HeaterApp() {
  const [set, setSet] = useState(68)
  const [gap, setGap] = useState(2)
  const run = useMemo(() => simulate(set, gap), [set, gap])
  const width = 320
  const height = 150
  const x = (minute: number) => (minute / MINUTES) * width
  const y = (temp: number) => 10 + ((set + 4 - temp) / 8) * 110
  const line = run.points.map((point) => `${x(point.minute).toFixed(1)},${y(point.temp).toFixed(1)}`).join(" ")
  const bursts = run.points.filter((point) => point.heating)

  return (
    <Card>
      <CardHeader title="The cabin heater" />
      <TextContent text="Slide the set point and the gap. The boiler only starts below the band and only stops above it." style="small" />
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible rounded-2xl bg-muted">
        <rect x={0} y={y(set + gap / 2)} width={width} height={y(set - gap / 2) - y(set + gap / 2)} className="fill-foreground/10" />
        <polyline points={line} className="fill-none stroke-primary" strokeWidth={2} strokeLinejoin="round" />
        {bursts.map((point) => (
          <rect key={point.minute} x={x(point.minute)} y={height - 14} width={(TICK / MINUTES) * width + 0.3} height={6} className="fill-primary" />
        ))}
        <text x={8} y={height - 20} className="fill-muted-foreground text-[10px]">
          Boiler on
        </text>
        <text x={width - 8} y={height - 20} textAnchor="end" className="fill-muted-foreground text-[10px]">
          2 hours
        </text>
      </svg>
      <Range label="Set point" value={set} unit="°F" min={60} max={74} step={1} onChange={setSet} />
      <Range label="Gap" value={gap} unit="°F" min={0.5} max={6} step={0.5} onChange={setGap} />
      <KVList
        rows={[
          { label: "Band", value: `${set - gap / 2}°F to ${set + gap / 2}°F` },
          { label: "Starts an hour", value: run.startsPerHour.toFixed(1) },
          { label: "Longest wait for heat", value: `${Math.round(run.longest)} min` },
        ]}
      />
      <TextContent text="This is the whole rule. The boiler keeps doing what it was doing until the room leaves the band." />
      <pre className="m-0 overflow-x-auto rounded-2xl bg-muted px-4 py-3.5 font-mono text-[13px] leading-[1.6]">
        <code>{heater.code}</code>
      </pre>
    </Card>
  )
}

const views = {
  groceries: GroceriesApp,
  books: BooksApp,
  poll: PollApp,
  rsvp: RsvpApp,
  recipe: RecipeApp,
  kitty: KittyApp,
  heater: HeaterApp,
} satisfies Record<ReactKind, () => ReactNode>

export function ReactApp({ kind }: { kind: ReactKind }) {
  const View = views[kind]
  return <View />
}
