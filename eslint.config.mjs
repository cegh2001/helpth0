import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Law 1: no dumping grounds. A module is named after the concept it owns.
const NO_DUMPING_GROUNDS = {
  group: ["**/utils", "**/helpers", "**/common", "**/misc", "**/shared"],
  message:
    "Dumping-ground module forbidden (utils/helpers/common/misc/shared). Name the module after the concept it owns (class-names, local-date, auth-policy) or extract a cohesive submodule.",
};

const NO_BARREL_IMPORTS = {
  group: ["**/index", "**/index.*"],
  message:
    "Barrel imports are forbidden. Import the concrete module path (e.g. '@/core/domain/entities/doctor.entity').",
};

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
  // 1. Physical file limits & modularity (src)
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
  // Legacy dashboard page: frozen budget (ratchet). Lower `max` with every extraction.
  {
    files: ["src/app/page.tsx"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 1460,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  // 2. Physical file limits (tests stay readable too)
  {
    files: ["tests/**/*.ts"],
    rules: {
      "max-lines": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  // 3. Ban wildcard barrel exports across the codebase
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
  // 4. Hexagonal Boundaries: Pure Domain Isolation
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
                "@prisma",
                "@/generated/*",
                "@/infrastructure/*",
                "@/app/*",
                "@/lib/*",
                "../../*infrastructure*",
                "../../*app*",
              ],
              message:
                "Hexagonal violation: Domain layer must remain pure with zero external dependencies, frameworks, or outer layers.",
            },
            NO_DUMPING_GROUNDS,
            NO_BARREL_IMPORTS,
          ],
        },
      ],
    },
  },
  // 5. Hexagonal Boundaries: Application Use-Cases Isolation
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
                "react*",
                "@prisma/*",
                "@prisma",
                "@/generated/*",
                "@/infrastructure/*",
                "@/app/*",
                "@/lib/*",
                "../../*infrastructure*",
                "../../*app*",
              ],
              message:
                "Hexagonal violation: Application use-cases must depend only on domain ports and entities, never on infrastructure adapters or delivery.",
            },
            NO_DUMPING_GROUNDS,
            NO_BARREL_IMPORTS,
          ],
        },
      ],
    },
  },
  // 6. Hexagonal Boundaries: Delivery reaches infrastructure only through the container
  {
    files: ["src/app/**/*.ts", "src/app/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/infrastructure/persistence/**",
                "@/infrastructure/exporters/*",
                "@/generated/*",
              ],
              message:
                "Delivery must consume use cases through '@/infrastructure/container'. Repositories, exporters and the Prisma client are infrastructure internals.",
            },
            NO_DUMPING_GROUNDS,
            NO_BARREL_IMPORTS,
          ],
        },
      ],
    },
  },
  // 7. Remaining layers: no dumping grounds, no barrels
  {
    files: ["src/infrastructure/**/*.ts", "src/components/**/*.tsx", "src/lib/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [NO_DUMPING_GROUNDS, NO_BARREL_IMPORTS],
        },
      ],
    },
  },
  // 8. Anti-tautology: unit tests may not assert trust-me matchers
  {
    files: ["tests/unit/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='toBeDefined']",
          message:
            "Shallow assertion: toBeDefined() proves nothing. Assert the exact value, shape (toStrictEqual) or invariant (regex/range) instead.",
        },
        {
          selector: "CallExpression[callee.property.name='toBeTruthy']",
          message:
            "Shallow assertion: toBeTruthy() accepts any truthy garbage. Assert the exact value or the domain invariant.",
        },
        {
          selector: "CallExpression[callee.property.name='toBeFalsy']",
          message:
            "Shallow assertion: toBeFalsy() accepts any falsy garbage. Assert the exact value (toBe/toStrictEqual).",
        },
        {
          selector: "CallExpression[callee.property.name='toBeInstanceOf']",
          message:
            "Shallow assertion: toBeInstanceOf() checks a type, not behaviour. Assert the exact payload or the specific error message.",
        },
        {
          selector:
            "CallExpression[callee.property.name='toHaveBeenCalled'][arguments.length=0]:not([callee.object.property.name='not'])",
          message:
            "Shallow assertion: toHaveBeenCalled() without arguments only proves the mock was touched. Assert toHaveBeenCalledWith(...) with the exact arguments, or assert the resulting state.",
        },
      ],
    },
  },
]);

export default eslintConfig;
