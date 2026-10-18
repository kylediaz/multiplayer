"use client"

import { useTriggerAction } from "@openuidev/react-lang"
import { Button } from "../../common/kit/buttons"
import type { ButtonProps } from "./buttons"

export function ButtonView({ props }: { props: ButtonProps }) {
  const triggerAction = useTriggerAction()
  return (
    <Button
      label={props.label}
      variant={props.variant}
      type={props.type}
      size={props.size}
      onClick={() => triggerAction(props.label, undefined, props.action)}
    />
  )
}
