"use client"

import type { ReactNode } from "react"
import { cn } from "cn"
import { Alert as AlertRoot, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge as BadgeRoot } from "@/components/ui/badge"
import { Button as ButtonRoot } from "@/components/ui/button"
import { Card as CardRoot, CardAction, CardContent, CardHeader as CardHeaderRoot, CardTitle } from "@/components/ui/card"
import { Progress as ProgressRoot, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Separator as SeparatorRoot } from "@/components/ui/separator"
import { Table as TableRoot, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Separator({ className }: { className?: string }) {
  return <SeparatorRoot className={className} />
}

export type CardProps = { children?: ReactNode; className?: string }
export function Card({ children, className }: CardProps) {
  return <CardRoot className={className}>{children}</CardRoot>
}

export function CardHeader({ children, trailing, className }: { children?: ReactNode; trailing?: ReactNode; className?: string }) {
  return (
    <CardHeaderRoot className={className}>
      <CardTitle>{children}</CardTitle>
      {trailing ? <CardAction>{trailing}</CardAction> : null}
    </CardHeaderRoot>
  )
}

export function CardBody({ children, className }: { children?: ReactNode; className?: string }) {
  return <CardContent className={className}>{children}</CardContent>
}

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"
export type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon"
export type ButtonProps = {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  pressed?: boolean
  className?: string
  onClick?: () => void
}
export function Button({ children, variant = "default", size = "default", disabled, type = "button", pressed, className, onClick }: ButtonProps) {
  return (
    <ButtonRoot type={type} variant={variant} size={size} disabled={disabled} aria-pressed={pressed} className={cn("w-fit", className)} onClick={onClick}>
      {children}
    </ButtonRoot>
  )
}

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost"
export function Badge({ children, variant = "outline", className }: { children?: ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <BadgeRoot variant={variant} className={className}>
      {children}
    </BadgeRoot>
  )
}

export type AlertVariant = "default" | "destructive" | "info" | "success" | "warning"
const alertClass: Record<AlertVariant, string> = {
  default: "",
  destructive: "",
  info: "border-chart-1/40",
  success: "border-chart-2/40",
  warning: "border-chart-4/40",
}
export function Alert({ children, title, variant = "default", className }: { children?: ReactNode; title?: ReactNode; variant?: AlertVariant; className?: string }) {
  return (
    <AlertRoot variant={variant === "destructive" ? "destructive" : "default"} className={cn(alertClass[variant], className)}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children ? <AlertDescription>{children}</AlertDescription> : null}
    </AlertRoot>
  )
}

export function Stat({ value, label, className }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-2xl font-semibold text-foreground tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export function Table({ headers, rows, className, emptyMessage }: { headers: ReactNode[]; rows: ReactNode[][]; className?: string; emptyMessage?: ReactNode }) {
  return (
    <TableRoot className={className}>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead key={index}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && emptyMessage ? (
          <TableRow>
            <TableCell colSpan={headers.length} className="text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {headers.map((_, column) => (
                <TableCell key={column}>{row[column]}</TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </TableRoot>
  )
}

export function Progress({ value, label, className }: { value: number; label?: string; className?: string }) {
  return (
    <ProgressRoot value={value} className={className}>
      {label ? <ProgressLabel>{label}</ProgressLabel> : null}
      <ProgressValue />
    </ProgressRoot>
  )
}

export type TabItem = { value: string; label: string; content: ReactNode }
export function Tabs({ tabs, defaultValue, className }: { tabs: TabItem[]; defaultValue?: string; className?: string }) {
  const first = defaultValue ?? tabs[0]?.value
  if (!first) return null
  return (
    <TabsRoot defaultValue={first} className={className}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </TabsRoot>
  )
}
