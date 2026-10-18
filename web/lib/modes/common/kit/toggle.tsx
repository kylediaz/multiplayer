"use client"

import { useState } from "react"
import { IconBadge } from "./icons"

export function Toggle({
  title,
  on,
  onChange,
  icon,
  subtitle,
}: {
  title: string
  on: boolean
  onChange?: (on: boolean) => void
  icon?: string | null
  subtitle?: string | null
}) {
  const [override, setOverride] = useState<boolean | null>(null)
  const checked = onChange ? on : (override ?? on)
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
      onClick={() => {
        const next = !checked
        if (onChange) onChange(next)
        else setOverride(next)
      }}
    >
      {icon ? <IconBadge name={icon} /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-5 font-medium text-foreground">{title}</span>
        {subtitle ? <span className="mt-px block text-[12.5px] leading-4 text-muted-foreground">{subtitle}</span> : null}
      </span>
      <span className={`flex h-7 w-12 shrink-0 rounded-full p-0.5 ${checked ? "justify-end bg-primary" : "justify-start bg-foreground/15"}`}>
        <span className="size-6 rounded-full bg-background" />
      </span>
    </button>
  )
}
