const OPENABLE = /^(https?:|mailto:|tel:)/i

export function onOpenUIAction(event: { type: string; params?: Record<string, unknown> }) {
  if (event.type !== "open_url") return
  const url = typeof event.params?.url === "string" ? event.params.url.trim() : ""
  if (OPENABLE.test(url)) window.open(url, "_blank", "noopener,noreferrer")
}
