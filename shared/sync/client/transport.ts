export type TransportData = string | Uint8Array

export type TransportHandlers = {
  open(): void
  message(data: TransportData): void
  close(): void
}

/** A reconnecting message pipe. Engines only see open/message/close in order. */
export interface Transport {
  setHandlers(handlers: TransportHandlers): void
  connect(): void
  send(data: TransportData): void
  destroy(): void
}

export class WebSocketTransport implements Transport {
  private ws: WebSocket | null = null
  private handlers: TransportHandlers | null = null
  private destroyed = false
  private attempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private url: string) {}

  setHandlers(handlers: TransportHandlers) {
    this.handlers = handlers
  }

  connect() {
    if (this.destroyed || this.ws) return
    const ws = new WebSocket(this.url)
    this.ws = ws
    ws.onopen = () => {
      this.attempts = 0
      this.handlers?.open()
    }
    ws.onmessage = (e) => {
      if (typeof e.data === "string") this.handlers?.message(e.data)
    }
    ws.onclose = () => {
      if (this.ws !== ws) return
      this.ws = null
      this.handlers?.close()
      this.scheduleReconnect()
    }
  }

  send(data: TransportData) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data)
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) return
    const base = Math.min(10_000, 250 * 2 ** this.attempts++)
    const delay = base * (0.5 + Math.random() * 0.5)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  destroy() {
    this.destroyed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    const ws = this.ws
    this.ws = null
    ws?.close()
  }
}
