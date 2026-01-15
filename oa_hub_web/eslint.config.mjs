import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
    ],
    rules: {
      // Allow any types for dynamic data structures (common in API responses)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused variables with underscore prefix and catch param
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      // Allow img tag for user-uploaded content  
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
