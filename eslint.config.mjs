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
  ]),
  {
    rules: {
      // The app intentionally uses static local PNG assets and share-card-friendly
      // <img> tags across the mini app. Converting everything to next/image is
      // a separate refactor, not a cleanup task.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
