# Nairi Audit Triage — Prioritized Fix List

Derived from 5 audit reports (docs/AUDIT_{CHAT,BUILDER,MARKETPLACE,LEARN,INFRA}.md). Policy: tests-first, commit per fix, tsc clean, named test passes.

## Priority 1 (CRITICAL — fix now)

| # | Area | Finding | Evidence | Fix scope |
|---|------|---------|----------|-----------|
| F1 | chat | Unauthenticated chat completion endpoints (anon abuse of paid backends) | AUDIT_CHAT.md top-1: `app/api/chat/route.ts:544`, `chat/colab/route.ts:24`, `nairi-chat/route.ts:26`, `nairi/chat/route.ts:28` | Add auth guard (401) on all 4 routes + strip `system` role in colab; test 401 anon |
| F2 | chat | Stored XSS in chat rendering (SVG dangerouslySetInnerHTML + markdown href scheme) | AUDIT_CHAT.md top-2: `components/chat/artifacts.tsx:82`, `chat-interface.tsx:190` | Sanitize SVG (no event handlers), scheme-allowlist links; unit tests |
| F3 | builder | SSRF in reference-site fetch | AUDIT_BUILDER.md top-1: `app/api/builder/generate/route.ts:78-93,289,403,963-971,195-231`; duplicate `lib/builder/utils/website-analyzer.ts:18-33` | `validateFetchTarget()` (https-only, block private/loopback/metadata, 10s timeout, 1MB cap); test |
| F4 | builder | Same-origin XSS via `handleOpenExternal` blob window.open | AUDIT_BUILDER.md top-2: `components/builder/live-preview.tsx:697-725` | Remove window.open of same-origin blob; sandboxed iframe or drop button; regression test |
| F5 | marketplace | RLS hardening migration drops wrong policy names → self-grant subs + forge purchases still open | AUDIT_MARKETPLACE.md top-1: `supabase/migrations/20260804_harden_rls_policies.sql:12,25` vs `006`/`010` | Fix drop names (`subscriptions_insert_own/update_own`, `purchases_own`), service-role-only writes; contract test |
| F6 | marketplace | Paid content (full_content/file_url) leaks via GET/search | AUDIT_MARKETPLACE.md top-2: `products/[id]/route.ts:23-47`, `search/route.ts:69-77` | Strip paid fields unless owner/creator; test |
| F7 | infra | Workflow execution RCE + unauth GET/DELETE | AUDIT_INFRA.md top-1: `lib/workflows/executor.ts:417` new Function; `execute/route.ts:60-73,184-240`; `executor.ts:80-84` client role | Gate behind auth + persisted workflow ownership + credits/rate-limit; server-side role; sandbox code nodes or disable; tests |
| F8 | infra | CSP `unsafe-inline`/`unsafe-eval` + CSRF localhost substring bypass | AUDIT_INFRA.md top-3: `lib/security/csp.mjs:17`, `request-validator.ts:161-165` | Remove unsafe-inline/eval in prod; exact-match origin allowlist; tests |
| F9 | learn | RAG chat history broken (IndexedDB keyPath mismatch) | AUDIT_LEARN.md top-3: `lib/nairibook/db.ts:47-48` vs `chat-store.ts:32-49`, `rag-chat-panel.tsx:63,118` | Fix keyPath to `notebookId`; try/catch; test |
| F10 | marketplace | Creator earnings math inconsistent (10% vs 70% vs 80%) + RLS-empty reads | AUDIT_MARKETPLACE.md top-3: `earnings/route.ts:46-58,63,121,129` | Unify payout %, use admin-client read, COUNT/SUM aggregations; test |

## Priority 2 (HIGH — next wave)

| # | Area | Finding |
|---|------|---------|
| F11 | chat | OpenCode agent all-permissions `"allow"` default (`hooks/use-opencode.ts:56-69`) → default `"ask"` |
| F12 | chat | Share feature dead (`/share/chat/<slug>` no page) + `Math.random()` slug → crypto.randomUUID |
| F13 | chat | `shouldRefuse` narrow regexes only on last message → scan all user messages |
| F14 | chat | model-comparison ignores provider/model → real routing |
| F15 | builder | Prompt injection into generated code → TIER1 instruction in system-prompt + opencode-prompt restrict perms |
| F16 | builder | Fork/collaborator access control (RLS `forked_by` mismatch, email disclosure, CSRF) |
| F17 | builder | Unbounded project body (enforce 500KB) + version snapshot churn |
| F18 | marketplace | `creator_profiles_own FOR ALL` self-verification → split policies |
| F19 | marketplace | Agents drafts public (`is_published` filter missing) + agent create/edit dead (RLS + `system_prompt` column) |
| F20 | marketplace | Reviews broken end-to-end (moderation insert denied, FK embed, rating) |
| F21 | learn | Quiz answers exposed (RLS USING(true) + page ships correct_answer) |
| F22 | learn | Achievements/analytics dead after hardening (service-role writes) |
| F23 | learn | Skill tree dead (skill_nodes vs skills, is_published vs is_public, wrong columns) |
| F24 | learn | Unbounded LLM context + no rate limit on notebook chat/generate |
| F25 | infra | Credits earn TOCTOU + no evidence + garbage rpc + referral status mismatch |
| F26 | infra | provider-health queries non-existent columns → all "down" |
| F27 | infra | signup_attempts PII leak + contact_submissions broken |
| F28 | infra | MFA TOTP can never verify (hashed secret) + QR to third party |

## Priority 3 (MEDIUM/LOW — batch)

F29 chat export header injection; F30 chat upload filename traversal; F31 chat conversation folder ownership; F32 colab mutex global serialization; F33 rate-limit x-forwarded-for spoofing (all areas); F34 builder dead code cleanup (duplicates, lib/features/builder, unmounted components); F35 builder error leak to client; F36 marketplace purchase double-spend atomicity; F37 marketplace recommendation invalid PostgREST syntax; F38 learn chunking overlap offsets; F39 learn embeddings WebGPU fallback; F40 learn nairi-chat `"assitant"` typo; F41 infra migration 025 duplicate numbering; F42 infra workflow webhook dead; F43 infra next.config ignoreBuildErrors; F44 infra docker socket mount; F45 infra session raw refresh token; F46 infra traces module-global state; F47 infra circuit-breaker TTL.

## Rejected / deferred (documented, not fixing now)

- F35's remove of `handleOpenExternal` button UX — will keep feature but sandbox it (no behavior loss).
- F42 workflow webhook registry — remove dead endpoint (low risk).
- Deleting `lib/features/builder` and other dead modules — defer to a dedicated cleanup pass to avoid churn alongside security fixes.

## How fixes are executed

Each fix-worker (big-pickle) takes ONE finding (or tightly-coupled cluster), works tests-first:
1. Write/adjust a failing test reproducing the defect.
2. Implement the minimal fix.
3. Run the named test file + `npx tsc --noEmit`.
4. Commit with conventional message.
Report back: test output + commit hash. Verification gate (1 agent) runs `npm run test` + typecheck and routes reds back.
