import { mkdirSync } from "node:fs"
import path from "node:path"
import type { ServerWebSocket } from "bun"
import { DataplaneDb } from "./db"
import { Document, type Conn } from "./document"
import { parseClientMessage, type ClientMessage, type ServerMessage } from "../shared/sync/protocol"
import { parseSchema } from "../shared/sync/schema"

const port = Number(process.env.PORT ?? 3003)
const origins = (process.env.NEXT_ORIGIN ?? "http://localhost:3002,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const dataDir = path.join(process.cwd(), ".data")
const viewsDir = path.join(dataDir, "views")
const db = new DataplaneDb(path.join(dataDir, "dataplane.db"))

type SocketData = { docId: string; clientId?: string; conn?: Conn }
const openDocuments = new Map<string, Document>()
const emptyTimers = new Map<string, ReturnType<typeof setTimeout>>()

function allowOrigin(request: Request): string | null {
  const origin = request.headers.get("origin")
  if (!origin) return origins[0] ?? "*"
  return origins.includes(origin) ? origin : null
}

function json(request: Request, body: unknown, status = 200): Response {
  const origin = allowOrigin(request)
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (origin) {
    headers["access-control-allow-origin"] = origin
    headers.vary = "origin"
  }
  return new Response(JSON.stringify(body), { status, headers })
}

function publicDocument(doc: NonNullable<ReturnType<DataplaneDb["getDocument"]>>, version: number) {
  return {
    id: doc.id,
    title: doc.title,
    schema: doc.schema,
    viewRevision: doc.viewRevision,
    headVersion: version,
  }
}

function loadDocument(docId: string): Document | null {
  const existing = openDocuments.get(docId)
  if (existing) return existing
  const doc = db.getDocument(docId)
  if (!doc) return null
  const document = new Document({ docId, schema: doc.schema, store: db })
  document.onEmpty = () => {
    const timer = setTimeout(() => {
      emptyTimers.delete(docId)
      if (document.size === 0 && openDocuments.get(docId) === document) {
        document.snapshot()
        openDocuments.delete(docId)
      }
    }, 5000)
    emptyTimers.set(docId, timer)
  }
  openDocuments.set(docId, document)
  return document
}

function viewHtml(parentOrigin: string): string {
  const origin = JSON.stringify(parentOrigin)
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./main.css">
<style>
  html {
    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
    --font-geist-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    -webkit-font-smoothing: antialiased;
  }
</style>
</head>
<body>
<div id="root"></div>
<script>
const parentOrigin = ${origin};
window.host = {
  post(message) { parent.postMessage({ ...message, source: "view" }, parentOrigin); },
  onMessage(callback) {
    window.addEventListener("message", (event) => {
      if (event.origin !== parentOrigin) return;
      const data = event.data;
      if (!data || data.source !== "shell") return;
      callback(data);
    });
  }
};
window.host.onMessage((message) => {
  if (message.type !== "ready" || document.querySelector("script[data-view]")) return;
  const script = document.createElement("script");
  script.src = "./main.js";
  script.dataset.view = "true";
  document.body.append(script);
});
</script>
</body>
</html>`
}

function contentType(file: string): string {
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8"
  if (file.endsWith(".css")) return "text/css; charset=utf-8"
  if (file.endsWith(".html")) return "text/html; charset=utf-8"
  if (file.endsWith(".svg")) return "image/svg+xml"
  if (file.endsWith(".png")) return "image/png"
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg"
  if (file.endsWith(".webp")) return "image/webp"
  return "application/octet-stream"
}

function viewFile(revisionId: string, rel: string): string | null {
  if (!/^rev_[a-z0-9]+$/.test(revisionId)) return null
  const clean = rel.split("/").filter((part) => part && part !== "." && part !== "..").join("/")
  const root = path.resolve(viewsDir, revisionId)
  const target = path.resolve(root, clean)
  if (target !== root && !target.startsWith(root + path.sep)) return null
  return target
}

async function serveView(request: Request, revisionId: string, rel: string): Promise<Response> {
  const requested = new URL(request.url).searchParams.get("parent")
  const origin =
    (requested && origins.includes(requested) ? requested : null) ?? allowOrigin(request) ?? origins[0] ?? "http://localhost:3002"
  const headers: Record<string, string> = { "content-security-policy": `frame-ancestors ${origins.join(" ")}` }
  if (rel === "" || rel === "index.html") {
    headers["content-type"] = "text/html; charset=utf-8"
    return new Response(viewHtml(origin), { headers })
  }
  const filePath = viewFile(revisionId, rel)
  if (!filePath) return new Response("not found", { status: 404 })
  const file = Bun.file(filePath)
  if (!(await file.exists())) return new Response("not found", { status: 404 })
  headers["content-type"] = contentType(filePath)
  return new Response(file, { headers })
}

function id(prefix: string): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return prefix + Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")
}

async function publishView(request: Request, docId: string): Promise<Response> {
  const doc = db.getDocument(docId)
  if (!doc) return json(request, { error: "not found" }, 404)
  const form = await request.formData()
  const revisionId = id("rev_")
  const dir = path.join(viewsDir, revisionId)
  mkdirSync(path.join(dir, "assets"), { recursive: true })
  let hasMain = false
  for (const entry of form.values()) {
    const file = entry as { name?: string; arrayBuffer?: () => Promise<ArrayBuffer> }
    if (typeof file.name !== "string" || typeof file.arrayBuffer !== "function") continue
    const name = path.basename(file.name)
    if (!name || name.startsWith(".")) continue
    const target = name === "main.js" || name === "main.css" ? path.join(dir, name) : path.join(dir, "assets", name)
    if (name === "main.js") hasMain = true
    await Bun.write(target, await file.arrayBuffer())
  }
  if (!hasMain) return json(request, { error: "main.js is required" }, 400)
  db.addRevision({ id: revisionId, docId, schema: doc.schema })
  return json(request, { revisionId })
}

const server = Bun.serve<SocketData>({
  port,
  async fetch(request, bun) {
    const url = new URL(request.url)
    if (request.method === "OPTIONS") {
      const origin = allowOrigin(request)
      if (!origin) return new Response(null, { status: 403 })
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
          "access-control-allow-headers": "content-type",
          vary: "origin",
        },
      })
    }

    const sync = url.pathname.match(/^\/v1\/documents\/([^/]+)\/sync$/)
    if (sync && request.method === "GET") {
      const origin = request.headers.get("origin")
      if (origin && !origins.includes(origin)) return new Response("forbidden", { status: 403 })
      const docId = decodeURIComponent(sync[1])
      if (!loadDocument(docId)) return new Response("not found", { status: 404 })
      if (bun.upgrade(request, { data: { docId } })) return
      return new Response("upgrade failed", { status: 400 })
    }

    const current = url.pathname.match(/^\/v1\/documents\/([^/]+)\/views\/current\/(.*)$/)
    if (current && request.method === "GET") {
      const doc = db.getDocument(decodeURIComponent(current[1]))
      if (!doc?.viewRevision) return new Response("not found", { status: 404 })
      return serveView(request, doc.viewRevision, current[2])
    }

    const revision = url.pathname.match(/^\/v1\/views\/([^/]+)\/(.*)$/)
    if (revision && request.method === "GET") return serveView(request, revision[1], revision[2])

    if (url.pathname === "/v1/documents" && request.method === "POST") {
      let body: { title?: unknown; schema?: unknown }
      try {
        body = await request.json()
      } catch {
        return json(request, { error: "invalid json" }, 400)
      }
      if (typeof body.title !== "string" || !body.title.trim()) return json(request, { error: "title is required" }, 400)
      let schema
      try {
        schema = parseSchema(body.schema)
      } catch (err) {
        return json(request, { error: err instanceof Error ? err.message : "invalid schema" }, 400)
      }
      const doc = db.createDocument({ id: id("doc_"), title: body.title.trim(), schema })
      return json(request, publicDocument(doc, 0), 201)
    }

    const one = url.pathname.match(/^\/v1\/documents\/([^/]+)$/)
    if (one && request.method === "GET") {
      const docId = decodeURIComponent(one[1])
      const doc = db.getDocument(docId)
      if (!doc) return json(request, { error: "not found" }, 404)
      const document = openDocuments.get(docId)
      return json(request, publicDocument(doc, document?.version ?? doc.headVersion))
    }

    const schemaRoute = url.pathname.match(/^\/v1\/documents\/([^/]+)\/schema$/)
    if (schemaRoute && request.method === "PUT") {
      const docId = decodeURIComponent(schemaRoute[1])
      const doc = db.getDocument(docId)
      if (!doc) return json(request, { error: "not found" }, 404)
      let body: { schema?: unknown }
      try {
        body = await request.json()
      } catch {
        return json(request, { error: "invalid json" }, 400)
      }
      let schema
      try {
        schema = parseSchema(body.schema)
      } catch (err) {
        return json(request, { error: err instanceof Error ? err.message : "invalid schema" }, 400)
      }
      db.updateSchema(docId, schema)
      openDocuments.get(docId)?.setSchema(schema)
      const next = db.getDocument(docId)!
      return json(request, publicDocument(next, openDocuments.get(docId)?.version ?? next.headVersion))
    }

    const views = url.pathname.match(/^\/v1\/documents\/([^/]+)\/views$/)
    if (views && request.method === "POST") return publishView(request, decodeURIComponent(views[1]))

    return json(request, { error: "not found" }, 404)
  },
  websocket: {
    message(ws: ServerWebSocket<SocketData>, message) {
      let parsed: ClientMessage | null
      try {
        const text = typeof message === "string" ? message : new TextDecoder().decode(message)
        parsed = parseClientMessage(JSON.parse(text))
      } catch {
        parsed = null
      }
      if (!parsed) {
        ws.send(JSON.stringify({ type: "error", message: "invalid message" } satisfies ServerMessage))
        return
      }
      const document = openDocuments.get(ws.data.docId)
      if (!document) {
        ws.send(JSON.stringify({ type: "error", message: "document is not loaded" } satisfies ServerMessage))
        return
      }
      if (parsed.type === "hello") {
        if (parsed.docId !== ws.data.docId) {
          ws.send(JSON.stringify({ type: "error", message: "document mismatch" } satisfies ServerMessage))
          return
        }
        const pending = emptyTimers.get(ws.data.docId)
        if (pending) {
          clearTimeout(pending)
          emptyTimers.delete(ws.data.docId)
        }
        const conn: Conn = {
          send: (msg) => ws.send(JSON.stringify(msg)),
          close: () => ws.close(),
        }
        ws.data.clientId = parsed.clientId
        ws.data.conn = conn
        document.join(conn, parsed)
        return
      }
      if (!ws.data.clientId || !ws.data.conn) {
        ws.send(JSON.stringify({ type: "error", message: "hello required" } satisfies ServerMessage))
        return
      }
      document.receive(ws.data.conn, ws.data.clientId, parsed)
    },
    close(ws) {
      if (!ws.data.clientId || !ws.data.conn) return
      openDocuments.get(ws.data.docId)?.leave(ws.data.conn, ws.data.clientId)
    },
  },
})

console.log(`dataplane listening on http://localhost:${server.port}`)
