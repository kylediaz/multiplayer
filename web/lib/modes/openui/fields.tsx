"use client"

import { useState } from "react"
import { useTriggerAction } from "@openuidev/react-lang"
import { Button, Checkbox, Select, Slider, Switch, TextArea, TextInput, type ButtonVariant, type SelectOption } from "../common/kit"

export function OpenButton({ label, variant, action }: { label: string; variant?: ButtonVariant; action?: unknown }) {
  const triggerAction = useTriggerAction()
  const plan = action && typeof action === "object" ? (action as { type?: string; params?: Record<string, unknown> }) : undefined
  return (
    <Button variant={variant} onClick={() => triggerAction(label, undefined, plan)}>
      {label}
    </Button>
  )
}

export function OpenTextInput({ value, placeholder, type }: { value?: string; placeholder?: string; type?: "text" | "email" | "password" | "number" | "url" | "search" }) {
  const [current, setCurrent] = useState(value ?? "")
  return <TextInput value={current} placeholder={placeholder} type={type} onChange={setCurrent} />
}

export function OpenTextArea({ value, placeholder, rows }: { value?: string; placeholder?: string; rows?: number }) {
  const [current, setCurrent] = useState(value ?? "")
  return <TextArea value={current} placeholder={placeholder} rows={rows} onChange={setCurrent} />
}

export function OpenCheckbox({ label, checked }: { label?: string; checked?: boolean }) {
  const [current, setCurrent] = useState(Boolean(checked))
  return <Checkbox label={label} checked={current} onChange={setCurrent} />
}

export function OpenSwitch({ label, checked }: { label?: string; checked?: boolean }) {
  const [current, setCurrent] = useState(Boolean(checked))
  return <Switch label={label} checked={current} onChange={setCurrent} />
}

export function OpenSelect({ options, placeholder, value }: { options: SelectOption[]; placeholder?: string; value?: string }) {
  const [current, setCurrent] = useState(value)
  return <Select options={options} placeholder={placeholder} value={current} onChange={setCurrent} />
}

export function OpenSlider({ value, min, max }: { value?: number; min?: number; max?: number }) {
  const [current, setCurrent] = useState(value ?? min ?? 0)
  return <Slider value={current} min={min} max={max} onChange={setCurrent} />
}
