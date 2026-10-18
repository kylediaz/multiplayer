import { tagSchemaId } from "@openuidev/react-lang"
import { z } from "zod"

const UNSAFE_CSS = /(url|image|image-set|cross-fade|element|expression|paint|var|attr|env)\s*\(|@import|[\\;{}<>]/i

function protocolOf(value: string): string | null {
  try {
    return new URL(value.trim()).protocol
  } catch {
    return null
  }
}

export function webUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  const protocol = protocolOf(value)
  return protocol === "http:" || protocol === "https:" ? value.trim() : null
}

export const color = z.string()
tagSchemaId(color, "Color")

export const length = z.union([z.number(), z.string()])
tagSchemaId(length, "Length")

const FOREGROUND: Record<string, string> = {
  ink: "var(--foreground)",
  muted: "var(--muted-foreground)",
  faint: "var(--muted-foreground)",
  canvas: "var(--background)",
  surface: "var(--muted)",
  info: "var(--primary)",
  success: "var(--foreground)",
  warning: "var(--muted-foreground)",
  danger: "var(--destructive)",
  purple: "var(--chart-3)",
  pink: "var(--chart-4)",
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
  chart6: "var(--foreground)",
}

function cssValue(value: unknown) {
  return typeof value === "string" && value.trim() && !UNSAFE_CSS.test(value) ? value.trim() : undefined
}

export const fg = (value: unknown) => (typeof value === "string" ? (FOREGROUND[value] ?? cssValue(value)) : undefined)

export function size(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.max(0, value)}px`
  if (typeof value !== "string") return undefined
  if (/^\d+(\.\d+)?$/.test(value.trim())) return `${value.trim()}px`
  return /^\d+(\.\d+)?(px|%|em|rem|vh|vw|fr)$|^auto$/.test(value.trim()) ? value.trim() : undefined
}

export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ") || undefined
