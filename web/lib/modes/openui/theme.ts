export interface CdsTheme {
  bg: string
  group: string
  ink: string
  ink2: string
  ink3: string
  sep: string
  fill: string
  tint: string
  green: string
  red: string
  bubble: string
  chartPalette: string[]
  dark: boolean
}

const CDS_LIGHT: CdsTheme = {
  bg: "#f2f2f7",
  group: "#ffffff",
  ink: "#101013",
  ink2: "rgba(60,60,67,0.6)",
  ink3: "rgba(60,60,67,0.3)",
  sep: "rgba(60,60,67,0.15)",
  fill: "rgba(120,120,128,0.14)",
  tint: "#007aff",
  green: "#34c759",
  red: "#ff3b30",
  bubble: "#e9e9eb",
  chartPalette: ["#0A84FF", "#C2410C", "#15803D", "#BF5AF2", "#FF375F", "#0891B2"],
  dark: false,
}

export function useCds(): CdsTheme {
  return CDS_LIGHT
}
