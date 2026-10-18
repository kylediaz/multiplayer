"use client"

import { Renderer } from "@openuidev/react-lang"
import { kitLibrary } from "@/lib/modes/openui/library"

export function OpenUIPane({ source }: { source: string }) {
  return <Renderer response={source} library={kitLibrary} isStreaming={false} />
}
