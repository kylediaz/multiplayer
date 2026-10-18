"use client"

import { Renderer } from "@openuidev/react-lang"
import type { DataplaneDocument } from "@/lib/dataplane"
import { runLibraryAction } from "./iui/actions"
import { library } from "./library"
import "./styles"

type OpenUIViewProps = {
  document: DataplaneDocument
  source: string | null
}

export function OpenUIView({ source }: OpenUIViewProps) {
  if (!source) return <p className="p-6 text-sm text-muted-foreground">This view has no saved source.</p>
  return (
    <div className="h-full overflow-auto bg-background text-foreground">
      <div className="p-4">
        <Renderer response={source} library={library} isStreaming={false} onAction={(event) => void runLibraryAction(event)} />
      </div>
    </div>
  )
}
