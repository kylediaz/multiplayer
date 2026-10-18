import { defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import { Glyph } from "./icons"
import { screenChildren } from "./screen"

const textClass = {
  small: "text-[12.5px] leading-normal text-muted-foreground",
  default: "text-[15px] leading-snug text-foreground",
  large: "text-[17px] leading-6 text-foreground",
  "small-heavy": "text-[13px] leading-snug font-semibold text-foreground",
  "large-heavy": "text-xl leading-snug font-bold tracking-tight text-foreground",
} as const

const calloutIcons = {
  neutral: "info",
  info: "info",
  success: "circle-check",
  warning: "triangle-alert",
  danger: "octagon-alert",
} as const

const calloutTones = {
  neutral: "bg-muted-foreground",
  info: "bg-primary",
  success: "bg-foreground",
  warning: "bg-muted-foreground",
  danger: "bg-destructive",
} as const

export const Card = defineComponent({
  name: "Card",
  props: z.object({ children: screenChildren() }),
  description: "Root of every screen. Children stack vertically.",
  component: ({ props, renderNode }) => <div className="flex flex-col gap-4">{renderNode(props.children)}</div>,
})

export const CardHeader = defineComponent({
  name: "CardHeader",
  props: z.object({ title: z.string() }),
  description: "Screen header. Large title.",
  component: ({ props }) => (
    <header className="mt-10 px-0.5 pb-1">
      <h1 className="text-[2.75rem] leading-none font-light tracking-tight text-foreground">{props.title}</h1>
    </header>
  ),
})

export const TextContent = defineComponent({
  name: "TextContent",
  props: z.object({
    text: z.string(),
    style: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional(),
  }),
  description: "Text block. style: 'large-heavy' section titles, 'default' body, 'small' footnotes. '-heavy' is bold.",
  component: ({ props }) => <p className={`px-0.5 ${textClass[props.style ?? "default"]}`}>{props.text}</p>,
})

export const TextCallout = defineComponent({
  name: "TextCallout",
  props: z.object({
    variant: z.enum(["neutral", "info", "success", "warning", "danger"]),
    title: z.string(),
    description: z.string().optional(),
  }),
  description: "Banner for an alert, tip, or status. variant: neutral, info, success, warning, or danger.",
  component: ({ props }) => (
    <div className="flex items-start gap-3 rounded-2xl bg-muted px-3.5 py-3">
      <span className={`mt-px flex size-7 shrink-0 items-center justify-center rounded-full text-background ${calloutTones[props.variant]}`}>
        <Glyph name={calloutIcons[props.variant]} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-semibold text-foreground">{props.title}</p>
        {props.description ? <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{props.description}</p> : null}
      </div>
    </div>
  ),
})
