import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export function repoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [process.cwd(), path.resolve(process.cwd(), ".."), path.resolve(here, "../..")]
  return candidates.find((dir) => existsSync(path.join(dir, "api", "index.ts"))) ?? process.cwd()
}
