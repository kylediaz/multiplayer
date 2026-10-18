---
name: books
description: A list where each row opens its own page to edit. Load for a reading list, saved places, contacts, or any records with a few fields and a note.
---

# Books

A list, and a page per item. The list is two tabs, to read and read. A row is the title over the author, and tapping it opens the book's page. The page edits the fields in place, so two people typing in the same note both land, and ends with a column of bars: Done, Move to the top, Remove. Adding is one field and an Add bar under the list.

## React

```json
{ "keys": { "books": { "kind": "list", "fields": { "title": { "kind": "text" }, "author": { "kind": "text" }, "note": { "kind": "text" }, "read": { "kind": "register", "value": "boolean" } } } } }
```

```tsx
import { useState } from "react"
import { useList, useRegister, useText } from "sync"
import { Button, Buttons, Card, CardHeader, ListBlock, ListItem, Tabs, TextContent, Toggle } from "ui"

const field = "w-full rounded-2xl bg-muted px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"

export default function App() {
  const [books, list] = useList("books")
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const book = books.find((item) => item.id === openId)

  if (book) {
    return (
      <BookPage
        id={book.id}
        first={books[0]?.id === book.id}
        onTop={() => list.move(book.id, 0)}
        onRemove={() => {
          list.remove(book.id)
          setOpenId(null)
        }}
        onBack={() => setOpenId(null)}
      />
    )
  }

  const add = () => {
    const title = draft.trim()
    if (!title) return
    list.insert(0, { title, author: "", note: "", read: false })
    setDraft("")
  }

  const shelf = (rows: typeof books) =>
    rows.length === 0 ? (
      <TextContent text="Nothing here yet." style="small" />
    ) : (
      <ListBlock>
        {rows.map((item) => (
          <ListItem key={item.id} title={String(item.data?.title || "Untitled")} subtitle={String(item.data?.author ?? "") || null} onClick={() => setOpenId(item.id)} />
        ))}
      </ListBlock>
    )

  return (
    <Card>
      <CardHeader title="Books to read" />
      <Tabs
        tabs={[
          { label: "To read", children: shelf(books.filter((item) => item.data?.read !== true)) },
          { label: "Read", children: shelf(books.filter((item) => item.data?.read === true)) },
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
        {!first && <Button label="Move to the top" variant="secondary" onClick={onTop} />}
        <Button label="Remove" variant="tertiary" type="destructive" onClick={onRemove} />
      </Buttons>
    </Card>
  )
}
```
