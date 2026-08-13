# Nairi — Architecture Report

**Repo:** `/content/Nairi` · **Package version:** 0.34.0 · **Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind · Supabase (Auth + Postgres) · Stripe · Vercel AI SDK · OpenCode WASM + WebContainer · transformers.js · Vitest + Playwright

**Method:** read-only investigation (grep/read, no file modifications). Verification runs: `npx tsc --noEmit` → **PASS**; `npx vitest run` → **26 files, 201 tests, 200 pass / 1 fail**. `next build` was **not** run; note `next.config.mjs:10` sets `typescript: { ignoreBuildErrors: true }`, so builds never gate on type errors regardless.

---

## 1. Repository Structure

| Area | Size | Notes |
|---|---|---|
| `app/` | 298 `ts/tsx` | `160` `route.ts` (all under `app/api/**`), `86` `page.tsx` |
| `components/` | 240 | Feature-grouped: `chat/*`, `builder/*`, `marketplace/*`, `learn/*`+`nairibook/*`, `studio/*`, `workflow/*`, `checkout/*`, shared UI |
| `lib/` | 191 | `supabase/*`, `ai/*`, `chat/*`, `nairibook/*`, `builder/*`, `workflows/*`, `marketplace/*`, `security/*`, `auth/*`, `nairi-api/*`, `colab/*`, `api/*`, `image-providers/*`, `rate-limit*.ts`, `features/*`, `webcontainer-provider.ts`, `opencode-wasm-bridge.ts`, `stripe.ts` |
| `hooks/` | 8 | `use-opencode.ts`, `use-nairi-chat.ts`, chat/files hooks |
| `scripts/` | 46 numbered SQL migrations (`001_create_profiles.sql`…`046_create_workflows_table.sql`) + `run-migrations.mjs`, `validate-migrations.mjs`, `validate-env.mjs`, `fix-migrations-idempotent.mjs`, deploy/night-run/dns shell scripts, `rollback/` (only `001`, `002`) |
| `supabase/migrations/` | 3 SQL | `001_enable_rls_all_tables.sql`, `20260501_add_opencode_session.sql`, `20260804_harden_rls_policies.sql` — **manual** SQL-Editor migrations, NOT in the automated pipeline |
| `__tests__/` | 45 files | 26 Vitest files run; 8 Playwright `e2e/*.spec.ts` + `auth.setup.ts`; 10 `integration/api/*.test.ts` (excluded from Vitest); helpers |

**API surface (160 routes)** grouped by feature dir:
`api/chat/*` (11: main, colab, conversations, folders, share/export, history, search, templates, upload, compare-models) · `api/builder/*` (generate, projects CRUD/fork/collaborators) · `api/generate-image/*` (6) · `api/generate-video/*` (2) · `api/generate-3d/*` (4) · `api/generate-*` (song, music+continue, audio, lyrics, sfx, vocals, world, chart, document, slide-images, avatar, presentation, simulation, project) · `api/learn/*` (notebooks×6, quizzes×3, progress, achievements, ai-mentors×2) · `api/marketplace/*` (agents×4, products×3, purchase, earnings, recommendations, reviews, search) · `api/nairi/*`, `api/nairi-chat/*` (2), `api/nairi-router/*` (4) · `api/workflows/*` (3) · `api/studio/*` (4) · `api/auth/*` (verify-signup, check-fingerprint) · `api/webhooks/stripe` · `api/seed` · `api/rate-limit/usage` · plus health, admin, credits, knowledge, flow, education, debate, research, export, upload, image/video/document/audio-tools, workspace, presentations, search, usage, traces, code-agent, import-document, preview, contact.

**Migration split (important):** the automated pipeline (`npm run migrate` → `scripts/run-migrations.mjs`) applies only `scripts/*.sql`. All RLS enforcement files (`001_enable_rls_all_tables.sql`, `20260804_harden_rls_policies.sql`) live in `supabase/migrations/` and must be run by hand — a real deployment hazard (see §4 WP6).

---

## 2. Core Features & Data Flow

### 2.1 Authentication & anti-abuse
- Session helpers: `lib/auth.ts` (`getSession`, `getUserIdForApi`; comment declares "No bypass mode"); clients `lib/supabase/{server,client,admin,server-profile}.ts`.
- Signup defenses: `app/api/auth/verify-signup/route.ts` (hCaptcha via `lib/hcaptcha-verify`, IP signup + tempmail limits via `lib/ip-rate-limiter`); `app/api/auth/check-fingerprint/route.ts` (device fingerprint, 3-accounts-per-device cap via `lib/device-fingerprint`).
- `lib/auth/{rbac,mfa,session-manager,account-lockout}.ts` — RBAC/MFA/session/lockout primitives. `lib/email-validation.ts` is a placeholder (see §4).
- OpenCode/WebContainer builder session: `supabase/migrations/20260501_add_opencode_session.sql`.

### 2.2 Chat (main UI + SSE)
- `app/api/chat/route.ts` (1605 L): request-size validation, content filters, prompt-injection detection, then **intent detection** (image/video/sound/audio/simulation/document) at lines ~101–319 that routes to the `generate-*` endpoints; otherwise model chat. Backend selection at lines ~9–21: `useColabBackend` / `useOllamaBackend` / `useOpenCodeBackend`.
- Client: AI SDK `useChat` + `DefaultChatTransport` in `components/chat/chat-interface.tsx:341–350`, body `{conversationId, mode}`.
- Nairi SSE chat: `app/api/nairi-chat/route.ts` (SSE) consumed by `lib/api/nairi-client.ts` (`healthCheck` 5s timeout, `sendChat` 60s timeout) from `hooks/use-nairi-chat.ts` (has a reconnect TODO, §4).
- Conversation persistence: `app/api/chat/conversations/**`, folders, history, search, share/export, templates, upload.

### 2.3 AI plumbing
- `lib/ai/groq-direct.ts` (297 L): `generateWithFallback` / `streamWithFallback` provider chain. Effective priority: `COLAB_AI_BASE_URL` / `NAIRI_AI_BASE_URL` → `NAIRI_ROUTER_BASE_URL` (async job via `lib/nairi-api/router.ts`, result polling with retry/backoff). `lib/ai/client.ts` builds the OpenAI-compatible provider (`createOpenAI`); `lib/ai/circuit-breaker.ts`; `lib/colab/*` (timeout, retry, mutex, health).
- **Note:** `GROQ_API_KEY` / `OPENROUTER_API_KEY` are documented in `.env.example` as fallbacks and advertised by the health endpoint, but are not consumed anywhere in `lib/ai/groq-direct.ts` — dead env vars (§4 HIGH-7).

### 2.4 Generation endpoints
- `app/api/generate-image/route.ts` — tiered: Nairi Router → Stability → HuggingFace → Pollinations (free fallback). Variants: `character`, `edit`, `img2img`, `inpaint`, `controlnet`, `enhance-prompt`.
- Video (`generate-video`, `long-form`), audio (`generate-audio`), song (`generate-song`), music (+`continue`), lyrics, sfx, vocals, 3D (`generate-3d/*`: scene, animate, texture), avatar, chart, world, simulation, slide-images, document.
- Tools: `image-tools/*` (blend, face-restore), `video-tools/*` (extend, transform, upscale), `audio-tools/*` (+separate), `document-tools`, `export/*`, `export-pptx`, `import-document`.
- `app/api/studio/*` (generate, image, presentation, gallery) — studio UI generator.

### 2.5 Builder — TWO architectures
1. **Client-side (primary, in use):** `app/builder/page.tsx` → `hooks/use-opencode.ts` → `lib/opencode-wasm-bridge.ts` → WebContainer (`lib/webcontainer-provider.ts`), generation via `opencode.executeTask` (`app/builder/page.tsx:342`). `hooks/use-opencode.ts` makes **zero** `/api` calls — fully in-browser. Projects persist via `app/api/builder/projects/**` (rate-limited, `assertSameOrigin`). OpenCode permissions are configurable through `use-opencode.ts`.
2. **Server-side (legacy, effectively dead):** `app/api/builder/generate/route.ts` (2845 L; website fetch, CSS extraction, smart plan, `callFreeLLM`). **No UI component calls it** — its only reference in the codebase is the rate-limit config `lib/features/platform/index.ts:11`. Same for `app/api/generate-presentation` (`index.ts:12`). The route returns 503 without `NAIRI_AI_BASE_URL` (lines ~985–991). See §4 HIGH-6.

### 2.6 NairiBook / Learn — TWO parallel RAG implementations
1. **Client-side (rich):** `lib/nairibook/*` — `pipeline.ts` parse → chunk → embed (`Xenova/all-MiniLM-L6-v2` via transformers.js, WebGPU/WASM), builds knowledge graph, concepts, exercises, photo-check, zen mode; `retrieval.ts` uses cosine similarity, threshold 0.25, top-k 5. Tests in `__tests__/lib/nairibook/*`.
2. **Server-side (naive):** `app/api/learn/notebooks/*` persist `learn_notebooks` / `learn_notebook_sources` to Supabase; the chat route `app/api/learn/notebooks/[id]/chat/route.ts:47–50` concatenates source text (`slice(0, 80000)`) directly into the prompt via `generateWithFallback` — **no embeddings, no retrieval**. Behavior divergence between the two paths is a real inconsistency (§4 HIGH-8).

### 2.7 Marketplace & payments
- Routes: `agents/**` (CRUD, install, reviews), `products/**` (CRUD, purchase), `purchase`, `earnings`, `recommendations`, `reviews`, `search`.
- Purchase flow (`app/api/marketplace/products/[id]/purchase/route.ts`, 205 L): free → insert purchase record; credits → check `profiles.tokens_balance`, deduct, insert record + `credit_transactions`, credit creator 70% (`line 132`, `floor(creditCost * 0.7)`); else Stripe checkout session (`line 170`). **See §4 HIGH-3/HIGH-4.**
- Checkout client: `components/checkout/*`, `app/actions/stripe.ts`; webhook `app/api/webhooks/stripe/route.ts` (see §4 HIGH-5).

### 2.8 Workflows
- `lib/workflows/*` + `app/api/workflows/{route,execute,webhook}`. Execution has a `TODO: Implement credit check` at `app/api/workflows/execute/route.ts:91`. UI under `app/workflows` + `components/workflow/*`.

### 2.9 Education / Debate / Research / Flow
- `app/api/education/route.ts` — GET lists education tools, POST executes actions via `generateWithFallback`; failure returns HTTP 200 with `success:false, provider:"fallback"` (lines ~217–225).
- `app/api/debate/[sessionId]/vote`, `app/api/research`, `app/api/flow/route.ts` (+`collections`).

### 2.10 Settings / BYOK
- `app/settings/page.tsx` stores BYOK / OpenCode-Zen / Pollinations keys in **localStorage** (`lib/image-providers/pollinations-config` `getPollinationsKey`/`setPollinationsKey`); `app/settings/api/page.tsx` surfaces `/api/rate-limit/usage`. Client-held keys + client-side OpenCode = keys never leave the browser (design note, not a bug).

### 2.11 Rate limiting & security
- `lib/rate-limit.ts` — in-memory `Map` window limiter with `setInterval` cleanup (per-instance, NOT production-safe for serverless); `RATE_LIMITS` config table in `lib/features/*` (`platform/index.ts` maps `/api/builder/generate`, `/api/generate-presentation`, etc.).
- `lib/rate-limit-redis.ts` (`checkRateLimitAsync`), `lib/rate-limit-helpers.ts`, `lib/ip-rate-limiter.ts`, `app/api/rate-limit/usage`.
- `lib/security/request-validator.ts` (`validateRequestSize`, `assertSameOrigin`, `sanitizeString`, `detectSuspiciousPatterns`); CSP at build (`lib/security/csp.mjs`); `lib/security/vulnerability-scanner.ts`; `scripts/ssrf-guard` tested in `__tests__/lib/builder/ssrf-guard.test.ts`.

### 2.12 Seed / demo
- `app/api/seed/route.ts` — POST endpoint seeding sample agents/courses/feed posts/knowledge nodes/creations (auth-gated but callable at runtime; §4 HIGH-9).

---

## 3. Design Patterns & Conventions

1. **Route handler envelope:** `createClient()` → `auth.getUser()` → validate → query → `NextResponse.json({...})` with `try/catch` JSON error responses. Auth reuse via `getUserIdForApi` (`lib/auth.ts`).
2. **Provider fallback chain:** generation tiers array + `generateWithFallback`/`streamWithFallback`; async job + poll via `lib/nairi-api/router.ts`; circuit breaker.
3. **Config-driven rate limits:** `RATE_LIMITS` constants in `lib/features/*`, referenced by route handlers and `rate-limit-helpers`.
4. **RLS-first data access:** Supabase RLS policies are the access boundary; route handlers use user-scoped clients (a convention HIGH-3 violates).
5. **Migration pipeline:** numbered idempotent SQL in `scripts/`, `run-migrations.mjs` applies in order, `validate-migrations.mjs` enforces rollback parity (`npm run migrate:validate`).
6. **Contract tests for migrations:** `__tests__/unit/marketplace/rls-contract.test.ts` parses migration SQL strings and asserts policies (drops in 010, hardening in 20260804).
7. **Testing split:** Vitest unit+route tests (node env, mocked clients) / Playwright e2e (needs real prod DB via `.env.local`, `.auth/e2e-test.json`) / `integration/api` (excluded from Vitest, DB-dependent).
8. **Dual-layer storage:** browser localStorage for BYOK/generator keys, Supabase for all app data.
9. **Large single-file route handlers:** `app/api/chat/route.ts` (1605 L), `app/api/builder/generate/route.ts` (2845 L) — both contain most of their feature logic inline.

---

## 4. Defect Inventory (severity-ranked, with evidence)

### HIGH
- **H1 · OpenCode permissions default to `allow` — failing test + security hole.** `hooks/use-opencode.ts:59–68` initializes `permissions` with `bash/read/edit/write/glob/grep/webfetch/websearch` all `"allow"`; the contract test `__tests__/unit/hooks/use-opencode.test.ts:279` expects `"ask"` → **the only failing test** (201 run, 200 pass). Grants generated code full shell + filesystem access by default.
- **H2 · Type errors never block builds.** `next.config.mjs:10` `typescript: { ignoreBuildErrors: true }`. A broken `npm run typecheck` (which currently passes) would not fail CI.
- **H3 · Marketplace purchases are broken by the RLS hardening migration.** The purchase route uses the **user-scoped anon client** (`createClient()`) to insert into `product_purchases` at `app/api/marketplace/products/[id]/purchase/route.ts:54` (free) and `:101` (credits). `supabase/migrations/20260804_harden_rls_policies.sql:37` creates `"Service role can insert purchases" ... FOR INSERT WITH CHECK (false)`, so only service_role (RLS-bypassing) can insert — anon inserts fail. The earlier policy `supabase/migrations/001_enable_rls_all_tables.sql:336` (`"Users can create own purchases"`) contradicts it. The route must use the admin/service client. The contract test `rls-contract.test.ts:103` enshrines the harden policy but **no test asserts the route uses an admin client**, so the runtime break is not caught (route tests mock supabase).
- **H4 · Non-atomic credit transactions (double-spend / lost update).** `purchase/route.ts:75–95` reads `tokens_balance` then writes it back as an absolute value — no atomic decrement, no row lock; concurrent purchases race. Refund on insert failure restores the stale balance (lost update). `credit_transactions` insert (line 114) and creator-credit update (lines 145–155) are fire-and-forget — partial state if they fail; `purchase_count` increment is read-modify-write (`:62–69`, `:122–129`).
- **H5 · Stripe subscription lifecycle never propagates.** `app/api/webhooks/stripe/route.ts` reads `subscription.metadata?.userId` for `customer.subscription.updated/deleted` (cancel/downgrade/past_due), but `app/actions/stripe.ts:58–67` sets only **session** metadata at checkout — subscription objects carry no `userId`. Lifecycle events silently no-op; subscription state diverges from reality.
- **H6 · `/api/builder/generate` (2845 L) and `/api/generate-presentation` are dead code.** No UI calls them — their only references are rate-limit config entries `lib/features/platform/index.ts:11–12`. Builder runs client-side (WebContainer/OpenCode, zero API calls from `hooks/use-opencode.ts`). The server route's `NAIRI_AI_BASE_URL` requirement (`app/api/builder/generate/route.ts:985–991`) and its "smart plan" logic describe a generator the app doesn't use.
- **H7 · Health endpoint lies about fallback providers.** `app/api/nairi-chat/health/route.ts:9–25` advertises `primary: nairi ? groq : openrouter`; `GROQ_API_KEY` / `OPENROUTER_API_KEY` in `.env.example` as fallbacks — but `lib/ai/groq-direct.ts` never reads those vars (only `NAIRI_AI_BASE_URL`, `COLAB_AI_BASE_URL`, `NAIRI_ROUTER_BASE_URL`). False availability signal + dead env config.
- **H8 · Two divergent RAG implementations.** Client `lib/nairibook/retrieval.ts` (real embeddings, cosine 0.25, top-k 5) vs server `app/api/learn/notebooks/[id]/chat/route.ts:47–50` (naive 80k-char concatenation, no retrieval). Same "learn" feature, inconsistent quality and behavior depending on entry point.
- **H9 · Live runtime seed endpoint.** `app/api/seed/route.ts` (sample agents, courses, feed posts, knowledge nodes, creations) is callable in production (POST, auth-gated only). Mistaken trigger pollutes the marketplace/knowledge data with sample content.
- **H10 · Mock/demo data in production paths.** `app/api/flow/route.ts:9` `mockFlowData` served when the DB is empty (lines 166–209); `components/studio/collaboration-panel.tsx:38–51` renders fake collaborators/versions ("Demonstration mode", `You@example.com`).

### MEDIUM
- **M1 · Explicit AI stubs.** `lib/ai/image-to-code.ts:58–60, 97, 313` — `analyzeImage` never calls a vision API ("Placeholder response — in production this would call vision API"); `lib/ai/rag/index.ts:27–28` stub RAG returns `[]`; `lib/ai/embedding-service.ts:11–14` returns `embedding: []`; `lib/ai/eval/index.ts:12` stub eval `{model:"stub", passed:true}`; `lib/chat/context-manager.ts:114–125` `generateSummary` counts messages instead of summarizing; `lib/email-validation.ts:741` "return true and rely on domain blacklist".
- **M2 · Workflow credit check missing.** `app/api/workflows/execute/route.ts:91` `TODO: Implement credit check and consumption`.
- **M3 · Education route returns HTTP 200 on failure.** `app/api/education/route.ts:217–225` returns `success:false, provider:"fallback"` with status 200 — hides failures from monitoring.
- **M4 · Migration pipeline gaps.** RLS files in `supabase/migrations/` are outside `npm run migrate`; only 2 rollbacks (`scripts/rollback/001,002`) exist for 46 migrations, so `npm run migrate:validate` (`scripts/validate-migrations.mjs:44–47`) fails for ~44 migrations; `20260501_add_opencode_session.sql` + `20260804_harden_rls_policies.sql` are dated non-sequential with `001_*.sql`.
- **M5 · In-memory rate limiter in production.** `lib/rate-limit.ts:1–22` `Map` + `setInterval` cleanup — per-instance counters in serverless; `lib/rate-limit-redis.ts` (`checkRateLimitAsync`) exists but is not wired.
- **M6 · Misleading auth comments.** `lib/auth.ts:4–5` "No bypass mode" vs `app/api/chat/conversations/route.ts:4` comment referencing `BYPASS_AUTH` (dev) — inconsistent security docs; grep confirms no bypass code exists, so this is documentation drift.
- **M7 · SSE reconnect TODO.** `hooks/use-nairi-chat.ts:74` — "Reconnect SSE via WebContainer after transition"; dropped streams are not recovered.
- **M8 · Deleted endpoint referenced.** `hooks/use-nairi-chat.ts:75` references deleted `/api/opencode-events`.
- **M9 · Disabled simulation route duplicated.** `app/api/generate-simulation/` and `app/api/generate-simulation_disabled/` both present.

### LOW / INFORMATIONAL
- Generation prompts in `app/api/generate/route.ts` instruct "sample data" / placeholder colors — by design for scaffolding, but no user-facing flag.
- Client-side BYOK keys (OpenCode-Zen, Pollinations) live in `localStorage` (`app/settings/page.tsx:82–87`) — acceptable given fully client-side OpenCode, but worth documenting as the trust boundary.
- No `.env.example` parity check with `lib/features/*` env usage — env var sprawl (e.g., `COLAB_AI_BASE_URL` vs `NAIRI_AI_BASE_URL` both accepted).

---

## 5. Test Coverage Matrix

**Vitest: 26 files / 201 tests — 200 pass, 1 fail (`use-opencode.test.ts:279`, H1).**

Covered routes/libraries:
| Group | Tests |
|---|---|
| API routes (8 of 160) | `auth/callback`, `builder/projects`, `chat/colab`, `chat/route`, `health`, `nairi-chat`, `nairi/chat`, `v1/health` |
| Builder lib | `code-cleaner`, `json-normalizers`, `ssrf-guard` |
| NairiBook lib | `core`, `exercises`, `photo-check`, `problem`, `retrieval` |
| Hooks | `use-opencode` (failing) |
| Auth/RBAC | `rbac`, `session-manager` |
| Security/limiting | `rate-limit`, `rate-limit/monitoring`, `validation/sanitize`, `errors/handler` |
| OpenCode bridge | `opencode-bridge`, `opencode-client` |
| Migrations | `marketplace/rls-contract` |

**Gaps (zero direct coverage):** ~150 API routes — notably marketplace `products/[id]/purchase`, `purchase`, `earnings`, `agents/install`; all `generate-image/video/audio/song/music/sfx/vocals/3d/avatar/world/chart/document`; `learn/notebooks/**` and `learn/notebooks/[id]/chat`; `workflows/{execute,webhook}`; `credits/*`; `webhooks/stripe`; `seed`; `studio/*`; `flow/*`; `knowledge/*`; `education`; `research`; `export/*`; `upload`; `image/video/document/audio-tools`; `nairi-router/*`; `admin/users`; `chat/{share,export,folders,history,search,templates,upload}`; `builder/generate`.

**Not run by Vitest:** `integration/api/*` (10 files, excluded by `vitest.config.ts`, need DB) and `e2e/*` (Playwright: `auth`, `builder`, `chat`, `chat-flow`, `learn`, `marketplace`, `routes`, `workspace.simulations`; requires real prod DB via `.env.local` + `.auth/e2e-test.json`).

**Coverage hazards to fix first:**
1. `rls-contract.test.ts` verifies the hardening policy but nothing verifies the *route* satisfies it → H3 shipped undetected.
2. No test asserts credit/purchase atomicity → H4.
3. No test covers Stripe webhook subscription metadata handling → H5.
4. `use-opencode` contract test fails on permissions → H1 (test already catches it; fix the code, not the test).

---

## 6. Prioritized Work Packages (non-overlapping)

- **WP1 · Security hardening (H1, H2, H3, M5):** change `hooks/use-opencode.ts:59–68` defaults to `"ask"` for bash/fs and add explicit prompt-time consent (fixes the failing test); remove `typescript.ignoreBuildErrors` (`next.config.mjs:10`) or add a real CI type gate; switch `product_purchases` inserts in `app/api/marketplace/products/[id]/purchase/route.ts` to the admin/service client and add a route-level test asserting it; wire `checkRateLimitAsync` (`lib/rate-limit-redis.ts`).
- **WP2 · Marketplace correctness (H4):** atomic `tokens_balance` decrement (single UPDATE with guard `tokens_balance >= cost`), atomic `purchase_count` increment, transactional rollback for `credit_transactions`/creator credit, duplicate-purchase idempotency. Files: `app/api/marketplace/products/[id]/purchase/route.ts`, `app/api/marketplace/purchase/route.ts`, related `credits/*`.
- **WP3 · Stripe lifecycle (H5):** add `userId` to subscription `metadata` at checkout (`app/actions/stripe.ts:58–67`) and/or resolve via `customer_email`; handle `customer.subscription.*` events to update profile state; add webhook handler tests.
- **WP4 · Dead code & demo data (H6, H10, M8, M9):** either wire the server builder or delete `app/api/builder/generate` + `/api/generate-presentation` (and their `RATE_LIMITS` entries at `lib/features/platform/index.ts:11–12`); gate or remove `mockFlowData` (`app/api/flow/route.ts:9`) and collaboration-panel mock data; remove `generate-simulation_disabled`, stale endpoint comments.
- **WP5 · AI plumbing honesty (H7, M1, M3):** fix `nairi-chat/health` to report real provider availability; implement or explicitly disable `analyzeImage`, `lib/ai/rag`, `embedding-service`, `eval`, `context-manager` summary, `email-validation`; return non-200 on education failure.
- **WP6 · Learn RAG unification (H8, M7):** route server notebook chat through `lib/nairibook/retrieval.ts` (or embed via `embedding-service`) instead of 80k concatenation; wire SSE reconnect in `use-nairi-chat`.
- **WP7 · Migration hygiene (M4):** move/merge `supabase/migrations/*.sql` into the automated pipeline (or document manual-run order), generate rollbacks for all 46 migrations, renumber dated files, make `migrate:validate` green.
- **WP8 · Test coverage (gap matrix in §5):** prioritize route tests for marketplace purchase + webhooks + workflows execute + learn notebook chat + generate-image tiers; add a route-vs-migration RLS contract test that fails when the route uses a client without INSERT rights.
- **WP9 · Seed hardening (H9):** gate `/api/seed` behind `NODE_ENV !== "production"` (or an explicit `ALLOW_SEED` flag) and remove sample content from production paths.

---

### Headline numbers for quick reference
- `160` API routes · `86` pages · `240` components · `191` lib files · `46` numbered SQL migrations (+3 manual RLS) · `26` Vitest files / `201` tests (`200` pass, `1` fail) · `tsc --noEmit` clean · `next build` **not** run, type gate disabled.
