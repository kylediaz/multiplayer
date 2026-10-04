import { apply as applyText, type TextOp } from "./text-ot"

export type JSONValue =
  | null
  | boolean
  | number
  | string
  | JSONValue[]
  | { [key: string]: JSONValue }

export type ListItem = {
  id: string
  pos: string
  deleted: boolean
  data: Record<string, JSONValue>
}

export type ListRecord = Record<string, ListItem>

/** The editable state of a document. Keys come from the document schema. */
export type DocState = {
  registers: Record<string, JSONValue>
  texts: Record<string, string>
  lists: Record<string, ListRecord>
}

export type ListOp =
  | { t: "list.insert"; key: string; id: string; pos: string; data: Record<string, JSONValue> }
  | { t: "list.delete"; key: string; id: string }
  | { t: "list.restore"; key: string; id: string }
  | { t: "list.move"; key: string; id: string; pos: string }
  | { t: "list.update"; key: string; id: string; patch: Record<string, JSONValue> }

export type Op = { t: "set"; key: string; value: JSONValue } | { t: "text"; key: string; op: TextOp } | ListOp

export function emptyState(): DocState {
  return { registers: {}, texts: {}, lists: {} }
}

export function cloneState(state: DocState): DocState {
  return structuredClone(state)
}

/** Mutates `state`. */
export function applyOp(state: DocState, op: Op): void {
  switch (op.t) {
    case "set":
      state.registers[op.key] = op.value
      return
    case "text":
      state.texts[op.key] = applyText(op.op, state.texts[op.key] ?? "")
      return
    default: {
      const list = (state.lists[op.key] ??= {})
      applyListOp(list, op)
    }
  }
}

export function applyListOp(list: ListRecord, op: ListOp): void {
  switch (op.t) {
    case "list.insert":
      if (!list[op.id]) list[op.id] = { id: op.id, pos: op.pos, deleted: false, data: { ...op.data } }
      return
    case "list.delete":
      if (list[op.id]) list[op.id] = { ...list[op.id], deleted: true }
      return
    case "list.restore":
      if (list[op.id]) list[op.id] = { ...list[op.id], deleted: false }
      return
    case "list.move":
      if (list[op.id]) list[op.id] = { ...list[op.id], pos: op.pos }
      return
    case "list.update":
      if (list[op.id]) list[op.id] = { ...list[op.id], data: { ...list[op.id].data, ...op.patch } }
      return
  }
}

export class TextMismatchError extends Error {}
