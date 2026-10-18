import { defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import { TabsView } from "./media.client"
import { screenChildren } from "./screen"

const imageProp = z.object({ src: z.string(), alt: z.string().optional() })

export const ImageBlock = defineComponent({
  name: "ImageBlock",
  props: z.object({ src: z.string(), caption: z.string().optional().nullable() }),
  description: "Full-width image with rounded corners. caption sits along the bottom.",
  component: ({ props }) => (
    <figure className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
      <img src={props.src} alt={props.caption ?? ""} className="size-full object-cover" />
      {props.caption ? <figcaption className="absolute inset-x-0 bottom-0 bg-black/55 px-4 py-3 text-[15px] font-semibold text-white">{props.caption}</figcaption> : null}
    </figure>
  ),
})

export const PhotoGrid = defineComponent({
  name: "PhotoGrid",
  props: z.object({ images: z.array(imageProp) }),
  description: "Three-column photo grid of {src, alt} images.",
  component: ({ props }) => (
    <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-2xl bg-muted">
      {(props.images ?? []).filter((image) => image?.src).map((image, index) => (
        <img key={index} src={image.src} alt={image.alt ?? ""} className="aspect-square w-full object-cover" />
      ))}
    </div>
  ),
})

export const Bubbles = defineComponent({
  name: "Bubbles",
  props: z.object({
    messages: z.array(z.object({ text: z.string(), me: z.boolean().optional(), time: z.string().optional() })),
  }),
  description: "Chat thread. Each message is {text, me?, time?}. me: true aligns the bubble to the right.",
  component: ({ props }) => (
    <div className="flex flex-col gap-1 px-0.5">
      {(props.messages ?? []).filter((message) => message?.text).map((message, index) => (
        <div key={index} className="flex flex-col">
          {message.time ? <p className="mt-2 mb-1 text-center text-[11px] font-medium text-muted-foreground">{message.time}</p> : null}
          <p
            className={`max-w-[78%] px-3.5 py-2 text-sm leading-5 ${
              message.me ? "self-end rounded-2xl rounded-br-md bg-imessage-sent text-imessage-sent-foreground" : "self-start rounded-2xl rounded-bl-md bg-imessage-received text-imessage-received-foreground"
            }`}
          >
            {message.text}
          </p>
        </div>
      ))}
    </div>
  ),
})

export const TabItem = defineComponent({
  name: "TabItem",
  props: z.object({
    label: z.string(),
    children: screenChildren(),
  }),
  description: "One tab: a label, then the content shown when it is selected.",
  component: () => null,
})

const tabsProps = z.object({ items: z.array(TabItem.ref) })

export type TabsProps = z.infer<typeof tabsProps>

export const Tabs = defineComponent({
  name: "Tabs",
  props: tabsProps,
  description: "Switches between TabItem contents on tap, with no round trip.",
  component: TabsView,
})
