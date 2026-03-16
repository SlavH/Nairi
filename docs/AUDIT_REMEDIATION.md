# Audit Remediation (Founder/Lead Dev Pass)

This document records fixes and improvements applied after a full project audit.

## Critical

### API auth: `getUserIdOrBypassForApi()` callback

**Issue:** Several API routes called `getUserIdOrBypassForApi()` with no arguments. The function requires a callback (e.g. `() => supabase.auth.getUser()`); omitting it caused runtime errors when resolving the user.

**Fix:** All such calls were updated to pass the Supabase getter:

- `app/api/knowledge/query/route.ts`
- `app/api/debate/[sessionId]/vote/route.ts`
- `app/api/marketplace/agents/[agentId]/reviews/route.ts`
- `app/api/search/route.ts`
- `app/api/flow/collections/route.ts`
- `app/api/chat/upload/route.ts`
- `app/api/studio/gallery/route.ts`
- `app/api/workspace/creations/[id]/activity/route.ts`
- `app/api/workspace/creations/[id]/share/route.ts`
- `app/api/workspace/search/route.ts`
- `app/api/workspace/folders/route.ts`
- `app/api/chat/compare-models/route.ts`
- `app/api/chat/export/route.ts`
- `app/api/chat/search/route.ts`
- `app/api/builder/code-quality/route.ts`

**Standard pattern:** `const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())`

---

## High

### Community pages: placeholder → Coming soon

**Issue:** `(fullscreen)/community/projects`, `people`, and `companies` showed fake placeholder data (“Add real data later”), which is misleading.

**Fix:** Replaced with a single “Coming soon” card and short description of what each section will do. No fake data.

### Builder code-quality: `formatCode` placeholder

**Issue:** `lib/builder/code-quality.ts` had a comment “This is a placeholder” and returned code unchanged.

**Fix:** JSDoc updated to state that formatting is pass-through until Prettier (or similar) is integrated; `_language` kept for API compatibility. No behavioral change.

---

## Medium

### Dev-only routes in production

**Issue:** `/test-interface` and `/test-error` are for development and Sentry testing; they should not be reachable in production.

**Fix:** Added `layout.tsx` in `app/test-interface` and `app/test-error` that calls `notFound()` when `NODE_ENV === 'production'`. In production builds, these URLs return 404.

### Webhook sample data

**Issue:** Builder webhooks config used example URL/secret that could be mistaken for real credentials.

**Fix:** Clarified with a comment that `SAMPLE_WEBHOOKS` entries are example/demo only and not real credentials.

---

## Documentation

- **TESTING.md:** Added “Dev-only routes” section describing `/test-interface` and `/test-error` and that they 404 in production. Added Community to “Feature status” as Coming soon.
- **AUDIT_REMEDIATION.md:** This file.

---

## Recommended follow-ups (not done in this pass)

- **API docs:** Ensure every public API route is listed in `docs/API_DOCUMENTATION.md` with auth and rate limits.
- **E2E:** Add smoke tests for onboarding, studio, and optionally billing/checkout (with Stripe test or mocks).
- **RLS:** Verify RLS policies on all user-scoped tables.
- **BYPASS_AUTH:** Keep disabled in production; document in deployment checklist.
