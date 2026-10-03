import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"
import postcss from "postcss"
import tailwindcss from "@tailwindcss/postcss"

const require = createRequire(path.join(repoRoot(), "package.json"))
const webDir = path.join(repoRoot(), "web")
const uiEntry = path.join(webDir, "lib/guest-ui.tsx")

const SYNC = `import { useEffect, useRef, useState } from "react"

type HostMessage = { type?: string; values?: Record<string, unknown> }

function subscribe(key: string, apply: (value: unknown) => void) {
  window.host.onMessage((message: HostMessage) => {
    if (message.type !== "keys" || !message.values || !Object.prototype.hasOwnProperty.call(message.values, key)) return
    apply(message.values[key])
  })
  window.host.post({ type: "subscribe", key })
}

export function useText(key: string): [string, (next: string) => void] {
  const [value, setValue] = useState("")
  const writing = useRef(0)
  useEffect(() => subscribe(key, (next) => {
    if (Date.now() - writing.current < 400) return
    setValue(typeof next === "string" ? next : "")
  }), [key])
  return [value, (next) => {
    writing.current = Date.now()
    setValue(next)
    window.host.post({ type: "text", key, next })
  }]
}

export function useRegister<T>(key: string): [T | null, (value: T | null) => void] {
  const [value, setValue] = useState<T | null>(null)
  const writing = useRef(0)
  useEffect(() => subscribe(key, (next) => {
    if (Date.now() - writing.current < 400) return
    setValue((next ?? null) as T | null)
  }), [key])
  return [value, (next) => {
    writing.current = Date.now()
    setValue(next)
    window.host.post({ type: "set", key, value: next })
  }]
}
`

const ENTRY = `import { createRoot } from "react-dom/client"
import App from "app"

const root = document.getElementById("root")
if (root) createRoot(root).render(<App />)
`

const ALLOWED = new Set(["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"])

export async function compileGuest(source: string): Promise<{ js: string; css: string }> {
  const [js, css] = await Promise.all([bundleGuest(source), compileGuestCss(source)])
  return { js, css }
}

async function bundleGuest(source: string): Promise<string> {
  const result = await esbuild.build({
    stdin: { contents: ENTRY, loader: "tsx", resolveDir: repoRoot(), sourcefile: "entry.tsx" },
    bundle: true,
    format: "iife",
    platform: "browser",
    write: false,
    jsx: "automatic",
    target: "es2022",
    logLevel: "silent",
    plugins: [
      {
        name: "guest",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.path.startsWith("node:") && fromGuest(args)) return { errors: [{ text: `Cannot import "${args.path}".` }] }
            if (args.path === "sync" || args.path === "app") return { path: args.path, namespace: "guest" }
            if (args.path === "ui") return { path: uiEntry }
            if (args.path.startsWith("@/")) {
              if (fromGuest(args)) return { errors: [{ text: `Cannot import "${args.path}".` }] }
              const resolved = resolveWeb(args.path.slice(2))
              return resolved ? { path: resolved } : { errors: [{ text: `Cannot resolve "${args.path}".` }] }
            }
            if (!fromGuest(args)) return undefined
            if (ALLOWED.has(args.path)) return { path: require.resolve(args.path) }
            return { errors: [{ text: `Cannot import "${args.path}".` }] }
          })
          build.onLoad({ filter: /.*/, namespace: "guest" }, (args) => ({
            contents: args.path === "sync" ? SYNC : source,
            loader: "tsx",
          }))
        },
      },
    ],
  })
  return result.outputFiles[0].text
}

function fromGuest(args: { namespace: string; importer: string }): boolean {
  return (
    args.namespace === "guest" ||
    args.importer === "app" ||
    args.importer === "sync" ||
    !args.importer ||
    args.importer.includes("entry.tsx")
  )
}

function resolveWeb(rel: string): string | null {
  const base = path.join(webDir, rel)
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

async function compileGuestCss(source: string): Promise<string> {
  const dir = mkdtempSync(path.join(tmpdir(), "guest-css-"))
  const file = path.join(dir, "app.tsx")
  writeFileSync(file, source)
  try {
    const input = `@import ${JSON.stringify(path.join(webDir, "app/globals.css"))};\n@source ${JSON.stringify(file)};\n`
    const result = await postcss([tailwindcss()]).process(input, { from: path.join(webDir, "app/guest.css") })
    return result.css
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function repoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [process.cwd(), path.resolve(process.cwd(), ".."), path.resolve(here, "../..")]
  return candidates.find((dir) => existsSync(path.join(dir, "api", "index.ts"))) ?? process.cwd()
}
