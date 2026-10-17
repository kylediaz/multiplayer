"use client"

import dynamic from "next/dynamic"
import type { ComponentType } from "react"
import type { DocumentLang } from "@shared/lang"
import type { DataplaneDocument } from "@/lib/dataplane"
import { ReactView } from "./react/view"

const OpenUIView = dynamic(() => import("./openui/view").then((mod) => mod.OpenUIView), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse bg-[#f2f2f7]" />,
})

export type ModeRenderProps = {
  document: DataplaneDocument
  source: string | null
}

const views = {
  react: ReactView,
  openui: OpenUIView,
} satisfies Record<DocumentLang, ComponentType<ModeRenderProps>>

export function modeRenderer(lang: DocumentLang): ComponentType<ModeRenderProps> {
  return views[lang]
}
