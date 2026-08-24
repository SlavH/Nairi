# Nairi — Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Supabase (Auth + Postgres + RLS) · Stripe · Vercel AI SDK · OpenCode/WebContainers (Builder) · transformers.js (local embeddings) · Vitest + Playwright

Verified gates: `tsc --noEmit` clean (build fails on type errors) · `vitest run` green · `next build` successful.

## Shape

One deployable Next.js app. No separate backend service.

- `app/**` — pages and ~74 API route handlers
- `components/**` — feature-grouped UI on a shadcn/radix design system
- `lib/**` — domain logic; everything reachable from a route or page
- `scripts/*.sql` — numbered migrations applied by `npm run migrate`
- `supabase/migrations/*.sql` — RLS-hardening SQL (run via Supabase editor)
- `__tests__/`, `e2e/` — Vitest + Playwright

## Provider chains

Text generation — `lib/ai/groq-direct.ts`:

```
NAIRI_AI_BASE_URL (OpenAI-compatible: vLLM/AMD, Ollama, Groq…)
  → COLAB_AI_BASE_URL → NAIRI_ROUTER_BASE_URL (async HF job router)
```

Media generation (image/video/audio):

```
Nairi Router → Replicate ($) → HuggingFace ($) → keyless (Pollinations / Streamlabs)
```

Routes return honest 503s when only paid tiers exist and no key is configured.

## Data access pattern

Pages read Postgres **directly through RLS-gated Supabase clients**. REST handlers
exist where logic must run server-side (streaming chat, provider calls with keys,
Stripe webhooks, rate limits, denormalized counters). There is deliberately no
parallel REST layer for pure CRUD the client can do under RLS.

## Social feed (Flow)

`scripts/048_flow_social.sql`: `feed_posts` (+title/media/visibility/counters),
`post_likes`, `post_comments` with counter-maintenance triggers; follows in
`user_follows`. Counters are trigger-maintained; like/comment/delete enforce
ownership via RLS plus explicit `.eq(user_id)` guards.

## Auth & abuse controls

Supabase Auth (email+OAuth). Signup path adds hCaptcha verify, tempmail detection,
per-IP signup limiting (`app/api/auth/verify-signup`). Middleware (`proxy.ts`)
gates protected route groups and applies nonce-based CSP headers.

## Known trade-offs

- In-memory rate limiting unless `REDIS_URL` set (then Redis-backed)
- Workflow execution disabled by default (`NAIRI_ENABLE_WORKFLOW_EXEC=true`)
- Migrations split between automated (`scripts/`) and manual (`supabase/migrations/`) — run both when provisioning fresh
