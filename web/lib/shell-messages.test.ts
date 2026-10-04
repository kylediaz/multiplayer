import { describe, expect, it } from "vitest"
import { shellMessage } from "./shell-messages"

describe("shellMessage", () => {
  it("reads peers and drops a keys message with a bad value", () => {
    expect(shellMessage({ source: "shell", type: "peers", peers: [{ focus: "title", color: "#000" }] })).toEqual({
      type: "peers",
      peers: [{ focus: "title", color: "#000" }],
    })
    expect(shellMessage({ source: "shell", type: "keys", values: { title: undefined } })).toBeNull()
    expect(shellMessage({ source: "view", type: "ready" })).toBeNull()
  })
})
