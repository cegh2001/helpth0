# helpth0 — Medical Clinic Management System

A local-first, highly maintainable medical clinic management monolith built with **Next.js**, **TypeScript**, **SQLite (via Prisma)**, **Vitest**, **ExcelJS**, and **PDFKit** using strict **Hexagonal Architecture (Ports and Adapters)**.

Designed for day-to-day clinic reception operations to track doctor shifts and daily patient headcounts (numeric volume only, zero patient PII), with one-click Excel and PDF export reports.

---

## Features

- **Daily Reception Desk**: Fast, keyboard-friendly patient headcount counters for each doctor on duty.
- **Weekly Shift Management**: Configure recurring weekly working hours (e.g., Monday 08:00–14:00, Thursday 14:00–18:00) with conflict detection.
- **Strict Domain Isolation (TDD)**: Pure domain entities and use cases decoupled from frameworks, allowing sub-second test execution.
- **Local SQLite Persistence**: Zero configuration or cloud dependencies. Runs entirely locally on your machine.
- **Excel & PDF Export**: One-click generation of structured multi-sheet `.xlsx` files and beautifully formatted printable `.pdf` summaries.
- **Windows Desktop Launcher**: Includes `start-helpth0.bat` to launch the application and open your default browser automatically.

---

## Quick Start (Windows)

Double-click `start-helpth0.bat` in the project root to automatically build (if needed), launch the local server, and open `http://localhost:3000` in your default browser.

---

## Manual Installation & Development

```bash
# 1. Install dependencies
pnpm install

# 2. Push database schema to local SQLite
pnpm exec prisma db push

# 3. Run test suites
pnpm test

# 4. Start local development server
pnpm dev
```

Visit `http://localhost:3000` to access the dashboard.

---

## Testing & Quality Assurance

All business rules are tested with **Vitest**:

```bash
pnpm test
```

Unit tests run in-memory without database latency. Integration tests verify Prisma SQLite operations and export file generation.

---

## Architecture

See [AGENTS.md](./AGENTS.md) for the complete architecture guide and coding conventions.
