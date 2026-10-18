import { Children, type ReactNode } from "react"
import { Glyph, IconBadge } from "./icons"

export type ListLeading = string | { src: string; alt?: string }

function Group({ header, children }: { header?: string | null; children: ReactNode }) {
  return (
    <section>
      {header ? <p className="mb-2 ml-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{header}</p> : null}
      <div className="overflow-hidden rounded-2xl bg-muted">{children}</div>
    </section>
  )
}

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onClick,
}: {
  title: string
  subtitle?: string | null
  leading?: ListLeading | null
  trailing?: string | null
  onClick?: () => void
}) {
  const icon = typeof leading === "string" && leading ? leading : null
  const thumb = leading && typeof leading === "object" ? leading.src : null
  const row = (
    <>
      {icon ? <IconBadge name={icon} /> : null}
      {thumb ? <img src={thumb} alt={leading && typeof leading === "object" ? (leading.alt ?? "") : ""} className="size-10 shrink-0 rounded-lg bg-background object-cover" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-5 font-medium text-foreground">{title}</span>
        {subtitle ? <span className="mt-px block text-[12.5px] leading-4 text-muted-foreground">{subtitle}</span> : null}
      </span>
      {trailing ? <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{trailing}</span> : null}
      {onClick ? (
        <span className="shrink-0 text-muted-foreground">
          <Glyph name="chevron-right" size={16} />
        </span>
      ) : null}
    </>
  )
  const className = "flex w-full items-start gap-3.5 px-4 py-3.5 text-left"
  if (!onClick) return <div className={className}>{row}</div>
  return (
    <button type="button" className={`${className} active:bg-background`} onClick={onClick}>
      {row}
    </button>
  )
}

export function ListBlock({ header, children }: { header?: string | null; children?: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean)
  return (
    <Group header={header}>
      {rows.map((row, index) => (
        <div key={index} className={index > 0 ? "border-t border-border" : undefined}>
          {row}
        </div>
      ))}
    </Group>
  )
}

export function KVList({ rows, header }: { rows: { label: string; value: string }[]; header?: string | null }) {
  const items = (rows ?? []).filter(Boolean)
  return (
    <Group header={header}>
      {items.map((row, index) => (
        <div key={index} className={`flex items-baseline justify-between gap-4 px-4 py-3.5 ${index > 0 ? "border-t border-border" : ""}`}>
          <span className="text-sm text-muted-foreground">{row.label}</span>
          <span className="min-w-0 flex-1 text-right text-sm font-medium text-foreground tabular-nums">{row.value}</span>
        </div>
      ))}
    </Group>
  )
}
