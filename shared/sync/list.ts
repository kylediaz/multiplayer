import { generateKeyBetween } from "fractional-indexing"
import type { JSONValue, ListItem, ListRecord } from "./doc"

export type ListEntry = { id: string; pos: string; data: Record<string, JSONValue> }

export function sortedItems(list: ListRecord | undefined): ListEntry[] {
  if (!list) return []
  return Object.values(list)
    .filter((item) => !item.deleted)
    .sort((a, b) => (a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(({ id, pos, data }) => ({ id, pos, data }))
}

/** A position between the items already occupying `index`. Equal positions stay distinct by id. */
export function positionAt(items: Pick<ListItem, "pos">[], index: number): string {
  const lower: string | null = items[index - 1]?.pos ?? null
  let upper: string | null = items[index]?.pos ?? null
  if (lower !== null && upper !== null && upper <= lower) {
    upper = items.slice(index).find((item) => item.pos > lower)?.pos ?? null
  }
  return generateKeyBetween(lower, upper)
}
