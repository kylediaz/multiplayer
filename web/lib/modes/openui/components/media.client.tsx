"use client"

import { type ComponentRenderProps } from "@openuidev/react-lang"
import { Tabs } from "../../common/kit/tabs"
import type { TabsProps } from "./media"

type TabElement = TabsProps["items"][number]

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
