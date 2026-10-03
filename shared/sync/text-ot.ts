/**
 * Plain-text operational transformation in the style of ot.js / Jupiter.
 *
 * An op is a list of components that walks the whole base document:
 *   positive number -> retain n characters
 *   negative number -> delete n characters
 *   string          -> insert the string
 * Ops are normalized: no empty components, adjacent components of the same
 * kind are merged, and an insert always precedes an adjacent delete.
 */
export type TextOp = (number | string)[]

const isRetain = (c: number | string | undefined): c is number =>
  typeof c === "number" && c > 0
const isDelete = (c: number | string | undefined): c is number =>
  typeof c === "number" && c < 0
const isInsert = (c: number | string | undefined): c is string =>
  typeof c === "string"

export class OpBuilder {
  readonly ops: TextOp = []

  retain(n: number): this {
    if (n <= 0) return this
    const last = this.ops.length - 1
    if (isRetain(this.ops[last])) this.ops[last] = (this.ops[last] as number) + n
    else this.ops.push(n)
    return this
  }

  insert(s: string): this {
    if (!s) return this
    const ops = this.ops
    const last = ops.length - 1
    if (isInsert(ops[last])) {
      ops[last] = (ops[last] as string) + s
    } else if (isDelete(ops[last])) {
      if (isInsert(ops[last - 1])) {
        ops[last - 1] = (ops[last - 1] as string) + s
      } else {
        ops.push(ops[last])
        ops[last] = s
      }
    } else {
      ops.push(s)
    }
    return this
  }

  delete(n: number): this {
    if (n <= 0) return this
    const last = this.ops.length - 1
    if (isDelete(this.ops[last])) this.ops[last] = (this.ops[last] as number) - n
    else this.ops.push(-n)
    return this
  }

  done(): TextOp {
    const last = this.ops.length - 1
    if (isRetain(this.ops[last])) this.ops.pop()
    return this.ops
  }
}

/**
 * Trailing retains are dropped by `OpBuilder.done`, so lengths are computed
 * relative to an explicit document length where it matters (`apply`, the
 * server's validation). An op with an implicit tail retains the rest.
 */
export function baseLength(op: TextOp): number {
  let n = 0
  for (const c of op) {
    if (isRetain(c)) n += c
    else if (isDelete(c)) n -= c
  }
  return n
}

function targetLength(op: TextOp): number {
  let n = 0
  for (const c of op) {
    if (isRetain(c)) n += c
    else if (isInsert(c)) n += c.length
  }
  return n
}

export function isNoop(op: TextOp): boolean {
  return op.every(isRetain)
}

/** Pad an op with a trailing retain so it covers a document of `len` chars. */
function full(op: TextOp, len: number): TextOp {
  const rest = len - baseLength(op)
  if (rest < 0) throw new Error(`op covers ${baseLength(op)} chars, doc has ${len}`)
  return rest > 0 ? [...op, rest] : op
}

export function apply(op: TextOp, text: string): string {
  const ops = full(op, text.length)
  let out = ""
  let i = 0
  for (const c of ops) {
    if (isRetain(c)) {
      out += text.slice(i, i + c)
      i += c
    } else if (isInsert(c)) {
      out += c
    } else {
      i -= c
    }
  }
  return out
}

/**
 * Ops omit their trailing retain, so two ops over the same document may have
 * different explicit lengths. Pad both to a common base before combining.
 */
function align(a: TextOp, b: TextOp, aLen: number, bLen: number): [TextOp, TextOp] {
  const len = Math.max(aLen, bLen)
  return [full(a, aLen + (len - aLen)), full(b, bLen + (len - bLen))]
}

/** compose(a, b) is a single op equivalent to applying a then b. */
export function compose(a: TextOp, b: TextOp): TextOp {
  const aBase = baseLength(a)
  const aTarget = targetLength(a)
  const bBase = baseLength(b)
  const pad = Math.max(0, bBase - aTarget)
  const left = full(a, aBase + pad)
  const right = full(b, aTarget + pad)

  const out = new OpBuilder()
  let i1 = 0
  let i2 = 0
  let op1 = left[i1++]
  let op2 = right[i2++]

  while (op1 !== undefined || op2 !== undefined) {
    if (typeof op1 === "number" && op1 < 0) {
      out.delete(-op1)
      op1 = left[i1++]
      continue
    }
    if (isInsert(op2)) {
      out.insert(op2)
      op2 = right[i2++]
      continue
    }
    if (op1 === undefined || op2 === undefined) {
      throw new Error("compose: ops have incompatible lengths")
    }
    if (isRetain(op1) && isRetain(op2)) {
      if (op1 > op2) {
        out.retain(op2)
        op1 -= op2
        op2 = right[i2++]
      } else if (op1 === op2) {
        out.retain(op1)
        op1 = left[i1++]
        op2 = right[i2++]
      } else {
        out.retain(op1)
        op2 -= op1
        op1 = left[i1++]
      }
    } else if (isInsert(op1) && isDelete(op2)) {
      if (op1.length > -op2) {
        op1 = op1.slice(-op2)
        op2 = right[i2++]
      } else if (op1.length === -op2) {
        op1 = left[i1++]
        op2 = right[i2++]
      } else {
        op2 += op1.length
        op1 = left[i1++]
      }
    } else if (isInsert(op1) && isRetain(op2)) {
      if (op1.length > op2) {
        out.insert(op1.slice(0, op2))
        op1 = op1.slice(op2)
        op2 = right[i2++]
      } else if (op1.length === op2) {
        out.insert(op1)
        op1 = left[i1++]
        op2 = right[i2++]
      } else {
        out.insert(op1)
        op2 -= op1.length
        op1 = left[i1++]
      }
    } else if (isRetain(op1) && isDelete(op2)) {
      if (op1 > -op2) {
        out.delete(-op2)
        op1 += op2
        op2 = right[i2++]
      } else if (op1 === -op2) {
        out.delete(-op2)
        op1 = left[i1++]
        op2 = right[i2++]
      } else {
        out.delete(op1)
        op2 += op1
        op1 = left[i1++]
      }
    } else {
      throw new Error("compose: unreachable")
    }
  }
  return out.done()
}

/**
 * transform(a, b) returns [a', b'] such that apply(b', apply(a, doc)) ===
 * apply(a', apply(b, doc)) (property TP1). When both insert at the same
 * position, `a`'s insert goes first. Both server and client always pass the
 * not-yet-sequenced op as `a`, so the tie-break is the same everywhere.
 */
export function transform(a: TextOp, b: TextOp): [TextOp, TextOp] {
  const [left, right] = align(a, b, baseLength(a), baseLength(b))
  const a2 = new OpBuilder()
  const b2 = new OpBuilder()
  let i1 = 0
  let i2 = 0
  let op1 = left[i1++]
  let op2 = right[i2++]

  while (op1 !== undefined || op2 !== undefined) {
    if (isInsert(op1)) {
      a2.insert(op1)
      b2.retain(op1.length)
      op1 = left[i1++]
      continue
    }
    if (isInsert(op2)) {
      a2.retain(op2.length)
      b2.insert(op2)
      op2 = right[i2++]
      continue
    }
    if (op1 === undefined || op2 === undefined) {
      throw new Error("transform: ops have incompatible lengths")
    }
    if (isRetain(op1) && isRetain(op2)) {
      const n = Math.min(op1, op2)
      a2.retain(n)
      b2.retain(n)
      op1 -= n
      op2 -= n
    } else if (isDelete(op1) && isDelete(op2)) {
      const n = Math.min(-op1, -op2)
      op1 += n
      op2 += n
    } else if (isDelete(op1) && isRetain(op2)) {
      const n = Math.min(-op1, op2)
      a2.delete(n)
      op1 += n
      op2 -= n
    } else if (isRetain(op1) && isDelete(op2)) {
      const n = Math.min(op1, -op2)
      b2.delete(n)
      op1 -= n
      op2 += n
    }
    if (op1 === 0) op1 = left[i1++]
    if (op2 === 0) op2 = right[i2++]
  }
  return [a2.done(), b2.done()]
}

/**
 * Map a caret index through an op. Inserts exactly at the caret land after
 * it, so a remote user typing at your position doesn't push your caret.
 */
export function transformIndex(index: number, op: TextOp): number {
  let oldPos = 0
  let next = index
  for (const c of op) {
    if (oldPos > index) break
    if (isRetain(c)) {
      oldPos += c
    } else if (isInsert(c)) {
      if (oldPos < index) next += c.length
    } else {
      const n = -c
      next -= Math.min(n, Math.max(0, index - oldPos))
      oldPos += n
    }
  }
  return next
}

/** invert(op, doc) undoes op when applied to apply(op, doc). */
export function invert(op: TextOp, doc: string): TextOp {
  const out = new OpBuilder()
  let i = 0
  for (const c of op) {
    if (isRetain(c)) {
      out.retain(c)
      i += c
    } else if (isInsert(c)) {
      out.delete(c.length)
    } else {
      out.insert(doc.slice(i, i - c))
      i -= c
    }
  }
  return out.done()
}

/**
 * Build the op that turns `prev` into `next`. A single contiguous replace is
 * all an <input> can produce per event. `cursor` (selectionEnd after the edit)
 * disambiguates runs of repeated characters, e.g. typing "a" into "aa".
 */
export function fromDiff(prev: string, next: string, cursor?: number): TextOp {
  if (prev === next) return []
  const minLen = Math.min(prev.length, next.length)
  let suffixCap = minLen
  if (cursor !== undefined) {
    suffixCap = Math.min(suffixCap, Math.max(0, next.length - cursor))
  }
  let suffix = 0
  while (
    suffix < suffixCap &&
    prev[prev.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix++
  }
  let prefix = 0
  const prefixCap = minLen - suffix
  while (prefix < prefixCap && prev[prefix] === next[prefix]) prefix++

  return new OpBuilder()
    .retain(prefix)
    .insert(next.slice(prefix, next.length - suffix))
    .delete(prev.length - suffix - prefix)
    .done()
}
