import type { ReactNode } from "react"
import { Glyph } from "./icons"
import { rootFontSize } from "./root"

const textClass = {
  small: "text-[12.5px] leading-normal text-muted-foreground",
  default: "text-[15px] leading-snug text-foreground",
  large: "text-[17px] leading-6 text-foreground",
  "small-heavy": "text-[13px] leading-snug font-semibold text-foreground",
  "large-heavy": "text-xl leading-snug font-bold tracking-tight text-foreground",
} as const

const calloutIcons = {
  neutral: "info",
  info: "info",
  success: "circle-check",
  warning: "triangle-alert",
  danger: "octagon-alert",
} as const

// Each variant is a wash behind the row and the color its title and glyph take.
const calloutTones = {
  neutral: { wash: "bg-muted", text: "text-foreground" },
  info: { wash: "bg-tint/10", text: "text-tint" },
  success: { wash: "bg-success-fill", text: "text-success" },
  warning: { wash: "bg-marigold/15", text: "text-marigold" },
  danger: { wash: "bg-destructive/10", text: "text-destructive" },
} as const

export const textStyles = ["small", "default", "large", "small-heavy", "large-heavy"] as const
export type TextStyle = (typeof textStyles)[number]
export const calloutVariants = ["neutral", "info", "success", "warning", "danger"] as const
export type CalloutVariant = (typeof calloutVariants)[number]

export function Card({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 text-foreground" style={{ fontSize: rootFontSize }}>
      {children}
    </div>
  )
}

export function CardHeader({ title }: { title: string }) {
  return (
    <header className="mt-10 px-0.5 pb-1">
      <h1 className="text-[2.125em] leading-[1.1] font-bold tracking-[-0.02em] text-foreground">{title}</h1>
    </header>
  )
}

export function TextContent({ text, style = "default" }: { text: string; style?: TextStyle }) {
  return <p className={`px-0.5 ${textClass[style]}`}>{text}</p>
}

export function TextCallout({ variant, title, description }: { variant: CalloutVariant; title: string; description?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl px-4 py-4 ${calloutTones[variant].wash}`}>
      <span className={`mt-0.5 shrink-0 ${calloutTones[variant].text}`}>
        <Glyph name={calloutIcons[variant]} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug font-semibold ${calloutTones[variant].text}`}>{title}</p>
        {description ? <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  )
}
