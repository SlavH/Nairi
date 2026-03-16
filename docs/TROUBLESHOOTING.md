# Troubleshooting

## Environment and database

### DATABASE_URL errors

- **ETIMEDOUT**: Use Supabase **Transaction pooler** (port 6543), not Direct (5432). Update your connection string in `.env`.
- **Invalid URL**: Remove any brackets `[]` from the URL; URL-encode special characters in the password (`@` → `%40`, `#` → `%23`, `%` → `%25`).
- **28P01 (password auth failed)**: Verify username and password in Supabase Dashboard → Project Settings → Database. Ensure no typos and password matches exactly.

Run `npm run env:validate` to check DATABASE_URL format and required variables.

### Migrations fail or schema out of sync

- Run migrations **in order** (001, 002, … 024, 025, etc.). See [README.md](../README.md) for the full list.
- If you added features that use `agents.is_published`, run `scripts/025_add_agents_is_published.sql` (and any later scripts your app needs).
- Migrations are idempotent where noted; re-running is safe.

### "Could not find the table 'public.learn_notebooks' in the schema cache" (NairiBook)

The NairiBook feature needs the `learn_notebooks` and `learn_notebook_sources` tables. Apply the migration:

1. **Option A – run all migrations** (recommended):  
   Set `DATABASE_URL` in `.env` (Supabase → Project Settings → Database → Connection string), then run:
   ```bash
   npm run migrate
   ```
   This runs every `scripts/NNN_*.sql` in order, including `042_learn_notebooklm.sql`.

2. **Option B – run only the NairiBook migration**:  
   In Supabase Dashboard → SQL Editor, paste and run the contents of `scripts/042_learn_notebooklm.sql`.

After the migration, if Supabase still reports the table as missing, refresh the schema cache (e.g. reload the Dashboard or re-open the Table Editor).

## Auth and API

### 401 on protected routes

- Ensure you’re logged in (or, in dev, `BYPASS_AUTH=true` is set).
- For Bearer token: send `Authorization: Bearer <access_token>` (Supabase session token).
- Check that Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are set and correct.

### Marketplace recommendations empty or errors

- Recommendations use `agents.is_published`. If the column is missing, run migration `025_add_agents_is_published.sql` and ensure README lists it (and any 026+ you use).

## Dev server and Turbopack

### Turbopack panic: "Failed to lookup task id" / "Unable to open static sorted file" / "The system cannot find the file specified"

This usually means the Next.js/Turbopack cache (`.next`) is corrupted or was partially deleted while the dev server was running.

**Fix:**

1. **Stop the dev server** (Ctrl+C in the terminal where `npm run dev` is running). The cache is locked while the server runs.
2. **Clear the cache:**  
   `npm run clean`  
   (If you see "Access denied", the server is still running—stop it and run `npm run clean` again.)
3. **Start the dev server again:**  
   `npm run dev`

**If the error keeps happening:** use the webpack dev server instead of Turbopack:

```bash
npm run dev:webpack
```

This runs `next dev --webpack` and avoids the Turbopack cache. Use `npm run dev` (Turbopack) again once the issue is resolved if you prefer it.

## Build and tests

### Build fails (TypeScript or Next)

- Run `npx tsc --noEmit` to list type errors. The project may have `typescript.ignoreBuildErrors: true` in `next.config.mjs`; fix errors incrementally and then consider turning that off.
- Clear `.next` and re-run `npm run build`.

### Unit or E2E tests fail

- Ensure `.env` is present and `npm run env:validate` passes.
- E2E: Start the app (`npm run dev`) in another terminal, or run in CI where the app is built and served. See [TESTING.md](TESTING.md).

## Production

- **Health**: Use `GET /api/health` for liveness. Use `GET /api/health/readiness` for DB-dependent readiness (load balancers, Kubernetes). See [production.md](production.md).
- **Monitoring**: Configure Sentry (or similar) via env; wire health check failures to your alerting. See [production.md](production.md) and [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md).
