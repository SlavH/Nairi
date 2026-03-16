# Nairi

Nairi is an AI assistant platform built with Next.js 16, React 19, and TypeScript. All AI (chat, builder, workflows, etc.) goes through a single configurable endpoint: your **Google Colab** server URL in `.env`. It also provides agent marketplace, studio, presentations, workspace, and billing.

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd nairi_v34
npm install
# or: pnpm install
```

### 2. Environment variables

Copy the example env file and fill in values (never commit `.env`):

```bash
cp .env.example .env
```

**Required:**

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (for webhooks/server-only use)
- **DATABASE_URL**: For migrations (Supabase → Project Settings → Database → Connection string, use Transaction pooler port 6543)
- **Stripe**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **AI (Google Colab)**: All AI requests go to your Colab server. Set `BITNET_BASE_URL` in `.env` to your Colab tunnel URL (e.g. `https://xxxxx.trycloudflare.com/v1`). Run your model in Colab, expose it with cloudflared, then paste that URL here.

**Optional:** `BYPASS_AUTH` (dev only) — when set to `true`, protected routes allow access without login; **never enable in production.** Other optional vars (see `.env.example`): **Sentry**, **Redis**, **Replicate** for video generation.

**Google Colab (AI):** Run your model in a Colab notebook, expose it with a tunnel (e.g. `cloudflared` or Colab’s “ngrok” style URL), then set `BITNET_BASE_URL` in `.env` to that URL including `/v1` (e.g. `https://xxxxx.trycloudflare.com/v1`). The app sends all AI requests to this endpoint (OpenAI-compatible `/v1/chat/completions`).

**Nairi web-grounded chat (optional):** Set `NAIRI_HF_BASE_URL` (Qwen HF Space) and `SEARXNG_BASE_URL` (SearXNG HF Space) in `.env` to use Nairi chat with web search and 2-pass inference. See `docs/NAIRI_HF_INTEGRATION.md` for env vars and testing.

**Validate environment variables:**

```bash
npm run env:validate
```

This checks DATABASE_URL format, required variables, and common configuration issues.

### 3. Database (Supabase)

Run the migration scripts **in order** against your Supabase project (SQL Editor or `psql`):

1. `scripts/001_create_profiles.sql`
2. `scripts/002_create_agents.sql`
3. `scripts/003_create_user_agents.sql`
4. `scripts/004_create_conversations.sql`
5. `scripts/005_create_messages.sql`
6. `scripts/006_create_subscriptions.sql`
7. `scripts/007_create_knowledge_graph.sql`
8. `scripts/008_create_education_tables.sql`
9. `scripts/009_create_feed_tables.sql`
10. `scripts/010_create_marketplace_extended.sql`
11. `scripts/011_create_debate_reasoning.sql`
12. `scripts/012_create_credits_system.sql`
13. `scripts/013_create_creations.sql`
14. `scripts/014_create_activity_logs.sql`
15. `scripts/015_create_notifications.sql`
16. `scripts/016_fix_credits_policies.sql`
17. `scripts/017_fix_activity_policies.sql`
18. `scripts/018_create_execution_traces.sql`
19. `scripts/019_create_tempmail_log.sql` (optional; for tempmail abuse monitoring)
20. `scripts/020_create_usage_logs.sql` (required for `/api/usage` and cost tracking)
21. `scripts/021_create_builder_projects.sql` (required for builder “Save project” / “My projects”)
22. `scripts/022_create_audit_log.sql` (optional; for audit logging)
23. `scripts/023_create_conversation_folders_and_tags.sql` (optional; for chat folders, tags, shared links)
24. `scripts/024_create_builder_deploys_and_usage.sql` (optional; for builder deploy history and usage limits)
25. `scripts/025_add_agents_is_published.sql` (required for marketplace recommendations; adds `agents.is_published`)
26. `scripts/025_create_migration_tracking.sql` (optional; migration status tracking)
27. `scripts/026_add_database_indexes.sql` (optional; performance indexes)
28. `scripts/027_auth_hardening.sql` through `scripts/041_knowledge_graph_enhancements.sql` (optional; run in numeric order if you use these features)

**Note:** `npm run migrate` runs all `scripts/NNN_*.sql` files in numeric order and skips already-applied migrations. For manual runs, execute 001–024 (and 025+) in order. Learn progress and achievements require 008 and 038; marketplace recommendations require 025 (agents.is_published).

**How to run migrations:**

- **Supabase Dashboard:** Open your project → SQL Editor → New query. Paste the contents of each script and run them in numeric order (001, 002, …). Run one script at a time to avoid errors.
- **psql:** From the project root, run each file in order. Get your connection string from Supabase → Project Settings → Database (URI, use the “Transaction” pooler for migrations if you use connection pooling):
  ```bash
  psql "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" -f scripts/001_create_profiles.sql
  psql "..." -f scripts/002_create_agents.sql
  # ... repeat for 003 through 024, then 025, 026, etc.
  ```
- **One-liner (bash, from project root):** Replace `$DATABASE_URL` with your Supabase connection string, then:
  ```bash
  for f in scripts/00*.sql scripts/01*.sql scripts/02*.sql; do [ -f "$f" ] && psql "$DATABASE_URL" -f "$f" && echo "OK $f"; done
  ```
- **Node (no psql required):** Add `DATABASE_URL` to `.env` (Supabase → Project Settings → Database → Connection string), then:
  ```bash
  # Validate environment variables first (recommended)
  npm run env:validate
  
  # Run migrations
  npm run migrate
  ```
  
  **DATABASE_URL Setup:**
  1. Go to Supabase → Project Settings → Database
  2. Copy the **Connection string** (use **Transaction pooler** for port 6543, not Direct/5432)
  3. Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
  4. If your password contains special characters (e.g., `@`, `#`, `%`), URL-encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `%` → `%25`
     - Or reset your password to one with only alphanumeric characters
  5. Remove any brackets `[]` around the password - they are placeholders, not part of the URL
  6. Add to `.env`: `DATABASE_URL=postgresql://...`
  
  **Common Issues:**
  - **ETIMEDOUT**: Use Transaction pooler (port 6543) instead of Direct (5432)
  - **Invalid URL**: Check for brackets `[]` or unencoded special characters in password
  - **28P01 (password auth failed)**: Verify username and password match exactly from Supabase dashboard

### 4. Stripe webhook (production)

For payments to update subscriptions and agent purchases:

1. In Stripe Dashboard → Developers → Webhooks, add an endpoint.
2. URL: `https://your-domain.com/api/webhooks/stripe` (or `https://your-ngrok-url/api/webhooks/stripe` for local testing).
3. Events: `checkout.session.completed`.
4. Copy the **Signing secret** and set `STRIPE_WEBHOOK_SECRET` in `.env`.

### 5. Run

```bash
npm run dev
# or: pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Build for production:

```bash
npm run build
npm run start
```

Before deploying to production, see the [Pre-production checklist](docs/production.md#pre-production-checklist) (BYPASS_AUTH off, env vars, migrations, health/readiness).

## Testing

With `BYPASS_AUTH=true` (dev only), all protected pages and key APIs (chat, create, generate-presentation, usage) work without login using a bypass user id. Use the [Testing & QA guide](docs/TESTING.md) for a full checklist: auth, nav, core flows, APIs, error/loading UX, and build.

Quick smoke test: `npm run dev` → open `/nav` → visit Dashboard, Chat, Workspace, Presentations, Studio; send a chat message and run one workspace creation.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API_DOCUMENTATION.md)
- [Testing & QA](docs/TESTING.md)

### Builder

The **Builder** (`/builder`) is an AI website builder: describe what you want in chat, and the AI generates or updates project code. You get a live preview, file explorer, tasks, and version history; you can save/load projects, export (Download ZIP, Copy code), and deploy. If the preview shows an error, use **Use safe starter page** to unblock, or **Fix Error** in chat to ask the AI to fix the code. See [API Documentation — Builder](docs/API_DOCUMENTATION.md#builder) and [Testing — Builder](docs/TESTING.md) for API details and E2E notes.
- [Backup & recovery](docs/BACKUP_RECOVERY.md)
- [Production readiness](docs/production.md) — health checks, CI/CD, backup/restore, monitoring
- [Development guide](docs/DEVELOPMENT.md) — setup, scripts, structure, testing, deployment
- [Troubleshooting](docs/TROUBLESHOOTING.md) — env, database, auth, build, tests, production
- [Next development steps](docs/NEXT_DEVELOPMENT_STEPS.md) — documentation, schema/lib fixes, caching, validation, deploy
- [Security](SECURITY.md) — reporting vulnerabilities, supported versions, auth, RLS, audit, rate limit, CSP

### Next.js 16 proxy

Auth, CSRF, and request-size logic live in `proxy.ts` (Next.js 16 proxy convention). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) “Middleware → Proxy” and the [proxy convention](https://nextjs.org/docs/messages/middleware-to-proxy).

## Contributing

**Start here:** [Setup](#setup) above, [Development guide](docs/DEVELOPMENT.md) (scripts, testing, deployment), [Testing & QA](docs/TESTING.md), and [API](docs/API_DOCUMENTATION.md) / [Architecture](docs/ARCHITECTURE.md) for code and docs expectations.

- **Setup:** Follow [Setup](#setup) above; use `.env.example` and never commit `.env`.
- **Branch strategy:** Use feature branches; main is protected; PRs required for changes.
- **Testing:** Run `npm run test` (Vitest) and `npm run test:e2e` (Playwright) before submitting; see [docs/TESTING.md](docs/TESTING.md).
- **Component library:** Run `npm run storybook` to open Storybook (port 6006) for UI components (buttons, cards, etc.); see `components/ui/*.stories.tsx`.
- **PR expectations:** Lint and typecheck pass; tests pass; keep [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) in sync when changing APIs or structure.
