"use client"

import { useTriggerAction, type ComponentRenderProps } from "@openuidev/react-lang"
import { useState } from "react"
import type { TabsProps } from "./media"

type TabElement = TabsProps["items"][number]

export function ChipsView({ props }: { props: { labels?: string[] | null } }) {
  const triggerAction = useTriggerAction()
  const [active, setActive] = useState(0)
  const labels = (props.labels ?? []).filter(Boolean)
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
      {labels.map((label, index) => (
        <button
          key={label}
          type="button"
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${index === active ? "bg-foreground text-background" : "border border-border bg-muted text-foreground"}`}
          onClick={() => {
            if (index === active) return
            setActive(index)
            triggerAction(`Apply the "${label}" filter and re-render this screen with only matching content`)
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function tabProps(item: TabElement | TabElement["props"]): TabElement["props"] | null {
  if (!item || typeof item !== "object") return null
  if ("props" in item && item.props && typeof item.props === "object" && "label" in item.props) return item.props
  if ("label" in item) return item
  return null
}

export function TabsView({ props, renderNode }: ComponentRenderProps<TabsProps>) {
  const [active, setActive] = useState(0)
  const items = props.items.flatMap((item) => {
    const tab = tabProps(item)
    return tab ? [tab] : []
  })
  const current = items[Math.min(active, Math.max(items.length - 1, 0))]
  return (
    <div>
      <div className="flex gap-0.5 rounded-xl bg-muted p-0.5">
        {items.map((item, index) => (
          <button
            key={item.label ?? index}
            type="button"
            className={`min-w-0 flex-1 truncate rounded-xl px-1 py-1.5 text-center text-[13px] font-semibold text-foreground ${index === active ? "bg-background" : ""}`}
            onClick={() => setActive(index)}
          >
            {item.label ?? `Tab ${index + 1}`}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-3.5">{current ? renderNode(current.children) : null}</div>
    </div>
  )
}
