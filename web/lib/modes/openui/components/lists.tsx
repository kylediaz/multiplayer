import { action, defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import { KVList as KVListView, ListBlock as ListBlockView } from "../../common/kit/lists"
import { ListItemView, ToggleView } from "./lists.client"

const imageProp = z.object({ src: z.string(), alt: z.string().optional() })

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

const toggleProps = z.object({
  title: z.string(),
  on: z.boolean(),
  icon: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
})

export type ToggleProps = z.infer<typeof toggleProps>

export const Toggle = defineComponent({
  name: "Toggle",
  props: toggleProps,
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
  component: ({ props, renderNode }) => <ListBlockView header={props.header}>{nodes(props.items).map((item) => renderNode(item))}</ListBlockView>,
})

export const KVList = defineComponent({
  name: "KVList",
  props: z.object({
    rows: z.array(z.object({ label: z.string(), value: z.string() })),
    header: z.string().optional().nullable(),
  }),
  description: "Label and value rows for a summary: an order, a reservation, nutrition, or a profile.",
  component: ({ props }) => <KVListView header={props.header} rows={(props.rows ?? []).filter(Boolean)} />,
})
