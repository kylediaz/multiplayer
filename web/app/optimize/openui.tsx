"use client"

import { Renderer } from "@openuidev/react-lang"
import { onOpenUIAction } from "@/lib/modes/openui/actions"
import { openuiLibrary } from "@/lib/modes/openui/library"

export function OpenUICandidate({ source }: { source: string }) {
  return (
    <div className="h-full overflow-auto bg-background text-foreground">
      <div className="p-4">
        <Renderer response={source} library={openuiLibrary} isStreaming={false} onAction={onOpenUIAction} />
      </div>
    </div>
  )
}
