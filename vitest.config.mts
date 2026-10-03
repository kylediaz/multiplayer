import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(root, "web"),
      "@shared": path.join(root, "shared"),
    },
  },
  test: {
    include: ["shared/**/*.test.ts", "web/**/*.test.ts"],
    environment: "node",
  },
})
