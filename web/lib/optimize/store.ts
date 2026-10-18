import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import type { DocumentLang, GenerationMode } from "@shared/lang"
import type { Schema } from "@shared/sync/schema"
import type { RevisionFile } from "../modes/mode"
import { repoRoot } from "../repo-root"

export type Candidate = {
  id: string
  task: string
  mode: GenerationMode
  lang: DocumentLang
  title: string
  schema: Schema
  promptVersion: string
  model: string
  createdAt: number
}

export type Pair = {
  id: string
  task: string
  mode: GenerationMode
  a: string
  b: string
  createdAt: number
}

export const CHOICES = ["a", "b", "tie", "both_bad"] as const

export type Choice = (typeof CHOICES)[number]

export type JudgmentSide = {
  candidateId: string
  lang: DocumentLang
  title: string
  promptVersion: string
  model: string
  source: string
  screenshotUrl: string
}

export type Judgment = {
  id: string
  pairId: string
  createdAt: number
  task: string
  a: JudgmentSide
  b: JudgmentSide
  choice: Choice
  critique: string
}

const candidateId = /^cand_[a-z0-9]+$/
const CANDIDATE_FILES = new Set(["main.js", "main.css", "source.txt"])

function isCandidateId(value: string): boolean {
  return candidateId.test(value)
}

export function newId(prefix: string): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return prefix + Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")
}

export function optimizeStore(dir = path.join(repoRoot(), ".data", "optimize")) {
  const pairs = path.join(dir, "pairs.jsonl")
  const judgments = path.join(dir, "judgments.jsonl")
  const candidateDir = (id: string) => {
    if (!isCandidateId(id)) throw new Error("The candidate id is invalid.")
    return path.join(dir, "candidates", id)
  }
  return {
    dir,
    saveCandidate(candidate: Candidate, files: RevisionFile[]) {
      const target = candidateDir(candidate.id)
      mkdirSync(target, { recursive: true })
      for (const file of files) {
        if (CANDIDATE_FILES.has(file.name)) writeFileSync(path.join(target, file.name), file.body)
      }
      writeFileSync(path.join(target, "candidate.json"), `${JSON.stringify(candidate, null, 2)}\n`)
    },
    readCandidate(id: string): Candidate | null {
      if (!isCandidateId(id)) return null
      const file = path.join(candidateDir(id), "candidate.json")
      return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Candidate) : null
    },
    readCandidateFile(id: string, name: string): string | null {
      if (!isCandidateId(id) || !CANDIDATE_FILES.has(name)) return null
      const file = path.join(candidateDir(id), name)
      return existsSync(file) ? readFileSync(file, "utf8") : null
    },
    screenshotFile(id: string): string {
      return path.join(candidateDir(id), "screenshot.png")
    },
    appendPair(pair: Pair) {
      appendLine(pairs, pair)
    },
    readPairs(): Pair[] {
      return readLines<Pair>(pairs)
    },
    appendJudgment(judgment: Judgment) {
      appendLine(judgments, judgment)
    },
    readJudgments(): Judgment[] {
      return readLines<Judgment>(judgments)
    },
    savePrompt(version: string, text: string) {
      const file = path.join(dir, "prompts", `${version}.txt`)
      if (existsSync(file)) return
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, text)
    },
  }
}

export type OptimizeStore = ReturnType<typeof optimizeStore>

export function pendingPairs(pairs: Pair[], judgments: Judgment[]): Pair[] {
  const judged = new Set(judgments.map((judgment) => judgment.pairId))
  return pairs.filter((pair) => !judged.has(pair.id))
}

function appendLine(file: string, value: unknown) {
  mkdirSync(path.dirname(file), { recursive: true })
  appendFileSync(file, `${JSON.stringify(value)}\n`)
}

function readLines<T>(file: string): T[] {
  if (!existsSync(file)) return []
  const rows: T[] = []
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue
    try {
      rows.push(JSON.parse(line) as T)
    } catch {
      continue
    }
  }
  return rows
}
