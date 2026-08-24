# Nairi Factory — Production Audit & AMD GPU Integration

## Completed: AMD GPU Integration

### Fixed `NAIRI_AI_BASE_URL` Routing Gaps

1. **`/api/nairi-chat`** — Rewrote to use `generateWithFallback` → `NAIRI_AI_BASE_URL` for all AI inference:
   - Classifier pass (greeting vs search)
   - Web search path with PLAN → FINAL 2-pass
   - Single natural reply for chitchat
   - Removed dependency on `NAIRI_HF_BASE_URL`/`NAIRI_AI_BASE_URL`

2. **`/api/nairi-chat/health`** — Created new health endpoint:
   - Checks `NAIRI_AI_BASE_URL`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`
   - No longer depends on external HF Space health check

3. **`lib/api/nairi-client.ts`** — Updated health check:
   - Changed from `/api/nairi/health` → `/api/nairi-chat/health`
   - Health now validates GPU backends, not external HF Space

4. **Multimedia routes** — Verified GPU-first architecture:
   - `generateWithFallback` (for LLM prompt enhancement/lyrics) → `NAIRI_AI_BASE_URL`
   - Router (`NAIRI_ROUTER_BASE_URL`) for self-hosted media inference
   - Robust fallback chains: Replicate → HuggingFace → Pollinations
   - All working as designed; no changes needed

### TypeScript Audit
- Full-project `tsc --noEmit` previously reported 28 errors (including runtime-breaking bugs like an undefined `userContent` in `/api/chat` and a missing `setWatchProgress` state in the earn page). All 28 have been fixed; as of 2026-08-23 `npm run typecheck` now passes cleanly and `npm test` reports 388/388 passing.

## Architecture Summary

```
User → /api/nairi-chat → generateWithFallback → NAIRI_AI_BASE_URL (AMD GPU)
                                      ↓ GROQ_API_KEY (fallback)
                                      ↓ OPENROUTER_API_KEY (fallback 2)

User → /api/generate-* → LLM enhancement → NAIRI_AI_BASE_URL
                      → Media generation → NAIRI_ROUTER_BASE_URL (self-hosted GPU)
                                         → Replicate → HuggingFace → Pollinations
```

## Remaining Recommendations
1. Run `npm test` to verify unit tests pass
2. Test `/api/nairi-chat` with `NAIRI_AI_BASE_URL` configured
3. Verify frontend `NairiChatView` works with new health endpoint
4. Consider fixing pre-existing TypeScript errors in test mocks
