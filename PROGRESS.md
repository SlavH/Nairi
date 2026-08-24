# Project Status — showcase build

> Updated: 2026-08-24 (cleanup/showcase branch)

## Verified state

- **TypeScript**: `npx tsc --noEmit` — 0 errors (build fails on type errors by policy)
- **Tests**: Vitest — 309 passed / 2 skipped (41 files)
- **Build**: `npm run build` — successful
- **Dependencies**: pruned to packages with real source imports

## What was done in the cleanup

1. **Dead UI code removed** (~22k LOC): 94 orphaned components/hooks/artifacts,
   incl. the never-rendered global nav-overlay system and 28 unreachable chat panels.
2. **Dead lib modules removed** (~10k LOC): the `lib/ai` Phase-X graveyard, duplicate
   validation/i18n/logging layers, retired provider clients (Brave/SearXNG/HF direct),
   plus their test-only companions (mfa, session-manager…).
3. **API surface halved** (~21.7k LOC): tools suites and media long-tail without UI,
   REST layers superseded by direct RLS-backed Supabase access, duplicate chat
   endpoints, dev seed endpoint (security), unauthenticated webhook ingress.
4. **Routes consolidated**: `/presentations` → full editor; top-level dashboard
   duplicates → permanent redirects; `/debate` removed (chat debate mode remains).
5. **Flow became a real social feed**: posts, likes, comments, follows
   (`scripts/048_flow_social.sql` + rewritten `/api/flow/*` + new feed UI).
6. **Workflows persistence wired** to its previously-unused server CRUD APIs.
7. **Broken flows fixed**: workspace/create form (was a guaranteed 500), `/nav`
   dead links, honest landing credit info.

## Feature truth table

See README.md for the pillar table; every listed feature is reachable from the UI.
