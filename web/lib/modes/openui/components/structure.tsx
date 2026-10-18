import { defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import { Card as CardView, CardHeader as CardHeaderView, TextCallout as TextCalloutView, TextContent as TextContentView } from "../../common/kit/structure"
import { screenChildren } from "./screen"

export const Card = defineComponent({
  name: "Card",
  props: z.object({ children: screenChildren() }),
  description: "Root of every screen. Children stack vertically.",
  component: ({ props, renderNode }) => <CardView>{renderNode(props.children)}</CardView>,
})

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: z.object({ title: z.string() }),
  description: "Screen header. Large title.",
  component: ({ props }) => <CardHeaderView title={props.title} />,
})

export const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({
    text: z.string(),
    style: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
  }),
  description: "Text block. style: 'large-heavy' section titles, 'default' body, 'small' footnotes. '-heavy' is bold.",
  component: ({ props }) => <TextContentView text={props.text} style={props.style} />,
})

export const TextCallout = defineComponent({
  name: "TextCallout",
  props: z.object({
    variant: z.enum(["neutral", "info", "success", "warning", "danger"]),
    title: z.string(),
    description: z.string().optional(),
  }),
  description: "Banner for an alert, tip, or status. variant: neutral, info, success, warning, or danger.",
  component: ({ props }) => <TextCalloutView variant={props.variant} title={props.title} description={props.description} />,
})
