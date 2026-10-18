import { Children, type ReactNode } from "react"

export const buttonVariants = ["primary", "fill", "secondary", "tertiary"] as const
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
  // Caddy's signed-in capsules: 56 for a page action, 50 for a card's, 44 for a row's, and a 36 chip.
  const shape =
    size === "large"
      ? "h-14 px-7 text-[20px]"
      : size === "medium"
        ? "h-[50px] px-[18px] text-[15px]"
        : size === "small"
          ? "h-11 px-3 text-[15px]"
          : "h-9 px-3 text-[13px]"
  // primary is the one cornflower glass capsule on a screen; secondary is the quiet glass under it;
  // fill is the ink bar for a second strong action; tertiary is text.
  const tone =
    variant === "primary"
      ? destructive
        ? "glass-capsule glass-danger"
        : "glass-capsule glass-primary"
      : variant === "secondary"
        ? destructive
          ? "glass-capsule text-destructive"
          : "glass-capsule"
        : variant === "fill"
          ? destructive
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
          : destructive
            ? "bg-transparent text-destructive"
            : "bg-transparent text-foreground"
  return (
    <button
      type="button"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full leading-none font-bold whitespace-nowrap transition-[transform,background-color,box-shadow] duration-150 outline-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:bg-disabled-fill disabled:text-disabled-text ${shape} ${tone}`}
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
    <div className={column ? "flex flex-col gap-3" : "flex gap-3"}>
      {items.map((button, index) => (
        <div key={index} className={column ? undefined : "min-w-0 flex-1"}>
          {button}
        </div>
      ))}
    </div>
  )
}
