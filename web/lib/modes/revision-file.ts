import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { repoRoot } from "../repo-root"

const revisionId = /^rev_[a-z0-9]+$/

export function readRevisionFile(revision: string, name: string): string | null {
  if (!revisionId.test(revision) || name.includes("/") || name.includes("\\")) return null
  const file = path.join(repoRoot(), ".data", "views", revision, name)
  if (!existsSync(file)) return null
  return readFileSync(file, "utf8")
}
