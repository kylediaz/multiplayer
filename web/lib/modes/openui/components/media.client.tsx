"use client"

import { useTriggerAction, type ComponentRenderProps } from "@openuidev/react-lang"
import { useState } from "react"
import { Tabs } from "../../common/kit/tabs"
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
  const items = props.items.flatMap((item) => {
    const tab = tabProps(item)
    return tab ? [tab] : []
  })
  return (
    <Tabs
      tabs={items.map((item, index) => ({
        label: item.label ?? `Tab ${index + 1}`,
        children: renderNode(item.children),
      }))}
    />
  )
}
