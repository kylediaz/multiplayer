"use client"

import { createContext, useContext, useState, type CSSProperties, type JSX, type ReactNode } from "react"
import { canvasTypography, toneColor, useHostTheme } from "./theme"

export function mergeStyle(base: CSSProperties, override?: CSSProperties): CSSProperties {
  return override ? { ...base, ...override } : base
}

const font = { fontFamily: canvasTypography.fontFamily, color: "inherit" }

export type StackProps = { children?: ReactNode; gap?: number; style?: CSSProperties }
export function Stack({ children, gap = 0, style }: StackProps): JSX.Element {
  return <div style={mergeStyle({ display: "flex", flexDirection: "column", gap }, style)}>{children}</div>
}

export type RowProps = {
  children?: ReactNode
  gap?: number
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "space-between"
  wrap?: boolean
  style?: CSSProperties
}
export function Row({ children, gap = 0, align = "center", justify = "start", wrap, style }: RowProps): JSX.Element {
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "row", gap, alignItems: align, justifyContent: justify, flexWrap: wrap ? "wrap" : "nowrap" }, style)}>
      {children}
    </div>
  )
}

export type GridProps = {
  children?: ReactNode
  columns: number | string
  gap?: number
  align?: "start" | "center" | "end" | "stretch"
  style?: CSSProperties
}
export function Grid({ children, columns, gap = 0, align = "stretch", style }: GridProps): JSX.Element {
  const template = typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns
  return <div style={mergeStyle({ display: "grid", gridTemplateColumns: template, gap, alignItems: align }, style)}>{children}</div>
}

export function Divider({ style }: { style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  return <hr style={mergeStyle({ border: 0, borderTop: `1px solid ${theme.stroke.tertiary}`, margin: 0, width: "100%" }, style)} />
}

export function Spacer(): JSX.Element {
  return <div style={{ flex: 1 }} />
}

const TextNest = createContext(false)

export type TextWeight = "normal" | "medium" | "semibold" | "bold"
const weightValue: Record<TextWeight, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 }

export type TextProps = {
  children?: ReactNode
  tone?: "primary" | "secondary" | "tertiary" | "quaternary"
  size?: "body" | "small"
  as?: "p" | "span"
  weight?: TextWeight
  italic?: boolean
  truncate?: boolean | "start" | "end"
  style?: CSSProperties
}

export function Text({ children, tone = "primary", size = "body", as, weight = "normal", italic, truncate, style }: TextProps): JSX.Element {
  const theme = useHostTheme()
  const nested = useContext(TextNest)
  const Tag = as ?? (nested ? "span" : "p")
  const type = size === "small" ? canvasTypography.small : canvasTypography.body
  const color = theme.text[tone]
  return (
    <TextNest.Provider value={true}>
      <Tag
        style={mergeStyle(
          {
            ...font,
            ...type,
            fontWeight: weightValue[weight],
            fontStyle: italic ? "italic" : "normal",
            color,
            margin: 0,
            ...(truncate
              ? {
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  direction: truncate === "start" ? "rtl" : "ltr",
                  textAlign: truncate === "start" ? "left" : undefined,
                }
              : {}),
          },
          style,
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

export function H1({ children, style }: { children?: ReactNode; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  return <h1 style={mergeStyle({ ...font, ...canvasTypography.h1, color: theme.text.primary, margin: 0 }, style)}>{children}</h1>
}

export function H2({ children, style }: { children?: ReactNode; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  return <h2 style={mergeStyle({ ...font, ...canvasTypography.h2, color: theme.text.primary, margin: 0 }, style)}>{children}</h2>
}

export function H3({ children, style }: { children?: ReactNode; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  return <h3 style={mergeStyle({ ...font, ...canvasTypography.h3, color: theme.text.primary, margin: 0 }, style)}>{children}</h3>
}

export function Code({ children, style }: { children?: ReactNode; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  return (
    <code
      style={mergeStyle(
        {
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontSize: "0.92em",
          background: theme.fill.tertiary,
          color: theme.text.primary,
          borderRadius: 4,
          padding: "1px 4px",
        },
        style,
      )}
    >
      {children}
    </code>
  )
}

export function Link({ children, href, style }: { children?: ReactNode; href: string; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  return (
    <a href={href} style={mergeStyle({ color: theme.text.link, textDecoration: "underline" }, style)}>
      {children}
    </a>
  )
}

type CardContextValue = {
  open: boolean
  toggle: () => void
  collapsible: boolean
  size: "base" | "lg"
  stickyHeader: boolean
}
const CardContext = createContext<CardContextValue>({ open: true, toggle: () => {}, collapsible: false, size: "base", stickyHeader: false })

export function CanvasChevron({ expanded }: { expanded: boolean }): JSX.Element {
  return (
    <svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? "rotate(90deg)" : "none", flexShrink: 0 }} aria-hidden>
      <path d="M4.5 2.5 L8 6 L4.5 9.5" stroke="currentColor" strokeWidth={1.2} />
    </svg>
  )
}

export type CardProps = {
  children?: ReactNode
  variant?: "default" | "borderless"
  size?: "base" | "lg"
  stickyHeader?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  style?: CSSProperties
}

export function Card({ children, variant = "default", size = "base", stickyHeader, collapsible, defaultOpen = true, open: openProp, onOpenChange, style }: CardProps): JSX.Element {
  const theme = useHostTheme()
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const open = openProp ?? uncontrolled
  const toggle = () => {
    const next = !open
    if (openProp === undefined) setUncontrolled(next)
    onOpenChange?.(next)
  }
  return (
    <CardContext.Provider value={{ open, toggle, collapsible: Boolean(collapsible), size, stickyHeader: Boolean(stickyHeader) }}>
      <section
        style={mergeStyle(
          {
            background: theme.bg.elevated,
            color: theme.text.primary,
            border: variant === "borderless" ? "none" : `1px solid ${theme.stroke.primary}`,
            borderRadius: variant === "borderless" ? 0 : theme.radius.lg,
            overflow: "hidden",
          },
          style,
        )}
      >
        {children}
      </section>
    </CardContext.Provider>
  )
}

export function CardHeader({ children, trailing, style }: { children?: ReactNode; trailing?: ReactNode; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  const card = useContext(CardContext)
  const height = card.size === "lg" ? 32 : 28
  const content = (
    <>
      {card.collapsible && <CanvasChevron expanded={card.open} />}
      <span style={{ ...canvasTypography.small, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</span>
      {trailing && <span style={{ marginLeft: "auto", color: theme.text.secondary, display: "inline-flex", alignItems: "center" }}>{trailing}</span>}
    </>
  )
  const shared: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minHeight: height,
    padding: card.size === "lg" ? "0 12px" : "0 10px",
    color: theme.text.primary,
    background: theme.bg.elevated,
    borderBottom: card.open ? `1px solid ${theme.stroke.tertiary}` : "none",
    position: card.stickyHeader ? "sticky" : "relative",
    top: 0,
    width: "100%",
  }
  if (!card.collapsible) return <div style={mergeStyle(shared, style)}>{content}</div>
  return (
    <button type="button" onClick={card.toggle} style={mergeStyle({ ...shared, border: 0, cursor: "pointer", textAlign: "left" }, style)}>
      {content}
    </button>
  )
}

export function CardBody({ children, style }: { children?: ReactNode; style?: CSSProperties }): JSX.Element | null {
  const card = useContext(CardContext)
  if (!card.open) return null
  return <div style={mergeStyle({ padding: 12 }, style)}>{children}</div>
}

export type ButtonProps = {
  children?: ReactNode
  variant?: "primary" | "secondary" | "ghost"
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  pressed?: boolean
  style?: CSSProperties
  onClick?: () => void
}

export function Button({ children, variant = "primary", disabled, type = "button", pressed, style, onClick }: ButtonProps): JSX.Element {
  const theme = useHostTheme()
  const background = variant === "primary" ? theme.accent.control : variant === "secondary" ? theme.fill.secondary : "transparent"
  const color = variant === "primary" ? theme.text.onAccent : theme.text.primary
  const border = variant === "ghost" ? "none" : `1px solid ${variant === "primary" ? "transparent" : theme.stroke.secondary}`
  return (
    <button
      type={type}
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onClick}
      style={mergeStyle(
        {
          ...font,
          ...canvasTypography.small,
          height: 24,
          padding: "0 8px",
          width: "fit-content",
          alignSelf: "flex-start",
          borderRadius: theme.radius.sm,
          background,
          color,
          border,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      )}
    >
      {children}
    </button>
  )
}

export type PillTone = "neutral" | "added" | "deleted" | "renamed" | "success" | "warning" | "info"
export type PillSize = "sm" | "md"
export type StatTone = "success" | "danger" | "warning" | "info"
export type PillProps = {
  children?: ReactNode
  active?: boolean
  tone?: PillTone
  size?: PillSize
  leadingContent?: ReactNode
  keyboardHint?: string
  disabled?: boolean
  title?: string
  style?: CSSProperties
  onClick?: () => void
}

export function Pill({ children, active, size = "md", leadingContent, keyboardHint, disabled, title, style, onClick }: PillProps): JSX.Element {
  const theme = useHostTheme()
  const compact = size === "sm"
  const shared: CSSProperties = {
    ...font,
    fontSize: compact ? 11 : 12,
    lineHeight: compact ? "14px" : "16px",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    width: "fit-content",
    padding: compact ? "1px 6px" : "2px 8px",
    borderRadius: theme.radius.full,
    border: compact ? "none" : `1px solid ${theme.stroke.secondary}`,
    background: active ? theme.fill.primary : "transparent",
    color: theme.text.primary,
    cursor: onClick && !disabled ? "pointer" : "default",
    opacity: disabled ? 0.5 : 1,
  }
  const body = (
    <>
      {leadingContent}
      {children}
      {keyboardHint && <span style={{ color: theme.text.tertiary }}>{keyboardHint}</span>}
    </>
  )
  if (!onClick) return <span title={title} style={mergeStyle(shared, style)}>{body}</span>
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} style={mergeStyle(shared, style)}>
      {body}
    </button>
  )
}

export type StatProps = { value: ReactNode; label: string; tone?: StatTone; style?: CSSProperties }
export function Stat({ value, label, tone, style }: StatProps): JSX.Element {
  const theme = useHostTheme()
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column", gap: 2 }, style)}>
      <span style={{ ...canvasTypography.h1, color: tone ? toneColor[tone] : theme.text.primary }}>{value}</span>
      <span style={{ ...canvasTypography.small, color: theme.text.tertiary }}>{label}</span>
    </div>
  )
}

export type CalloutTone = "info" | "success" | "warning" | "danger" | "neutral"
export function Callout({ children, tone = "info", title, icon, style }: { children?: ReactNode; tone?: CalloutTone; title?: ReactNode; icon?: ReactNode; style?: CSSProperties }): JSX.Element {
  const theme = useHostTheme()
  const color = tone === "neutral" ? theme.text.secondary : toneColor[tone]
  return (
    <div style={mergeStyle({ display: "flex", gap: 8, padding: 10, background: theme.fill.quaternary, borderRadius: theme.radius.md, color: theme.text.primary }, style)}>
      <span style={{ color, flexShrink: 0, marginTop: 2 }}>{icon ?? <CalloutIcon tone={tone} />}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        {title && <span style={{ ...canvasTypography.small, fontWeight: 600 }}>{title}</span>}
        <div style={{ ...canvasTypography.small, color: theme.text.secondary }}>{children}</div>
      </div>
    </div>
  )
}

function CalloutIcon({ tone }: { tone: CalloutTone }) {
  if (tone === "success") return <svg width={14} height={14} viewBox="0 0 14 14" fill="none"><circle cx={7} cy={7} r={5.25} stroke="currentColor" /><path d="M4.5 7.2 L6.2 8.8 L9.5 5.2" stroke="currentColor" /></svg>
  if (tone === "warning" || tone === "danger") return <svg width={14} height={14} viewBox="0 0 14 14" fill="none"><circle cx={7} cy={7} r={5.25} stroke="currentColor" /><path d="M7 4.2 V7.6" stroke="currentColor" /><circle cx={7} cy={9.6} r={0.6} fill="currentColor" /></svg>
  return <svg width={14} height={14} viewBox="0 0 14 14" fill="none"><circle cx={7} cy={7} r={5.25} stroke="currentColor" /><path d="M7 6.2 V9.6" stroke="currentColor" /><circle cx={7} cy={4.6} r={0.6} fill="currentColor" /></svg>
}

export type TableColumnAlign = "left" | "center" | "right"
export type TableRowTone = "success" | "danger" | "warning" | "info" | "neutral"
export type TableProps = {
  headers: ReactNode[]
  rows: ReactNode[][]
  columnAlign?: Array<TableColumnAlign | undefined>
  rowTone?: Array<TableRowTone | undefined>
  framed?: boolean
  striped?: boolean
  stickyHeader?: boolean
  style?: CSSProperties
  emptyMessage?: ReactNode
}

export function Table({ headers, rows, columnAlign, rowTone, framed = true, striped, stickyHeader, style, emptyMessage }: TableProps): JSX.Element {
  const theme = useHostTheme()
  const align = (index: number): CSSProperties["textAlign"] => columnAlign?.[index] ?? "left"
  return (
    <div style={mergeStyle({ overflow: "auto", border: framed ? `1px solid ${theme.stroke.primary}` : "none", borderRadius: framed ? theme.radius.lg : 0 }, style)}>
      <table style={{ width: "100%", borderCollapse: "collapse", ...canvasTypography.small, color: theme.text.primary }}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} style={{ textAlign: align(index), fontWeight: 500, color: theme.text.tertiary, padding: "6px 8px", position: stickyHeader ? "sticky" : "static", top: 0, background: theme.bg.elevated, borderBottom: `1px solid ${theme.stroke.tertiary}` }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && emptyMessage ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: "8px", color: theme.text.tertiary }}>{emptyMessage}</td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ background: striped && rowIndex % 2 === 1 ? theme.fill.quaternary : "transparent" }}>
                {headers.map((_, column) => (
                  <td key={column} style={{ textAlign: align(column), padding: "6px 8px", borderBottom: `1px solid ${theme.stroke.tertiary}`, verticalAlign: "middle" }}>
                    {column === 0 && rowTone?.[rowIndex] ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: toneColor[rowTone[rowIndex]], flexShrink: 0 }} />
                        {row[column]}
                      </span>
                    ) : (
                      row[column]
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
