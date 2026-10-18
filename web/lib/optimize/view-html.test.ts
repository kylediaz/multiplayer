import { describe, expect, it } from "vitest"
import { candidateHtml } from "./view-html"

type Host = { post(message: Record<string, unknown>): void; onMessage(callback: (message: unknown) => void): void }

function localHost(): { host: Host; received: Record<string, unknown>[] } {
  const script = candidateHtml().match(/<script>([\s\S]*?)<\/script>/)?.[1]
  if (!script) throw new Error("The view has no host script.")
  const window = {} as { host: Host }
  new Function("window", "setTimeout", script)(window, (callback: () => void) => callback())
  const received: Record<string, unknown>[] = []
  window.host.onMessage((message) => received.push((message as { values: Record<string, unknown> }).values))
  return { host: window.host, received }
}

describe("candidate view host", () => {
  it("answers subscriptions with empty values", () => {
    const { host, received } = localHost()
    host.post({ type: "subscribe", key: "title" })
    expect(received.at(-1)).toEqual({ title: null })
  })

  it("keeps registers, text, and list edits in memory", () => {
    const { host, received } = localHost()
    host.post({ type: "subscribe", key: "done" })
    host.post({ type: "subscribe", key: "items" })
    host.post({ type: "set", key: "done", value: true })
    host.post({ type: "list", key: "items", action: "insert", index: 0, data: { name: "Milk" } })
    host.post({ type: "list", key: "items", action: "insert", index: 1, data: { name: "Eggs" } })
    const [milk, eggs] = received.at(-1)?.items as { id: string }[]
    host.post({ type: "text", key: `items/${milk.id}/name`, next: "Oat milk" })
    host.post({ type: "list", key: "items", action: "move", id: eggs.id, index: 0 })
    host.post({ type: "list", key: "items", action: "update", id: eggs.id, patch: { done: true } })
    expect(received.at(-1)).toEqual({
      done: true,
      items: [
        { id: eggs.id, data: { name: "Eggs", done: true } },
        { id: milk.id, data: { name: "Oat milk" } },
      ],
    })
    host.post({ type: "list", key: "items", action: "delete", id: milk.id })
    expect(received.at(-1)?.items).toEqual([{ id: eggs.id, data: { name: "Eggs", done: true } }])
  })
})
