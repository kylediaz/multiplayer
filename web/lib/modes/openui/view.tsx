"use client"

import { Renderer } from "@openuidev/react-lang"
import type { CSSProperties } from "react"
import type { DataplaneDocument } from "@/lib/dataplane"
import { cupertinoLibrary } from "./library"

type OpenUIViewProps = {
  document: DataplaneDocument
  source: string | null
}

const chrome: CSSProperties = {
  background: "#f2f2f7",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  maxWidth: 420,
  margin: "0 auto",
  padding: "16px 14px 28px",
  minHeight: "100%",
}

export function OpenUIView({ source }: OpenUIViewProps) {
  if (!source) return <p className="p-6 text-sm text-muted-foreground">This view has no saved source.</p>
  return (
    <div id="openui-root" className="h-full overflow-auto" style={chrome}>
      <style>{`#openui-root input::placeholder, #openui-root textarea::placeholder { color: rgba(60, 60, 67, 0.3); }`}</style>
      <Renderer response={source} library={cupertinoLibrary} isStreaming={false} />
    </div>
  )
}
