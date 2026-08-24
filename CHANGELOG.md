# Changelog

All notable changes to Nairi are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.35.0] — 2026-08-24 — Showcase cleanup

### Removed
- 94 dead UI files (~22k LOC): orphaned components/hooks, unrendered nav-overlay system, junk artifacts
- 74 dead lib modules (~10k LOC): lib/ai Phase-X graveyard, duplicate validation/i18n layers, retired provider clients
- ~100 API route files without live consumers (tools suites, media long-tail, superseded REST layers)
- Routes: /debate (subsumed by chat mode), /studio/document, top-level dashboard duplicates (now permanent redirects), /api/seed (security), workflows/webhook (unauthenticated)
- 16 unused npm dependencies (gsap, zustand, otplib, @dnd-kit/*, react-hook-form stack, recharts, cmdk, embla-carousel, vaul, react-day-picker, input-otp, fake-indexeddb, @storybook/test)

### Added
- Flow social feed: posts, likes, comments, follows (scripts/048_flow_social.sql + /api/flow rewrite + new UI)
- /workflows server persistence via previously-unused /api/workflows CRUD

### Fixed
- /workspace/create: native form POST (guaranteed 500) replaced with JSON fetch; type picker trimmed to supported types
- /nav hub broken links (/dashboard/profile -> /profile, /dashboard/creations -> /workspace)
- Landing page fake credit meter removed; honest daily-allowance copy
- studio/generate route verified clean (audit false positive)

### Docs
- README rewritten to match reality; .env.example reduced to actually-read variables
- Audit/historical documents moved to docs/archive/
## [Unreleased]

### AMD GPU Integration
- `/api/nairi-chat` — rewrote to use `generateWithFallback` → `NAIRI_AI_BASE_URL` for all AI inference (classifier, plan, answer passes)
- `/api/nairi-chat/health` — new health endpoint checking NAIRI_AI/GROQ/OPENROUTER backends
- `lib/api/nairi-client.ts` — updated health check to use new endpoint
- All multimedia routes verified: LLM prompt enhancement uses NAIRI_AI_BASE_URL, media uses router with fallback chains

### Security Hardening
- `/api/create` — added rate limiting + prompt length validation (2000 chars)
- `/api/presentations` — added rate limiting + prompt/content length validation
- `/api/builder/projects` — added rate limiting (GET/POST) + try/catch error handling
- `/api/profile` — added per-method rate limits + field length + URL validation
- `/lib/rate-limit.ts` — added `create` rate limit configuration

### TypeScript — Zero Errors
- Fixed 13 pre-existing TypeScript errors in test mocks (`rbac.test.ts`, `session-manager.test.ts`, `monitoring.test.ts`)
- Fixed 4 pre-existing TypeScript errors in app code (`custom-builder.ts`, `circular-navigation.tsx`, `chat-sidebar.tsx`, `factory/page.tsx`)
- Fixed test API route (`builder/projects/route.test.ts`)
- All 73 tests passing

### Documentation
- `AUDIT_SUMMARY.md` — GPU integration audit results
- `PRODUCTION_CHECKLIST.md` — deployment checklist

## [0.34.0] - 2026-02-13

- Nairi v34: Next.js 16, React 19, TypeScript.
- Features: chat (multi-provider AI), agent marketplace, builder, workflows, studio, presentations, workspace, billing, learn, debate, flow, knowledge.
- Migrations 001–041 (idempotent); env validation; unit/integration/E2E tests; production readiness (health, backup, monitoring docs); cache on marketplace agents; readiness endpoint.

[Unreleased]: https://github.com/nairi/nairi_v34/compare/v0.34.0...HEAD
[0.34.0]: https://github.com/nairi/nairi_v34/releases/tag/v0.34.0
