"use client"

import { useState, type ReactNode } from "react"

export function Tabs({ tabs }: { tabs: { label: string; children?: ReactNode }[] }) {
  const [active, setActive] = useState(0)
  const index = Math.min(active, Math.max(tabs.length - 1, 0))
  const current = tabs[index]
  return (
    <div>
      <div className="flex gap-0.5 rounded-xl bg-secondary p-0.5">
        {tabs.map((tab, item) => (
          <button
            key={tab.label || item}
            type="button"
            className={`min-w-0 flex-1 truncate rounded-xl px-1 py-2 text-center text-[13px] font-semibold ${item === index ? "bg-tint text-on-tint" : "text-muted-foreground"}`}
            onClick={() => setActive(item)}
          >
            {tab.label || `Tab ${item + 1}`}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-4">{current?.children}</div>
    </div>
  )
}
