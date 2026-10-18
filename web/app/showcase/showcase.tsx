"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"
import { cn } from "cn"
import { rootFontSize } from "@/lib/modes/common/kit"
import { openuiSources } from "./openui-apps"
import { openuiShowcase, reactShowcase } from "./data"

const loading = () => <div className="h-full animate-pulse bg-muted" />

const ReactApp = dynamic(() => import("./react-apps").then((mod) => mod.ReactApp), { ssr: false, loading })

const OpenUIPane = dynamic(() => import("./openui-pane").then((mod) => mod.OpenUIPane), { ssr: false, loading })

export function Showcase() {
  return (
    <div className="flex h-dvh overflow-x-auto overscroll-x-contain">
      <Band label="React" className="bg-background">
        {reactShowcase.map((app) => {
          const phones = "phones" in app ? app.phones : 1
          return (
            <div key={app.kind} className="flex h-full shrink-0 items-center gap-4">
              {Array.from({ length: phones }, (_, index) => (
                <Frame key={index}>
                  <ReactApp kind={app.kind} />
                </Frame>
              ))}
            </div>
          )
        })}
      </Band>
      <Band label="OpenUI" className="bg-muted">
        {openuiShowcase.map((app) => (
          <Frame key={app.kind}>
            <OpenUIPane source={openuiSources[app.kind]} />
          </Frame>
        ))}
      </Band>
    </div>
  )
}

function Band({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn("flex h-dvh shrink-0 flex-col", className)}>
      <h2 className="px-12 pt-8 text-sm font-medium text-foreground">{label}</h2>
      <div className="flex min-h-0 flex-1 items-center gap-12 px-12 pt-6 pb-12">{children}</div>
    </section>
  )
}

const phoneWidth = 390
const phoneHeight = 844

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="relative aspect-[390/844] h-[68dvh] shrink-0 overflow-hidden rounded-[2.5rem] bg-background shadow-sm ring-1 ring-foreground/10">
      <div
        className="absolute top-0 left-0 origin-top-left overflow-auto p-5"
        style={{ width: phoneWidth, height: phoneHeight, fontSize: rootFontSize, transform: "scale(calc(68dvh / 844px))" }}
      >
        {children}
      </div>
    </div>
  )
}
