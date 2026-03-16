# Nairi v34 - Architecture Documentation

## System Overview

Nairi is an advanced AI assistant platform built with Next.js 16, React 19, and TypeScript. It provides a comprehensive interface for interacting with multiple AI providers, building custom agents, and managing AI-powered workflows.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Next.js 16 + React 19 + TypeScript + Tailwind CSS)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Homepage   │  │     Chat     │  │  Marketplace │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Dashboard   │  │  Builder V2  │  │Presentations │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                         API Layer                                │
│              (Next.js API Routes + Proxy)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Chat API   │  │   User API   │  │Marketplace API│       │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Payments API │  │  Health API  │  │  Admin API   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer                               │
│         (Business Logic + AI Integration + Security)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ AI Providers │  │     Auth     │  │Rate Limiting │        │
│  │   (9 APIs)   │  │  (Supabase)  │  │(Redis/In-Mem)│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Payments   │  │   Analytics  │  │  Monitoring  │        │
│  │   (Stripe)   │  │              │  │   (Sentry)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                       Data Layer                                 │
│              (Supabase PostgreSQL + Storage)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.7.3
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI, Shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js (via Next.js)
- **API**: Next.js API Routes
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Payments**: Stripe

### AI Providers
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google AI (Gemini)
- Groq
- Cohere
- Mistral
- Perplexity
- OpenRouter
- Replicate

### DevOps
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (configured)
- **Testing**: Planned (Vitest + Playwright); see [Testing & QA](TESTING.md) for manual checklist.
- **Linting**: ESLint + Prettier

## Directory Structure

```
nairi_v34/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Dashboard pages
│   ├── api/                 # API routes
│   │   ├── v1/             # Versioned API
│   │   ├── chat/           # Chat endpoints
│   │   ├── health/         # Health check
│   │   └── webhooks/       # Webhook handlers
│   ├── chat/               # Chat interface
│   ├── marketplace/        # Agent marketplace
│   ├── builder-v2/         # Agent builder
│   ├── presentations/      # Presentation creator
│   └── layout.tsx          # Root layout
│
├── components/              # React components
│   ├── ui/                 # Base UI components
│   ├── chat/               # Chat components
│   ├── navigation/         # Navigation components
│   ├── forms/              # Form components
│   └── modals/             # Modal components
│
├── lib/                     # Utility libraries
│   ├── ai/                 # AI provider integrations
│   ├── supabase/           # Supabase client
│   ├── security/           # Security utilities
│   ├── validation/         # Input validation
│   ├── utils/              # General utilities
│   └── icons.ts            # Icon exports
│
├── tests/                   # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── e2e/                # End-to-end tests
│   └── visual/             # Visual regression tests
│
├── public/                  # Static assets
│   ├── images/             # Images
│   └── fonts/              # Fonts
│
├── docs/                    # Documentation
│   ├── API_DOCUMENTATION.md
│   └── ARCHITECTURE.md
│
└── config files             # Configuration
    ├── next.config.mjs     # Next.js config
    ├── tailwind.config.ts  # Tailwind config
    ├── tsconfig.json       # TypeScript config
    ├── vitest.config.ts    # Vitest config
    └── playwright.config.ts # Playwright config
```

## Core Components

### 1. Chat Interface

**Location**: `app/chat/page.tsx`, `components/chat/`

**Features**:
- Real-time AI chat
- Multiple AI provider support
- Message history
- File attachments
- Code syntax highlighting
- Markdown rendering

**Flow**:
```
User Input → Chat Component → API Route → AI Provider → Stream Response → UI Update
```

### 2. Agent Marketplace

**Location**: `app/marketplace/page.tsx`, `app/api/marketplace/`

**Features**:
- Browse pre-built agents
- Install agents
- Rate and review
- Search and filter
- **Recommendation engine**: [lib/marketplace/recommendation.ts](../lib/marketplace/recommendation.ts) — `RecommendationEngine.getRecommendations(userId, limit)` returns personalized agent recommendations based on user's installed agents, usage patterns (usage_logs), and trending agents (agents table with `is_published`). Requires migration 025 (agents.is_published) for recommendations to work correctly.

**Data Model**:
```typescript
interface Agent {
  id: string
  name: string
  description: string
  category: string
  price: number
  rating: number
  installs: number
  creator: User
}
```

### 3. Agent Builder V2

**Location**: `app/builder/page.tsx`, `app/api/builder/`, `components/builder-v2/`, `lib/builder-v2/`

**Features**:
- Visual agent builder (chat, file explorer, tasks, version history, preview/code panels).
- **Generate**: POST /api/builder/generate — streaming NDJSON (plan, task-update, file-update, message, complete, optional error). Request body validated with Zod (`lib/builder-v2/schemas/request-schema.ts`). Prompt/plan phase uses `lib/builder-v2/generate/initial-plan.ts` and design guidance from `lib/builder-v2/utils/design-intelligence.ts`; execution and streaming live in the route. Generation can perform one optional retry on validation failure and one optional retry for a missing "wow" element when enabled via `BUILDER_RETRY_ON_VALIDATION_FAILURE` and `BUILDER_RETRY_FOR_WOW`.
- **Projects**: GET/POST /api/builder/projects, GET/PATCH/DELETE /api/builder/projects/[id] — persist projects and version snapshots; RLS and auth required.
- **Deploy**: POST /api/builder/deploy — deploy a project (e.g. to Vercel); request/response are implementation-specific.

### 4. Dashboard

**Location**: `app/dashboard/page.tsx`

**Features**:
- Usage statistics
- Recent activity
- Quick actions
- Account management

### 5. Learn (Education)

**Location**: `app/learn/`, `app/api/learn/`, [lib/learn/progress-tracker.ts](../lib/learn/progress-tracker.ts), [lib/learn/achievements.ts](../lib/learn/achievements.ts)

**Features**:
- Courses, modules, lessons (scripts 008)
- Lesson progress and learning analytics (scripts 008, 038, 044 for `progress_percentage`)
- **LearningProgressTracker**: `getUserProgress(userId)` — aggregates progress per course (completed/total lessons, progress percent, time spent from `lesson_progress` and `learning_analytics`). Source of truth for learn progress. Aligns with [scripts/008_create_education_tables.sql](../scripts/008_create_education_tables.sql) (courses, course_modules, lessons, lesson_progress) and [scripts/038_learn_progress_tracking.sql](../scripts/038_learn_progress_tracking.sql) (learning_analytics).
- **AchievementSystem**: check and unlock achievements (user_achievements, achievements tables from 038)
- **NairiBook (notebooks)**: `app/api/learn/notebooks/` — CRUD for notebooks, sources (including upload), generate, and chat; migrations 042/043 if used.
- **Quizzes**: `app/api/learn/quizzes/`, `app/api/learn/quizzes/[id]`, `app/api/learn/quizzes/[id]/attempt` — list, get quiz, submit and get attempt.
- **AI mentors**: `app/api/learn/ai-mentors/`, `app/api/learn/ai-mentors/[domain]` — list, create, get by domain, update.
- **Badges**: `app/api/badges`, `app/api/users/[userId]/badges` — system/user badges and award badges (creator/expert badges when enabled).

### 6. Creations and Workspace

**Location**: `app/workspace/`, `app/api/creations/`, `app/api/workspace/`, `app/api/create/`

**Creations**: Table `creations` (script 013) stores user creations (type, content, metadata). GET/POST /api/creations and GET/PATCH/DELETE /api/creations/[id] provide CRUD (currently 501 placeholders; implement in Phase 221–222). Workspace folders (app/api/workspace/folders) and workspace search (app/api/workspace/search) organize and find creations. Activity and share for a creation: /api/workspace/creations/[id]/activity, /api/workspace/creations/[id]/share.

**Create (workspace)**: POST /api/create — AI-generated content by type (presentation, website, document, visual, code, analysis); uses design brief and Groq fallback; can persist as creation when authenticated.

### 7. Research and knowledge

**Research (URL / deep research)**: POST /api/research — deep research flow; request body includes query and options; uses AI and optional web sources. See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for request/response shape.

**Knowledge graph**: POST /api/knowledge/query, GET /api/knowledge/nodes, GET /api/knowledge/edges, GET /api/knowledge/graph — query and manage user knowledge nodes and edges (scripts 007, 041).

## API Architecture

### API Versioning

**Strategy**: URL-based versioning

```
/api/v1/health      # Version 1
/api/v2/health      # Version 2 (future)
/api/health         # Latest (redirects to current version)
```

### Authentication Flow

```
1. User logs in → Supabase Auth
2. Receives JWT token
3. Token stored in httpOnly cookie
4. Proxy validates token on each request
5. User data attached to request context
```

### Rate Limiting

**Current**: In-memory store (`lib/rate-limit.ts`). Limits are per process; they do not persist across serverless invocations or multiple instances.

**Production**: Use a shared store (e.g. Redis) so limits are consistent across instances. See [docs/api/RATE_LIMITS.md](api/RATE_LIMITS.md) for implementation notes.

**Limits**:
- Anonymous: 10 requests/minute
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour
- Enterprise: Unlimited

### Error Handling

**Standard Error Response**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2026-02-05T16:00:00Z"
    }
  }
}
```

## Security Architecture

### 1. Authentication

- **Provider**: Supabase Auth
- **Method**: JWT tokens
- **Storage**: httpOnly cookies
- **Refresh**: Automatic token refresh

### 2. Authorization

- **Model**: Role-based access control (RBAC)
- **Roles**: User, Pro, Admin
- **Enforcement**: Proxy + API route guards

### 3. Content Security Policy

**Implemented**: Yes (next.config.mjs)

**Directives**:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
- `style-src 'self' 'unsafe-inline'`
- `img-src 'self' data: https:`
- `connect-src 'self' https://api.openai.com ...`

### 4. CSRF Protection

**Implemented**: Yes (proxy.ts)

**Method**: Origin header validation

### 5. Input Validation

**Library**: Zod
**Location**: `lib/validation/`

**Example**:
```typescript
const chatMessageSchema = z.object({
  message: z.string().min(1).max(10000),
  model: z.enum(['gpt-4', 'claude-3', 'gemini-pro']),
  temperature: z.number().min(0).max(2).optional(),
})
```

## Data Flow

### Chat Message Flow

```
1. User types message in chat interface
   ↓
2. React component validates input
   ↓
3. POST /api/chat with message data
   ↓
4. Proxy validates authentication
   ↓
5. API routes check rate limits
   ↓
6. API route validates request body
   ↓
7. Select AI provider based on user preference
   ↓
8. Call AI provider API
   ↓
9. Stream response back to client
   ↓
10. Save message to database
   ↓
11. Update UI with response
```

### Payment Flow

```
1. User selects plan
   ↓
2. POST /api/payments/create-checkout
   ↓
3. Create Stripe checkout session
   ↓
4. Redirect to Stripe
   ↓
5. User completes payment
   ↓
6. Stripe webhook → /api/webhooks/stripe
   ↓
7. Verify webhook signature
   ↓
8. Update user subscription in database
   ↓
9. Send confirmation email
```

## Performance Optimization

### 1. Code Splitting

- **Method**: Next.js automatic code splitting
- **Dynamic imports**: Used for heavy components
- **Route-based splitting**: Automatic per page

### 2. Image Optimization

- **Component**: Next.js Image
- **Formats**: WebP, AVIF
- **Lazy loading**: Enabled
- **Responsive**: Multiple sizes

### 3. Caching Strategy

**Static Assets**:
- Cache-Control: public, max-age=31536000, immutable

**API Responses**:
- Cache-Control: private, no-cache (for user data)
- Cache-Control: public, max-age=300 (for public data)

**Database Queries**:
- Supabase built-in caching
- In-memory cache: [lib/cache/simple.ts](../lib/cache/simple.ts) is used for read-heavy APIs (e.g. GET /api/marketplace/agents) with a short TTL to reduce DB load.
- **Redis cache**: When `REDIS_URL` is set, use a Redis-backed cache (or [lib/rate-limit-redis](../lib/rate-limit-redis.ts) for rate limiting) so cache and limits are shared across instances. Keep in-memory fallback for single-instance/dev.

### 4. Bundle Optimization

- **Tree shaking**: Enabled
- **Minification**: Enabled in production
- **Compression**: Gzip + Brotli
- **Icon optimization**: Individual imports (implemented)

## Monitoring & Observability

### 1. Error Tracking

- **Service**: Sentry
- **Coverage**: Client + Server + Edge
- **Features**: Error grouping, source maps, user context

### 2. Performance Monitoring

- **Metrics**: Core Web Vitals (LCP, CLS, FID)
- **Tools**: Vercel Analytics, Sentry Performance (when compatible with Next 16)
- **Alerts**: Configured for degradation
- **Bundle**: Heavy routes (builder, studio) use dynamic imports; Sandpack is lazy-loaded. Optional: `@next/bundle-analyzer` for bundle analysis; target fast LCP and minimal blocking JS.

### Analytics and experimentation (Phase 38)

- **RUM:** Vercel Analytics (and Sentry when compatible with Next 16) for Core Web Vitals; document target LCP/CLS/FID in runbooks. Optional: Lighthouse CI in pipeline.
- **Feature flags:** Env-based flags (e.g. `NEXT_PUBLIC_FEATURE_SIMULATIONS=true`) or a feature-flag service for gradual rollout (e.g. simulations, new marketplace). Optional: `lib/feature-flags.ts` to centralize checks.
- **A/B testing:** Optional A/B tests for key flows (onboarding, pricing); document in ARCHITECTURE when adopted.

### 3. Health Checks

**Endpoints**:
- **Liveness / basic**: `GET /api/health` — returns 200 when the app is up.
- **Readiness (DB-dependent)**: `GET /api/health/readiness` — returns 200 only if database (Supabase) is reachable; use for Kubernetes readiness probes or load balancers. See [production.md](production.md).

**Response** (GET /api/health):
```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T15:30:00Z",
  "version": "1.0.0",
  "uptime": 86400,
  "environment": "production",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "ai_providers": "healthy"
  }
}
```

### 4. Logging

- **Development**: Console logs
- **Production**: Structured logging to Sentry
- **Levels**: Error, Warn, Info, Debug

## Deployment Architecture

### Vercel Deployment

```
GitHub Repository
       ↓
   Push to main
       ↓
GitHub Actions CI (.github/workflows/ci.yml)
  (Typecheck, build, unit/integration tests; optional e2e on deploy preview)
       ↓
   Vercel Build
  (Next.js Build)
       ↓
Vercel Edge Network
  (Global CDN)
       ↓
   End Users
```

### Environment Variables

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Optional**:
- `SENTRY_DSN`
- `REDIS_URL` — when set, use `checkRateLimitAsync` in API routes so rate limits apply across instances (see [lib/rate-limit-redis.ts](lib/rate-limit-redis.ts); requires optional dependency `ioredis`).
- `GOOGLE_AI_API_KEY`
- `GROQ_API_KEY`

## Scalability Considerations

### Current Capacity

- **Concurrent users**: ~1,000
- **Requests/second**: ~100
- **Database connections**: 100 (Supabase limit)

### Scaling Strategy

**Horizontal Scaling**:
- Vercel automatically scales serverless functions
- No manual intervention needed

**Staging and deployment (Phase 40):** Staging via Vercel preview or dedicated host; env parity, no production secrets in repo. Runbooks: “Deploy to staging” and “Promote to production” in [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md). Optional feature-flag service or env-based flags for phased rollout.

**Database Scaling**:
- Supabase connection pooling
- Read replicas for read-heavy operations
- Caching layer (Redis) for hot data

**AI Provider Scaling**:
- Multiple API keys for load distribution
- Fallback providers for redundancy
- Request queuing for rate limit management

## Audit logging and compliance

- **Table:** `audit_log` (see `scripts/022_create_audit_log.sql`) — columns: user_id, action, resource, metadata (JSONB, no PII), created_at.
- **Usage:** `lib/audit.ts` — `auditLog(userId, action, resource?, metadata?)`. Use for login, password change, billing actions, data export, delete account.
- **Retention and access:** Define retention (e.g. 90 days or per compliance); only the owning user or service role can read. Document in SECURITY.md or compliance docs.
- **Optional:** “Export my data” and “Delete my account” flows for GDPR; call `auditLog` before performing the action.

## Caching and CDN strategy

- **Public assets:** Static files under `public/` and `_next/static` are served with cache headers (Next.js default). For custom static routes, set `Cache-Control: public, max-age=31536000, immutable` where appropriate.
- **Read-heavy APIs:** Endpoints such as `GET /api/marketplace/agents`, learn courses list, and public catalog data are good candidates for short-lived caching (e.g. `Cache-Control: public, s-maxage=60, stale-while-revalidate`) or optional Redis/edge cache when `REDIS_URL` is set. Do not cache user-specific or mutation responses.
- **In-memory cache:** [lib/cache/simple.ts](../lib/cache/simple.ts) is wired to `GET /api/marketplace/agents` for anonymous requests (60s TTL); other read-heavy routes can use `get`/`set`/`invalidate` with the same pattern. For multi-instance production, use Redis or edge cache.
- **Marketing / landing pages:** Consider ISR (Incremental Static Regeneration) for `/`, `/faq`, `/docs` by exporting `revalidate` in page or route segment config.
- **Vercel:** Deployment on Vercel provides edge caching; use Vercel’s cache headers and Data Cache for server components where applicable.

## Testing Strategy

Testing infrastructure (Vitest, Playwright) is planned; use the [Testing & QA](TESTING.md) checklist for manual verification. When added:

- **Unit**: Vitest — utilities, helpers, business logic
- **Integration**: Vitest — API routes, DB operations (mock AI providers)
- **E2E**: Playwright — critical flows, Chromium/Firefox/WebKit
- **Visual**: Playwright — major pages, desktop/tablet/mobile

## Product scope (simulations)

Simulations (`/simulations`, workspace create card, chat) are **permanently SOON**: no simulation execution API, no removal of SOON from UI or chat. See [PRODUCT_SPEC](PRODUCT_SPEC.md) and [GAP_CLOSURE](GAP_CLOSURE.md).

## Future Enhancements

### Short Term (1-3 months)

1. ~~Redis rate limiting~~ — Implemented: `lib/rate-limit-redis.ts`; chat, builder generate, create, usage use `checkRateLimitAsync`; set `REDIS_URL` for production.
2. Complete TODO tests
3. ~~Storybook component library~~ — Added: `.storybook/`, stories for Button and Card in `components/ui/*.stories.tsx`; run `npm run storybook` (port 6006). Design tokens: colors/spacing from Tailwind and `globals.css`.
4. ~~Load testing infrastructure~~ — Scripts in `scripts/load/` (e.g. k6); runbooks in [BACKUP_RECOVERY.md](BACKUP_RECOVERY.md) (high load, dependency failure).
5. Mobile app (React Native)

### Medium Term (3-6 months)

1. **Real-time collaboration (Phase 39, optional):** Scope: one high-value flow (e.g. builder project, document, or chat room). Implement presence and optional CRDT/OT or simple lock-and-cursor; use WebSockets (e.g. Supabase Realtime) or a dedicated service; document in ARCHITECTURE when implemented.
2. Advanced analytics dashboard
3. Custom AI model training
4. API marketplace
5. White-label solution

### Long Term (6-12 months)

1. Multi-tenancy support
2. Enterprise SSO
3. On-premise deployment option
4. Advanced workflow automation
5. AI model fine-tuning platform

## Maintenance & Operations

### Regular Tasks

**Daily**:
- Monitor error rates
- Check API health
- Review user feedback

**Weekly**:
- Review performance metrics
- Update dependencies
- Deploy bug fixes

**Monthly**:
- Security audit
- Performance optimization
- Feature releases

**Quarterly**:
- Architecture review
- Capacity planning
- Major version updates

## Contact & Support

- **Documentation**: https://docs.nairi.ai
- **Support**: support@nairi.ai
- **Status Page**: https://status.nairi.ai
- **GitHub**: https://github.com/nairi/nairi_v34

---

**Last Updated**: February 13, 2026  
**Version**: 0.34.0  
**Maintained By**: Nairi Development Team

## Middleware → Proxy (Next.js 16)

Next.js 16 deprecates the `middleware.ts` file convention in favor of **proxy**. Session, CSRF, and request-size logic have been moved to the new proxy convention.

- **File:** `proxy.ts` at the project root (same level as `app/`, `lib/`).
- **Export:** Named function `proxy(request: NextRequest)`; optional `config` with `matcher` for path matching.
- **Behavior:** Same as before: Supabase session (`updateSession` from `lib/supabase/session`), CSRF via origin validation (`lib/security/request-validator`), request size limits for `/api/` (chat, builder, upload), and security headers on the response.
- **Docs:** [Next.js proxy convention](https://nextjs.org/docs/messages/middleware-to-proxy), [proxy file reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).

## Internationalization (i18n)

Translations live in `lib/i18n/` (e.g. `lib/i18n/translations.ts`, `lib/i18n/translations/en.json`). To support multiple locales: use Next.js i18n (or next-intl) with locale in path or cookie; replace hardcoded strings in key flows (auth, nav, builder, marketplace) with translation keys; add RTL support in Tailwind and layout for `dir="rtl"` if required.

## TypeScript

`next.config.mjs` has `typescript.ignoreBuildErrors: false` so the production build fails on type errors. Run `npx tsc --noEmit` to check types locally; fix errors in `app/api`, `components`, and `lib` as needed.
