# Changelog

All notable changes to Nairi v34 will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### AMD GPU Integration
- `/api/nairi-chat` — rewrote to use `generateWithFallback` → `BITNET_BASE_URL` for all AI inference (classifier, plan, answer passes)
- `/api/nairi-chat/health` — new health endpoint checking BITNET/GROQ/OPENROUTER backends
- `lib/api/nairi-client.ts` — updated health check to use new endpoint
- All multimedia routes verified: LLM prompt enhancement uses BITNET, media uses router with fallback chains

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
