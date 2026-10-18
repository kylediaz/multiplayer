import { describe, expect, it } from "vitest"
import { openuiMode } from "./modes/openui/mode"
import { reactMode } from "./modes/react/mode"
import { parseGeneration } from "./parse-generation"

async function reactBundle(source: string) {
  const revision = await reactMode.publish(source)
  if (!revision.ok) throw new Error(revision.problems.join("\n"))
  return {
    js: revision.files.find((file) => file.name === "main.js")?.body ?? "",
    css: revision.files.find((file) => file.name === "main.css")?.body ?? "",
  }
}

describe("parseGeneration", () => {
  it("reads a generated app", () => {
    const app = parseGeneration({
      title: "Scoreboard",
      schema: { keys: { score: { kind: "register", value: "number" } } },
      source: "export default function App() { return null }",
    })
    expect(app.title).toBe("Scoreboard")
    expect(app.schema.keys.score).toMatchObject({ kind: "register", value: "number" })
  })

  it("keeps source that has no default export", () => {
    const app = parseGeneration({ title: "Nope", schema: { keys: {} }, source: "const App = () => null" })
    expect(app.source).toBe("const App = () => null")
  })

  it("reads an OpenUI program", () => {
    const app = parseGeneration({
      title: "Hello",
      lang: "openui",
      schema: { keys: {} },
      source: 'root = Card([title])\ntitle = CardHeader("Hello")',
    })
    expect(app.lang).toBe("openui")
    expect(app.source).toContain("root = Card")
  })

  it("keeps an OpenUI program that does not parse", () => {
    const app = parseGeneration({ title: "Nope", lang: "openui", schema: { keys: {} }, source: "nope" })
    expect(app.source).toBe("nope")
  })
})

describe("publish", () => {
  it("reports a missing default export", async () => {
    const revision = await reactMode.publish("const App = () => null")
    expect(revision.ok).toBe(false)
    if (revision.ok) return
    expect(revision.problems.join("\n")).toMatch(/default export/)
  })

  it("reports a forbidden import", async () => {
    const revision = await reactMode.publish(`import fs from "node:fs"\nexport default function App(){ return <span>{String(fs.existsSync)}</span> }`)
    expect(revision.ok).toBe(false)
    if (revision.ok) return
    expect(revision.problems.join("\n")).toMatch(/Cannot import/)
  })

  it("reports every OpenUI problem", async () => {
    const revision = await openuiMode.publish('root = Card([a, b])\na = Missing("x")\nb = Missing("y")')
    expect(revision.ok).toBe(false)
    if (revision.ok) return
    expect(revision.problems.length).toBeGreaterThan(1)
    expect(revision.problems.some((problem) => problem.startsWith("a:"))).toBe(true)
    expect(revision.problems.some((problem) => problem.startsWith("b:"))).toBe(true)
  })

  it("bundles a component that reads its own register", async () => {
    const { js } = await reactBundle(`import { useRegister } from "sync"
export default function App() {
  const [score, setScore] = useRegister<number>("score")
  return <button onClick={() => setScore((score ?? 0) + 1)}>{score ?? 0}</button>
}`)
    expect(js).toContain("subscribe")
    expect(js).not.toContain("export default")
  })

  it("bundles a list of items", async () => {
    const { js } = await reactBundle(`import { useList } from "sync"
export default function App() {
  const [items, list] = useList("tasks")
  return <button onClick={() => list.insert(items.length, { text: "one" })}>{items.length}</button>
}`)
    expect(js).toContain("list")
    expect(js).toContain("insert")
  })

  it("reports focus for a field on the built-in input", async () => {
    const { js } = await reactBundle(`import { TextInput } from "ui"
import { useText } from "sync"
export default function App() {
  const [name, setName] = useText("name")
  return <TextInput field="name" value={name} onChange={(value, cursor) => setName(value, cursor)} />
}`)
    expect(js).toContain("presence")
    expect(js).toContain("outline")
    expect(js).toContain("selectionEnd")
  })

  it("renders list items whose fields are registers", async () => {
    const { js } = await reactBundle(`import { TodoList } from "ui"
import { useList } from "sync"
export default function App() {
  const [items, tasks] = useList("tasks")
  return <TodoList todos={items} onTodoClick={(todo) => tasks.update(todo.id, { done: todo.data?.done !== true })} />
}`)
    expect(js).toContain("useList")
    expect(js).toContain("title")
  })

  it("bundles kit components", async () => {
    const { js, css } = await reactBundle(`import { Button, Stack } from "ui"
export default function App() {
  return <Stack gap={8} className="mt-8"><Button variant="default">Go</Button></Stack>
}`)
    expect(js).toContain("Go")
    expect(css).toContain("mt-8")
  })

  it("publishes maps, prose, tables, drawings, and html", async () => {
    const source = [
      'root = Card([header, prose, sheet, pin, map, dot, drawing, page])',
      'header = CardHeader("Nopa")',
      'prose = Markdown("**7:30** at [Nopa](https://nopa.com)")',
      'sheet = Table(["Place", "Seats"], [["Nopa", "6"]])',
      'pin = MapMarker("Nopa", 37.7749, -122.4376)',
      'map = Map([pin])',
      'dot = Circle(50, 50, 20)',
      'drawing = Svg([dot], "0 0 100 100")',
      'page = HtmlView("<p>Hello</p>", 120, "Hello")',
    ].join("\n")
    const revision = await openuiMode.publish(source)
    expect(revision.ok).toBe(true)
  })

  it("publishes a program that calls a library function", async () => {
    const revision = await openuiMode.publish('root = Card([header, line])\nheader = CardHeader("Bill")\nline = TextContent(@Percent(1, 4))')
    expect(revision.ok).toBe(true)
  })

  it("publishes a list program", async () => {
    const revision = await openuiMode.publish('root = Card([header, list])\nheader = CardHeader("Groceries")\nlist = ListBlock([item])\nitem = ListItem("Eggs", null, null, "$8")')
    expect(revision.ok).toBe(true)
  })

  it("stores an OpenUI program without a bundle", async () => {
    const revision = await openuiMode.publish('root = Card([title])\ntitle = CardHeader("Hello")')
    expect(revision.ok).toBe(true)
    if (!revision.ok) return
    expect(revision.files.map((file) => file.name)).toEqual(["source.txt"])
  })
})
