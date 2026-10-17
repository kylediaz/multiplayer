import { FormNameContext, useFormName, useTriggerAction } from "@openuidev/react-lang"
import type { ActionPlan } from "@openuidev/react-lang"
import { Fragment, useState } from "react"
import type { CSSProperties } from "react"
import type {
  ButtonProps,
  ButtonsProps,
  DatePickerProps,
  FormControlProps,
  FormProps,
  InputProps,
  Renderer,
  SelectProps,
  SliderProps,
  TextAreaProps,
} from "./contract"
import { inputType, readSelectItems, useFieldState } from "./field"
import { LucideIcon } from "./icons"
import { useCds } from "./theme"

function useInputStyle(): CSSProperties {
  const theme = useCds()
  return {
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: theme.group,
    borderWidth: 0.5,
    borderStyle: "solid",
    borderColor: theme.sep,
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 15,
    color: theme.ink,
    fontFamily: "inherit",
    outline: "none",
  }
}

export const Input: Renderer<InputProps> = ({ props }) => {
  const theme = useCds()
  const field = useFieldState(props.name, "Input", props.value)
  const style = useInputStyle()
  return (
    <input
      style={{ ...style, color: theme.ink }}
      placeholder={props.placeholder}
      type={inputType(props.type)}
      autoCapitalize={props.type === "email" || props.type === "url" ? "none" : "sentences"}
      value={typeof field.value === "string" ? field.value : ""}
      onChange={(event) => field.set(event.target.value, false)}
      onBlur={(event) => field.set(event.target.value, true)}
    />
  )
}

export const TextArea: Renderer<TextAreaProps> = ({ props }) => {
  const field = useFieldState(props.name, "TextArea", props.value)
  const style = useInputStyle()
  const rows = props.rows ?? 4
  return (
    <textarea
      style={{ ...style, minHeight: 24 + rows * 20, resize: "vertical" }}
      placeholder={props.placeholder}
      rows={rows}
      value={typeof field.value === "string" ? field.value : ""}
      onChange={(event) => field.set(event.target.value, false)}
      onBlur={(event) => field.set(event.target.value, true)}
    />
  )
}

export const DatePicker: Renderer<DatePickerProps> = ({ props }) => {
  const field = useFieldState(props.name, "DatePicker", props.value)
  const style = useInputStyle()
  const range = props.mode === "range"
  return (
    <input
      style={style}
      type={range ? "text" : "date"}
      placeholder={range ? "YYYY-MM-DD → YYYY-MM-DD" : "YYYY-MM-DD"}
      value={typeof field.value === "string" ? field.value : ""}
      onChange={(event) => field.set(event.target.value, false)}
      onBlur={(event) => field.set(event.target.value, true)}
    />
  )
}

const SELECT_SIZES = {
  small: { padding: "8px 14px", fontSize: 13 },
  medium: { padding: "12px 14px", fontSize: 15 },
  large: { padding: "15px 14px", fontSize: 17 },
} as const

export const Select: Renderer<SelectProps> = ({ props }) => {
  const theme = useCds()
  const field = useFieldState(props.name, "Select", props.value)
  const style = useInputStyle()
  const size = SELECT_SIZES[props.size ?? "medium"] ?? SELECT_SIZES.medium
  const [open, setOpen] = useState(false)
  const items = readSelectItems(props.items)
  const selected = items.find((item) => item.value === field.value)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ ...style, ...size, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ color: selected ? theme.ink : theme.ink3 }}>{selected?.label ?? props.placeholder ?? "Select…"}</span>
        <LucideIcon name="chevrons-up-down" size={14} color={theme.ink3} />
      </button>
      {open ? (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, zIndex: 20 }}
        >
          <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 320, backgroundColor: theme.group, borderRadius: 14, overflow: "hidden" }}>
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  field.set(item.value, true)
                  setOpen(false)
                }}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  border: "none",
                  borderTop: index > 0 ? `0.5px solid ${theme.sep}` : "none",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  font: "inherit",
                  fontSize: 15,
                  color: theme.ink,
                  cursor: "pointer",
                }}
              >
                <span>{item.label ?? item.value}</span>
                {item.value === field.value ? <LucideIcon name="check" size={16} strokeWidth={2.4} color={theme.tint} /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}

export const Slider: Renderer<SliderProps> = ({ props }) => {
  const theme = useCds()
  const field = useFieldState(props.name, "Slider", props.value ?? props.defaultValue ?? [props.min])
  const current = Array.isArray(field.value) ? Number(field.value[0]) : (props.defaultValue?.[0] ?? props.min)
  const step = props.variant === "discrete" ? (props.step ?? 1) : (props.step ?? Math.max((props.max - props.min) / 100, 0.01))
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {props.label ? <div style={{ fontSize: 13, color: theme.ink2 }}>{props.label}</div> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="range"
          min={props.min}
          max={props.max}
          step={step}
          value={Number.isFinite(current) ? current : props.min}
          onChange={(event) => field.set([Number(event.target.value)], false)}
          onMouseUp={(event) => field.set([Number(event.currentTarget.value)], true)}
          onTouchEnd={(event) => field.set([Number(event.currentTarget.value)], true)}
          style={{ flex: 1, accentColor: theme.tint }}
        />
        <span style={{ minWidth: 36, textAlign: "right", fontSize: 13, fontWeight: 600, color: theme.ink2, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(current * 100) / 100}
        </span>
      </div>
    </div>
  )
}

export const FormControl: Renderer<FormControlProps> = ({ props, renderNode }) => {
  const theme = useCds()
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ marginLeft: 4, fontSize: 13, fontWeight: 600, color: theme.ink2 }}>{props.label}</div>
      {renderNode(props.input)}
      {props.hint ? <div style={{ marginLeft: 4, fontSize: 12, color: theme.ink3 }}>{props.hint}</div> : null}
    </div>
  )
}

export const Button: Renderer<ButtonProps> = ({ props }) => {
  const theme = useCds()
  const formName = useFormName()
  const triggerAction = useTriggerAction()
  const variant = props.variant ?? "primary"
  const destructive = props.type === "destructive"
  const background = variant === "primary" ? (destructive ? theme.red : theme.tint) : variant === "secondary" ? theme.fill : "transparent"
  const color = variant === "primary" ? "#fff" : destructive ? theme.red : theme.tint
  const compact = props.size === "extra-small" || props.size === "small"
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      onClick={() => triggerAction(props.label ?? "", formName, props.action as ActionPlan | undefined)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: "100%",
        border: "none",
        borderRadius: 14,
        padding: compact ? "9px 18px" : "13px 18px",
        backgroundColor: background,
        color,
        font: "inherit",
        fontSize: compact ? 13.5 : 15,
        fontWeight: 600,
        cursor: "pointer",
        opacity: pressed ? 0.75 : 1,
        transform: pressed ? "scale(0.97)" : "none",
      }}
    >
      {props.label}
    </button>
  )
}

export const Buttons: Renderer<ButtonsProps> = ({ props, renderNode }) => {
  const column = props.direction === "column"
  return (
    <div style={{ display: "flex", flexDirection: column ? "column" : "row", gap: 9 }}>
      {(props.buttons ?? []).filter(Boolean).map((button, index) => (
        <div key={index} style={column ? undefined : { flex: 1 }}>
          {renderNode(button)}
        </div>
      ))}
    </div>
  )
}

export const Form: Renderer<FormProps> = ({ props, renderNode }) => (
  <FormNameContext.Provider value={props.name}>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(props.fields ?? []).filter(Boolean).map((field, index) => (
        <Fragment key={index}>{renderNode(field)}</Fragment>
      ))}
      {renderNode(props.buttons)}
    </div>
  </FormNameContext.Provider>
)
