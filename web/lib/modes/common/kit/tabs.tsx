"use client"

import { useState, type ReactNode } from "react"

export function Tabs({ tabs }: { tabs: { label: string; children?: ReactNode }[] }) {
  const [active, setActive] = useState(0)
  const index = Math.min(active, Math.max(tabs.length - 1, 0))
  const current = tabs[index]
  return (
    <div>
      <div className="flex gap-0.5 rounded-xl bg-muted p-0.5">
        {tabs.map((tab, item) => (
          <button
            key={tab.label || item}
            type="button"
            className={`min-w-0 flex-1 truncate rounded-xl px-1 py-1.5 text-center text-[13px] font-semibold text-foreground ${item === index ? "bg-background" : ""}`}
            onClick={() => setActive(item)}
          >
            {tab.label || `Tab ${item + 1}`}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-3.5">{current?.children}</div>
    </div>
  )
}
