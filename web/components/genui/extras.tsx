"use client"

import { useState, type CSSProperties, type JSX, type ReactNode } from "react"
import { CanvasChevron, Card, CardBody, CardHeader, Text, mergeStyle } from "./primitives"
import { canvasTypography, useHostTheme, usageColorSequence, type Color } from "./theme"

export function Swatch({ color, style }: { color: Color; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  return <span style={mergeStyle({ display: "inline-block", width: 24, height: 24, borderRadius: 4, background: theme.category[color], flexShrink: 0 }, style)} />
}

export type UsageBarSegment = { readonly id: string; readonly value: number; readonly color?: Color }
export function UsageBar({ segments, total, topLeftLabel, topRightLabel, style }: { readonly segments: readonly UsageBarSegment[]; readonly total: number; readonly topLeftLabel?: ReactNode; readonly topRightLabel?: ReactNode; readonly style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  const safeTotal = total > 0 ? total : 1
  const used = segments.reduce((sum, segment) => sum + (Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0), 0)
  const remainder = Math.max(0, safeTotal - used)
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap: 6 }, style)}>
      {(topLeftLabel || topRightLabel) && (
        <div style={{ display: "flex", justifyContent: "space-between", ...canvasTypography.small, color: theme.text.tertiary }}>
          <span>{topLeftLabel}</span>
          <span>{topRightLabel}</span>
        </div>
      )}
      <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", background: theme.fill.tertiary }}>
        {segments.map((segment, index) => {
          const value = Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0
          const color = theme.category[segment.color ?? usageColorSequence[index % usageColorSequence.length]]
          return <span key={segment.id} style={{ width: `${(value / safeTotal) * 100}%`, background: color }} />
        })}
        <span style={{ width: `${(remainder / safeTotal) * 100}%` }} />
      </div>
    </div>
  )
}

export function CollapsibleSection({ title, leading, count, trailing, children, defaultOpen = false, style }: { title: string; leading?: ReactNode; count?: number; trailing?: ReactNode; children?: ReactNode; defaultOpen?: boolean; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={mergeStyle({ color: theme.text.primary }, style)}>
      <button type="button" onClick={() => setOpen((value) => !value)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", color: "inherit", padding: "4px 0", cursor: "pointer", textAlign: "left" }}>
        <CanvasChevron expanded={open} />
        {leading}
        <span style={{ ...canvasTypography.body }}>{title}</span>
        {count !== undefined && <span style={{ ...canvasTypography.small, color: theme.text.tertiary }}>{count}</span>}
        {trailing && <span style={{ marginLeft: "auto", color: theme.text.tertiary }}>{trailing}</span>}
      </button>
      {open && <div style={{ paddingLeft: 20 }}>{children}</div>}
    </div>
  )
}

export function DiffStats({ additions = 0, deletions = 0, style }: { additions?: number; deletions?: number; style?: CSSProperties }): JSX.Element | null {
  const theme = useHostTheme()
  if (!additions && !deletions) return null
  return (
    <span style={mergeStyle({ ...canvasTypography.small, fontVariantNumeric: "tabular-nums", display: "inline-flex", gap: 6 }, style)}>
      {additions > 0 && <span style={{ color: theme.diff.stripAdded }}>+{additions}</span>}
      {deletions > 0 && <span style={{ color: theme.diff.stripRemoved }}>-{deletions}</span>}
    </span>
  )
}

export type DiffLineType = "added" | "removed" | "unchanged"
export type DiffLineData = { type: DiffLineType; content: string; lineNumber?: number }
export function DiffView({ lines, path, language, showLineNumbers = true, coloredLineNumbers = true, showAccentStrip = true, style }: { lines: DiffLineData[]; path?: string; language?: string; showLineNumbers?: boolean; coloredLineNumbers?: boolean; showAccentStrip?: boolean; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  const lang = language ?? languageFromPath(path)
  return (
    <div style={mergeStyle({ fontFamily: "var(--font-geist-mono), ui-monospace, monospace", fontSize: 12, lineHeight: "18px", color: theme.text.primary }, style)}>
      {lines.map((line, index) => {
        const background = line.type === "added" ? theme.diff.insertedLine : line.type === "removed" ? theme.diff.removedLine : "transparent"
        const strip = line.type === "added" ? theme.diff.stripAdded : line.type === "removed" ? theme.diff.stripRemoved : "transparent"
        const numberColor = coloredLineNumbers && line.type !== "unchanged" ? strip : theme.text.quaternary
        return (
          <div key={index} style={{ display: "flex", background }}>
            {showAccentStrip && <span style={{ width: 3, background: strip, flexShrink: 0 }} />}
            {showLineNumbers && <span style={{ width: 36, textAlign: "right", paddingRight: 8, color: numberColor, flexShrink: 0 }}>{line.lineNumber ?? ""}</span>}
            <span style={{ whiteSpace: "pre", paddingRight: 8 }}>{highlight(line.content, lang, theme.text.link)}</span>
          </div>
        )
      })}
    </div>
  )
}

export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled"
export type TodoItem = {
  readonly id: string
  readonly content?: string | null
  readonly status?: TodoStatus | null
  readonly data?: Readonly<Record<string, unknown>> | null
}

const STATUSES: readonly TodoStatus[] = ["pending", "in_progress", "completed", "cancelled"]

function isStatus(value: unknown): value is TodoStatus {
  return typeof value === "string" && STATUSES.includes(value as TodoStatus)
}

function todoText(todo: TodoItem): string {
  if (typeof todo.content === "string") return todo.content
  const data = todo.data
  if (!data) return ""
  for (const key of ["content", "title", "text", "name"]) {
    const value = data[key]
    if (typeof value === "string") return value
  }
  return ""
}

function todoStatus(todo: TodoItem): TodoStatus {
  if (isStatus(todo.status)) return todo.status
  const data = todo.data
  if (!data) return "pending"
  if (isStatus(data.status)) return data.status
  if (data.done === true) return "completed"
  return "pending"
}

export function TodoList({ todos, dimmedTodoIds, onTodoClick, style }: { todos?: readonly TodoItem[] | null; dimmedTodoIds?: ReadonlySet<string>; onTodoClick?: (todo: TodoItem) => void; style?: CSSProperties }): JSX.Element | null {
  const theme = useHostTheme()
  const items = todos ?? []
  if (items.length === 0) return null
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column" }, style)}>
      {items.map((todo) => {
        const status = todoStatus(todo)
        return (
          <button key={todo.id} type="button" onClick={() => onTodoClick?.(todo)} style={{ display: "flex", gap: 8, alignItems: "flex-start", textAlign: "left", background: "transparent", border: "none", color: theme.text.primary, padding: "4px 0", cursor: onTodoClick ? "pointer" : "default", opacity: dimmedTodoIds?.has(todo.id) ? 0.45 : 1 }}>
            <TodoMark status={status} />
            <Text style={{ textDecoration: status === "cancelled" ? "line-through" : "none" }}>{todoText(todo)}</Text>
          </button>
        )
      })}
    </div>
  )
}

export function TodoListCard({ todos, dimmedTodoIds, defaultExpanded = false, onTodoClick, style }: { todos?: readonly TodoItem[] | null; dimmedTodoIds?: ReadonlySet<string>; defaultExpanded?: boolean; onTodoClick?: (todo: TodoItem) => void; style?: CSSProperties }): JSX.Element | null {
  const items = todos ?? []
  if (items.length === 0) return null
  const done = items.filter((todo) => todoStatus(todo) === "completed").length
  return (
    <Card collapsible defaultOpen={defaultExpanded} style={style}>
      <CardHeader>{done} of {items.length} Done</CardHeader>
      <CardBody>
        <TodoList todos={items} dimmedTodoIds={dimmedTodoIds} onTodoClick={onTodoClick} />
      </CardBody>
    </Card>
  )
}

function TodoMark({ status }: { status: TodoStatus }) {
  const theme = useHostTheme()
  const color = status === "completed" ? theme.diff.stripAdded : status === "cancelled" ? theme.text.quaternary : status === "in_progress" ? theme.accent.primary : theme.text.tertiary
  return <span style={{ width: 12, height: 12, marginTop: 4, borderRadius: 99, border: `1.5px solid ${color}`, background: status === "completed" ? color : "transparent", flexShrink: 0 }} />
}

function languageFromPath(path?: string) {
  const extension = path?.split(".").pop()?.toLowerCase()
  if (extension === "ts" || extension === "tsx") return "typescript"
  if (extension === "js" || extension === "jsx") return "javascript"
  if (extension === "py") return "python"
  return extension
}

function highlight(content: string, language: string | undefined, link: string): ReactNode {
  if (!language || !/typescript|javascript|python|tsx|ts|js|py/.test(language)) return content
  const parts = content.split(/(\/\/.*$|#.*$|"[^"]*"|'[^']*'|\b\d+\b|\b(?:const|let|var|function|return|if|else|import|export|from|class|def)\b)/)
  return parts.map((part, index) => {
    const colored = part.startsWith("//") || part.startsWith("#") || part.startsWith("\"") || part.startsWith("'") || /^(const|let|var|function|return|if|else|import|export|from|class|def)$/.test(part)
    return colored ? <span key={index} style={{ color: link }}>{part}</span> : <span key={index}>{part}</span>
  })
}
