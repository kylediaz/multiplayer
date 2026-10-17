import { parseSchema } from "@shared/sync/schema"
import type { Published, ViewMode } from "../mode"
import { bundleReact } from "./bundle"

export const reactMode: ViewMode = {
  lang: "react",
  schema: parseSchema,
  async publish(source): Promise<Published> {
    if (!source.includes("export default")) return { ok: false, problems: ["The app needs a default export."] }
    const built = await bundleReact(source)
    if (!built.ok) return built
    return {
      ok: true,
      files: [
        { name: "main.js", body: built.js, type: "text/javascript" },
        { name: "main.css", body: built.css, type: "text/css" },
        { name: "source.txt", body: source, type: "text/plain" },
      ],
    }
  },
}
