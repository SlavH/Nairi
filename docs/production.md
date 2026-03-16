# Production readiness

## Pre-production checklist

Before going live, confirm:

1. **BYPASS_AUTH** is `false` or unset. Never enable in production; see [AUDIT_REMEDIATION.md](AUDIT_REMEDIATION.md) for auth patterns.
2. **Required env vars** are set: Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`), Stripe (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`), and at least one AI provider key (e.g. `OPENAI_API_KEY`, `GROQ_API_KEY`). See [README.md](README.md) and `.env.example`.
3. **Migrations** have been run in order (001 through 025 minimum; 042/043 if using NairiBook). Use `npm run migrate` or run scripts manually in the SQL Editor.
4. **Health and readiness** pass: `GET /api/health` and `GET /api/health/readiness` return 200. Wire these to your orchestrator or load balancer so traffic is only sent when the app and DB are ready.

## Health checks

- **Liveness / basic**: Use `GET /api/health`. It returns 200 when the app is up; use for Kubernetes liveness or simple load balancer checks.
- **Readiness (DB-dependent)**: Use `GET /api/health/readiness`. It returns 200 only when the database (Supabase) is reachable; use for Kubernetes readiness probes or load balancers that should not send traffic until DB is ready. See [API_DOCUMENTATION.md](API_DOCUMENTATION.md#get-apihealthreadiness).

## Runbooks

Operational runbooks (Deploy to staging, Promote to production, High load, Dependency failure) are in [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md#runbooks). Use them for incident response and deployment verification.

## CI/CD

- **GitHub Actions**: `.github/workflows/ci.yml` runs on push/PR to `main`:
  - Install, typecheck, build (with placeholder env vars)
  - Optional env validation (`npm run env:validate`)
  - Unit and integration tests
  - E2E (Playwright) with `npm run test:e2e`; Playwright webServer starts the app (`npm run start` after build) so E2E runs against a real server. Use GitHub Actions secrets for any real env in deploy jobs; keep build/test on placeholders.
- **Branch and deploy**: Document branch strategy (e.g. main = production, develop = staging) and how preview deployments work (e.g. Vercel per-PR). Link from README.
- For deployment: build with `npm run build`, then run `npm start` or deploy the `.next` output to your platform (Vercel, Docker, etc.). Ensure all required env vars are set in the deployment environment.

## Backup and restore

- **Database**: Data lives in Supabase (PostgreSQL). Use Supabase’s backup features (dashboard → Database → Backups) or `pg_dump` against your `DATABASE_URL` for custom backups.
- **Restore**: Restore a dump with `psql` or Supabase’s restore flow. Re-run migrations if the schema changed; application migrations in `scripts/` are idempotent where noted.
- **Full procedures**: See [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md) for backup schedules, manual/automated procedures, disaster recovery, and runbooks.
- **Secrets**: Store env vars (Supabase, Stripe, API keys) in your deployment secret store; never commit `.env`. Rotate keys via Supabase and Stripe dashboards and update deployment env.

## Caching and readiness

- **Read-heavy cache**: `GET /api/marketplace/agents` uses [lib/cache/simple.ts](../lib/cache/simple.ts) (in-memory, short TTL) for anonymous requests. For multi-instance production, consider Redis when `REDIS_URL` is set; see [ARCHITECTURE.md](ARCHITECTURE.md).
- **Readiness**: `GET /api/health/readiness` checks Supabase; use it so orchestrators stop sending traffic when the DB is unavailable.

## RLS audit (recommended)

Verify RLS is enabled on user-scoped tables and policies use `auth.uid()`: profiles, conversations, messages, creations, usage_logs, user_agents, lesson_progress, learning_analytics, user_achievements; marketplace/builder: agents, user_agents, marketplace_reviews, builder_projects, builder_project_collaborators; plus knowledge_*, activity_logs, notifications, credits_balances, subscriptions, presentations, builder_deploys, studio_gallery, conversation_folders, conversation_shared_links. Admin paths should use service role only where intended. See migrations in `scripts/`.

## Monitoring and alerts

- Configure your hosting platform’s monitoring (e.g. Vercel Analytics, error tracking).
- **Error tracking**: Enable Sentry (or similar) via existing env vars; see `.env.example` (e.g. `NEXT_PUBLIC_SENTRY_DSN`). Wire client and server errors to Sentry for grouping and alerts.
- **Health-based alerts**: Wire `GET /api/health` and `GET /api/health/readiness` failures to your alerting (PagerDuty, Slack, etc.) using your platform’s health check and alert rules so critical failures are notified. In alert messages or on-call docs, link to [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md#runbooks), [production.md](production.md), and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for quick response.
