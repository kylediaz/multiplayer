"use client"

import { useSyncExternalStore } from "react"

export type Color = "gray" | "purple" | "green" | "yellow" | "cyan" | "pink" | "blue" | "orange" | "red"
export type CategoryPalette = Readonly<Record<Color, string>>

export type CanvasPalette = {
  readonly foreground: string
  readonly foregroundSecondary: string
  readonly foregroundTertiary: string
  readonly foregroundQuaternary: string
  readonly editor: string
  readonly chrome: string
  readonly sidebar: string
  readonly elevated: string
  readonly fillPrimary: string
  readonly fillSecondary: string
  readonly fillTertiary: string
  readonly fillQuaternary: string
  readonly strokePrimary: string
  readonly strokeSecondary: string
  readonly strokeTertiary: string
  readonly strokeFocused: string
  readonly accent: string
  readonly buttonBackground: string
  readonly buttonForeground: string
  readonly buttonHoverBackground: string
  readonly link: string
  readonly diffInsertedLine: string
  readonly diffRemovedLine: string
  readonly diffStripAdded: string
  readonly diffStripRemoved: string
}

export type CanvasTokens = {
  bg: { editor: string; chrome: string; elevated: string }
  text: { primary: string; secondary: string; tertiary: string; quaternary: string; link: string; onAccent: string }
  stroke: { primary: string; secondary: string; tertiary: string; focused: string }
  fill: { primary: string; secondary: string; tertiary: string; quaternary: string }
  accent: { primary: string; control: string; controlHover: string }
  diff: { insertedLine: string; removedLine: string; stripAdded: string; stripRemoved: string }
  category: CategoryPalette
}

export type CanvasHostTheme = CanvasTokens & {
  readonly kind: string
  readonly tokens: CanvasTokens
  readonly palette: CanvasPalette
  readonly radius: typeof canvasRadius
  readonly typography: typeof canvasTypography
  readonly chart: { readonly palette: ChartPalette; readonly sequence: readonly string[] }
}

export type ChartPalette = {
  readonly green: string
  readonly darkGreen: string
  readonly lightGreen: string
  readonly mintGreen: string
  readonly blue: string
  readonly lightBlue: string
  readonly indigo: string
  readonly lightIndigo: string
  readonly purple: string
  readonly lightPurple: string
  readonly warmPink: string
  readonly lightPink: string
  readonly brightOrange: string
  readonly deepOrange: string
  readonly goldenYellow: string
  readonly darkAmber: string
  readonly warmPeach: string
  readonly vibrantTeal: string
  readonly muted: string
  readonly neutralLine: string
}

const mix = (hex: string, percent: number) => `${hex}${Math.round((percent / 100) * 255).toString(16).padStart(2, "0")}`

function palette(base: string, surfaces: { editor: string; chrome: string; sidebar: string }, accent: string, onAccent: string): CanvasPalette {
  return {
    foreground: base,
    foregroundSecondary: mix(base, 74),
    foregroundTertiary: mix(base, 60),
    foregroundQuaternary: mix(base, 36),
    editor: surfaces.editor,
    chrome: surfaces.chrome,
    sidebar: surfaces.sidebar,
    elevated: surfaces.editor,
    fillPrimary: mix(base, 20),
    fillSecondary: mix(base, 14),
    fillTertiary: mix(base, 8),
    fillQuaternary: mix(base, 6),
    strokePrimary: mix(base, 20),
    strokeSecondary: mix(base, 12),
    strokeTertiary: mix(base, 8),
    strokeFocused: accent,
    accent,
    buttonBackground: accent,
    buttonForeground: onAccent,
    buttonHoverBackground: accent,
    link: accent,
    diffInsertedLine: mix("#1F8A65", 16),
    diffRemovedLine: mix("#C04848", 16),
    diffStripAdded: "#1F8A65",
    diffStripRemoved: "#C04848",
  }
}

export const canvasPaletteDark = palette("#F0F0F0", { editor: "#181818", chrome: "#141414", sidebar: "#141414" }, "#599CE7", "#0E0E0E")
export const canvasPaletteLight = palette("#141414", { editor: "#FCFCFC", chrome: "#F3F3F3", sidebar: "#F3F3F3" }, "#1F6FEB", "#FFFFFF")

export const categoryPaletteDark: CategoryPalette = {
  gray: "#9A9A9A",
  purple: "#7B64B8",
  green: "#1F8A65",
  yellow: "#C9A227",
  cyan: "#2A9A8A",
  pink: "#C85898",
  blue: "#2E79B5",
  orange: "#E07A2F",
  red: "#C04848",
}
export const categoryPaletteLight: CategoryPalette = categoryPaletteDark
export const colorPalette = categoryPaletteDark

export const usageColorSequence: readonly Color[] = ["gray", "purple", "green", "yellow", "pink", "blue", "orange", "cyan", "red"]

export const chartPalette: ChartPalette = {
  green: "#1F8A65E8",
  darkGreen: "#0D855AE0",
  lightGreen: "#52B896E0",
  mintGreen: "#7DCAB0E0",
  blue: "#2E79B5E0",
  lightBlue: "#70B0D8E0",
  indigo: "#5A6CC0F0",
  lightIndigo: "#9AAADCE0",
  purple: "#7B64B8F0",
  lightPurple: "#AA98D8E0",
  warmPink: "#C85898E0",
  lightPink: "#E8A0C4E0",
  brightOrange: "#F0A040E0",
  deepOrange: "#C06028E0",
  goldenYellow: "#E8C030E0",
  darkAmber: "#C04848E0",
  warmPeach: "#F0A088E0",
  vibrantTeal: "#2A9A8AE0",
  muted: "#8888A8E0",
  neutralLine: "#888899D0",
}

export const chartColorSequence: readonly string[] = [
  chartPalette.blue,
  chartPalette.brightOrange,
  chartPalette.purple,
  chartPalette.green,
  chartPalette.warmPink,
  chartPalette.goldenYellow,
  chartPalette.indigo,
  chartPalette.vibrantTeal,
  chartPalette.deepOrange,
  chartPalette.lightBlue,
]

export const canvasTypography = {
  fontFamily: "inherit",
  h1: { fontSize: "24px", lineHeight: "30px", fontWeight: 590 },
  h2: { fontSize: "18px", lineHeight: "24px", fontWeight: 590 },
  h3: { fontSize: "16px", lineHeight: "22px", fontWeight: 590 },
  body: { fontSize: "14px", lineHeight: "20px", fontWeight: 400 },
  small: { fontSize: "12px", lineHeight: "16px", fontWeight: 400 },
} as const

export const canvasFontFamilyCursor = "inherit" as const
export const canvasSpacing = { "0.5": 2, "1": 4, "1.5": 6, "2": 8, "2.5": 10, "3": 12, "3.5": 14, "4": 16, "4.5": 18, "5": 20, "6": 24, "7": 28, "8": 32, "9": 36, "10": 40 } as const
export const canvasRadius = { none: 0, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, full: 9999 } as const

function tokensFrom(paletteValue: CanvasPalette, category: CategoryPalette): CanvasTokens {
  return {
    bg: { editor: paletteValue.editor, chrome: paletteValue.chrome, elevated: paletteValue.elevated },
    text: {
      primary: paletteValue.foreground,
      secondary: paletteValue.foregroundSecondary,
      tertiary: paletteValue.foregroundTertiary,
      quaternary: paletteValue.foregroundQuaternary,
      link: paletteValue.link,
      onAccent: paletteValue.buttonForeground,
    },
    stroke: {
      primary: paletteValue.strokePrimary,
      secondary: paletteValue.strokeSecondary,
      tertiary: paletteValue.strokeTertiary,
      focused: paletteValue.strokeFocused,
    },
    fill: {
      primary: paletteValue.fillPrimary,
      secondary: paletteValue.fillSecondary,
      tertiary: paletteValue.fillTertiary,
      quaternary: paletteValue.fillQuaternary,
    },
    accent: { primary: paletteValue.accent, control: paletteValue.buttonBackground, controlHover: paletteValue.buttonHoverBackground },
    diff: {
      insertedLine: paletteValue.diffInsertedLine,
      removedLine: paletteValue.diffRemovedLine,
      stripAdded: paletteValue.diffStripAdded,
      stripRemoved: paletteValue.diffStripRemoved,
    },
    category,
  }
}

export const canvasTokens = tokensFrom(canvasPaletteDark, categoryPaletteDark)
export const canvasTokensLight = tokensFrom(canvasPaletteLight, categoryPaletteLight)

function hostTheme(kind: string): CanvasHostTheme {
  const dark = kind !== "light" && kind !== "hc-light"
  const paletteValue = dark ? canvasPaletteDark : canvasPaletteLight
  const tokens = dark ? canvasTokens : canvasTokensLight
  return {
    ...tokens,
    kind,
    tokens,
    palette: paletteValue,
    radius: canvasRadius,
    typography: canvasTypography,
    chart: { palette: chartPalette, sequence: chartColorSequence },
  }
}

function subscribeScheme(listener: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)")
  query.addEventListener("change", listener)
  return () => query.removeEventListener("change", listener)
}

function schemeKind() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function useHostTheme(): CanvasHostTheme {
  const kind = useSyncExternalStore(subscribeScheme, schemeKind, () => "light")
  return hostTheme(kind)
}

export const toneColor = {
  success: "#1F8A65",
  danger: "#C04848",
  warning: "#C9A227",
  info: "#2E79B5",
  neutral: "#888899",
} as const
