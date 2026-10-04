import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"
import postcss from "postcss"
import tailwindcss from "@tailwindcss/postcss"

const require = createRequire(path.join(repoRoot(), "package.json"))
const webDir = path.join(repoRoot(), "web")
const uiEntry = path.join(webDir, "lib/view-ui.tsx")
const syncEntry = path.join(webDir, "lib/view-sync.ts")

const ENTRY = `import { createRoot } from "react-dom/client"
import App from "app"

const root = document.getElementById("root")
if (root) createRoot(root).render(<App />)
`

const ALLOWED = new Set(["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"])

export async function compileView(source: string): Promise<{ js: string; css: string }> {
  const [js, css] = await Promise.all([bundleView(source), compileViewCss(source)])
  return { js, css }
}

async function bundleView(source: string): Promise<string> {
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
          build.onLoad({ filter: /.*/, namespace: "view" }, () => ({
            contents: source,
            loader: "tsx",
          }))
        },
      },
    ],
  })
  return result.outputFiles[0].text
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

async function compileViewCss(source: string): Promise<string> {
  const dir = mkdtempSync(path.join(tmpdir(), "view-css-"))
  const file = path.join(dir, "app.tsx")
  writeFileSync(file, source)
  try {
    const input = `@import ${JSON.stringify(path.join(webDir, "app/globals.css"))};\n@source ${JSON.stringify(file)};\n`
    const result = await postcss([tailwindcss()]).process(input, { from: path.join(webDir, "app/view.css") })
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
