"use client"

import { useSyncExternalStore } from "react"

// The showcase has no document, so this keeps the shared state in memory with the same API as "sync".
// Every phone that reads a key sees the same value, the way two people in one document would.

type ListItem = { id: string; data: Record<string, unknown> }

const values = new Map<string, unknown>()
const listeners = new Map<string, Set<() => void>>()
let nextId = 0

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener())
}

function subscribe(key: string, listener: () => void) {
  const root = key.split("/")[0] ?? key
  const set = listeners.get(root) ?? new Set()
  set.add(listener)
  listeners.set(root, set)
  return () => set.delete(listener)
}

function itemPath(key: string): { list: string; id: string; field: string } | null {
  const [list, id, field] = key.split("/")
  return list && id && field ? { list, id, field } : null
}

function listOf(key: string): ListItem[] {
  const value = values.get(key)
  return Array.isArray(value) ? (value as ListItem[]) : []
}

function read(key: string): unknown {
  const path = itemPath(key)
  if (!path) return values.get(key)
  return listOf(path.list).find((item) => item.id === path.id)?.data[path.field]
}

function write(key: string, value: unknown) {
  const path = itemPath(key)
  if (!path) {
    values.set(key, value)
    notify(key)
    return
  }
  patch(path.list, path.id, { [path.field]: value })
}

function patch(key: string, id: string, next: Record<string, unknown>) {
  values.set(
    key,
    listOf(key).map((item) => (item.id === id ? { id, data: { ...item.data, ...next } } : item)),
  )
  notify(key)
}

function useValue(key: string): unknown {
  return useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => read(key),
    () => read(key),
  )
}

export function seed(initial: Record<string, unknown>) {
  for (const [key, value] of Object.entries(initial)) {
    if (values.has(key)) continue
    values.set(key, Array.isArray(value) ? value.map((data) => ({ id: `${key}-${nextId++}`, data })) : value)
  }
}

export function useText(key: string): [string, (next: string, cursor?: number) => void] {
  const value = useValue(key)
  return [typeof value === "string" ? value : "", (next) => write(key, next)]
}

export function useRegister<T>(key: string): [T | null, (value: T | null) => void] {
  const value = useValue(key)
  return [(value ?? null) as T | null, (next) => write(key, next)]
}

export function useList(key: string): [
  ListItem[],
  {
    insert: (index: number, data?: Record<string, unknown>) => void
    remove: (id: string) => void
    move: (id: string, index: number) => void
    update: (id: string, patch: Record<string, unknown>) => void
  },
] {
  useValue(key)
  return [
    listOf(key),
    {
      insert: (index, data = {}) => {
        const next = [...listOf(key)]
        next.splice(index, 0, { id: `${key}-${nextId++}`, data })
        values.set(key, next)
        notify(key)
      },
      remove: (id) => {
        values.set(key, listOf(key).filter((item) => item.id !== id))
        notify(key)
      },
      move: (id, index) => {
        const item = listOf(key).find((entry) => entry.id === id)
        if (!item) return
        const next = listOf(key).filter((entry) => entry.id !== id)
        next.splice(index, 0, item)
        values.set(key, next)
        notify(key)
      },
      update: (id, next) => patch(key, id, next),
    },
  ]
}
