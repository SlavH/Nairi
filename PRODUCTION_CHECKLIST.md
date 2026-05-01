# Nairi Factory — Production Deployment Checklist

## Security Audit — Completed

### Fixed Issues
| Route | Issue | Fix Applied |
|-------|-------|-------------|
| `/api/create` | Missing rate limiting | ✅ Added `checkRateLimit` |
| `/api/create` | Missing prompt length validation | ✅ Added 2000 char limit |
| `/api/presentations` | Missing rate limiting | ✅ Added rate limiting |
| `/api/presentations` | Missing input validation | ✅ Added prompt/content length checks |
| `/api/builder/projects` | Missing rate limiting (GET/POST) | ✅ Added rate limiting |
| `/api/builder/projects` | Missing error handling | ✅ Added try/catch |
| `/api/profile` | Missing rate limiting | ✅ Added per-method rate limits |
| `/api/profile` | Missing input validation | ✅ Added field length + URL validation |

### Pre-Existing Security (Verified ✅)
| Feature | Status |
|---------|--------|
| Auth enforcement (Supabase) | ✅ All routes check `getUserIdOrBypassForApi()` |
| Rate limiting infrastructure | ✅ Redis + in-memory fallback |
| Content filters (input/output) | ✅ `filterInput`, `filterOutput` in chat |
| Prompt injection detection | ✅ `detectPromptInjection` in chat |
| Request size validation | ✅ `validateRequestSize` in chat |
| XSS prevention | ✅ Input sanitization in website generation |
| CORS configuration | ✅ Next.js default + custom headers |

## GPU Integration — Verified

### Primary Path (BITNET_BASE_URL)
- ✅ `/api/nairi-chat` — All LLM inference routes through `generateWithFallback`
- ✅ `/api/chat` — `streamWithFallback` uses BITNET as primary
- ✅ `/api/factory/generate` — 3-agent orchestration uses BITNET
- ✅ `/api/generate-video` — LLM prompt enhancement uses BITNET
- ✅ `/api/generate-image` — No LLM needed (direct generation)
- ✅ `/api/generate-song` — Lyrics generation uses BITNET
- ✅ `/api/generate-audio` — No LLM needed (TTS)

### Health Check
- ✅ `/api/nairi-chat/health` — Checks BITNET, GROQ, OPENROUTER backends
- ✅ Client updated to use new health endpoint

## Frontend States — Verified

| Page | Loading | Error | Empty |
|------|---------|-------|-------|
| Root | ✅ `loading.tsx` | ✅ `error.tsx` | N/A |
| Chat | ✅ `loading.tsx` | ✅ Error boundary | ✅ Demo prompts |
| Dashboard | ✅ Skeleton loaders | ✅ Error boundary | ✅ Empty state |
| Factory | ✅ `isRunning` state | ✅ `toast.error` | ✅ Demo prompts |
| 404 | N/A | N/A | ✅ `not-found.tsx` |

## Deployment Requirements

### Environment Variables
```bash
# Required
BITNET_BASE_URL=https://your-bitnet-endpoint
GROQ_API_KEY=sk-xxx  # Fallback
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Optional (for enhanced features)
NAIRI_ROUTER_BASE_URL=https://your-router  # Self-hosted media
REPLICATE_API_TOKEN=xxx  # Video/image fallback
HUGGINGFACE_API_KEY=xxx  # Image fallback
SEARXNG_BASE_URL=https://your-searxng  # Web search for nairi-chat
REDIS_URL=redis://xxx  # Rate limiting (optional, falls back to in-memory)
```

### Pre-Deployment
- [ ] Run `npm run build` — verify zero errors
- [ ] Run `npm test` — verify all tests pass
- [ ] Verify `BITNET_BASE_URL` is accessible from deployment environment
- [ ] Verify Supabase connection and migrations applied
- [ ] Set up Redis for production rate limiting (optional)
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (Sentry already integrated)

### Post-Deployment
- [ ] Test `/api/nairi-chat/health` — should return `ok: true`
- [ ] Test `/api/nairi-chat` — should return AI response
- [ ] Test `/api/factory/generate` — should stream agent updates
- [ ] Test rate limiting — verify 429 responses after threshold
- [ ] Test auth bypass (if enabled) — verify in dev only
- [ ] Check error tracking in Sentry dashboard

## Known Issues (Pre-Existing)
- 13 TypeScript errors in test mocks (`__tests__/`) — not blocking, mocks need type updates
- `lib/tools/custom-builder.ts` — type instantiation warning (not blocking)
- `components/dashboard/circular-nav/circular-navigation.tsx` — missing prop (not blocking)

## AMD Hackathon Submission
- [ ] Hugging Face Space deployed
- [ ] Demo script tested end-to-end
- [ ] `HACKATHON_SUBMISSION.md` reviewed
- [ ] `README_HF.md` updated with deployment instructions
- [ ] Video demo recorded (if required)
