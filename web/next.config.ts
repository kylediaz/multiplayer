import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadEnvConfig } from "@next/env"
import type { NextConfig } from "next"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
loadEnvConfig(root)

const nextConfig: NextConfig = {
  serverExternalPackages: ["esbuild", "postcss", "@tailwindcss/postcss", "@tailwindcss/node", "@tailwindcss/oxide", "lightningcss", "tailwindcss"],
  allowedDevOrigins: ["kyle-web.ngrok.app"],
  experimental: {
    externalDir: true,
  },
  turbopack: {
    root,
  },
}

export default nextConfig
