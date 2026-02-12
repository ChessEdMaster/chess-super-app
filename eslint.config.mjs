import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Exclude non-source files from linting
  globalIgnores([
    // Default ignores
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Compiled/vendor JS
    "public/**/*.js",
    "public/**/*.wasm",
    // Non-app source
    "scripts/**",
    "database/**",
    "bin/**",
    "geojson*/**",
    "lichess-data/**",
    "docs/**",
    "supabase/**",
  ]),
  // Project-specific rule overrides
  {
    rules: {
      // Allow unused vars prefixed with _
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      // Allow explicit any as warning (not error) during migration
      "@typescript-eslint/no-explicit-any": "warn",
      // Disable require imports (scripts use require)
      "@typescript-eslint/no-require-imports": "off",
      // Allow @ts-ignore with description
      "@typescript-eslint/ban-ts-comment": ["warn", {
        "ts-ignore": "allow-with-description",
      }],
      // Catalan text uses heavy apostrophes — warn not error
      "react/no-unescaped-entities": "warn",
      // Allow empty object types (used for marker interfaces)
      "@typescript-eslint/no-empty-object-type": "warn",
      // Downgrade React Compiler rules to warnings during refactor  
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
