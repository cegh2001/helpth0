# AGENTS.md — helpth0 AI Agent Constitution

## 1. System & Architecture: Strict Hexagonal Monolith
- **Stack**: Next.js 16, TypeScript, SQLite (Prisma 7), Vitest, ExcelJS, PDFKit, Better Auth (single local user).
- **Domain (`src/core/domain/`)**: Pure business logic & entities. ZERO external dependencies. Forbidden: `next/*`, `@prisma/*`, `react`, infrastructure, or app imports.
- **Application (`src/core/application/`)**: Use cases & repository/exporter ports. Never import infrastructure or delivery.
- **Infrastructure (`src/infrastructure/`)**: Prisma repositories, ExcelJS/PDFKit exporters, DI container (`container.ts`).
- **Delivery (`src/app/`)**: Next.js App Router & client UI. Consumes use cases solely via `src/infrastructure/container.ts`.

## 2. Five Unbreakable Laws
1. **Modularity (Hard Limit: 350 lines)**:
   - ESLint enforces `max-lines: 350`. Extract cohesive domain concepts or custom hooks FIRST.
   - Antipatter ban: Never create dumping grounds (`utils.ts`, `helpers.ts`, `common.ts`).
2. **Direct Imports & No Barrels**:
   - Wildcard re-exports (`export * from ...`) are banned. Import direct module paths to preserve boundaries and AST performance.
3. **Strict TDD & In-Memory Unit Tests**:
   - Unit tests (`tests/unit/`) execute purely in-memory using `tests/mocks/`. Zero SQLite, Prisma, or I/O access.
   - For all testing tasks, apply the `.agents/skills/strict-testing` skill (no tautological mocks, no shallow assertions).
4. **Data Privacy & Invariants**:
   - Zero patient PII: only aggregate numeric headcounts and immutable shift timestamps.
   - Legacy `DailyCount.notes` column is strictly suppressed: never expose in domain, API, UI, or exporters.
5. **Single-User Security**:
   - Production binds to `127.0.0.1`. `.env` ignored. Use `pnpm auth:ensure-secret`. Never log or commit credentials.

## 3. Essential Commands
```bash
pnpm test                 # Run all unit and integration tests (Vitest)
pnpm lint                 # Deterministic linter (enforces limits and boundaries)
pnpm build                # Production build
pnpm auth:ensure-secret   # Generate local Better Auth secret if missing
pnpm exec prisma migrate deploy # Apply migrations to SQLite
```

## 4. Conventional Commits & Clean Diffs
- Format: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Zero AI attribution: No "Co-Authored-By", AI watermarks, or bot comments in commits.
- English for code, identifiers, tests, and commit messages; professional Spanish for UI copy.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
