"use client"

import { Renderer } from "@openuidev/react-lang"
import { runLibraryAction } from "@/lib/modes/openui/iui/actions"
import { library } from "@/lib/modes/openui/library"
import "@/lib/modes/openui/styles"

export function OpenUIPane({ source }: { source: string }) {
  return <Renderer response={source} library={library} isStreaming={false} onAction={(event) => void runLibraryAction(event)} />
}
