import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "work/phase2-tests/**",
    "work/phase3-tests/**",
    "work/phase4-tests/**",
    "work/phase5-tests/**",
    "work/phase6-tests/**",
  ]),
]);

export default eslintConfig;
