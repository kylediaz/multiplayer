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
    const { js } = await compileView(`import { Input } from "ui"
import { useText } from "sync"
export default function App() {
  const [name, setName] = useText("name")
  return <Input field="name" value={name} onChange={(event) => setName(event.target.value, event.target.selectionEnd)} />
}`)
    expect(js).toContain("presence")
    expect(js).toContain("outline")
    expect(js).toContain("selectionEnd")
  })

  it("bundles shadcn components and the classes the app uses", async () => {
    const { js, css } = await compileView(`import { Button } from "ui"
export default function App() {
  return <Button className="mt-8">Go</Button>
}`)
    expect(js).toContain("data-slot")
    expect(css).toContain("mt-8")
    expect(css).toContain("--primary")
  })

  it("rejects imports outside react, sync, and ui", async () => {
    await expect(
      compileView(`import fs from "node:fs"\nexport default function App(){ return <span>{String(fs.existsSync)}</span> }`)
    ).rejects.toThrow(/Cannot import/)
  })
})
