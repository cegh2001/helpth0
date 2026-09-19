# AGENTS.md — AI Agent Guidelines for helpth0

## 1. Project Overview

`helpth0` is a local-first medical clinic management monolith built with **Next.js 15**, **TypeScript**, **SQLite (via Prisma)**, **Vitest**, **ExcelJS**, and **PDFKit**.

The system tracks:
- Registered doctors and their medical specialties.
- Weekly recurring shifts and working hours (e.g. Mon 08:00–14:00).
- Daily patient headcounts attended per doctor (numeric volume only, zero patient PII).
- Professional report generation with multi-sheet Excel spreadsheets (`.xlsx`) and printable medical summaries (`.pdf`).
- A native one-click Windows desktop launcher (`start-helpth0.bat`).

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

Unit tests must never touch SQLite or external IO; they run completely in-memory in under 1 second. Integration tests in `tests/integration/` verify database persistence and file export outputs.

---

## 4. Development & Build Commands

```bash
# Install dependencies
pnpm install

# Run all tests (Vitest)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Push database schema to SQLite (dev.db)
pnpm exec prisma db push

# Run development server
pnpm dev

# Build production application
pnpm run build

# Run production server
pnpm start

# Run Windows desktop launcher
start-helpth0.bat
```

---

## 5. Coding & Commit Standards

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- **No AI Attribution**: Never include "Co-Authored-By", AI watermarks, or bot comments in Git commits.
- **Language**: Source code, identifiers, tests, documentation, and UI copy are in **English**.
- **KISS & SOLID**: Prefer straightforward, decoupled solutions over premature abstraction.
