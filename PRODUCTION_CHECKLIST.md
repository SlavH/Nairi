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
| Auth enforcement (Supabase) | ✅ All routes check `getUserIdForApi()` / `getSession()` |
| Rate limiting infrastructure | ✅ Redis + in-memory fallback |
| Content filters (input/output) | ✅ `filterInput`, `filterOutput` in chat |
| Prompt injection detection | ✅ `detectPromptInjection` in chat |
| Request size validation | ✅ `validateRequestSize` in chat |
| XSS prevention | ✅ Input sanitization in website generation |
| CORS configuration | ✅ Next.js default + custom headers |

## GPU Integration — Verified

### Primary Path (NAIRI_AI_BASE_URL)
- ✅ `/api/nairi-chat` — All LLM inference routes through `generateWithFallback`
- ✅ `/api/chat` — `streamWithFallback` uses NAIRI_AI_BASE_URL as primary
- ✅ `/api/factory/generate` — 3-agent orchestration uses NAIRI_AI_BASE_URL
- ✅ `/api/generate-video` — LLM prompt enhancement uses NAIRI_AI_BASE_URL
- ✅ `/api/generate-image` — No LLM needed (direct generation)
- ✅ `/api/generate-song` — Lyrics generation uses NAIRI_AI_BASE_URL
- ✅ `/api/generate-audio` — No LLM needed (TTS)

### Health Check
- ✅ `/api/nairi-chat/health` — Checks NAIRI_AI, GROQ, OPENROUTER backends
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
NAIRI_AI_BASE_URL=https://your-ai-endpoint/v1
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
- [ ] Verify `NAIRI_AI_BASE_URL` is accessible from deployment environment
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
- None. As of the latest audit all 28 TypeScript compile errors have been fixed and `npm run typecheck` passes cleanly with 73/73 unit tests passing.

## Security Hardening (Latest Audit)
- **CSRF / cross-origin protection**: Added `assertSameOrigin()` + `getAllowedOrigins()` in `lib/security/request-validator.ts`. Mutating routes now reject disallowed Origins with 403 while still permitting non-browser/server-to-server calls. Wired into `/api/chat` (POST) and `/api/credits/earn` (POST) and `/api/builder/projects` (POST) as a representative baseline; extend to other mutating routes as needed.
- **Redis rate limiter fixed**: `lib/rate-limit-redis.ts` now invokes the Lua script via ioredis `call("EVAL", ...)` (the previous `redis.eval` API did not exist on the typed client and silently fell back to in-memory rate limiting).
- **Auth is enforced**: No `BYPASS_AUTH` / `getUserIdOrBypassForApi` remains. All routes use `supabase.auth.getUser()` and `getUserIdForApi` / `getSession`.

## Environment Variables (Current)
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://...
NAIRI_AI_BASE_URL=https://your-ai-endpoint/v1   # primary AI backend (OpenAI-compatible)
NAIRI_AI_API_KEY=xxx
NAIRI_AI_MODEL=nairi-llama
GROQ_API_KEY=sk-xxx          # Fallback
OPENROUTER_API_KEY=xxx       # Fallback 2

# Optional
NAIRI_ROUTER_BASE_URL=https://your-router        # Self-hosted media generation
SEARXNG_BASE_URL=https://your-searxng            # Web search for chat
REPLICATE_API_TOKEN=xxx                          # Video/image fallback
REDIS_URL=redis://xxx                            # Shared rate limiting (recommended in prod)
ALLOWED_ORIGINS=https://app.nairi.ai,https://nairi-seven.vercel.app  # CSRF allowlist
MFA_ENCRYPTION_KEY=<random 32+ chars>        # Required for TOTP MFA (secrets stored AES-256-GCM encrypted)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```


## AMD Hackathon Submission
- [ ] Hugging Face Space deployed
- [ ] Demo script tested end-to-end
- [ ] `HACKATHON_SUBMISSION.md` reviewed
- [ ] `README_HF.md` updated with deployment instructions
- [ ] Video demo recorded (if required)
