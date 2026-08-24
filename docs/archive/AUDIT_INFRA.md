# Nairi Infra Audit — lib/ai, lib/auth, rate-limit, config, supabase, validation, security, errors, admin/agents/workflows/credits/traces/usage routes, proxy, configs, migrations

Auditor: INFRA. Date: 2026-08-05. Scope: as listed in AUDIT_RECON.md §SCOPE. No code was modified.

---

## Summary (top 5 risks)

1. **Workflow execution is a server-side RCE for any authenticated user.** `app/api/workflows/execute/route.ts` takes the workflow JSON straight from the request body and `lib/workflows/executor.ts:417` compiles `action-code` nodes with `new Function` in the global scope (no sandbox). The only guard is the env flag `NAIRI_ENABLE_WORKFLOW_EXEC=true`, and the "admin" check at `executor.ts:82` trusts client-supplied `triggerData.user.role`. The HTTP node is also an SSRF primitive. GET/DELETE on the same route have no auth and leak all in-memory executions of all users.

2. **The RLS hardening migration (20260804_harden_rls_policies.sql) breaks live app paths while leaving a PII hole.** `usage_logs` INSERT is blocked for users, but `lib/cost-tracker.ts:35` (used by `app/api/generate-image` and friends) writes via the user client, so usage/cost tracking is now silently dead and `checkCostLimit` fails open. `product_purchases` INSERT is blocked but the purchase route writes via the user client (purchases broken). `contact_submissions` public INSERT is dropped with no replacement (anonymous contact form broken). Meanwhile `signup_attempts` SELECT is open to every authenticated user (emails/IPs of all signups leak).

3. **CSP and CSRF are both bypassable.** `lib/security/csp.mjs:17` ships `script-src 'self' 'unsafe-eval' 'unsafe-inline'` in production, which defeats CSP as an XSS control. `lib/security/request-validator.ts:161-165` accepts any Origin that merely *contains* `localhost`, so `https://localhost.evil.com` passes the CSRF check.

4. **Credits can be minted by any user.** `app/api/credits/earn/route.ts` lets a user claim daily rewards (watch/activity/streak) with no proof of the activity, has a TOCTOU double-claim race (SELECT-then-INSERT), and contains a garbage update `tokens_balance: supabase.rpc("", {})` (line 68) followed by a non-atomic read-modify-write of the balance. Referral credits are never actually awarded (route inserts status `completed`; `award_referral_credits` only rewards `pending`).

5. **The Phase-4 auth layer (MFA/session/lockout) is either dead code or internally broken.** `SessionManager`/`MFAManager`/`AccountLockoutManager` are referenced nowhere except their own tests. Where they would touch the DB, `sessions` and `mfa_verifications` have no INSERT/UPDATE RLS policies so writes fail; TOTP verification compares against the sha256 *hash* of the secret (`mfa.ts:117` + `mfa.ts:198`) so MFA can never succeed; backup codes use `Math.random()`; and the QR URL sends the TOTP secret to a third-party QR API.

---

## Findings

| file:line | severity | issue | suggested fix |
|---|---|---|---|
| lib/workflows/executor.ts:417-426 | critical | `new Function('input','variables','context','console', code)` runs arbitrary Node.js with `process`/`require`/`fetch` in scope; comment claims sandboxing | Run code nodes in a real sandbox (node `vm` with no `require`/process, or a subprocess/WebContainer); never in global scope |
| app/api/workflows/execute/route.ts:60-73 | critical | Workflow definition taken from request body; any authenticated user can execute arbitrary nodes (incl. code/HTTP); no credits, no rate limit, no size cap | Load workflow by id from DB with ownership check; enforce credits + rate limit; cap nodes/body |
| lib/workflows/executor.ts:80-84 | high | "Admin" gate reads `triggerData.user.isAdmin/role` from client-supplied triggerData → trivially bypassed | Derive role server-side from the authenticated session |
| app/api/workflows/execute/route.ts:184-240 | high | GET (list all) and DELETE (cancel) have zero auth; in-memory `executions` map is shared across all users | Require auth + ownership; persist executions instead of module-global Map |
| lib/workflows/executor.ts:368-406 | high | `action-http` can fetch arbitrary URLs (SSRF: metadata endpoints, internal services) | Block private/loopback ranges; allowlist schemes/hosts |
| lib/security/csp.mjs:17,42 | high | `script-src 'self' 'unsafe-eval' 'unsafe-inline'` in prod CSP defeats XSS defense; `generateNonce()` never used | Remove `unsafe-inline`/`unsafe-eval` in prod; use nonces/hashes for inline scripts |
| lib/security/request-validator.ts:146-176 (see also docs/AUDIT_BUILDER.md:45) | high | `validateOrigin` passes any Origin containing `localhost` (`https://localhost.evil.com` bypass); also a `*` wildcard entry is honored verbatim | Exact equality against allowlist; drop substring matching and the `*` passthrough |
| app/api/generate-{image,music,video,3d}/** and voice-clone/route.ts (isValidApiKey, e.g. generate-music/route.ts:106) | high | Dev-mode flag set when `request.headers.get('host')?.includes('localhost')` — Host header is attacker-controlled, so any request with a matching Host downgrades safety checks in API-key validation | Use `NODE_ENV`/`NEXT_PUBLIC_*` only; never trust the Host header |
| app/api/credits/earn/route.ts:40-94 | high | TOCTOU double-claim of daily rewards + non-atomic balance read-modify-write + bogus `supabase.rpc("", {})` update (line 68) | Single atomic RPC (INSERT … ON CONFLICT DO NOTHING + conditional balance update); remove the garbage update |
| app/api/credits/earn/route.ts:31-36 | high | Reward types `watch`/`activity`/`streak` claimable without any evidence; free credits at will | Require and verify `metadata` proof (watch event id, activity id) server-side |
| lib/cost-tracker.ts:35 + supabase/migrations/20260804_harden_rls_policies.sql:101 | high | `usage_logs` INSERT now blocked for users but `logGenerationCost` (used by generate-image etc.) writes via user client → usage/cost tracking dead, `checkCostLimit` fails open | Move logging to service-role client; or keep user INSERT with `WITH CHECK (auth.uid() = user_id)` |
| app/api/marketplace/products/[id]/purchase/route.ts:54,101 + 20260804_harden_rls_policies.sql:28 | high | `product_purchases` user INSERT removed by hardening but purchase route writes via user client → purchases fail | Use admin client for the insert, or add ownership-checked INSERT policy |
| supabase/migrations/20260804_harden_rls_policies.sql:119-122 | high | Drops "Anyone can submit contact form" and creates no replacement despite comment saying public INSERT stays → `app/api/contact/route.ts:56` fails for anonymous users | Add `CREATE POLICY ... ON contact_submissions FOR INSERT WITH CHECK (true)` (and restrict SELECT to service role) |
| scripts/045_create_missing_feature_tables.sql:57-58 | high | `signup_attempts` SELECT policy `auth.uid() IS NOT NULL` exposes every user's email/IP; no INSERT policy so `logSignupAttempt` fails | Restrict SELECT to service role; service-role INSERT only |
| lib/auth/mfa.ts:117,197-199 | high | TOTP secret stored sha256-hashed, then `verifyTOTP(data.secret, code)` verifies against the hash → MFA verification can never succeed | Store raw secret in a protected column (or encrypt with app key); verify against raw value |
| lib/auth/mfa.ts:62 | high | QR URL sends the TOTP `otpauth://` URL (with secret) to `api.qrserver.com` third party | Generate QR locally (client-side lib) |
| lib/auth/mfa.ts:233-242 | medium | Backup codes generated with `Math.random()` (not CSPRNG) | Use `randomBytes` |
| lib/auth/session-manager.ts:44 | medium | Raw refresh token persisted in plaintext next to its hash | Store only `refresh_token_hash` |
| supabase/migrations/001_enable_rls_all_tables.sql:226,234 + scripts/027_auth_hardening.sql:215-222 | medium | `sessions` and `mfa_verifications` have SELECT-only policies → SessionManager create/rotate/revoke and MFA recordVerification fail if ever used | Add ownership INSERT/UPDATE/DELETE policies or switch to service role |
| scripts/012_create_credits_system.sql:92-243 | medium | SECURITY DEFINER functions (`consume_credits`, `reset_daily_credits`, `update_activity_streak`, `award_referral_credits`) lack `SET search_path` → search_path hijack risk | Add `SET search_path = public` to each |
| app/api/credits/referral/route.ts:104-118 + scripts/012:168-206 | medium | Referral row inserted with `status:'completed'`, but `award_referral_credits` only matches `status='pending'` → "You both received 500" but no credits awarded; also TOCTOU on "already referred" | Insert as `pending` then call RPC (or pass status); enforce uniqueness atomically |
| app/api/credits/route.ts:29-44,62-67 | medium | Profile fetch failure returns fake `balance:100`; RPC failure defaults to 1000 — fail-open masks real errors | Return error, don't fabricate balances |
| lib/ai/provider-health.ts:38-42 | high | `usage_logs` has no `provider` or `success` columns (see scripts/020) → query always errors → every provider reported "down" | Query existing columns or a dedicated health table |
| lib/ai/usage-tracking.ts:27-33 | medium | `recordUsage` is a no-op (commented log, no persistence) → usage tracking dead | Wire to cost-tracker / admin-client insert |
| lib/ai/groq-direct.ts:108-114 | medium | Router fallback path returns a fake stream whose `toDataStream()` is an empty ReadableStream → clients receive no content | Implement real stream conversion or drop the fallback |
| app/api/agents/route.ts:114 | high | Rate limit keyed on spoofable `x-forwarded-for`; multi-step LLM loops run without credits/usage checks | Key on user id; consume credits; record usage; persist kill-switch state |
| proxy.ts:28,62-68 | medium | In-memory rate-limit store + trust of `x-forwarded-for` header → limits bypassable (spoofable) and ineffective across instances | Use Redis (checkRateLimitAsync) and a trusted proxy/CF header; key on user cookie |
| proxy.ts:166 | low | Middleware always sets the *production* CSP even in dev, overriding next.config dev CSP (HMR breaks) | Choose CSP by NODE_ENV in proxy |
| lib/rate-limit.ts:86-101 | medium | `getClientIdentifier` trusts `x-forwarded-for`; used by `/api/usage`, `/api/contact` → rate-limit bypass | Combine with cookie/user id; use trusted proxy config |
| app/api/traces/route.ts:18-19 | low | `limit`/`offset` unvalidated → unbounded `.range()` DoS | Clamp/parse with schema |
| app/api/admin/users/route.ts:32-34,57-61 | low | `limit` unvalidated; `total` is page size not real total | Clamp limit; use count query |
| app/api/admin/users/route.ts:37-41 | medium | Users list is fetched with the *user* client but no ownership filter — RLS returns only own profile → admin list broken if `profiles_select_own` applied | Use admin/service-role client for admin reads |
| scripts/025_add_agents_is_published.sql:2 | high | `ALTER TABLE public.migration_status …` runs before `025_create_migration_tracking.sql` (alphabetical order) on a fresh DB where the table doesn't exist → migration run aborts; two files share number 025 | Add `IF EXISTS` on table; renumber one of the 025 files |
| scripts/validate-migrations.mjs:37-40 | medium | `Duplicate migration number 25` makes `migrate:validate` always fail | Renumber or special-case duplicates |
| app/api/workflows/webhook/route.ts:12-21,104-111 | medium | Webhook registry is an empty in-memory Map; nothing registers handlers; `triggerWorkflow` never executes → dead endpoint returning 404 | Remove or wire to real execution + auth |
| lib/auth/{mfa,session-manager,account-lockout}.ts | low | Referenced nowhere except own tests → dead code carrying the bugs above | Wire into real auth flow or delete |
| lib/rate-limit/monitoring.ts, lib/security/vulnerability-scanner.ts | low | Unreferenced outside tests; writes to `rate_limit_events` now blocked by hardening anyway | Wire or delete |
| lib/ai/traces.ts:13-17 | medium | Module-global mutable `steps` array shared across requests/tenants in serverless; never persisted | Per-request instance; persist via `/api/traces` |
| lib/ai/circuit-breaker.ts:18-26 | low | Single-failure entries never expire from the Map; no cooldown stagger | Add TTL cleanup on read; exponential backoff |
| next.config.mjs:9-11 | medium | `typescript: { ignoreBuildErrors: true }` lets type errors ship | Remove; CI already runs `tsc --noEmit` |
| docker-compose.yml:38 | medium | Docker socket mounted (ro) into the opencode container that executes LLM-generated code → host escape risk | Remove socket; use sandboxed runner |
| lib/config/env.ts:70-84 | low | `requireEnv` returns `placeholder-<key>` during Vercel build; `isValidApiKey` rejects placeholders, but `hasValidApiKey` (client.ts:60-62) returns `true` when a URL is set and no key → provider "configured" without key | Make `hasValidApiKey` reject missing keys |
| scripts/045:101-102 + 20260804:120 | medium | contact_submissions INSERT requires `auth.uid() IS NOT NULL` (045) while SELECT is `USING(false)` (001) — anonymous submissions blocked, reads blocked | Single coherent policy set (public INSERT, service-role SELECT) |
| supabase/migrations/001_enable_rls_all_tables.sql:199 | medium | referrals INSERT policy references non-existent column `referred_by_user_id` | Use `referred_id` |
| lib/ip-rate-limiter.ts:101-103 | medium | Queries `profiles.ip_address` / `profiles.is_tempmail` which don't exist → always fail-open | Add columns or drop the check |
| app/api/workflows/route.ts:45-57 | low | `nodes`/`edges`/`triggers` stored without schema validation; oversized bodies possible | Zod schema + size limit |

---

## Test gaps

Files with NO unit tests (highest-risk first):

- `lib/ai/*` — zero tests for the entire module: `providers.ts`, `model-router.ts`, `client.ts` (key validation), `circuit-breaker.ts`, `provider-health.ts`, `usage-tracking.ts`, `groq-direct.ts` (streaming/fallback), `traces.ts`, `quality-control.ts`, `stream-quality.ts`. Pure-function tests here are cheap (circuit-breaker, estimateCost, isValidApiKey, routeModel).
- `lib/workflows/*` — no tests for `executor.ts`, the RCE/SSRF surface.
- `app/api/workflows/execute/route.ts` — no auth/abuse tests (unauthenticated GET leaks executions).
- `app/api/credits/earn/route.ts` + `referral/route.ts` — no tests for double-claim/TOCTOU or the referral status mismatch.
- `proxy.ts` — no tests for CSRF origin handling (`localhost.evil.com` case), rate-limit keying, or CSP selection.
- `app/api/admin/**` — only `__tests__/unit/lib/auth/rbac.test.ts` (RPC mocking) and `__tests__/integration/api/admin.test.ts`; no direct route-level tests that a non-admin gets 403.
- `scripts/run-migrations.mjs` / `validate-migrations.mjs` — no test for the duplicate-025 ordering failure.
- `lib/rate-limit/monitoring.ts` has a unit test but the class is dead code; no test for `lib/ip-rate-limiter.ts` fail-open behavior.

Existing coverage that helps: `__tests__/unit/lib/auth/rbac.test.ts`, `session-manager.test.ts`, `rate-limit*.test.ts`, `errors/handler.test.ts`, `validation/sanitize.test.ts`, `__tests__/api/health/*`.

---

## Quick wins

1. Fix the CSRF bypass: `lib/security/request-validator.ts:162-163` — replace substring `includes('localhost')` with exact-match on `http://localhost` / `http://127.0.0.1` entries. Two lines.
2. Fix TOTP: `lib/auth/mfa.ts` — store the raw secret (protected column/encryption) so `verifyTOTP` works, and generate QR locally. Confirmed-by-test candidate: unit test that enable→verify round-trips.
3. Move `logGenerationCost` to `createAdminClient()` so the RLS hardening doesn't kill usage/cost tracking; add a test asserting an INSERT is attempted with service role.
4. Fix `provider-health.ts` to query real columns (or drop the broken usage_logs query) — currently every provider is "down".
5. Remove the garbage `supabase.rpc("", {})` update and make the reward claim atomic in `app/api/credits/earn/route.ts`.
6. Add unit tests for `circuit-breaker.ts`, `isValidApiKey` (client.ts), and `estimateCost` (usage-tracking.ts) — pure functions, no mocks.
7. Renumber one of the two `025_*` migrations and add `IF EXISTS` to the ALTER in `025_add_agents_is_published.sql`.
8. Gate `/api/workflows/execute` behind the authenticated user's persisted workflow + `NAIRI_ENABLE_WORKFLOW_EXEC`; add auth to its GET/DELETE.
