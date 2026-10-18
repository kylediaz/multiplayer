"use client"

import { useTriggerAction } from "@openuidev/react-lang"
import { ListItem } from "../../common/kit/lists"
import { Toggle } from "../../common/kit/toggle"
import type { ListItemProps, ToggleProps } from "./lists"

export function ListItemView({ props }: { props: ListItemProps }) {
  const triggerAction = useTriggerAction()
  const plan = props.action ?? undefined
  const onClick = plan ? () => triggerAction(props.title, undefined, plan) : undefined
  return <ListItem title={props.title} subtitle={props.subtitle} leading={props.leading} trailing={props.trailing} onClick={onClick} />
}

export function ToggleView({ props }: { props: ToggleProps }) {
  return <Toggle title={props.title} on={props.on} icon={props.icon} subtitle={props.subtitle} />
}
