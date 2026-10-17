export const swatchColors = ["gray", "purple", "green", "yellow", "cyan", "pink", "blue", "orange", "red"] as const

export type SwatchColor = (typeof swatchColors)[number]
