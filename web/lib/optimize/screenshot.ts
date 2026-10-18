import { existsSync } from "node:fs"
import { chromium, type Browser, type Frame, type Page } from "playwright-core"
import type { DocumentLang } from "@shared/lang"
import { optimizeStore, type OptimizeStore } from "./store"

const WIDTH = 390
const HEIGHT = 844
const MAX_HEIGHT = 8000
const TIMEOUT = 30_000

const shared = globalThis as typeof globalThis & {
  optimizeBrowser?: Promise<Browser>
  optimizeCaptures?: Map<string, Promise<string>>
}

function screenshotUrl(candidateId: string): string {
  return `/api/optimize/candidates/${candidateId}/screenshot.png`
}

type CaptureInput = { origin: string; candidateId: string; lang: DocumentLang }

export async function captureScreenshot(input: CaptureInput, store: OptimizeStore = optimizeStore()): Promise<string> {
  const file = store.screenshotFile(input.candidateId)
  if (existsSync(file)) return screenshotUrl(input.candidateId)
  const captures = (shared.optimizeCaptures ??= new Map())
  const running = captures.get(input.candidateId)
  if (running) return running
  const capture = capture_(input, file).finally(() => captures.delete(input.candidateId))
  captures.set(input.candidateId, capture)
  return capture
}

async function capture_(input: CaptureInput, file: string): Promise<string> {
  const browser = await launch()
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 3 })
  try {
    const page = await context.newPage()
    page.setDefaultTimeout(TIMEOUT)
    await page.goto(`${input.origin}/optimize/view/${input.candidateId}`, { waitUntil: "load" })
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" })
    const height = input.lang === "react" ? await settleReact(page) : await settleOpenUI(page)
    await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(height, HEIGHT), MAX_HEIGHT) })
    await page.waitForTimeout(300)
    await page.locator("[data-phone]").screenshot({ path: file, animations: "disabled" })
    return screenshotUrl(input.candidateId)
  } finally {
    await context.close()
  }
}

async function settleReact(page: Page): Promise<number> {
  const handle = await page.waitForSelector("[data-phone] iframe")
  const frame = await handle.contentFrame()
  if (!frame) throw new Error("The view frame did not load.")
  await frame.waitForFunction(() => (document.querySelector("#root")?.childElementCount ?? 0) > 0)
  await settled(frame)
  return frame.evaluate(() => document.documentElement.scrollHeight)
}

async function settleOpenUI(page: Page): Promise<number> {
  await page.waitForFunction(() => {
    const phone = document.querySelector("[data-phone]")
    return phone instanceof HTMLElement && phone.innerText.trim().length > 0
  })
  await settled(page.mainFrame())
  return page.evaluate(() => {
    const phone = document.querySelector("[data-phone]")
    if (!phone) return 0
    return Math.max(...[phone, ...phone.querySelectorAll("*")].map((el) => el.scrollHeight))
  })
}

async function settled(frame: Frame) {
  await frame.waitForFunction(() => document.fonts.status === "loaded")
  await frame
    .waitForFunction(() => Array.from(document.images).every((image) => image.complete), undefined, { timeout: 10_000 })
    .catch(() => undefined)
  await frame.waitForTimeout(500)
}

function launch(): Promise<Browser> {
  const existing = shared.optimizeBrowser
  if (existing) return existing.then((browser) => (browser.isConnected() ? browser : relaunch()))
  return relaunch()
}

function relaunch(): Promise<Browser> {
  const browser = chromium.launch({ channel: "chrome", headless: true })
  shared.optimizeBrowser = browser
  browser.catch(() => {
    if (shared.optimizeBrowser === browser) shared.optimizeBrowser = undefined
  })
  return browser
}
