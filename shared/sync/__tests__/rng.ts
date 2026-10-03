/** mulberry32: small, fast, seedable. */
export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (max: number) => Math.floor(next() * max),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (p: number) => next() < p,
    word: (max = 4) =>
      Array.from({ length: 1 + Math.floor(next() * max) }, () => "abcdefghij "[Math.floor(next() * 11)]).join(""),
  }
}

export type Rng = ReturnType<typeof rng>
