import { action, defineComponent } from "@openuidev/react-lang"
import type { ReactNode } from "react"
import { z } from "zod"
import { ListItemView, ToggleView } from "./lists.client"

const imageProp = z.object({ src: z.string(), alt: z.string().optional() })

function Group({ header, children }: { header?: string | null; children: ReactNode }) {
  return (
    <section>
      {header ? <p className="mb-1.5 ml-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{header}</p> : null}
      <div className="overflow-hidden rounded-2xl bg-muted">{children}</div>
    </section>
  )
}

function nodes(value: unknown): unknown[] {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

const listItemProps = z.object({
  title: z.string(),
  subtitle: z.string().optional().nullable(),
  leading: z.union([z.string(), imageProp]).optional().nullable(),
  trailing: z.string().optional().nullable(),
  action: action().optional().nullable(),
})

export type ListItemProps = z.infer<typeof listItemProps>

export const ListItem = defineComponent({
  name: "ListItem",
  props: listItemProps,
  description:
    'Tappable list row. leading: an icon name ("wifi", "credit-card") shown as a badge, or {src, alt} for a thumbnail. trailing: small value text on the right ("82%", "$12.99"). A row with an action shows a navigation affordance.',
  component: ListItemView,
})

export const Toggle = defineComponent({
  name: "Toggle",
  props: z.object({
    title: z.string(),
    on: z.boolean(),
    icon: z.string().optional().nullable(),
    subtitle: z.string().optional().nullable(),
  }),
  description: "Switch row for a setting. It flips on tap and does not take an action. icon: optional icon name.",
  component: ToggleView,
})

export const ListBlock = defineComponent({
  name: "ListBlock",
  props: z.object({
    items: z.array(z.union([ListItem.ref, Toggle.ref])),
    header: z.string().optional().nullable(),
  }),
  description: "Grouped list, the main way to show rows. items: ListItem and Toggle rows. header: section label above the group.",
  component: ({ props, renderNode }) => (
    <Group header={props.header}>
      {nodes(props.items).map((item, index) => (
        <div key={index} className={index > 0 ? "border-t border-border" : undefined}>
          {renderNode(item)}
        </div>
      ))}
    </Group>
  ),
})

export const KVList = defineComponent({
  name: "KVList",
  props: z.object({
    rows: z.array(z.object({ label: z.string(), value: z.string() })),
    header: z.string().optional().nullable(),
  }),
  description: "Label and value rows for a summary: an order, a reservation, nutrition, or a profile.",
  component: ({ props }) => (
    <Group header={props.header}>
      {(props.rows ?? []).filter(Boolean).map((row, index) => (
        <div key={index} className={`flex items-baseline justify-between gap-3.5 px-4 py-2.5 ${index > 0 ? "border-t border-border" : ""}`}>
          <span className="text-sm text-muted-foreground">{row.label}</span>
          <span className="min-w-0 flex-1 text-right text-sm font-medium text-foreground tabular-nums">{row.value}</span>
        </div>
      ))}
    </Group>
  ),
})
