# Nairi Factory — Production Audit & AMD GPU Integration

## Completed: AMD GPU Integration

### Fixed `BITNET_BASE_URL` Routing Gaps

1. **`/api/nairi-chat`** — Rewrote to use `generateWithFallback` → `BITNET_BASE_URL` for all AI inference:
   - Classifier pass (greeting vs search)
   - Web search path with PLAN → FINAL 2-pass
   - Single natural reply for chitchat
   - Removed dependency on `NAIRI_HF_BASE_URL`/`NAIRI_AI_BASE_URL`

2. **`/api/nairi-chat/health`** — Created new health endpoint:
   - Checks `BITNET_BASE_URL`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`
   - No longer depends on external HF Space health check

3. **`lib/api/nairi-client.ts`** — Updated health check:
   - Changed from `/api/nairi/health` → `/api/nairi-chat/health`
   - Health now validates GPU backends, not external HF Space

4. **Multimedia routes** — Verified GPU-first architecture:
   - `generateWithFallback` (for LLM prompt enhancement/lyrics) → `BITNET_BASE_URL`
   - Router (`NAIRI_ROUTER_BASE_URL`) for self-hosted media inference
   - Robust fallback chains: Replicate → HuggingFace → Pollinations
   - All working as designed; no changes needed

### TypeScript Audit
- **0 errors** in modified files (nairi-chat route, nairi-client, health endpoint)
- 13 pre-existing errors in test mocks and unrelated components (not caused by our changes)
- All changes compile cleanly

## Architecture Summary

```
User → /api/nairi-chat → generateWithFallback → BITNET_BASE_URL (AMD GPU)
                                      ↓ GROQ_API_KEY (fallback)
                                      ↓ OPENROUTER_API_KEY (fallback 2)

User → /api/generate-* → LLM enhancement → BITNET_BASE_URL
                     → Media generation → NAIRI_ROUTER_BASE_URL (self-hosted GPU)
                                        → Replicate → HuggingFace → Pollinations
```

## Remaining Recommendations
1. Run `npm test` to verify unit tests pass
2. Test `/api/nairi-chat` with `BITNET_BASE_URL` configured
3. Verify frontend `NairiChatView` works with new health endpoint
4. Consider fixing pre-existing TypeScript errors in test mocks
