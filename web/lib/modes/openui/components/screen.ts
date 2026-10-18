import { z, type ZodType } from "zod"

let child: ZodType = z.unknown()

export function screenChildren() {
  return z.array(z.lazy(() => child))
}

export function setScreenChild(next: ZodType) {
  child = next
}
