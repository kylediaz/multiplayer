---
name: books
description: A reading list the person can edit. Load for a list of books, records, or saved titles.
---

# Books

One list. The title is the book, the subtitle is the author, and the switch is read. No ratings, covers, notes, or a delete on the row. Adding is one field, then a full-width Add bar. Copy this page.

schema.keys.books is a list. title and author are text. read is a boolean register.

```tsx
import { useState } from "react"
import { useList } from "sync"
import { Button, Buttons, Card, CardHeader, ListBlock, TextContent, Toggle } from "ui"

export default function App() {
  const [books, list] = useList("books")
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const add = () => {
    const next = title.trim()
    if (!next) return
    list.insert(books.length, { title: next, author: author.trim(), read: false })
    setTitle("")
    setAuthor("")
  }
  return (
    <Card>
      <CardHeader title="Books to read" />
      {books.length === 0 ? <TextContent text="Nothing on the list yet." style="small" /> : (
        <ListBlock>
          {books.map((book) => (
            <Toggle key={book.id} title={String(book.data?.title ?? "")} subtitle={String(book.data?.author ?? "")} on={book.data?.read === true} onChange={(read) => list.update(book.id, { read })} />
          ))}
        </ListBlock>
      )}
      <input value={title} placeholder="Title" onChange={(event) => setTitle(event.target.value)} />
      <input value={author} placeholder="Author" onChange={(event) => setAuthor(event.target.value)} />
      <Buttons>
        <Button label="Add" onClick={add} />
      </Buttons>
    </Card>
  )
}
```

OpenUI writes the rows out. A finished book uses trailing "Read" on a ListItem. There is no Add button.
