"use client"

import { useIsStreaming } from "@openuidev/react-lang"
import { useEffect, useMemo, useRef, useState } from "react"
import { useColorScheme } from "./scheme"

const CDNS = "https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://esm.sh"
const CSP = [
  "default-src 'none'",
  `script-src 'unsafe-inline' ${CDNS}`,
  `style-src 'unsafe-inline' ${CDNS} https://fonts.googleapis.com`,
  "font-src https://fonts.gstatic.com data:",
  "img-src data: blob: https:",
  "media-src data: blob:",
  `connect-src ${CDNS}`,
  "frame-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ")

const MIN_HEIGHT = 80
const MAX_HEIGHT = 2400
const AUTO_START = 360

const REPORTER = `<script>(function(){var last=0;function send(){var h=Math.ceil(document.documentElement.getBoundingClientRect().height);if(Math.abs(h-last)>1){last=h;parent.postMessage({type:"iui-html-view-height",height:h},"*")}}addEventListener("message",function(e){if(e.source===parent&&e.data==="iui-html-view-measure"){last=0;send()}});addEventListener("load",send);new ResizeObserver(send).observe(document.documentElement);send()})()</script>`

function documentFor(html: string, scheme: "light" | "dark") {
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:${scheme}}html,body{margin:0}body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}</style>${REPORTER}${html}`
}

export function HtmlViewView({ props }: { props: { html?: string; height?: number; title?: string } }) {
  const streaming = useIsStreaming()
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const scheme = useColorScheme(box)
  const fixed = typeof props.height === "number" && props.height > 0 ? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, props.height)) : null
  const [measured, setMeasured] = useState<number | null>(null)
  const html = typeof props.html === "string" ? props.html : ""
  const srcDoc = useMemo(() => documentFor(html, scheme), [html, scheme])

  useEffect(() => {
    if (fixed) return
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return
      const data = event.data as { type?: unknown; height?: unknown }
      if (data?.type === "iui-html-view-height" && typeof data.height === "number" && Number.isFinite(data.height)) {
        setMeasured(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, data.height)))
      }
    }
    window.addEventListener("message", onMessage)
    frame.current?.contentWindow?.postMessage("iui-html-view-measure", "*")
    return () => window.removeEventListener("message", onMessage)
  }, [fixed])

  const height = fixed ?? measured ?? AUTO_START
  return (
    <div ref={box} className="relative w-full min-w-0 overflow-hidden rounded-lg border border-border bg-background [&>iframe]:block [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0 [&>iframe]:bg-transparent" style={{ height }}>
      {streaming ? (
        <div className="grid h-full place-items-center text-[13px] text-muted-foreground">Preparing the interactive view…</div>
      ) : (
        <iframe ref={frame} title={props.title || "Interactive view"} sandbox="allow-scripts" srcDoc={srcDoc} referrerPolicy="no-referrer" loading="lazy" />
      )}
    </div>
  )
}
