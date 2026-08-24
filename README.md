# Nairi

**Nairi** is an open, modular AI platform: chat with multiple backends, generate apps from prompts, learn with AI notebooks, publish creations to a marketplace, and share results on a social feed.

> Status: feature-complete demo build. Not production-hardened — see [Roadmap notes](#roadmap-notes).

---

## What's inside

| Pillar | Route | What it does |
|---|---|---|
| **Chat** | `/chat` | Streaming AI chat with modes (reasoning, tutor, research…), conversation history, folders, file uploads, artifacts |
| **Builder** | `/builder` | Prompt-to-app IDE: agent-driven codegen in-browser (OpenCode + WebContainers), Sandpack live preview, project versions |
| **Learn / NairiBook** | `/learn` | Courses, skill trees, quizzes, AI mentors, and **NairiBook notebooks**: turn documents into concept graphs with local RAG (WebGPU embeddings) |
| **Flow** | `/flow` | Social feed: post creations, like, comment, follow people, remix posts into chats |
| **Studio** | `/studio`, `/studio/presentation` | Keyless-capable image/video/audio generators and a full slide editor with PPTX export |
| **Marketplace** | `/marketplace` | Publish agents & creations, reviews, Stripe checkout, creator dashboard |
| **Dashboard** | `/dashboard` | Activity log, execution traces, notifications, credits, billing |

## Works without any API keys

Clone, install, run — these features work out of the box:

- **Builder codegen** via free OpenCode Zen models (browser WebContainers)
- **Image generation** via Pollinations fallback tier
- **Text-to-speech** via Streamlabs Polly fallback
- **PPTX export / document import** (pure client/server-side processing)
- All Supabase-backed CRUD once you configure a free Supabase project

AI chat and text generation need any OpenAI-compatible endpoint (`NAIRI_AI_BASE_URL`) — vLLM on an AMD MI300X, Ollama locally, or Groq's free tier all work.

## Quick start

```bash
git clone https://github.com/SlavH/Nairi && cd Nairi
npm ci
cp .env.example .env.local   # add Supabase URL+keys (free tier is fine)
npm run dev                  # http://localhost:3000
```

Optional extras:

```bash
npm run migrate          # apply SQL migrations from scripts/*.sql
npm test                 # vitest unit/integration suite
npm run test:e2e         # Playwright (needs a running dev server)
```

## Architecture

Single Next.js 16 App Router application (React 19, TypeScript strict):

```
app/
  page.tsx            landing
  chat/ builder/ learn/ flow/ studio/ marketplace/ dashboard/ ...
  api/                route handlers (chat streaming, generation, CRUD)
components/           UI (shadcn/radix-based design system)
lib/
  ai/groq-direct.ts   provider fallback chain (AI backend → Colab → Router)
  supabase/           auth + DB clients (server/client/service roles)
  nairibook/          document parsing → concepts → graph → RAG pipeline
  workflows/          node-graph engine (executor flag-gated)
scripts/              numbered SQL migrations (001–048), seed & ops scripts
supabase/migrations/  RLS hardening policies
e2e/ __tests__/       Playwright + Vitest suites
```

Key decisions:

- **No separate backend service.** Route handlers call providers directly; heavy media generation goes through an optional async HF-Space router.
- **Graceful degradation.** Every paid provider tier has a keyless or cheaper fallback where feasible; routes fail honestly (503) when no path exists.
- **RLS-first data access.** Pages read Supabase directly under row-level-security; REST endpoints exist only where logic must run server-side.

## Testing & quality gates

- `npx tsc --noEmit` — zero errors, enforced at build time
- `npm test` — Vitest suite covering API auth/validation paths and core libs
- `npm run lint` — ESLint (flat config)

## Roadmap notes

Known gaps, intentionally documented instead of hidden:

- Rate limiting is per-instance unless `REDIS_URL` is set
- Workflow execution is disabled by default (`NAIRI_ENABLE_WORKFLOW_EXEC=true` opts in)
- Some media tiers (video quality, avatars) require paid provider keys
- No CI-deployed preview environment yet

## Links

- Live demo: https://nairi-seven.vercel.app/

*Bridging human knowledge and digital transformation.*
