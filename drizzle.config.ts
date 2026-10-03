import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./api/schema.ts",
  out: "./api/migrations",
  dialect: "sqlite",
  dbCredentials: { url: "./.data/dataplane.db" },
})
