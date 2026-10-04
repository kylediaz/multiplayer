import { describe, expect, it } from "vitest"
import { compileView } from "./compile-view"
import { parseGeneration } from "./parse-generation"

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

  it("rejects a document with no default export", () => {
    expect(() => parseGeneration({ title: "Nope", schema: { keys: {} }, source: "const App = () => null" })).toThrow(/default export/)
  })
})

describe("compileView", () => {
  it("bundles a component that reads its own register", async () => {
    const { js } = await compileView(`import { useRegister } from "sync"
export default function App() {
  const [score, setScore] = useRegister<number>("score")
  return <button onClick={() => setScore((score ?? 0) + 1)}>{score ?? 0}</button>
}`)
    expect(js).toContain("subscribe")
    expect(js).not.toContain("export default")
  })

  it("bundles a list of items", async () => {
    const { js } = await compileView(`import { useList } from "sync"
export default function App() {
  const [items, list] = useList("tasks")
  return <button onClick={() => list.insert(items.length, { text: "one" })}>{items.length}</button>
}`)
    expect(js).toContain("list")
    expect(js).toContain("insert")
  })

  it("reports focus for a field on the built-in input", async () => {
    const { js } = await compileView(`import { TextInput } from "ui"
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
    const { js } = await compileView(`import { TodoList } from "ui"
import { useList } from "sync"
export default function App() {
  const [items, tasks] = useList("tasks")
  return <TodoList todos={items} onTodoClick={(todo) => tasks.update(todo.id, { done: todo.data?.done !== true })} />
}`)
    expect(js).toContain("useList")
    expect(js).toContain("title")
  })

  it("bundles canvas components", async () => {
    const { js, css } = await compileView(`import { Button, Stack } from "ui"
export default function App() {
  return <Stack gap={8} className="mt-8"><Button variant="primary">Go</Button></Stack>
}`)
    expect(js).toContain("Go")
    expect(css).toContain("mt-8")
  })

  it("rejects imports outside react, sync, and ui", async () => {
    await expect(
      compileView(`import fs from "node:fs"\nexport default function App(){ return <span>{String(fs.existsSync)}</span> }`)
    ).rejects.toThrow(/Cannot import/)
  })
})
