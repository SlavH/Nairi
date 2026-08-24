# Nairi — API Reference (route map)

Source of truth: `app/api/**/route.ts` (this file mirrors the kept surface after the 2026-08 cleanup).

| Group | Endpoints | Purpose |
|---|---|---|
| `/api/chat` | GET, POST + conversations/folders subresources | Streaming chat (SSE), conversation & folder CRUD |
| `/api/nairi-chat` | POST (+ `/health`) | Web-grounded Nairi-mode SSE chat |
| `/api/nairi` | chat / health / config | Proxy to Nairi HF Space stack |
| `/api/builder/projects` | CRUD | Builder projects & versions (RLS-backed) |
| `/api/flow` | GET feed, POST post | Social feed; `POST /api/flow/follow` toggle; `[postId]` DELETE; `[postId]/like` POST; `[postId]/comments` GET/POST |
| `/api/workflows` | GET, POST, PUT, DELETE (+ `execute`, flag-gated) | Workflow persistence & optional execution |
| `/api/create` | POST | Generic creation router → `creations` table |
| `/api/studio` | image / presentation / generate | Studio generators |
| `/api/generate-image` | POST (Pollinations keyless tier) | Image generation |
| `/api/generate-video` | POST (frames fallback) | Video generation |
| `/api/generate-audio` | POST (Streamlabs keyless tier) | TTS/audio |
| `/api/generate-document` \| `generate-presentation` \| `generate-slide-images` \| `generate-world` | POST | Document/deck/slide-image/world generation |
| `/api/learn/*` | notebooks ×6, quizzes ×3, skills unlock, ai-mentors ×2 | Learn/NairiBook backend |
| `/api/marketplace/*` | products CRUD, purchase, reviews (products & agents) | Marketplace transactions |
| `/api/users/[userId]/badges` | GET, POST | Creator badges |
| `/api/credits{,/earn,/referral}` | GET, POST | Credits wallet |
| `/api/activity` \| `/api/traces` \| `/api/notifications` | GET (+PATCH/DELETE) | Dashboard data |
| `/api/search` | GET | Global user-data search |
| `/api/profile` | GET, PATCH, DELETE | Profile & account deletion request |
| `/api/auth/verify-signup` | POST | hCaptcha + tempmail/IP abuse gating |
| `/api/contact` | POST | Contact form (SECURITY DEFINER RPC) |
| `/api/upload` | GET, POST | Storage upload (typed allowlist) |
| `/api/export` (+`/pdf`) \| `/api/export-pptx` \| `/api/import-document` | POST/GET | Exports & document import |
| `/api/health` (+liveness/readiness) \| `/api/v1/health` | GET | Probes |
| `/api/rate-limit/usage` | GET | Effective limit configuration |
| `/api/webhooks/stripe` | POST | Subscription sync (signature-verified) |

Removed in the cleanup (previously listed in docs): tools suites
(`audio/video/image/document-tools`, `voice-clone`), unwired media long-tail
(`generate-3d/avatar/song/music/sfx/vocals/chart/simulation`, image edit variants,
long-form video), duplicate chat endpoints (`history/search/templates/upload/
compare-models/share/export/colab`), `nairi-router` HTTP proxies, `presentations`,
`knowledge`, `workspace`, `creations` REST layers (superseded by direct RLS reads),
`admin/users`, `agents`, `education`, `badges`, `prompts`, `preview`, `latency`,
`usage`, `seed`, `auth/check-fingerprint`.
