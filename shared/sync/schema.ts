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

type KeyDef = RegisterDef | TextDef

export type Schema = { keys: Record<string, KeyDef> }

export type ResolvedKey = { kind: "register"; def: RegisterDef } | { kind: "text"; def: TextDef }

const JSON_CAP = 8192

const isObject = (v: unknown): v is Record<string, JSONValue> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

export function resolveKey(schema: Schema, key: string): ResolvedKey | null {
  const direct = schema.keys[key]
  if (!direct) return null
  if (direct.kind === "text") return { kind: "text", def: direct }
  return { kind: "register", def: direct }
}

export function parseSchema(value: unknown): Schema {
  if (!isObject(value) || !isObject(value.keys)) throw new Error("schema.keys is required")
  const keys: Record<string, KeyDef> = {}
  for (const [key, def] of Object.entries(value.keys)) {
    if (!/^[A-Za-z0-9_:-]{1,64}$/.test(key)) throw new Error(`invalid key ${key}`)
    keys[key] = parseKey(def, key)
  }
  return { keys }
}

function parseKey(value: unknown, key: string): KeyDef {
  if (!isObject(value) || typeof value.kind !== "string") throw new Error(`invalid definition for ${key}`)
  if (value.kind === "text") return { kind: "text", maxLength: optionalNumber(value.maxLength) }
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
 * the current string throws, and the room fails the whole batch.
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

  return null
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
