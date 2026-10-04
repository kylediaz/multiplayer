import { TextMismatchError, type DocState, type JSONValue, type Op } from "./doc"
import { apply as applyText, baseLength } from "./text-ot"

type RegisterDef = {
  kind: "register"
  value: "boolean" | "string" | "number" | "json"
  enum?: string[]
  maxLength?: number
  min?: number
  max?: number
  step?: number
  maxBytes?: number
}

type TextDef = { kind: "text"; maxLength?: number }

type FieldDef = RegisterDef | TextDef

type ListDef = { kind: "list"; fields: Record<string, FieldDef> }

type KeyDef = RegisterDef | TextDef | ListDef

export type Schema = { keys: Record<string, KeyDef> }

export type ResolvedKey =
  | { kind: "register"; def: RegisterDef }
  | { kind: "text"; def: TextDef }
  | { kind: "list"; def: ListDef }

const JSON_CAP = 8192

const isObject = (v: unknown): v is Record<string, JSONValue> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const KEY = /^[A-Za-z0-9_:-]{1,64}$/

export function resolveKey(schema: Schema, key: string): ResolvedKey | null {
  const direct = schema.keys[key]
  if (direct) return asResolved(direct)
  const parts = key.split("/")
  if (parts.length !== 3) return null
  const [listId, itemId, fieldId] = parts
  if (!listId || !itemId || !fieldId) return null
  const list = schema.keys[listId]
  if (!list || list.kind !== "list") return null
  const field = list.fields[fieldId]
  return field ? asResolved(field) : null
}

function asResolved(def: KeyDef): ResolvedKey {
  if (def.kind === "list") return { kind: "list", def }
  if (def.kind === "text") return { kind: "text", def }
  return { kind: "register", def }
}

export function parseSchema(value: unknown): Schema {
  if (!isObject(value) || !isObject(value.keys)) throw new Error("schema.keys is required")
  const keys: Record<string, KeyDef> = {}
  for (const [key, def] of Object.entries(value.keys)) {
    if (!KEY.test(key)) throw new Error(`invalid key ${key}`)
    keys[key] = parseKey(def, key)
  }
  return { keys }
}

function parseKey(value: unknown, key: string): KeyDef {
  if (!isObject(value) || typeof value.kind !== "string") throw new Error(`invalid definition for ${key}`)
  if (value.kind === "text") return { kind: "text", maxLength: optionalNumber(value.maxLength) }
  if (value.kind === "list") {
    if (!isObject(value.fields)) throw new Error(`list ${key} needs fields`)
    const fields: Record<string, FieldDef> = {}
    for (const [field, def] of Object.entries(value.fields)) {
      if (!KEY.test(field)) throw new Error(`invalid key ${key}.${field}`)
      const parsed = parseKey(def, `${key}.${field}`)
      if (parsed.kind === "list") throw new Error(`nested lists are not allowed (${key}.${field})`)
      fields[field] = parsed
    }
    return { kind: "list", fields }
  }
  if (value.kind !== "register" || typeof value.value !== "string") throw new Error(`invalid register ${key}`)
  if (!["boolean", "string", "number", "json"].includes(value.value)) throw new Error(`invalid register value for ${key}`)
  return {
    kind: "register",
    value: value.value as RegisterDef["value"],
    enum: Array.isArray(value.enum) ? value.enum.filter((item): item is string => typeof item === "string") : undefined,
    maxLength: optionalNumber(value.maxLength),
    min: optionalNumber(value.min),
    max: optionalNumber(value.max),
    step: optionalNumber(value.step),
    maxBytes: optionalNumber(value.maxBytes),
  }
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

/**
 * Returns the op to store, or null to drop it. A text op that does not fit
 * the current string throws, and the document rejects the whole batch.
 */
export function validateSchemaOp(schema: Schema, state: DocState, op: Op): Op | null {
  const resolved = resolveKey(schema, op.key)
  if (!resolved) return null

  if (op.t === "set") {
    if (resolved.kind !== "register") return null
    const value = canonicalRegister(resolved.def, op.value)
    return value === undefined ? null : { ...op, value }
  }

  if (op.t === "text") {
    if (resolved.kind !== "text" || !Array.isArray(op.op)) return null
    const current = state.texts[op.key] ?? ""
    if (baseLength(op.op) > current.length) {
      throw new TextMismatchError(`text op on ${op.key} does not fit the document`)
    }
    if (resolved.def.maxLength !== undefined && applyText(op.op, current).length > resolved.def.maxLength) return null
    return op
  }

  if (resolved.kind !== "list") return null
  if (typeof op.id !== "string" || op.id.length === 0 || op.id.length > 64) return null
  switch (op.t) {
    case "list.insert": {
      if (typeof op.pos !== "string" || op.pos.length > 256) return null
      const data = canonicalListData(resolved.def, op.data)
      return data && { ...op, data }
    }
    case "list.move":
      if (typeof op.pos !== "string" || op.pos.length > 256) return null
      return op
    case "list.update": {
      const patch = canonicalListData(resolved.def, op.patch)
      return patch && Object.keys(patch).length ? { ...op, patch } : null
    }
    case "list.delete":
    case "list.restore":
      return op
  }
}

function canonicalRegister(def: RegisterDef, value: JSONValue): JSONValue | undefined {
  if (value === null) return null
  switch (def.value) {
    case "boolean":
      return typeof value === "boolean" ? value : undefined
    case "string": {
      if (typeof value !== "string") return undefined
      if (def.maxLength !== undefined && value.length > def.maxLength) return undefined
      if (def.enum && !def.enum.includes(value)) return undefined
      return value
    }
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) return undefined
      let next = value
      if (def.min !== undefined && def.step !== undefined && def.step > 0) {
        next = Math.round((next - def.min) / def.step) * def.step + def.min
      }
      if (def.min !== undefined) next = Math.max(def.min, next)
      if (def.max !== undefined) next = Math.min(def.max, next)
      return next
    }
    case "json": {
      const cap = def.maxBytes ?? JSON_CAP
      if (JSON.stringify(value).length > cap) return undefined
      return value
    }
  }
}

function canonicalListData(def: ListDef, value: unknown): Record<string, JSONValue> | null {
  if (!isObject(value)) return null
  if (Object.keys(def.fields).length === 0) {
    if (JSON.stringify(value).length > JSON_CAP) return null
    return { ...value }
  }
  const out: Record<string, JSONValue> = {}
  for (const [key, item] of Object.entries(value)) {
    const field = def.fields[key]
    if (!field) continue
    if (field.kind === "text") {
      if (typeof item === "string" && (field.maxLength === undefined || item.length <= field.maxLength)) out[key] = item
      continue
    }
    const canonical = canonicalRegister(field, item)
    if (canonical !== undefined) out[key] = canonical
  }
  return out
}
