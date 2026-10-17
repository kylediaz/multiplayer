"use client"

import { useEffect, useRef, type CSSProperties, type JSX, type ReactNode } from "react"
import { mergeStyle } from "./primitives"
import { canvasTypography, useHostTheme } from "./theme"

const controlFont = { ...canvasTypography.small, fontFamily: canvasTypography.fontFamily }

export type TextInputProps = {
  value?: string
  onChange?: (value: string, cursor?: number) => void
  placeholder?: string
  disabled?: boolean
  type?: "text" | "email" | "password" | "number" | "url" | "search"
  style?: CSSProperties
  "aria-label"?: string
}

export function TextInput({ value, onChange, placeholder, disabled, type = "text", style, "aria-label": ariaLabel }: TextInputProps): JSX.Element {
  const theme = useHostTheme()
  return (
    <input
      type={type}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange?.(event.target.value, event.target.selectionEnd ?? undefined)}
      style={mergeStyle(fieldStyle(theme), style)}
    />
  )
}

export type TextAreaProps = {
  value?: string
  onChange?: (value: string, cursor?: number) => void
  placeholder?: string
  disabled?: boolean
  rows?: number
  style?: CSSProperties
  "aria-label"?: string
}

export function TextArea({ value, onChange, placeholder, disabled, rows = 3, style, "aria-label": ariaLabel }: TextAreaProps): JSX.Element {
  const theme = useHostTheme()
  const ref = useRef<HTMLTextAreaElement>(null)
  const fixed = style?.height !== undefined
  useEffect(() => {
    const node = ref.current
    if (!node || fixed) return
    node.style.height = "auto"
    node.style.height = `${node.scrollHeight}px`
  }, [value, rows, fixed])
  return (
    <textarea
      ref={ref}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      aria-label={ariaLabel}
      onChange={(event) => onChange?.(event.target.value, event.target.selectionEnd ?? undefined)}
      style={mergeStyle({ ...fieldStyle(theme), height: fixed ? undefined : "auto", resize: "vertical", lineHeight: "20px" }, style)}
    />
  )
}

export type CheckboxProps = {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: ReactNode
  style?: CSSProperties
}

export function Checkbox({ checked, onChange, disabled, label, style }: CheckboxProps): JSX.Element {
  const theme = useHostTheme()
  return (
    <label style={mergeStyle({ display: "inline-flex", alignItems: "center", gap: 8, ...controlFont, color: theme.text.primary, cursor: disabled ? "default" : "pointer" }, style)}>
      <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} style={{ accentColor: theme.accent.primary, width: 14, height: 14 }} />
      {label}
    </label>
  )
}

export type ToggleProps = {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "md"
  style?: CSSProperties
}

export function Toggle({ checked, onChange, disabled, size = "sm", style }: ToggleProps): JSX.Element {
  const theme = useHostTheme()
  const on = Boolean(checked)
  const height = size === "md" ? 20 : 16
  const width = height * 1.7
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      style={mergeStyle(
        {
          width,
          height,
          borderRadius: 99,
          border: "none",
          padding: 2,
          background: on ? theme.accent.primary : theme.fill.primary,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          display: "inline-flex",
          alignItems: "center",
        },
        style,
      )}
    >
      <span style={{ width: height - 4, height: height - 4, borderRadius: 99, background: theme.bg.editor, transform: on ? `translateX(${width - height}px)` : "none" }} />
    </button>
  )
}

export type SelectOption = { value: string; label: string; disabled?: boolean }
export type SelectProps = {
  value?: string
  onChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  style?: CSSProperties
}

export function Select({ value, onChange, options, placeholder, disabled, style }: SelectProps): JSX.Element {
  const theme = useHostTheme()
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
      style={mergeStyle({ ...fieldStyle(theme), colorScheme: theme.kind === "dark" ? "dark" : "light" }, style)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export type IconButtonProps = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  variant?: "default" | "circle"
  size?: "sm" | "md"
  style?: CSSProperties
}

export function IconButton({ children, onClick, disabled, title, variant = "default", size = "md", style }: IconButtonProps): JSX.Element {
  const theme = useHostTheme()
  const box = size === "sm" ? 16 : 20
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={mergeStyle(
        {
          width: box,
          height: box,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: variant === "circle" ? 99 : theme.radius.sm,
          background: variant === "circle" ? theme.fill.secondary : "transparent",
          color: theme.text.secondary,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          padding: 0,
        },
        style,
      )}
    >
      {children}
    </button>
  )
}

function fieldStyle(theme: ReturnType<typeof useHostTheme>): CSSProperties {
  return {
    ...controlFont,
    width: "100%",
    minHeight: 28,
    padding: "4px 8px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.stroke.secondary}`,
    background: theme.bg.editor,
    color: theme.text.primary,
    outline: "none",
  }
}
