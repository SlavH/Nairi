# Development Guide

**Start here:** Setup (below), then run `npm run dev` and open [http://localhost:3000](http://localhost:3000). For testing, see [Testing](#testing). For deployment and runbooks, see [production.md](production.md) and [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md). Code style: TypeScript strict (`next.config.mjs` has `typescript.ignoreBuildErrors: false`), `@/` aliases; run `npx tsc --noEmit` and fix type errors before committing; run lint (ESLint/Prettier if configured) so CI passes.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project (for auth and database)
- See [README.md](../README.md) for full setup (env, migrations, Stripe).

## Quick start

```bash
npm install
cp .env.example .env   # Fill in Supabase, Stripe, AI keys
npm run env:validate
npm run migrate        # If using Node migrations
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `BYPASS_AUTH=true` in `.env`, protected routes work without login (bypass user).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run unit/integration tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run migrate` | Run SQL migrations (requires DATABASE_URL) |
| `npm run env:validate` | Validate environment variables |
| `npm run storybook` | Component library (port 6006) |
| `npm run env:validate` | Validate env vars (run before migrate) |
| `npx vitest run __tests__/integration` | Integration tests (requires app running; set NEXT_PUBLIC_APP_URL) |

## Project structure

- **app/** — Next.js App Router (pages, API routes, layouts)
- **components/** — React components (ui, chat, marketplace, etc.)
- **lib/** — Shared logic (AI, auth, Supabase, cache, errors, learn, marketplace)
- **scripts/** — SQL migrations, env validation, load tests
- **docs/** — Architecture, API, testing, production, backup

See [ARCHITECTURE.md](ARCHITECTURE.md) for a full overview.

## Database

Migrations live in `scripts/` and are run in numeric order. Use Supabase SQL Editor or `npm run migrate` (with `DATABASE_URL` in `.env`). See README “Database (Supabase)” for the full list and run order. **Seed:** `POST /api/seed` (or the seed script) populates sample data (agents, feed, etc.); use in **development only** and ensure RLS and schema match. Do not call in production.

## Testing

- **Unit / API route tests**: `npm run test` — runs Vitest (unit tests and API route tests). Integration tests under `__tests__/integration/api/` require a running app and are excluded from the default run.
- **Integration tests with server**: Start the app (`npm run dev` or `npm run start`), then run integration tests (e.g. `npx vitest run __tests__/integration --exclude '**/e2e/**'` with `NEXT_PUBLIC_APP_URL=http://localhost:3000`). In CI, use a job that starts the app then runs this pattern.
- **E2E**: `npm run test:e2e` — Playwright; requires `npx playwright install` (browsers) and the app running (Playwright webServer starts it in CI).
- **Manual**: Use [TESTING.md](TESTING.md) checklist; smoke-test auth, chat, workspace create, marketplace, learn, builder.

## Deployment

See [production.md](production.md) for health checks, CI/CD, backup/restore, and monitoring. For staging and production runbooks, see [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md).
