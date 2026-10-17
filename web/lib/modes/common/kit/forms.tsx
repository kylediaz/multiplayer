"use client"

import type { ReactNode } from "react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Checkbox as CheckboxRoot } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider as SliderRoot } from "@/components/ui/slider"
import { Switch as SwitchRoot } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type TextInputProps = {
  value?: string
  onChange?: (value: string, cursor?: number) => void
  placeholder?: string
  disabled?: boolean
  type?: "text" | "email" | "password" | "number" | "url" | "search"
  className?: string
  "aria-label"?: string
}

export function TextInput({ value, onChange, placeholder, disabled, type = "text", className, "aria-label": ariaLabel }: TextInputProps) {
  return (
    <Input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      onChange={(event) => onChange?.(event.target.value, event.target.selectionEnd ?? undefined)}
    />
  )
}

export type TextAreaProps = {
  value?: string
  onChange?: (value: string, cursor?: number) => void
  placeholder?: string
  disabled?: boolean
  rows?: number
  className?: string
  "aria-label"?: string
}

export function TextArea({ value, onChange, placeholder, disabled, rows = 3, className, "aria-label": ariaLabel }: TextAreaProps) {
  return (
    <Textarea
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      aria-label={ariaLabel}
      className={className}
      onChange={(event) => onChange?.(event.target.value, event.target.selectionEnd ?? undefined)}
    />
  )
}

export type CheckboxProps = {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: ReactNode
  className?: string
}

export function Checkbox({ checked, onChange, disabled, label, className }: CheckboxProps) {
  return (
    <Label className={cn("w-fit font-normal", className)}>
      <CheckboxRoot checked={Boolean(checked)} disabled={disabled} onCheckedChange={(next) => onChange?.(next)} />
      {label}
    </Label>
  )
}

export type SwitchProps = {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: ReactNode
  size?: "sm" | "default"
  className?: string
}

export function Switch({ checked, onChange, disabled, label, size = "default", className }: SwitchProps) {
  const control = <SwitchRoot checked={Boolean(checked)} disabled={disabled} size={size} onCheckedChange={(next) => onChange?.(next)} />
  if (!label) return control
  return (
    <Label className={cn("w-fit font-normal", className)}>
      {control}
      {label}
    </Label>
  )
}

export type SelectOption = { value: string; label: string; disabled?: boolean }
export type SelectProps = {
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Select({ value, onChange, options, placeholder, disabled, className }: SelectProps) {
  return (
    <SelectRoot value={value ?? null} disabled={disabled} onValueChange={(next) => { if (next) onChange?.(next) }}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}

export type SliderProps = {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  className?: string
}

export function Slider({ value, onChange, min = 0, max = 100, disabled, className }: SliderProps) {
  return (
    <SliderRoot
      value={value === undefined ? undefined : [value]}
      min={min}
      max={max}
      disabled={disabled}
      className={className}
      onValueChange={(next) => {
        const resolved = Array.isArray(next) ? next[0] : next
        if (typeof resolved === "number") onChange?.(resolved)
      }}
    />
  )
}

export type IconButtonProps = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  className?: string
}

export function IconButton({ children, onClick, disabled, title, className }: IconButtonProps) {
  return (
    <Button type="button" size="icon" variant="ghost" title={title} aria-label={title} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </Button>
  )
}
