import { defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import { HtmlViewView } from "./html-view.client"

export const HtmlView = defineComponent({
  name: "HtmlView",
  props: z.object({
    html: z.string(),
    height: z.number().optional(),
    title: z.string().optional(),
  }),
  description: "Sandboxed HTML page with inline JS, for games and canvas. No network except script CDNs. Fits its content unless height is set.",
  component: HtmlViewView,
})
