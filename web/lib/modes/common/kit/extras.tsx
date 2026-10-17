"use client"

import type { ReactNode } from "react"
import { cn } from "cn"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { swatchColors, type SwatchColor } from "./colors"
import { Text } from "./type"

export type { SwatchColor } from "./colors"

const swatchClass: Record<SwatchColor, string> = {
  gray: "bg-muted-foreground",
  purple: "bg-chart-4",
  green: "bg-chart-2",
  yellow: "bg-chart-3",
  cyan: "bg-chart-5",
  pink: "bg-chart-4",
  blue: "bg-chart-1",
  orange: "bg-chart-5",
  red: "bg-destructive",
}

export function Swatch({ color, className }: { color: SwatchColor; className?: string }) {
  return <span className={cn("inline-block size-6 shrink-0 rounded-sm", swatchClass[color], className)} />
}

export type UsageBarSegment = { readonly id: string; readonly value: number; readonly color?: SwatchColor }

export function UsageBar({ segments, total, topLeftLabel, topRightLabel, className }: { readonly segments: readonly UsageBarSegment[]; readonly total: number; readonly topLeftLabel?: ReactNode; readonly topRightLabel?: ReactNode; readonly className?: string }) {
  const safeTotal = total > 0 ? total : 1
  const used = segments.reduce((sum, segment) => sum + (Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0), 0)
  const remainder = Math.max(0, safeTotal - used)
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(topLeftLabel || topRightLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{topLeftLabel}</span>
          <span>{topRightLabel}</span>
        </div>
      )}
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {segments.map((segment, index) => {
          const value = Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0
          const color = swatchClass[segment.color ?? swatchColors[index % swatchColors.length]]
          return <span key={segment.id} className={color} style={{ width: `${(value / safeTotal) * 100}%` }} />
        })}
        <span style={{ width: `${(remainder / safeTotal) * 100}%` }} />
      </div>
    </div>
  )
}

export function CollapsibleSection({ title, count, trailing, children, defaultOpen = false, className }: { title: string; count?: number; trailing?: ReactNode; children?: ReactNode; defaultOpen?: boolean; className?: string }) {
  return (
    <Accordion defaultValue={defaultOpen ? ["section"] : []} className={className}>
      <AccordionItem value="section">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            {title}
            {count !== undefined ? <span className="text-muted-foreground">{count}</span> : null}
          </span>
          {trailing ? <span className="text-muted-foreground">{trailing}</span> : null}
        </AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function DiffStats({ additions = 0, deletions = 0, className }: { additions?: number; deletions?: number; className?: string }) {
  if (!additions && !deletions) return null
  return (
    <span className={cn("inline-flex gap-1.5 text-xs tabular-nums", className)}>
      {additions > 0 && <span className="text-chart-2">+{additions}</span>}
      {deletions > 0 && <span className="text-destructive">-{deletions}</span>}
    </span>
  )
}

export type DiffLineType = "added" | "removed" | "unchanged"
export type DiffLineData = { type: DiffLineType; content: string; lineNumber?: number }

export function DiffView({ lines, path, language, showLineNumbers = true, className }: { lines: DiffLineData[]; path?: string; language?: string; showLineNumbers?: boolean; className?: string }) {
  const lang = language ?? languageFromPath(path)
  return (
    <div className={cn("font-mono text-xs leading-[18px] text-foreground", className)}>
      {lines.map((line, index) => (
        <div key={index} className={cn("flex", line.type === "added" && "bg-chart-2/15", line.type === "removed" && "bg-destructive/15")}>
          <span className={cn("w-0.5 shrink-0", line.type === "added" && "bg-chart-2", line.type === "removed" && "bg-destructive")} />
          {showLineNumbers && <span className="w-9 shrink-0 pr-2 text-right text-muted-foreground">{line.lineNumber ?? ""}</span>}
          <span className="pr-2 whitespace-pre">{highlight(line.content, lang)}</span>
        </div>
      ))}
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

export function TodoList({ todos, dimmedTodoIds, onTodoClick, className }: { todos?: readonly TodoItem[] | null; dimmedTodoIds?: ReadonlySet<string>; onTodoClick?: (todo: TodoItem) => void; className?: string }) {
  const items = todos ?? []
  if (items.length === 0) return null
  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((todo) => {
        const status = todoStatus(todo)
        return (
          <button key={todo.id} type="button" onClick={() => onTodoClick?.(todo)} className={cn("flex items-start gap-2 py-1 text-left text-foreground", onTodoClick ? "cursor-pointer" : "cursor-default", dimmedTodoIds?.has(todo.id) && "opacity-45")}>
            <TodoMark status={status} />
            <Text className={status === "cancelled" ? "line-through" : undefined}>{todoText(todo)}</Text>
          </button>
        )
      })}
    </div>
  )
}

export function TodoListCard({ todos, dimmedTodoIds, defaultExpanded = false, onTodoClick, className }: { todos?: readonly TodoItem[] | null; dimmedTodoIds?: ReadonlySet<string>; defaultExpanded?: boolean; onTodoClick?: (todo: TodoItem) => void; className?: string }) {
  const items = todos ?? []
  if (items.length === 0) return null
  const done = items.filter((todo) => todoStatus(todo) === "completed").length
  return (
    <CollapsibleSection title={`${done} of ${items.length} done`} defaultOpen={defaultExpanded} className={className}>
      <TodoList todos={items} dimmedTodoIds={dimmedTodoIds} onTodoClick={onTodoClick} />
    </CollapsibleSection>
  )
}

function TodoMark({ status }: { status: TodoStatus }) {
  return (
    <span
      className={cn(
        "mt-1 size-3 shrink-0 rounded-full border",
        status === "completed" && "border-chart-2 bg-chart-2",
        status === "cancelled" && "border-muted-foreground/40",
        status === "in_progress" && "border-primary",
        status === "pending" && "border-muted-foreground",
      )}
    />
  )
}

function languageFromPath(path?: string) {
  const extension = path?.split(".").pop()?.toLowerCase()
  if (extension === "ts" || extension === "tsx") return "typescript"
  if (extension === "js" || extension === "jsx") return "javascript"
  if (extension === "py") return "python"
  return extension
}

function highlight(content: string, language: string | undefined): ReactNode {
  if (!language || !/typescript|javascript|python|tsx|ts|js|py/.test(language)) return content
  const parts = content.split(/(\/\/.*$|#.*$|"[^"]*"|'[^']*'|\b\d+\b|\b(?:const|let|var|function|return|if|else|import|export|from|class|def)\b)/)
  return parts.map((part, index) => {
    const colored = part.startsWith("//") || part.startsWith("#") || part.startsWith("\"") || part.startsWith("'") || /^(const|let|var|function|return|if|else|import|export|from|class|def)$/.test(part)
    return colored ? <span key={index} className="text-primary">{part}</span> : <span key={index}>{part}</span>
  })
}
