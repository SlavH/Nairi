# Nairi Factory — Project Status

> Snapshot 2026-08-23; current status is maintained in CHANGELOG_AGENTS.md.

## ✅ Production Ready

### Build Status
- **TypeScript**: 0 errors
- **Tests**: 388 passing, 0 failing (54 files, vitest)
- **Build**: Successful (`npm run build` passes with type checking enabled)

### Files Modified (Total: 19)

#### GPU Integration (4 files)
| File | Change |
|------|--------|
| `app/api/nairi-chat/route.ts` | Rewrote with `generateWithFallback` → NAIRI_AI_BASE_URL, fixed TS type bug |
| `app/api/nairi-chat/health/route.ts` | New health endpoint for GPU backends |
| `lib/api/nairi-client.ts` | Updated health check to new endpoint |
| `lib/rate-limit.ts` | Added `create` rate limit config |

#### Security Hardening (4 files)
| File | Change |
|------|--------|
| `app/api/create/route.ts` | Rate limiting + prompt validation |
| `app/api/presentations/route.ts` | Rate limiting + input validation |
| `app/api/builder/projects/route.ts` | Rate limiting + error handling |
| `app/api/profile/route.ts` | Rate limiting + field/URL validation |

#### TypeScript Fixes (7 files)
| File | Change |
|------|--------|
| `lib/tools/custom-builder.ts` | Fixed AI SDK tool type compatibility |
| `components/dashboard/circular-nav/circular-navigation.tsx` | Fixed CentralCircle props |
| `components/chat/chat-sidebar.tsx` | Fixed missing translation key |
| `app/factory/page.tsx` | Added missing `name` property to FileArtifact type |
| `lib/agents/types.ts` | Added optional `name` to FileArtifact |
| `__tests__/api/builder/projects/route.test.ts` | Fixed GET() signature |
| `__tests__/unit/lib/auth/rbac.test.ts` | Fixed Supabase mock chain |
| `__tests__/unit/lib/auth/session-manager.test.ts` | Fixed Supabase mock chain |
| `__tests__/unit/lib/rate-limit/monitoring.test.ts` | Fixed Supabase mock chain |

#### Documentation (2 files)
| File | Change |
|------|--------|
| `CHANGELOG.md` | Comprehensive changelog of all changes |
| `PRODUCTION_CHECKLIST.md` | Deployment checklist |
| `AUDIT_SUMMARY.md` | GPU integration audit |

## Architecture

```
User → /api/nairi-chat → generateWithFallback → NAIRI_AI_BASE_URL (AMD GPU)
                                      ↓ GROQ_API_KEY (fallback)
                                      ↓ OPENROUTER_API_KEY (fallback 2)

User → /api/chat → streamWithFallback → NAIRI_AI_BASE_URL (primary)
                                 ↓ GROQ_API_KEY (fallback)

User → /api/factory/generate → 3-agent stream → NAIRI_AI_BASE_URL

Multimedia (video/image/audio/song):
  LLM parts → generateWithFallback → NAIRI_AI_BASE_URL
  Media parts → NAIRI_ROUTER_BASE_URL → Replicate → HuggingFace → Pollinations
```

## Key Metrics
- **API Routes**: 100+ (all with auth + rate limiting where needed)
- **TypeScript**: 100% clean
- **Test Coverage**: 388 tests passing
- **Build**: Clean
- **Security**: Rate limiting on all write endpoints, input validation, content filters
