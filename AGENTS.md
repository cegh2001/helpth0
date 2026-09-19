# AGENTS.md — AI Agent Guidelines for helpth0

## 1. Project Overview

`helpth0` is a local-first medical clinic management monolith built with **Next.js 16**, **TypeScript**, **SQLite (via Prisma)**, **Vitest**, **ExcelJS**, and **PDFKit**.

The system tracks:
- Registered doctors and their medical specialties.
- Weekly recurring shifts and working hours (e.g. Mon 08:00–14:00).
- Daily patient headcounts attended per doctor (numeric volume only, zero patient PII).
- Professional report generation with multi-sheet Excel spreadsheets (`.xlsx`) and printable medical summaries (`.pdf`).
- One fixed local user with a closed initial setup and Better Auth sessions.
- A native one-click Windows desktop launcher (`start-helpth0.bat`).

The legacy nullable `DailyCount.notes` database column is retained only for compatibility. It must not be exposed through domain entities, APIs, UI, or exporters. After backup and retention review, legacy values can be purged with `UPDATE "DailyCount" SET "notes" = NULL WHERE "notes" IS NOT NULL;` in a trusted SQLite client.

---

## 2. Architectural Blueprint: Strict Hexagonal Architecture

The codebase enforces strict **Ports and Adapters (Hexagonal Architecture)**. All code must respect the boundary rules:

```
src/
├── core/
│   ├── domain/                  # PURE DOMAIN (No framework, no ORM, no external libraries)
│   │   ├── entities/            # Doctor, WeeklySchedule, DailyPatientCount
│   │   └── repositories/        # Repository Interfaces (Ports)
│   └── application/             # APPLICATION LAYER
│       ├── ports/               # Exporter ports (ReportExporterPort)
│       └── use-cases/           # Use Cases (Doctor, Schedule, Count, Reports)
├── infrastructure/              # ADAPTERS LAYER
│   ├── persistence/
│   │   ├── prisma/              # Prisma Client singleton
│   │   └── repositories/        # Prisma repository implementations
│   ├── exporters/               # ExcelJS and PDFKit exporters
│   └── container.ts             # Composition Root (Dependency Injection)
└── app/                         # DELIVERY LAYER (Next.js App Router)
    ├── api/                     # HTTP Route Handlers (invoking application use cases)
    └── page.tsx                 # Responsive Clinic Dashboard (React Client Component)
```

### Architectural Guardrails (Non-Negotiable)

1. **Domain Isolation**: `src/core/domain/` must NEVER import from `next/*`, `@prisma/*`, `react`, or UI libraries. Invariants (e.g., non-negative counts, chronological shift hours, non-empty names) are enforced inside the entities.
2. **Application Independence**: Use cases orchestrate domain entities and interact with repositories via interface ports.
3. **Infrastructure as Adapters**: Prisma and export libraries (`exceljs`, `pdfkit`) exist solely as adapters in `src/infrastructure/`.
4. **Delivery as Consumers**: Next.js route handlers (`src/app/api/`) only parse HTTP requests, invoke use cases from `src/infrastructure/container.ts`, and return JSON or binary streaming responses.

---

## 3. Strict TDD Protocol (Test-Driven Development)

All new business rules and use cases must be developed using TDD:
1. **Red**: Write a failing unit test in `tests/unit/` using in-memory mock repositories (`tests/mocks/`).
2. **Green**: Write the minimal domain or use-case code to make tests pass.
3. **Refactor**: Clean up and optimize while keeping tests green.

Unit tests must never touch SQLite or external IO. Focused unit tests cover current domain rules and use cases; do not describe coverage as exhaustive. Integration tests in `tests/integration/` verify database persistence and file export outputs.

---

## 4. Development & Build Commands

```bash
# Install dependencies
pnpm install

# Generate the local Better Auth secret when absent
pnpm auth:ensure-secret

# Run all tests (Vitest)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Push database schema to SQLite (dev.db)
pnpm exec prisma db push

# Apply tracked migrations
pnpm exec prisma migrate deploy

# Run development server
pnpm dev

# Build production application
pnpm run build

# Run production server
pnpm start

# Run Windows desktop launcher
start-helpth0.bat
```

## 5. Authentication, Data, and Migration Operations

- Authentication is local-only and single-user. `/setup` is available only before the first user exists; public sign-up stays disabled afterward.
- Never place a user's password in the repository, documentation, fixtures, commands, or logs.
- `.env` is ignored. `pnpm auth:ensure-secret` appends a random `BETTER_AUTH_SECRET` only when absent and rejects short existing values.
- Production binds to `127.0.0.1`. The Windows launcher always runs secret setup, `prisma generate`, `prisma db push`, and `pnpm build`, checking each exit code before starting.
- New migration-managed databases use `prisma migrate deploy`.
- For an existing database created from the original pre-auth schema with `db push`, first back it up, then run `pnpm exec prisma migrate resolve --applied 20260918000000_initial`, followed by `pnpm exec prisma migrate deploy`.
- Do not collect patient PII. Daily records contain numeric headcounts and immutable schedule-time snapshots only; the legacy `notes` column is not an application field.

---

## 6. Coding & Commit Standards

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- **No AI Attribution**: Never include "Co-Authored-By", AI watermarks, or bot comments in Git commits.
- **Language**: Source code, identifiers, tests, and documentation are in **English**. User-facing UI copy is professional Spanish.
- **KISS & SOLID**: Prefer straightforward, decoupled solutions over premature abstraction.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
