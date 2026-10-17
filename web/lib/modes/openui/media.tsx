import { useState } from "react"
import type { CSSProperties } from "react"

function resolvedSrc(uri?: string): string | undefined {
  if (!uri) return undefined
  if (/^(https?:|data:|blob:)/.test(uri)) return uri
  return undefined
}

export function createImg(usePlaceholderColor: () => string) {
  return function Img({ uri, style }: { uri?: string; style: CSSProperties }) {
    const placeholder = usePlaceholderColor()
    const [loaded, setLoaded] = useState(false)
    const src = resolvedSrc(uri)
    if (!src) return <div style={{ ...style, backgroundColor: placeholder }} />
    return (
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        style={{ ...style, objectFit: "cover", opacity: loaded ? 1 : 0, display: "block" }}
      />
    )
  }
}
