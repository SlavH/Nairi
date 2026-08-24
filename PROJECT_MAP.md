# Nairi — Project Map

Post-cleanup map (2026-08). Every entry is reachable from a live route.

## Pages

| Area | Routes |
|---|---|
| Marketing | `/`, `/about`, `/pricing`, `/faq`, `/how-it-works`, `/capabilities`, `/security`, `/blog`, `/careers`, `/contact`, legal (`/privacy` `/terms` `/cookies`), `/docs/*` |
| Auth | `/auth/login|sign-up|forgot-password|reset-password|callback…`, `/onboarding` |
| Chat | `/chat`, `/chat/[id]`, `/share/chat/[slug]` |
| Builder | `/builder` (client-side OpenCode + Sandpack) |
| Learn | `/learn`, courses, skill-tree, quizzes, mentors, notebooks |
| Flow (social) | `/flow` |
| Studio | `/studio`, `/studio/presentation` |
| Documents | `/documents` |
| Simulations | `/simulations` |
| Marketplace | listing, detail, product, create/edit, creator dashboard & badges |
| Dashboard | `/dashboard` + activity/traces/notifications/billing/credits/settings |
| Account | `/profile`, `/settings`, `/checkout/[id]`, `/checkout/plan/[id]` |
| Hub | `/nav`, `/community/*`, `/search`, `/workspace{,/all,/[id],/create}` |

Redirects: `/billing /credits /activity /execution-traces /notifications → /dashboard/*`; `/presentations → /studio/presentation`.

## Backend groups (74 route files)

chat · nairi-chat · nairi · builder/projects · flow(+likes/comments/follow) ·
workflows · create · studio · generate-{image,video,audio,document,presentation,
slide-images,world} · learn/* · marketplace/{products,purchase,reviews} ·
users/badges · credits · activity/traces/notifications · search · profile ·
auth/verify-signup · contact · upload · export{,-pptx}/import-document · health ·
rate-limit · v1 · webhooks/stripe. See `docs/API_DOCUMENTATION.md`.

## Libraries that matter

- `lib/ai/groq-direct.ts` — provider fallback chain for all text generation
- `lib/nairibook/*` — parsers → concepts → graph → RAG (WebGPU embeddings)
- `lib/supabase/*` — server/client/admin clients; `lib/auth.ts` session helpers
- `lib/security/request-validator.ts`, `lib/rate-limit*.ts` — request hygiene
- `lib/workflows/{store,executor}.ts` — node-graph engine
- `lib/opencode-wasm-bridge.ts` + `lib/webcontainer-provider.ts` — Builder agent

## Migrations

`npm run migrate` applies `scripts/001…048_*.sql`. RLS hardening lives in
`supabase/migrations/*.sql` (manual step on fresh projects).
