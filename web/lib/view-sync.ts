import { useEffect, useRef, useState } from "react"
import { shellMessage } from "./shell-messages"

type Host = {
  post(message: Record<string, unknown>): void
  onMessage(callback: (message: unknown) => void): void
}

function host(): Host {
  return (window as unknown as Window & { host: Host }).host
}

function subscribe(key: string, apply: (value: unknown) => void) {
  host().onMessage((message) => {
    const parsed = shellMessage(message)
    if (!parsed || parsed.type !== "keys" || !Object.prototype.hasOwnProperty.call(parsed.values, key)) return
    apply(parsed.values[key])
  })
  host().post({ type: "subscribe", key })
}

export function useText(key: string): [string, (next: string, cursor?: number) => void] {
  const [value, setValue] = useState("")
  const writing = useRef(0)
  useEffect(() => subscribe(key, (next) => {
    if (Date.now() - writing.current < 400) return
    setValue(typeof next === "string" ? next : "")
  }), [key])
  return [value, (next, cursor) => {
    writing.current = Date.now()
    setValue(next)
    const caret = typeof cursor === "number" && Number.isFinite(cursor) ? cursor : caretOf(next)
    host().post(caret === undefined ? { type: "text", key, next } : { type: "text", key, next, cursor: caret })
  }]
}

function caretOf(next: string): number | undefined {
  const el = document.activeElement
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return undefined
  if (el.value !== next || el.selectionEnd === null) return undefined
  return el.selectionEnd
}

export function useRegister<T>(key: string): [T | null, (value: T | null) => void] {
  const [value, setValue] = useState<T | null>(null)
  const writing = useRef(0)
  useEffect(() => subscribe(key, (next) => {
    if (Date.now() - writing.current < 400) return
    setValue((next ?? null) as T | null)
  }), [key])
  return [value, (next) => {
    writing.current = Date.now()
    setValue(next)
    host().post({ type: "set", key, value: next })
  }]
}

type ListItem = { id: string; data: Record<string, unknown> }

export function useList(key: string): [ListItem[], {
  insert: (index: number, data?: Record<string, unknown>) => void
  remove: (id: string) => void
  move: (id: string, index: number) => void
  update: (id: string, patch: Record<string, unknown>) => void
}] {
  const [items, setItems] = useState<ListItem[]>([])
  useEffect(() => subscribe(key, (next) => {
    if (!Array.isArray(next)) {
      setItems([])
      return
    }
    setItems(next.flatMap((item) => {
      if (!item || typeof item !== "object" || typeof (item as ListItem).id !== "string") return []
      const data = (item as ListItem).data
      return [{ id: (item as ListItem).id, data: data && typeof data === "object" ? data : {} }]
    }))
  }), [key])
  const post = (action: string, extra: Record<string, unknown>) => host().post({ type: "list", key, action, ...extra })
  return [items, {
    insert: (index, data = {}) => post("insert", { index, data }),
    remove: (id) => post("delete", { id }),
    move: (id, index) => post("move", { id, index }),
    update: (id, patch) => post("update", { id, patch }),
  }]
}
