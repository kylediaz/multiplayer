"use client"

import { Renderer } from "@openuidev/react-lang"
import type { DataplaneDocument } from "@/lib/dataplane"
import { kitLibrary } from "./library"

type OpenUIViewProps = {
  document: DataplaneDocument
  source: string | null
}

export function OpenUIView({ source }: OpenUIViewProps) {
  if (!source) return <p className="p-6 text-sm text-muted-foreground">This view has no saved source.</p>
  return (
    <div className="h-full overflow-auto bg-background p-4 text-foreground">
      <Renderer response={source} library={kitLibrary} isStreaming={false} />
    </div>
  )
}
