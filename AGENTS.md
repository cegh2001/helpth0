# AGENTS.md — helpth0 AI Agent Constitution

Everything below is enforced by `pnpm lint` or `pnpm test`. A rule that is not in the linter is NOT a law: when you find a gap, add the rule instead of a reminder.

## 1. Stack & Layers (strict hexagonal monolith)
- Stack: Next.js 16 App Router, TypeScript, PostgreSQL (Neon) + Prisma 7, Vitest, ExcelJS, PDFKit, Better Auth (single administrator).
- `src/core/domain/` — entities, value objects, invariants. ZERO dependencies: no `next`, `react`, `@prisma/*`, `@/generated/*`, `@/infrastructure/*`, `@/app/*`, `@/lib/*`.
- `src/core/application/` — use cases and ports. Depends only on domain.
- `src/infrastructure/` — Prisma repositories, exporters, DI container (`container.ts`).
- `src/app/` — App Router and client UI. Reaches infrastructure ONLY through `@/infrastructure/container`.
- Imports are direct module paths. Barrels (`export * from`, `**/index`) and dumping grounds (`utils|helpers|common|misc|shared`) are lint errors.

## 2. Modularity Budget
- Hard fail: 350 lines for `src/**`, 500 for `tests/**` (blank lines and comments excluded). Never write up to the wall.
- Soft stop at 250 lines: before adding code, extract a cohesive unit first.
- Extraction order: domain invariant/value object → use case → custom hook → presentational subcomponent. NEVER `utils.ts`, `helpers.ts`, `component-part-2.tsx`.
- The dashboard is a route group: `src/app/(dashboard)/` with one route per module (`/consultas`, `/examenes`, `/terapias`, `/recepcion`, `/medicos`). No navigation state for modules — the URL is the state.

## 3. Testing
- Unit (`tests/unit/`): pure in-memory, injecting `tests/mocks/`. Zero SQLite, Prisma, network or filesystem.
- Integration (`tests/integration/`): the only place allowed to touch real databases or real Excel/PDF buffers.
- `toBeDefined`, `toBeTruthy`, `toBeFalsy`, `toBeInstanceOf` and argument-less `toHaveBeenCalled()` are lint errors in `tests/unit`.
- Before finishing, apply `.agents/skills/strict-testing` plus the mutation check: delete or invert the production invariant — if the test still passes, the test is worthless.

## 4. Domain Invariants
- No patient PII: aggregate headcounts and immutable shift timestamps only.
- Legacy `DailyCount.notes` is suppressed: never in domain, API, UI or exporters.

## 5. Security
- Production runs on Vercel with HTTPS; `.env` stays ignored; secrets come from environment variables. Never log or commit credentials.

## 6. Commands
```bash
pnpm lint       # deterministic gates — must be green before saying "done"
pnpm test       # unit + integration suites
pnpm verify     # lint + test
pnpm build
pnpm exec prisma migrate deploy
```

## 7. Commits
- Conventional commits in English: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Zero AI attribution: no `Co-Authored-By`, watermarks or bot comments.
- English for code, identifiers and commit messages; professional Spanish for UI copy.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
