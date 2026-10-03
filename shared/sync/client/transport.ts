import type { NetworkControls } from "./engine"

export type TransportData = string | Uint8Array

export type TransportHandlers = {
  open(): void
  message(data: TransportData): void
  close(): void
}

/**
 * A reconnecting message pipe. Engines only see open/message/close in order;
 * the lab's artificial latency and offline switch live here so both engines
 * get them for free.
 */
export interface Transport extends NetworkControls {
  setHandlers(handlers: TransportHandlers): void
  connect(): void
  send(data: TransportData): void
  destroy(): void
}

type Inbound = { type: "open" } | { type: "message"; data: TransportData } | { type: "close" }

export class WebSocketTransport implements Transport {
  private ws: WebSocket | null = null
  private handlers: TransportHandlers | null = null
  private latency = 0
  private offline = false
  private destroyed = false
  private attempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private lastOutAt = 0
  private lastInAt = 0

  constructor(private url: string) {}

  setHandlers(handlers: TransportHandlers) {
    this.handlers = handlers
  }

  connect() {
    if (this.destroyed || this.offline || this.ws) return
    const ws = new WebSocket(this.url)
    ws.binaryType = "arraybuffer"
    this.ws = ws
    ws.onopen = () => {
      this.attempts = 0
      this.deliver({ type: "open" })
    }
    ws.onmessage = (e) => {
      const data = typeof e.data === "string" ? e.data : new Uint8Array(e.data as ArrayBuffer)
      this.deliver({ type: "message", data })
    }
    ws.onclose = () => {
      if (this.ws !== ws) return
      this.ws = null
      this.deliver({ type: "close" })
      this.scheduleReconnect()
    }
  }

  /** Delayed sends keep their order: each fires no earlier than the previous one. */
  send(data: TransportData) {
    const ws = this.ws
    if (!ws) return
    const at = Math.max(Date.now() + this.latency, this.lastOutAt)
    this.lastOutAt = at
    const fire = () => {
      if (this.ws === ws && ws.readyState === WebSocket.OPEN) ws.send(data)
    }
    if (at <= Date.now()) fire()
    else setTimeout(fire, at - Date.now())
  }

  private deliver(event: Inbound) {
    const at = Math.max(Date.now() + this.latency, this.lastInAt)
    this.lastInAt = at
    const fire = () => {
      if (this.destroyed || !this.handlers) return
      if (event.type === "open") this.handlers.open()
      else if (event.type === "message") this.handlers.message(event.data)
      else this.handlers.close()
    }
    if (at <= Date.now()) fire()
    else setTimeout(fire, at - Date.now())
  }

  private scheduleReconnect() {
    if (this.destroyed || this.offline || this.reconnectTimer) return
    const base = Math.min(10_000, 250 * 2 ** this.attempts++)
    const delay = base * (0.5 + Math.random() * 0.5)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  getLatency = () => this.latency
  setLatency = (ms: number) => {
    this.latency = Math.max(0, ms)
  }
  isOffline = () => this.offline
  setOffline = (offline: boolean) => {
    if (offline === this.offline) return
    this.offline = offline
    if (offline) {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
      this.ws?.close(4000, "offline")
    } else {
      this.attempts = 0
      this.connect()
    }
  }

  destroy() {
    this.destroyed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    const ws = this.ws
    this.ws = null
    ws?.close()
  }
}
