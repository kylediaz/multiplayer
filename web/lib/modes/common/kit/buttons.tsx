import { Children, type ReactNode } from "react"

export const buttonVariants = ["primary", "secondary", "tertiary"] as const
export const buttonTypes = ["normal", "destructive"] as const
export const buttonSizes = ["extra-small", "small", "medium", "large"] as const

export type ButtonVariant = (typeof buttonVariants)[number]
export type ButtonType = (typeof buttonTypes)[number]
export type ButtonSize = (typeof buttonSizes)[number]

export function Button({
  label,
  variant = "primary",
  type = "normal",
  size = "medium",
  onClick,
}: {
  label: string
  variant?: ButtonVariant
  type?: ButtonType
  size?: ButtonSize
  onClick?: () => void
}) {
  const destructive = type === "destructive"
  const compact = size === "extra-small" || size === "small"
  const tone =
    variant === "primary"
      ? destructive
        ? "bg-destructive text-primary-foreground"
        : "bg-primary text-primary-foreground"
      : variant === "secondary"
        ? "bg-muted text-foreground"
        : destructive
          ? "bg-transparent text-destructive"
          : "bg-transparent text-foreground"
  return (
    <button
      type="button"
      className={`w-full rounded-2xl text-center font-semibold active:opacity-75 ${compact ? "px-3.5 py-2 text-[13.5px]" : "px-4 py-3 text-[15px]"} ${tone}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function Buttons({ direction = "row", children }: { direction?: "row" | "column"; children?: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean)
  const column = direction === "column"
  return (
    <div className={column ? "flex flex-col gap-2" : "flex gap-2"}>
      {items.map((button, index) => (
        <div key={index} className={column ? undefined : "min-w-0 flex-1"}>
          {button}
        </div>
      ))}
    </div>
  )
}
