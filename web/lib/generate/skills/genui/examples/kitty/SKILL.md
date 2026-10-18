---
name: kitty
description: Shared expenses with who owes whom worked out. Load for splitting costs, a trip kitty, a shared tab, or any ledger that needs a settle-up.
---

# Kitty

The answer comes first: what was spent, each person's share, then the transfers that settle it. A table shows each person's paid and balance. Then the spends, then the form: what, how much, a select for who paid, and an Add bar. Everything but the spends is derived in code.

## React

```json
{ "keys": { "spends": { "kind": "list", "fields": { "what": { "kind": "text" }, "amount": { "kind": "register", "value": "number" }, "paidBy": { "kind": "register", "value": "string" } } } } }
```

```tsx
import { useState } from "react"
import { useList } from "sync"
import { Button, Buttons, Card, CardHeader, KVList, ListBlock, ListItem, Table, TextContent } from "ui"

const field = "w-full rounded-2xl bg-muted px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
const people = ["Maya", "Jon", "Priya", "Sam"]
const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" })

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

export default function App() {
  const [spends, list] = useList("spends")
  const [what, setWhat] = useState("")
  const [amount, setAmount] = useState("")
  const [payer, setPayer] = useState(people[0])
  const total = spends.reduce((sum, spend) => sum + Number(spend.data?.amount ?? 0), 0)
  const share = total / people.length
  const balances = people.map((name) => {
    const paid = spends.filter((spend) => spend.data?.paidBy === name).reduce((sum, spend) => sum + Number(spend.data?.amount ?? 0), 0)
    return { name, paid, balance: paid - share }
  })
  const transfers = settle(balances)

  const add = () => {
    const value = Number(amount)
    if (!what.trim() || !(value > 0)) return
    list.insert(spends.length, { what: what.trim(), amount: value, paidBy: payer })
    setWhat("")
    setAmount("")
  }

  return (
    <Card>
      <CardHeader title="Kitty" />
      {spends.length === 0 ? (
        <TextContent text="Nothing spent yet." style="small" />
      ) : (
        <>
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
              <ListItem key={spend.id} title={String(spend.data?.what ?? "")} subtitle={String(spend.data?.paidBy ?? "")} trailing={money(Number(spend.data?.amount ?? 0))} />
            ))}
          </ListBlock>
        </>
      )}
      <input className={field} value={what} placeholder="What was it" onChange={(event) => setWhat(event.target.value)} />
      <input className={field} value={amount} inputMode="decimal" placeholder="How much" onChange={(event) => setAmount(event.target.value)} />
      <div className="relative">
        <select className={`${field} appearance-none pr-10`} value={payer} onChange={(event) => setPayer(event.target.value)}>
          {people.map((name) => (
            <option key={name} value={name}>
              Paid by {name}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 fill-none stroke-muted-foreground stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <Buttons>
        <Button label="Add" onClick={add} />
      </Buttons>
    </Card>
  )
}
```
