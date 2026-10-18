"use client"

import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic"

const names = new Set<string>(iconNames)

function iconName(value: unknown): IconName | null {
  if (typeof value !== "string") return null
  const name = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
  return names.has(name) ? (name as IconName) : null
}

export function Glyph({ name, size = 18, className }: { name: unknown; size?: number; className?: string }) {
  const icon = iconName(name)
  if (!icon) return null
  return (
    <DynamicIcon
      name={icon}
      size={size}
      strokeWidth={1.8}
      aria-hidden
      className={className}
      fallback={() => <span className={className} style={{ display: "inline-block", width: size, height: size, flex: "none" }} />}
    />
  )
}

const badgeTones = ["bg-primary", "bg-foreground", "bg-destructive", "bg-muted-foreground"]

export function IconBadge({ name }: { name: string }) {
  const tone = badgeTones[hash(name) % badgeTones.length]
  return (
    <span className={`flex size-7 shrink-0 items-center justify-center rounded-md text-background ${tone}`}>
      <Glyph name={name} size={15} />
    </span>
  )
}

function hash(name: string): number {
  let value = 0
  for (let index = 0; index < name.length; index++) value = (value * 31 + name.charCodeAt(index)) | 0
  return Math.abs(value)
}
