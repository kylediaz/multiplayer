"use client"

import { useSyncExternalStore, type FocusEvent, type ReactNode } from "react"
import { Checkbox as CheckboxBase } from "@/components/ui/checkbox"
import { Input as InputBase } from "@/components/ui/input"
import { RadioGroup as RadioGroupBase } from "@/components/ui/radio-group"
import { SelectTrigger as SelectTriggerBase } from "@/components/ui/select"
import { Slider as SliderBase } from "@/components/ui/slider"
import { Switch as SwitchBase } from "@/components/ui/switch"
import { Textarea as TextareaBase } from "@/components/ui/textarea"
import { Toggle as ToggleBase } from "@/components/ui/toggle"
import { ToggleGroup as ToggleGroupBase } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { shellMessage } from "@/lib/shell-messages"

export { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle, AttachmentTrigger } from "@/components/ui/attachment"
export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar"
export { Button } from "@/components/ui/button"
export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle } from "@/components/ui/field"
export { Label } from "@/components/ui/label"
export { RadioGroupItem } from "@/components/ui/radio-group"
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectValue } from "@/components/ui/select"
export { Separator } from "@/components/ui/separator"
export { Skeleton } from "@/components/ui/skeleton"
export { ToggleGroupItem } from "@/components/ui/toggle-group"

type Host = {
  post(message: Record<string, unknown>): void
  onMessage(callback: (message: unknown) => void): void
}

let remoteFocus: Record<string, string> = {}
const focusListeners = new Set<() => void>()

function viewHost(): Host | null {
  if (typeof window === "undefined") return null
  const host = (window as Window & { host?: Host }).host
  return host ?? null
}

const bridge = viewHost()
if (bridge) {
  bridge.onMessage((message) => {
    const parsed = shellMessage(message)
    if (!parsed || parsed.type !== "peers") return
    const next: Record<string, string> = {}
    for (const peer of parsed.peers) {
      if (next[peer.focus]) continue
      next[peer.focus] = peer.color
    }
    remoteFocus = next
    for (const listener of focusListeners) listener()
  })
}

function subscribeFocus(listener: () => void) {
  focusListeners.add(listener)
  return () => focusListeners.delete(listener)
}

function useRemoteFocus(field: string | undefined): string | null {
  const focuses = useSyncExternalStore(subscribeFocus, () => remoteFocus, () => remoteFocus)
  return field ? focuses[field] ?? null : null
}

function reportFocus(field: string | null) {
  viewHost()?.post({ type: "presence", presence: { focus: field } })
}

function FieldFocus({ field, className, children }: { field?: string; className?: string; children: ReactNode }) {
  const color = useRemoteFocus(field)
  if (!field) return children
  return (
    <div
      className={cn("relative", className)}
      style={{ outline: `2px solid ${color ?? "transparent"}`, outlineOffset: 4 }}
      onFocus={() => reportFocus(field)}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        reportFocus(null)
      }}
    >
      {children}
    </div>
  )
}

export function Input({ field, ...props }: React.ComponentProps<typeof InputBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-full">
      <InputBase {...props} />
    </FieldFocus>
  )
}

export function Textarea({ field, ...props }: React.ComponentProps<typeof TextareaBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-full">
      <TextareaBase {...props} />
    </FieldFocus>
  )
}

export function Checkbox({ field, ...props }: React.ComponentProps<typeof CheckboxBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-fit">
      <CheckboxBase {...props} />
    </FieldFocus>
  )
}

export function Switch({ field, ...props }: React.ComponentProps<typeof SwitchBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-fit">
      <SwitchBase {...props} />
    </FieldFocus>
  )
}

export function Slider({ field, ...props }: React.ComponentProps<typeof SliderBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-full">
      <SliderBase {...props} />
    </FieldFocus>
  )
}

export function RadioGroup({ field, ...props }: React.ComponentProps<typeof RadioGroupBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-full">
      <RadioGroupBase {...props} />
    </FieldFocus>
  )
}

export function SelectTrigger({ field, ...props }: React.ComponentProps<typeof SelectTriggerBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-fit">
      <SelectTriggerBase {...props} />
    </FieldFocus>
  )
}

export function Toggle({ field, ...props }: React.ComponentProps<typeof ToggleBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-fit">
      <ToggleBase {...props} />
    </FieldFocus>
  )
}

export function ToggleGroup({ field, ...props }: React.ComponentProps<typeof ToggleGroupBase> & { field?: string }) {
  return (
    <FieldFocus field={field} className="w-fit">
      <ToggleGroupBase {...props} />
    </FieldFocus>
  )
}
