# helpth0 - Medical Clinic Management System

`helpth0` is a local-first clinic management monolith built with **Next.js 16**, **TypeScript**, **SQLite via Prisma 7**, **Vitest**, **ExcelJS**, and **PDFKit** using strict Hexagonal Architecture.

It supports weekly doctor schedules, daily numeric patient headcounts, and Excel/PDF reports. The application is designed for one local authorized user and does not collect patient-identifying information.

## Features

- Daily patient headcounts by doctor and shift.
- Recurring weekly schedules with overlap validation and stable schedule identities.
- Historical shift snapshots in reports when schedules later change or are removed.
- Single-user local authentication with a closed initial setup flow.
- Local SQLite persistence with no cloud dependency.
- Excel and PDF report generation.
- One-click Windows launcher.

## Windows Launcher

Double-click `start-helpth0.bat`. On every launch it:

1. Reuses an existing healthy helpth0 instance when one is already listening.
2. Otherwise, creates `BETTER_AUTH_SECRET` in `.env` when the variable is absent.
3. Generates Prisma Client 7.
4. Synchronizes the SQLite schema with `prisma db push`.
5. Builds the production application.
6. Starts and verifies the server on `http://127.0.0.1:3000` before opening it.

The launcher rejects another application occupying port 3000 and stops on any preparation or startup failure. Prisma 8 release candidates are intentionally not used; the project pins the latest verified stable Prisma 7 release.

For desktop access, create a shortcut to `start-helpth0.bat` instead of copying the project file. A copied launcher can still locate the default installation at `%USERPROFILE%\Documents\GitHub\helpth0`; if the project is moved elsewhere, set `HELPTH0_HOME` to its full path.

## Initial Setup

The first visit redirects to `/setup` while no user exists. The setup page shows the fixed authorized email and accepts a new password of 8 to 128 characters. After setup closes, authentication is available only through `/login`; public sign-up is not exposed.

Never place the chosen password in source files, documentation, fixtures, commands, or logs. The generated auth secret is stored only in the ignored local `.env` file. Run this command manually when needed:

```bash
pnpm auth:ensure-secret
```

The command appends a cryptographically random secret when `BETTER_AUTH_SECRET` is absent, leaves a valid existing value unchanged, and fails rather than replacing a value shorter than 32 characters.

## Manual Development

Requires Node.js 20.19 or newer.

```bash
pnpm install
pnpm auth:ensure-secret
pnpm exec prisma generate
pnpm exec prisma db push
pnpm dev
```

Production startup binds only to loopback:

```bash
pnpm build
pnpm start
```

## Database Migrations

Fresh migration-managed databases can apply the migrations in `prisma/migrations` with `pnpm exec prisma migrate deploy`.

For an existing `prisma/dev.db` created from this repository's original pre-auth schema with `prisma db push`:

1. Stop the application.
2. Back up `prisma/dev.db` outside the repository or as `prisma/dev.db.backup`.
3. Mark only the original schema baseline as already applied:

```bash
pnpm exec prisma migrate resolve --applied 20260918000000_initial
```

4. Apply the auth and integrity migration:

```bash
pnpm exec prisma migrate deploy
```

The second migration preserves all counts. For legacy duplicate unassigned counts, one row keeps the canonical empty slot key and each additional row receives a `legacy:<id>` key.

## Patient Privacy And Legacy Notes

The current application accepts and exports numeric patient volumes only. It does not expose a patient notes field through the domain, API, UI, or report exporters.

The nullable `DailyCount.notes` column remains solely for compatibility with older databases and may contain historical free text. After making a backup and reviewing retention requirements, purge it explicitly with a trusted SQLite client:

```sql
UPDATE "DailyCount" SET "notes" = NULL WHERE "notes" IS NOT NULL;
```

## Testing

```bash
pnpm test
```

Focused unit tests cover the current domain rules and application use cases with in-memory repositories. Integration tests exercise Prisma persistence and report files; this is not a claim of exhaustive coverage.

## Architecture

See [AGENTS.md](./AGENTS.md) for architecture rules and contribution conventions.
