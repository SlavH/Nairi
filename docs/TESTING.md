# Nairi — Testing & QA Guide

Use this checklist for comprehensive testing (as CEO, QA, or developer).

## Prerequisites

- `.env` with at least: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and one AI key (e.g. `GROQ_API_KEY`).
- For **bypass auth** testing: set `BYPASS_AUTH=true` in `.env` (development only).
- Run `npm run dev` and open http://localhost:3000.

---

## 1. Auth & Bypass

- [ ] **With real login:** Sign up / log in → redirect to `/nav` or dashboard; protected pages load.
- [ ] **With BYPASS_AUTH=true:** No login; open `/dashboard`, `/chat`, `/workspace`, `/flow`, `/learn`, `/knowledge`, `/marketplace`, `/presentations`, `/studio`, `/debate`, `/onboarding`, `/checkout/*` — all load without redirect to login.
- [ ] **Nav overlay:** On any page (except `/nav`), left-edge arrow opens circular nav with blurred background; clicking a circle navigates; overlay closes on route change or close button.
- [ ] **Middleware:** With bypass off, visiting `/dashboard` without session redirects to `/auth/login`.

---

## 2. Core Flows

- [ ] **Onboarding:** `/onboarding` — New users reach first value quickly; flows and CTAs are clear.
- [ ] **Billing and credits:** Billing and credits pages show plan, usage, and “insufficient credits” behavior; document in user guide or FAQ if needed.
- [ ] **Home:** `/` — Hero, sections, footer; no console errors.
- [ ] **Nav hub:** `/nav` — Circular nav; all links work (dashboard, chat, workspace, learn, flow, marketplace, etc.).
- [ ] **Dashboard:** `/dashboard` — Stats, recent conversations, creations; sidebar and header work.
- [ ] **Chat:** `/chat` → redirects to `/chat/[id]`; send a message; response streams; with bypass, message and reply are saved (conversation id in URL).
- [ ] **Workspace:** `/workspace` — Creations list (or empty); `/workspace/create` — select type, prompt, generate; result and download work.
- [ ] **Presentations:** `/presentations` — Topic, slide count, style, theme; Generate; slides appear; edit, export HTML/PPTX.
- [ ] **Builder:** `/builder` (or `/builder-v2` → redirects) — Chat prompt; AI generates/updates project; preview and code panels; file explorer, tasks, version history; preview error boundary shows on runtime errors; "Use safe starter page" on preview error; Save project / My projects (list and load); version history persists with project and Restore works; Export: Download ZIP (runnable with `npm install && npm run dev`), Deploy to Vercel (opens vercel.com/new). **E2E:** Send prompt, save project, and restore version tests may require `BYPASS_AUTH=true` and a stable or mocked generate API (`GROQ_API_KEY`) to avoid flakiness. **Integration:** `__tests__/integration/api/builder.test.ts` POSTs to `/api/builder/generate` with minimal body; the test that asserts 200 and NDJSON (plan/message/complete/error) is skipped in CI when `GROQ_API_KEY` is unset or placeholder.
- [ ] **Studio:** `/studio` — Tabs: Image, Video, Audio, Slides; each generator runs without hard errors (external APIs may fail; check error UI).
- [ ] **Marketplace:** `/marketplace` — Agent list; open an agent; purchase flow (free or Stripe if configured).
- [ ] **Learn / Flow / Knowledge / Debate:** Pages load; content or empty state shown (no 500). See “Feature status (Marketplace, Learn, Debate, Flow, Knowledge)” below for what is implemented vs stub.

---

## 3. API & Data

- [ ] **Health:** `GET /api/health` returns 200.
- [ ] **Chat API:** With bypass, POST to `/api/chat` (with conversationId and messages) returns stream and saves messages for bypass user.
- [ ] **Create API:** With bypass, POST to `/api/create` with `{ type, prompt }` returns content and creation id.
- [ ] **Presentation API:** POST to `/api/generate-presentation` with `{ prompt, slideCount }` returns `{ success, slides }`; with bypass, creation is saved.
- [ ] **Builder API:** POST to `/api/builder/generate` with `{ prompt, currentFiles, conversationHistory }` returns streaming NDJSON (plan, task-update, file-update, message, complete, or error); auth or bypass required. Invalid body returns 400; 429 shows "Too many requests; try again in a minute" in client.
- [ ] **Builder projects API:** GET `/api/builder/projects` returns list; POST with `{ name, files }` creates; GET `/api/builder/projects/[id]` returns project (files, versions); PATCH updates (and appends version snapshot); DELETE removes; auth or bypass required.
- [ ] **Usage API:** With bypass, `GET /api/usage` returns `{ monthlyCost, totalLogs, byType }`.
- [ ] **Stripe:** If `STRIPE_SECRET_KEY` is unset, payment routes return clear error (no crash). Checkout, portal, webhooks at `/api/webhooks/stripe`; handle failures and edge cases; no silent 500s.
- [ ] **Credits:** `/api/credits` and scripts/012_create_credits_system.sql; deduct on use (chat, builder, generation); clear "insufficient credits" UX; billing pages show plan, usage, invoices.

---

## 4. Error & Edge UX

- [ ] **404:** Visit unknown path → custom 404 with links to Nav, Dashboard, Home.
- [ ] **Error boundary:** Trigger a client error (e.g. throw in a component) → “Something went wrong” with Try again / Home.
- [ ] **Loading:** Navigate to `/dashboard`, `/chat`, `/workspace` — loading skeletons appear (no blank flash where possible).
- [ ] **Empty states:** New user workspace, no creations — empty state or clear CTA; dashboard “Your Agents” shows empty state when no agents.
- [ ] **Auth error:** `/auth/error` shows card with error message and links: Try Again, Open navigation, Go Home.
- [ ] **Loading:** Flow, Learn, Marketplace, Studio, Presentations show route-specific loading skeletons when navigating.

---

## 5. Build & Lint

- [ ] `npm run build` completes with exit code 0.
- [ ] No TypeScript errors in edited files; fix any reported in IDE or `tsc --noEmit` if run.

---

## 6. Accessibility (a11y)

- [ ] **Focus:** Tab through nav overlay and main actions; focus visible and order logical.
- [ ] **Labels:** Buttons and links have accessible names (aria-label or visible text); nav arrow has “Open navigation hub”.
- [ ] **Live regions:** Root loading uses `aria-live="polite"` and `aria-busy="true"`.
- [ ] **Contrast:** Text meets contrast ratio on background (use devtools or axe).
- [ ] **Motion:** `prefers-reduced-motion` is respected (see `globals.css`). CSS animations and transitions are shortened in globals.css; Framer Motion (e.g. circular nav) uses `useReducedMotion()` and disables or shortens animations when the user prefers reduced motion. See [docs/DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) (Animations).
- [ ] **Viewport zoom:** Pinch-zoom is allowed (no `maximumScale: 1`); app layout uses `maximumScale: 5` for WCAG 2.1 Level AA (1.4.4 Resize text).

**Automated a11y:** Add `@axe-core/playwright` to E2E and run axe on key pages (auth, nav, dashboard, builder, workspace, chat, marketplace) in CI; fail on violations above a threshold. Root loading uses `aria-live="polite"` and `aria-busy="true"`; nav arrow has "Open navigation hub"; key flows have focus order and ARIA labels. When adopted, add a dedicated E2E spec (e.g. `e2e/a11y.spec.ts`) that visits each key page and runs `axe.run()`; document the threshold and how to update it.

### UI and motion (Phase 470)

QA can verify: **Focus** — tab order on dashboard, chat, builder, marketplace is logical; modals trap focus and return on close. **Motion** — `prefers-reduced-motion` respected (globals.css + Framer Motion `useReducedMotion()` in circular nav). **Loading** — route loading shows skeleton or spinner with `aria-busy`/`aria-live`; no blank flash where possible. **Empty states** — "no data" views use Empty component with icon and CTA (e.g. "Create your first"). **Form errors** — validation errors associated with inputs (`aria-describedby`); not conveyed by color alone.

---

## Responsiveness

- [ ] **Viewport zoom:** Pinch-zoom is allowed (no `maximumScale: 1`); see a11y checklist above.
- [ ] **Key viewports:** At 320px, 768px, and 1024px: no horizontal page scroll; primary actions visible and tappable.
- [ ] **Touch targets:** Sidebar toggles (dashboard, chat) and main CTAs meet at least 44×44px on mobile.
- [ ] **Dashboard:** Sidebar slides in on small screens; header and main content have responsive padding; no overlap between global nav button and sidebar (global nav hidden on `/dashboard*`).
- [ ] **Chat:** Sidebar slides in; message list and input area readable; no overflow on narrow viewports.
- [ ] **Builder:** Stacked layout on mobile; resizable panels on desktop; top bar actions accessible at narrow widths.
- [ ] **Marketplace / workspace:** Filter row wraps or scrolls; card grid responsive (1/2/3 columns); no horizontal overflow.
- [ ] **Landing:** Hero, sections, and footer readable at all breakpoints; CTAs above the fold on key viewports.

---

## 7. Security

- [ ] **CSRF:** POST/PUT/DELETE/PATCH require valid origin (middleware); test from another origin → 403.
- [ ] **Request size:** Large body to `/api/chat` or `/api/upload` is rejected with 413 when over limit.
- [ ] **Auth:** Protected API routes return 401 when not logged in and bypass off; no sensitive data in client bundle.
- [ ] **Stripe:** Webhook verifies signature when `STRIPE_WEBHOOK_SECRET` is set; purchase route returns 503 when Stripe not configured.

---

## 8. API Quick Reference (critical endpoints)

| Endpoint | Method | Auth | Bypass | Purpose |
|----------|--------|------|--------|---------|
| `/api/health` | GET | No | — | Health check |
| `/api/chat` | POST | Optional* | Yes | Stream chat; save messages when userId present |
| `/api/create` | POST | Required* | Yes | Create content; save to creations |
| `/api/generate-presentation` | POST | Optional* | Yes | Generate slides; save when userId present |
| `/api/builder/generate` | POST | Required* | Yes | Stream builder code gen (plan, file-update, message) |
| `/api/usage` | GET | Required* | Yes | User usage stats |
| `/api/marketplace/purchase` | POST | Required | No | Purchase agent; Stripe or credits |
| `/api/webhooks/stripe` | POST | Signature | — | Stripe checkout completion |

*When BYPASS_AUTH=true, “Required” APIs accept bypass user id.

---

## Test coverage (automated vs manual)

| Area | Automated | Manual |
|------|-----------|--------|
| **Health** | Vitest: `GET /api/health`, `GET /api/v1/health`, `HEAD /api/health` (status, shape) | — |
| **Auth callback** | Vitest: redirect when no code; redirect to error when `error` param | Login/sign-up flows, OAuth |
| **Builder projects API** | Vitest: GET/POST with mocked auth (401 when unauthenticated; 200 + project when authenticated) | Save/load project in UI |
| **Builder generate (parsing)** | Vitest: `lib/builder-v2/json-normalizers` (valid JSON, backticks, control chars, trailing commas) | Full builder prompt to preview |
| **Builder generate (integration)** | Vitest: POST `/api/builder/generate` with minimal body; 400 for invalid/missing prompt; 200 + NDJSON when BYPASS_AUTH and GROQ_API_KEY (skip in CI if no API key) | Stream shape and validation |
| **E2E (optional)** | Playwright: builder load, prompt input, save/projects; send prompt and wait for completion, restore version (E2E may require BYPASS_AUTH and stable or mocked generate API to avoid flakiness) | Full user journeys |

Run automated tests: `npm run test` (unit/integration). E2E: `npm run test:e2e` (starts dev server locally; in CI, E2E job runs after build and uses `npm run start` via Playwright webServer). **CI runs both** so every push/PR runs Vitest and Playwright. E2E may require `BYPASS_AUTH=true` and API keys (e.g. `GROQ_API_KEY`) for full coverage of builder and generate flows; see builder E2E notes below. See [.github/workflows/ci.yml](../.github/workflows/ci.yml) for the E2E job.

**Learn progress:** [lib/learn/progress-tracker.ts](../lib/learn/progress-tracker.ts) aligns with the resolved schema: table `lesson_progress` (scripts 008, 038, 044), course → lessons via `course_modules` (no direct FK from lessons to courses). Progress uses `lesson_progress.completed`; no `user_lesson_progress` or `status` field.

### E2E coverage (smoke and flows)

| Flow | E2E spec | Notes |
|------|----------|--------|
| Home | home.spec.ts | Branding, nav links |
| Auth | auth.spec.ts | Login/signup redirects |
| Health API | health-api.spec.ts | GET /api/health |
| Chat | chat-flow.spec.ts | Chat flow |
| Learn | learn.spec.ts | Learn page, courses list |
| Marketplace | marketplace.spec.ts | List, filters |
| Workspace | workspace.spec.ts | Creations |
| Presentations | presentations.spec.ts | Generate flow |
| Builder | builder.spec.ts | Load, prompt, save/restore (may need BYPASS_AUTH + API key) |
| Onboarding | onboarding.spec.ts | Page loads, one path (smoke) |
| Studio | studio.spec.ts | Page loads, tabs (smoke) |

Billing/credits and checkout (Stripe test or mocks) are not covered by E2E; test manually. NairiBook (notebooks), debate, and knowledge are manual or partial.

### E2E in CI and deploy preview

- **CI:** The E2E job in [.github/workflows/ci.yml](../.github/workflows/ci.yml) runs on every push/PR to `main`: it installs Playwright browsers (`npx playwright install --with-deps`), builds the app with placeholder env (same as build job), and runs `npm run test:e2e`. Playwright’s `webServer` starts `npm run start` so tests hit the built app at `http://localhost:3000`. Critical flows (e.g. home, health) are guarded on every PR or main.
- **Optional — deploy preview:** To avoid flaky local server, you can run E2E only against a deploy preview (e.g. Vercel preview URL). In CI, set `PLAYWRIGHT_BASE_URL` to the preview URL (e.g. `https://nairi-xxx-org.vercel.app`) and skip the local `webServer` (e.g. by not starting the server when `PLAYWRIGHT_BASE_URL` is set). Document the chosen approach (local server vs deploy preview) in this section when adopted.

---

## 9. Performance

- [ ] **First load:** LCP reasonable; no huge blocking scripts (check Network/Lighthouse).
- [ ] **Navigation:** Route transitions show loading state; no long blank screen.
- [ ] **Images:** Next/Image used where applicable; logos have width/height.

---

## 10. Loading & Empty States Coverage

- [ ] **Loading:** `/`, `/dashboard`, `/chat`, `/workspace`, `/builder`, `/flow`, `/learn`, `/marketplace`, `/studio`, `/presentations`, `/auth/login`, `/docs`, `/faq`, `/dashboard/notifications` have loading.tsx or inherit.
- [ ] **Empty:** Workspace “Recent Creations”, Dashboard “Recent Conversations”, Dashboard “Your Agents” show clear empty state and CTA.

---

## Quick Bypass Test (CEO smoke test)

1. Set `BYPASS_AUTH=true` in `.env`.
2. `npm run dev` → http://localhost:3000.
3. Click **Login** (or go to `/auth/login`) then go to `/nav` (or open nav overlay from left arrow).
4. From nav, open: Dashboard, Chat, Workspace, Builder, Presentations, Studio, Marketplace, Learn, Flow, Knowledge.
5. In Chat: send one message; confirm reply.
6. In Workspace Create: pick type, enter prompt, generate; confirm result.
7. In Builder: enter a prompt (e.g. "Add a hero section"); confirm streaming updates and preview/code.
8. In Presentations: enter topic, generate; confirm slides.
9. Confirm no redirect to login and no 500s on these flows.

---

## Completeness checklist (audit)

After a full project completion audit, ensure:

- [ ] **Docs:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md) paths match implementation (`/api/profile`, `/api/usage`, chat/marketplace/presentations/builder as documented).
- [ ] **DB:** Migration `scripts/020_create_usage_logs.sql` has been run if using `/api/usage` or cost tracking; `scripts/021_create_builder_projects.sql` for builder Save project / My projects.
- [ ] **Auth:** Protected routes in `lib/supabase/session.ts` include `/presentations`, `/builder`, `/builder-v2`; builder layout also redirects unauthenticated users to login.
- [ ] **Error UX:** Global error page ([app/error.tsx](../app/error.tsx)) includes “Open navigation” and “Home” links.
- [ ] **Rate limits:** [docs/api/RATE_LIMITS.md](api/RATE_LIMITS.md) and [ARCHITECTURE.md](ARCHITECTURE.md) describe in-memory vs production (Redis) behavior.

See the Nairi Full Project Completion Audit plan for the full list of fixes and decisions.

---

---

## Feature status (Marketplace, Learn, Debate, Flow, Knowledge)

Per PRODUCT_SPEC, logic for these areas is “TBD in audit”. Use this section to confirm routes load (no 500) and to document what works vs stub.

- **Marketplace:** `/marketplace` — List page with search/filters, agent detail `[id]`, purchase flow (free, credits, or Stripe via `/api/marketplace/purchase`), reviews UI; empty state when no agents; create/creator routes exist.
- **Learn:** `/learn` — Courses list (empty state when no courses), course detail `courses/[courseId]`, skill-tree page; layout and loading states; content from `courses` table or seeded.
- **Debate:** `/debate` — Single page; fetches `debate_sessions`, renders DebateInterface; topics/arguments logic may be stub or wired to chat.
- **Flow:** `/flow` — Main page (feed from feed_posts), `/flow/create`; workflows execute API at `/api/workflows/execute`; lib/workflows executor and templates.
- **Knowledge:** `/knowledge` — Page fetches knowledge_nodes, knowledge_edges, belief_contradictions; KnowledgeGraph component; APIs at `/api/knowledge/nodes`, `/api/knowledge/edges`, `/api/knowledge/graph`.

For each area: (a) confirm route loads without 500, (b) note what works (e.g. marketplace list, learn courses list) and what is empty/stub, (c) fix broken links or missing error states as found.

**Simulations:** Remain SOON until product ships; then implement `/api/generate-simulation` (or dedicated API), remove SOON from [app/simulations/page.tsx](../app/simulations/page.tsx) and workspace create, and wire chat tool.

**Community:** `/nav` → Community (Projects, People, Companies) show “Coming soon” cards; no placeholder data. Full community data will be wired when the feature ships.

---

## Dev-only routes

The following routes **return 404 in production** (`NODE_ENV === 'production'`) and are for local development or QA only:

- **`/test-interface`** — UI to call `/api/chat`, `/api/generate-image`, `/api/generate`, `/api/generate-video`, `/api/generate-audio` without auth. Use with `BYPASS_AUTH=true` or a real session.
- **`/test-error`** — Button to trigger a client error for Sentry (or error boundary) testing.

Do not link to these from production UI. In production builds, visiting them yields a 404.

---

**Chat and workspace:** Chat uses `/api/chat` with tool routing; workspace list and create use creations API; rate limits and error UX per Phase 7–8. Creations are source of truth; workspace and dashboard read from it.

*Last updated: 20-phase roadmap — testing expansion, observability, rate limit/security, marketplace/learn/debate/flow/knowledge feature status, simulations SOON note, chat/workspace doc.*
