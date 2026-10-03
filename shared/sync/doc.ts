import { apply as applyText, type TextOp } from "./text-ot"

export type JSONValue =
  | null
  | boolean
  | number
  | string
  | JSONValue[]
  | { [key: string]: JSONValue }

/** The editable state of a document. Keys come from the document schema. */
export type DocState = {
  registers: Record<string, JSONValue>
  texts: Record<string, string>
}

export type Op =
  | { t: "set"; key: string; value: JSONValue }
  | { t: "text"; key: string; op: TextOp }

export function emptyState(): DocState {
  return { registers: {}, texts: {} }
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
  }
}

export class TextMismatchError extends Error {}
