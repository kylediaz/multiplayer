"use client"

import { useTriggerAction } from "@openuidev/react-lang"
import type { ButtonProps } from "./buttons"

export function ButtonView({ props }: { props: ButtonProps }) {
  const triggerAction = useTriggerAction()
  const variant = props.variant ?? "primary"
  const destructive = props.type === "destructive"
  const compact = props.size === "extra-small" || props.size === "small"
  const tone =
    variant === "primary"
      ? destructive
        ? "bg-destructive text-primary-foreground"
        : "bg-primary text-primary-foreground"
      : variant === "secondary"
        ? "bg-muted text-foreground"
        : destructive
          ? "bg-transparent text-destructive"
          : "bg-transparent text-foreground"
  return (
    <button
      type="button"
      className={`w-full rounded-2xl text-center font-semibold active:opacity-75 ${compact ? "px-3.5 py-2 text-[13.5px]" : "px-4 py-3 text-[15px]"} ${tone}`}
      onClick={() => triggerAction(props.label, undefined, props.action)}
    >
      {props.label}
    </button>
  )
}
