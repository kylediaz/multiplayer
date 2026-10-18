import { action, defineComponent } from "@openuidev/react-lang"
import { z } from "zod"
import { Buttons as ButtonsView } from "../../common/kit/buttons"
import { ButtonView } from "./buttons.client"

function nodes(value: unknown): unknown[] {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

const buttonProps = z.object({
  label: z.string(),
  action: action().optional(),
  variant: z.enum(["primary", "secondary", "tertiary"]).optional(),
  type: z.enum(["normal", "destructive"]).optional(),
  size: z.enum(["extra-small", "small", "medium", "large"]).optional(),
})

export type ButtonProps = z.infer<typeof buttonProps>

export const Button = defineComponent({
  name: "Button",
  props: buttonProps,
  description: 'Button. variant: "primary", "secondary", or "tertiary". type: "normal" or "destructive". size: "extra-small", "small", "medium", or "large".',
  component: ButtonView,
})

export const Buttons = defineComponent({
  name: "Buttons",
  props: z.object({
    buttons: z.array(Button.ref),
    direction: z.enum(["row", "column"]).optional(),
  }),
  description: 'Group of Button components. direction: "row" (default) or "column".',
  component: ({ props, renderNode }) => (
    <ButtonsView direction={props.direction}>{nodes(props.buttons).map((button) => renderNode(button))}</ButtonsView>
  ),
})
