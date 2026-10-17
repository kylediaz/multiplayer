"use client"

import { useSyncExternalStore, type ComponentProps, type FocusEvent, type ReactNode } from "react"
import { Checkbox as CheckboxBase, Select as SelectBase, TextArea as TextAreaBase, TextInput as TextInputBase, Toggle as ToggleBase } from "./kit"
import { cn } from "@/lib/utils"
import { shellMessage } from "@/lib/shell-messages"

export {
  BarChart,
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  CollapsibleSection,
  computeDAGLayout,
  DiffStats,
  DiffView,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  IconButton,
  LineChart,
  Link,
  mergeStyle,
  PieChart,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Swatch,
  Table,
  Text,
  TodoList,
  TodoListCard,
  UsageBar,
  useHostTheme,
} from "./kit"

type Host = {
  post(message: Record<string, unknown>): void
  onMessage(callback: (message: unknown) => void): void
}

let remoteFocus: Record<string, string> = {}
const focusListeners = new Set<() => void>()

function viewHost(): Host | null {
  if (typeof window === "undefined") return null
  const host = (window as Window & { host?: Host }).host
  return host ?? null
}

const bridge = viewHost()
if (bridge) {
  bridge.onMessage((message) => {
    const parsed = shellMessage(message)
    if (!parsed || parsed.type !== "peers") return
    const next: Record<string, string> = {}
    for (const peer of parsed.peers) {
      if (next[peer.focus]) continue
      next[peer.focus] = peer.color
    }
    remoteFocus = next
    for (const listener of focusListeners) listener()
  })
}

function subscribeFocus(listener: () => void) {
  focusListeners.add(listener)
  return () => focusListeners.delete(listener)
}

function useRemoteFocus(field: string | undefined): string | null {
  const focuses = useSyncExternalStore(subscribeFocus, () => remoteFocus, () => remoteFocus)
  return field ? focuses[field] ?? null : null
}

function reportFocus(field: string | null) {
  viewHost()?.post({ type: "presence", presence: { focus: field } })
}

function FieldFocus({ field, className, children }: { field?: string; className?: string; children: ReactNode }) {
  const color = useRemoteFocus(field)
  if (!field) return children
  return (
    <div
      className={cn("relative", className)}
      style={{ outline: `2px solid ${color ?? "transparent"}`, outlineOffset: 4 }}
      onFocus={() => reportFocus(field)}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        reportFocus(null)
      }}
    >
      {children}
    </div>
  )
}

export function TextInput({ field, ...props }: ComponentProps<typeof TextInputBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-full">
      <TextInputBase {...props} />
    </FieldFocus>
  )
}

export function TextArea({ field, ...props }: ComponentProps<typeof TextAreaBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-full">
      <TextAreaBase {...props} />
    </FieldFocus>
  )
}

export function Checkbox({ field, ...props }: ComponentProps<typeof CheckboxBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-fit">
      <CheckboxBase {...props} />
    </FieldFocus>
  )
}

export function Toggle({ field, ...props }: ComponentProps<typeof ToggleBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-fit">
      <ToggleBase {...props} />
    </FieldFocus>
  )
}

export function Select({ field, ...props }: ComponentProps<typeof SelectBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-full">
      <SelectBase {...props} />
    </FieldFocus>
  )
}
