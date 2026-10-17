"use client"

import type { CSSProperties, ReactNode } from "react"
import { cn } from "cn"

const alignClass = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const

const justifyClass = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  "space-between": "justify-between",
} as const

export type StackProps = { children?: ReactNode; gap?: number; className?: string; style?: CSSProperties }
export function Stack({ children, gap = 0, className, style }: StackProps) {
  return (
    <div className={cn("flex flex-col", className)} style={{ gap, ...style }}>
      {children}
    </div>
  )
}

export type RowProps = {
  children?: ReactNode
  gap?: number
  align?: keyof typeof alignClass
  justify?: keyof typeof justifyClass
  wrap?: boolean
  className?: string
  style?: CSSProperties
}
export function Row({ children, gap = 0, align = "center", justify = "start", wrap, className, style }: RowProps) {
  return (
    <div className={cn("flex flex-row", alignClass[align], justifyClass[justify], wrap && "flex-wrap", className)} style={{ gap, ...style }}>
      {children}
    </div>
  )
}

export type GridProps = {
  children?: ReactNode
  columns: number | string
  gap?: number
  align?: keyof typeof alignClass
  className?: string
  style?: CSSProperties
}
export function Grid({ children, columns, gap = 0, align = "stretch", className, style }: GridProps) {
  const template = typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns
  return (
    <div className={cn("grid", alignClass[align], className)} style={{ gridTemplateColumns: template, gap, ...style }}>
      {children}
    </div>
  )
}

export function Spacer() {
  return <div className="flex-1" />
}
