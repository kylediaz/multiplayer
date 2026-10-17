"use client"

import { createContext, useContext, type ReactNode } from "react"
import { cn } from "cn"

const TextNest = createContext(false)

export type TextTone = "primary" | "secondary" | "muted"
export type TextWeight = "normal" | "medium" | "semibold" | "bold"

const toneClass: Record<TextTone, string> = {
  primary: "text-foreground",
  secondary: "text-muted-foreground",
  muted: "text-muted-foreground/70",
}
const weightClass: Record<TextWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
}

export type TextProps = {
  children?: ReactNode
  tone?: TextTone
  size?: "body" | "small"
  as?: "p" | "span"
  weight?: TextWeight
  italic?: boolean
  truncate?: boolean | "start" | "end"
  className?: string
}

export function Text({ children, tone = "primary", size = "body", as, weight = "normal", italic, truncate, className }: TextProps) {
  const nested = useContext(TextNest)
  const Tag = as ?? (nested ? "span" : "p")
  return (
    <TextNest.Provider value={true}>
      <Tag
        className={cn(
          "m-0",
          size === "small" ? "text-xs leading-4" : "text-sm leading-5",
          toneClass[tone],
          weightClass[weight],
          italic && "italic",
          truncate && "truncate",
          truncate === "start" && "text-left [direction:rtl]",
          className,
        )}
      >
        {inline(children)}
      </Tag>
    </TextNest.Provider>
  )
}

function inline(children: ReactNode): ReactNode {
  if (typeof children === "string") return parseInline(children)
  if (Array.isArray(children)) return children.map((child, index) => (typeof child === "string" ? <span key={index}>{parseInline(child)}</span> : child))
  return children
}

function parseInline(value: string): ReactNode[] {
  const parts: ReactNode[] = []
  const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  let cursor = 0
  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > cursor) parts.push(value.slice(cursor, start))
    if (match[1]) parts.push(<Code key={start}>{match[1]}</Code>)
    else parts.push(<Link key={start} href={match[3]}>{match[2]}</Link>)
    cursor = start + match[0].length
  }
  if (cursor < value.length) parts.push(value.slice(cursor))
  return parts
}

export function H1({ children, className }: { children?: ReactNode; className?: string }) {
  return <h1 className={cn("font-heading text-2xl font-semibold tracking-tight text-foreground", className)}>{children}</h1>
}

export function H2({ children, className }: { children?: ReactNode; className?: string }) {
  return <h2 className={cn("font-heading text-lg font-semibold text-foreground", className)}>{children}</h2>
}

export function H3({ children, className }: { children?: ReactNode; className?: string }) {
  return <h3 className={cn("font-heading text-base font-semibold text-foreground", className)}>{children}</h3>
}

export function Code({ children, className }: { children?: ReactNode; className?: string }) {
  return <code className={cn("rounded bg-muted px-1 py-px font-mono text-[0.92em] text-foreground", className)}>{children}</code>
}

export function Link({ children, href, className }: { children?: ReactNode; href: string; className?: string }) {
  return (
    <a href={href} className={cn("text-primary underline", className)}>
      {children}
    </a>
  )
}
