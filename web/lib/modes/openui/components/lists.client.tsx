"use client"

import { useTriggerAction } from "@openuidev/react-lang"
import { useState } from "react"
import { Glyph, IconBadge } from "./icons"
import type { ListItemProps } from "./lists"

function useTap(label: string, plan: ListItemProps["action"]) {
  const triggerAction = useTriggerAction()
  if (!plan) return undefined
  return () => {
    triggerAction(label, undefined, plan)
  }
}

export function ListItemView({ props }: { props: ListItemProps }) {
  const onTap = useTap(props.title, props.action)
  const leading = props.leading
  const icon = typeof leading === "string" && leading ? leading : null
  const thumb = leading && typeof leading === "object" ? leading.src : null
  const row = (
    <>
      {icon ? <IconBadge name={icon} /> : null}
      {thumb ? <img src={thumb} alt={leading && typeof leading === "object" ? (leading.alt ?? "") : ""} className="size-10 shrink-0 rounded-lg bg-background object-cover" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-5 font-medium text-foreground">{props.title}</span>
        {props.subtitle ? <span className="mt-px block text-[12.5px] leading-4 text-muted-foreground">{props.subtitle}</span> : null}
      </span>
      {props.trailing ? <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{props.trailing}</span> : null}
      {onTap ? (
        <span className="shrink-0 text-muted-foreground">
          <Glyph name="chevron-right" size={16} />
        </span>
      ) : null}
    </>
  )
  const className = "flex w-full items-start gap-3 px-4 py-2.5 text-left"
  if (!onTap) return <div className={className}>{row}</div>
  return (
    <button type="button" className={`${className} active:bg-background`} onClick={onTap}>
      {row}
    </button>
  )
}

export function ToggleView({ props }: { props: { title: string; on: boolean; icon?: string | null; subtitle?: string | null } }) {
  const [override, setOverride] = useState<boolean | null>(null)
  const on = override ?? Boolean(props.on)
  return (
    <button type="button" role="switch" aria-checked={on} className="flex w-full items-center gap-3 px-4 py-2.5 text-left" onClick={() => setOverride(!on)}>
      {props.icon ? <IconBadge name={props.icon} /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-5 font-medium text-foreground">{props.title}</span>
        {props.subtitle ? <span className="mt-px block text-[12.5px] leading-4 text-muted-foreground">{props.subtitle}</span> : null}
      </span>
      <span className={`flex h-7 w-12 shrink-0 rounded-full p-0.5 ${on ? "justify-end bg-primary" : "justify-start bg-foreground/15"}`}>
        <span className="size-6 rounded-full bg-background" />
      </span>
    </button>
  )
}
