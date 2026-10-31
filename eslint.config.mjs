import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
  // 1. Physical file limits & modularity
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/app/page.tsx"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 350,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  // Legacy dashboard page (monolith pending modularization)
  {
    files: ["src/app/page.tsx"],
    rules: {
      "max-lines": [
        "warn",
        {
          max: 1600,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  // 2. Ban wildcard barrel exports across the codebase
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportAllDeclaration",
          message:
            "Wildcard re-exports (barrel files: export * from ...) are forbidden. Import directly from source modules to preserve AST resolution and boundaries.",
        },
      ],
    },
  },
  // 3. Hexagonal Boundaries: Pure Domain Isolation
  {
    files: ["src/core/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next*",
                "react*",
                "@prisma/*",
                "@/infrastructure/*",
                "@/app/*",
                "../../*infrastructure*",
                "../../*app*",
              ],
              message:
                "Hexagonal violation: Domain layer must remain pure with zero external dependencies, frameworks, or outer layers.",
            },
          ],
        },
      ],
    },
  },
  // 4. Hexagonal Boundaries: Application Use-Cases Isolation
  {
    files: ["src/core/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next*",
                "@prisma/*",
                "@/infrastructure/*",
                "@/app/*",
                "../../*infrastructure*",
                "../../*app*",
              ],
              message:
                "Hexagonal violation: Application use-cases must depend only on domain ports and entities, never on infrastructure adapters or delivery.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
