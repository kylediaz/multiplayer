import type { Transport, TransportData, TransportHandlers } from "../client/transport"
import type { Rng } from "./rng"

export type ServerSide = {
  connect(toClient: (data: TransportData) => void, close: () => void): {
    message(data: TransportData): void
    close(): void
  }
}

/**
 * An in-memory Transport on fake timers. Each direction preserves order but
 * gets random latency. Disconnecting drops everything still in flight, which
 * is harsher than TCP (where sent bytes would still arrive) and so a better
 * test of resend and dedupe.
 */
export class SimTransport implements Transport {
  private handlers: TransportHandlers | null = null
  private epoch = 0
  private server: ReturnType<ServerSide["connect"]> | null = null
  private lastOut = 0
  private lastIn = 0
  private offline = false
  private latency: number

  constructor(
    private side: ServerSide,
    private r: Rng,
    maxLatency = 40
  ) {
    this.latency = maxLatency
  }

  setHandlers(handlers: TransportHandlers) {
    this.handlers = handlers
  }

  private delay(last: "lastOut" | "lastIn") {
    const at = Math.max(Date.now() + this.r.int(this.latency + 1), this[last])
    this[last] = at
    return at - Date.now()
  }

  connect() {
    if (this.offline || this.server) return
    const epoch = ++this.epoch
    setTimeout(() => {
      if (this.epoch === epoch) this.handlers?.open()
    }, this.delay("lastIn"))
    this.server = this.side.connect(
      (data) => {
        setTimeout(() => {
          if (this.epoch === epoch) this.handlers?.message(data)
        }, this.delay("lastIn"))
      },
      () => this.disconnect()
    )
  }

  send(data: TransportData) {
    const server = this.server
    if (!server) return
    const epoch = this.epoch
    setTimeout(() => {
      if (this.epoch === epoch && this.server === server) server.message(data)
    }, this.delay("lastOut"))
  }

  disconnect() {
    const server = this.server
    if (!server) return
    this.server = null
    this.epoch++
    setTimeout(() => server.close(), this.r.int(this.latency + 1))
    this.handlers?.close()
    if (!this.offline) setTimeout(() => this.connect(), 100)
  }

  getLatency = () => this.latency
  setLatency = (ms: number) => {
    this.latency = ms
  }
  isOffline = () => this.offline
  setOffline = (offline: boolean) => {
    this.offline = offline
    if (offline) this.disconnect()
    else this.connect()
  }

  destroy() {
    this.offline = true
    this.disconnect()
  }
}
