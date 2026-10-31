# helpth0 - Medical Clinic Management System

`helpth0` is a clinic management application built with **Next.js 16**, **TypeScript**, **Prisma 7** connected to **Neon (PostgreSQL)**, **Vitest**, **ExcelJS**, and **PDFKit** using strict Hexagonal Architecture, deployed on **Vercel**.

It supports weekly doctor schedules, daily numeric patient headcounts, and Excel/PDF reports. The application is designed for clinic administration and does not collect patient-identifying information.

## Features

- Daily patient headcounts by doctor and shift.
- Recurring weekly schedules with overlap validation and stable schedule identities.
- Historical shift snapshots in reports when schedules later change or are removed.
- Single administrator authentication with closed initial bootstrap flow.
- Serverless PostgreSQL persistence powered by Neon.
- Excel and PDF report generation.
- Production-ready cloud deployment on Vercel.

## Deployment on Vercel

1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Configure the following environment variables in the Vercel project settings:
   - `DATABASE_URL`: Your Neon pooled connection string (`postgresql://...sslmode=require`).
   - `BETTER_AUTH_SECRET`: Secret of at least 32 characters (generate with `openssl rand -base64 32`).
   - `BETTER_AUTH_URL`: Canonical production URL (e.g., `https://helpth0.vercel.app`).
   - `ADMIN_EMAIL`: Email address authorized for the initial administrator setup.
4. Deploy. Vercel automatically runs `prisma generate` and builds the Next.js application.

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
