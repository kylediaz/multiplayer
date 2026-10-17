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

type ModeRenderProps = {
  document: DataplaneDocument
  source: string | null
}

export type ModeRenderer = {
  sourceLabel: string
  className?: string
  View: ComponentType<ModeRenderProps>
}

const renderers = {
  react: {
    sourceLabel: "App.tsx",
    className: "md:px-4 md:pt-6 md:pb-4",
    View: ReactView,
  },
  openui: {
    sourceLabel: "app.openui",
    View: OpenUIView,
  },
} satisfies Record<DocumentLang, ModeRenderer>

export function modeRenderer(lang: DocumentLang): ModeRenderer {
  return renderers[lang]
}
