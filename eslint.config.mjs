import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    rules: {
      "@next/next/no-html-link-for-pages": ["error", "web/app"],
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "web/.next/**",
    ".data/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
