import type { JSONValue } from "@shared/sync/doc"

export type ShellMessage =
  | { type: "ready" }
  | { type: "keys"; values: Record<string, JSONValue> }
  | { type: "peers"; peers: { focus: string; color: string }[] }

export function shellMessage(value: unknown): ShellMessage | null {
  if (!isRecord(value) || value.source !== "shell") return null
  switch (value.type) {
    case "ready":
      return { type: "ready" }
    case "keys": {
      const values = jsonObject(value.values)
      return values && { type: "keys", values }
    }
    case "peers":
      return Array.isArray(value.peers) && value.peers.every(isPeer) ? { type: "peers", peers: value.peers } : null
    default:
      return null
  }
}

function isPeer(value: unknown): value is { focus: string; color: string } {
  return isRecord(value) && typeof value.focus === "string" && typeof value.color === "string"
}

function jsonObject(value: unknown): Record<string, JSONValue> | null {
  if (!isRecord(value)) return null
  const out: Record<string, JSONValue> = {}
  for (const [key, item] of Object.entries(value)) {
    if (!isJSONValue(item)) return null
    out[key] = item
  }
  return out
}

function isJSONValue(value: unknown): value is JSONValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isJSONValue)
  return jsonObject(value) !== null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
