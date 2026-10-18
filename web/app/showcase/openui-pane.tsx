"use client"

import { Renderer } from "@openuidev/react-lang"
import { openuiLibrary } from "@/lib/modes/openui/library"

export function OpenUIPane({ source }: { source: string }) {
  return <Renderer response={source} library={openuiLibrary} isStreaming={false} />
}
