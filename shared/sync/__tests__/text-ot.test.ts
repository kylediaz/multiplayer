import { describe, expect, it } from "vitest"
import { apply, compose, fromDiff, invert, OpBuilder, transform, transformIndex, type TextOp } from "../text-ot"
import { rng, type Rng } from "./rng"

function randomOp(r: Rng, doc: string): TextOp {
  const b = new OpBuilder()
  let i = 0
  while (i < doc.length) {
    const n = 1 + r.int(Math.min(5, doc.length - i))
    const roll = r.next()
    if (roll < 0.25) b.insert(r.word())
    if (roll < 0.6) b.retain(n)
    else b.delete(n)
    i += n
  }
  if (r.chance(0.3)) b.insert(r.word())
  return b.done()
}

describe("text OT", () => {
  it("applies retain/insert/delete with an implicit trailing retain", () => {
    expect(apply([2, "XY", -1], "abcde")).toBe("abXYde")
    expect(apply(["!"], "abc")).toBe("!abc")
    expect(apply([], "abc")).toBe("abc")
    expect(() => apply([10], "abc")).toThrow()
  })

  it("normalizes insert before delete", () => {
    expect(new OpBuilder().retain(1).delete(2).insert("x").done()).toEqual([1, "x", -2])
  })

  it("diffs with a cursor hint to disambiguate repeated characters", () => {
    expect(fromDiff("aa", "aaa", 1)).toEqual(["a"])
    expect(fromDiff("aa", "aaa", 2)).toEqual([1, "a"])
    expect(fromDiff("aa", "aaa")).toEqual(["a"])
    expect(fromDiff("abc", "ac", 1)).toEqual([1, -1])
    expect(fromDiff("hello world", "hello there", 11)).toEqual([6, "there", -5])
  })

  it("transforms concurrent inserts at the same spot with a stable tie-break", () => {
    const [a2, b2] = transform([1, "A"], [1, "B"])
    expect(apply(b2, apply([1, "A"], "xy"))).toBe("xABy")
    expect(apply(a2, apply([1, "B"], "xy"))).toBe("xABy")
  })

  it("maps carets through remote ops", () => {
    expect(transformIndex(3, ["ab"])).toBe(5)
    expect(transformIndex(3, [3, "ab"])).toBe(3)
    expect(transformIndex(3, [1, -1])).toBe(2)
    expect(transformIndex(3, [-5])).toBe(0)
  })

  it("satisfies compose, TP1, and invert on random ops", () => {
    for (let seed = 0; seed < 3000; seed++) {
      const r = rng(seed)
      const doc = r.chance(0.1) ? "" : r.word(20)
      const a = randomOp(r, doc)
      const b = randomOp(r, doc)

      const afterA = apply(a, doc)
      const c = randomOp(r, afterA)
      expect(apply(compose(a, c), doc)).toBe(apply(c, afterA))

      const [a2, b2] = transform(a, b)
      expect(apply(b2, afterA)).toBe(apply(a2, apply(b, doc)))

      expect(apply(invert(a, doc), afterA)).toBe(doc)
    }
  })
})
