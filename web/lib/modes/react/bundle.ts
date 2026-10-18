import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"
import postcss from "postcss"
import tailwindcss from "@tailwindcss/postcss"
import { repoRoot } from "../../repo-root"

const require = createRequire(path.join(repoRoot(), "package.json"))
const dir = path.dirname(fileURLToPath(import.meta.url))
const webDir = path.join(repoRoot(), "web")
const syncEntry = path.join(webDir, "lib/view-sync.ts")
const uiEntry = path.join(dir, "ui.tsx")

const ENTRY = `import { createRoot } from "react-dom/client"
import App from "app"

const root = document.getElementById("root")
if (root) createRoot(root).render(<App />)
`

const ALLOWED = new Set(["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"])

export async function bundleReact(source: string): Promise<{ ok: true; js: string; css: string } | { ok: false; problems: string[] }> {
  const [js, css] = await Promise.allSettled([bundleJs(source), bundleCss(source)])
  const problems = [...settledProblems(js), ...settledProblems(css)]
  if (js.status === "rejected" || css.status === "rejected") {
    return { ok: false, problems: problems.length ? problems : ["The app failed to compile."] }
  }
  return { ok: true, js: js.value, css: css.value }
}

async function bundleJs(source: string): Promise<string> {
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
        name: "view",
        setup(build) {
          build.onResolve({ filter: /\.css$/ }, (args) => ({ path: args.path, namespace: "css-stub" }))
          build.onLoad({ filter: /.*/, namespace: "css-stub" }, () => ({ contents: "", loader: "js" }))
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.path.startsWith("node:") && fromView(args)) return { errors: [{ text: `Cannot import "${args.path}".` }] }
            if (args.path === "sync") return { path: syncEntry }
            if (args.path === "app") return { path: args.path, namespace: "view" }
            if (args.path === "ui") return { path: uiEntry }
            if (args.path.startsWith("@/")) {
              if (fromView(args)) return { errors: [{ text: `Cannot import "${args.path}".` }] }
              const resolved = resolveWeb(args.path.slice(2))
              return resolved ? { path: resolved } : { errors: [{ text: `Cannot resolve "${args.path}".` }] }
            }
            if (!fromView(args)) return undefined
            if (ALLOWED.has(args.path)) return { path: require.resolve(args.path) }
            return { errors: [{ text: `Cannot import "${args.path}".` }] }
          })
          build.onLoad({ filter: /.*/, namespace: "view" }, () => ({ contents: source, loader: "tsx" }))
        },
      },
    ],
  })
  return result.outputFiles[0].text
}

function settledProblems(result: PromiseSettledResult<string>): string[] {
  if (result.status === "fulfilled") return []
  return problemMessages(result.reason)
}

function problemMessages(err: unknown): string[] {
  if (isBuildFailure(err)) {
    const messages = err.errors.flatMap((message) => [formatMessage(message), ...message.notes.map(formatMessage)])
    if (messages.length) return messages
  }
  const message = err instanceof Error ? err.message : "The app failed to compile."
  const text = message.replace(/\u001b\[[0-9;]*m/g, "").trim()
  return [text || "The app failed to compile."]
}

function isBuildFailure(err: unknown): err is { errors: esbuild.Message[] } {
  return typeof err === "object" && err !== null && "errors" in err && Array.isArray(err.errors)
}

function formatMessage(message: { text: string; location: esbuild.Location | null }): string {
  const loc = message.location
  if (!loc) return message.text
  const file = loc.file.replace(/^view:/, "")
  const where = file === "app" || file === "entry.tsx" ? "" : `${file}:`
  return `${where}${loc.line}:${loc.column}: ${message.text}`
}

function fromView(args: { namespace: string; importer: string }): boolean {
  return (
    args.namespace === "view" ||
    args.importer === "app" ||
    args.importer === "sync" ||
    !args.importer ||
    args.importer.includes("entry.tsx")
  )
}

function resolveWeb(rel: string): string | null {
  const base = path.join(webDir, rel)
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

async function bundleCss(source: string): Promise<string> {
  const temp = mkdtempSync(path.join(tmpdir(), "view-css-"))
  const file = path.join(temp, "app.tsx")
  writeFileSync(file, source)
  try {
    const input = [
      `@import ${JSON.stringify(path.join(webDir, "app/globals.css"))};`,
      `@source ${JSON.stringify(path.join(webDir, "lib/modes/common/kit"))};`,
      `@source ${JSON.stringify(file)};`,
    ].join("\n")
    const result = await postcss([tailwindcss()]).process(input, { from: path.join(webDir, "app/view.css") })
    return result.css
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
}
