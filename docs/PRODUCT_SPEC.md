# Nairi — Technical Product Spec (from real UI only)

**Source:** Actual UI text, routes, existing components, code comments.  
**Rule:** Only what is implemented or explicitly marked SOON. No future/planned claims.

---

## Core mission (from UI)

- **Hero (en):** "One thought. Complete reality."
- **Tagline:** Nairi eliminates the gap between intention and outcome. No learning. No process. Just results.
- **How it works:** Speak your mind → Nairi understands → Autonomous execution → Receive the result.

---

## Core promise (from UI)

- Create original content (not templates) tailored to user intent.
- From thought to reality: intention → outcome.
- Capabilities: text formats, presentations, websites & interfaces, visual concepts, ideas & strategies, simulations (SOON), and more.

---

## Target user

- **Stated:** "Whatever you can imagine, Nairi can materialize" — creators / anyone who wants to generate content.
- **Reach:** Sign up, login, workspace, builder, chat, studio, presentations, documents, marketplace, learn, debate, flows, knowledge.  
- **UNKNOWN:** No explicit persona (e.g. "for developers" / "for marketers") in UI.

---

## Actually implemented capabilities (from code + UI)

| Capability | Route / entry | Status |
|------------|----------------|--------|
| **Website / App builder** | `/builder`, `/builder-v2`, `/workspace/create` (website) | Implemented (API: `/api/generate`, `/api/builder/generate`, etc.) |
| **Presentations** | `/presentations`, `/studio/presentation`, `/workspace/create` (presentation) | Implemented (API: presentation generation) |
| **Documents** | `/documents`, `/studio/document`, `/workspace/create` (document) | Implemented |
| **AI Chat** | `/chat`, `/chat/[id]` | Implemented (API: `/api/chat`) |
| **Workspace / Creations** | `/workspace`, `/workspace/create`, `/workspace/[id]`, `/workspace/all` | Implemented (create types: presentation, website, document, visual, code, analysis; simulation = SOON) |
| **Studio** | `/studio`, `/studio/presentation`, `/studio/document` | Implemented |
| **Images / Visuals** | `/builder/visual`, workspace "visual", capabilities "Visual concepts" | Implemented (image generation APIs) |
| **Code** | Workspace "code", capabilities, builder code output | Implemented |
| **Analysis** | Workspace "analysis", capabilities "Ideas & Strategies" | Implemented |
| **Simulations** | `/simulations` | **SOON** — under active development. No execution, no APIs, no fake actions. |
| **Marketplace** | `/marketplace`, `/marketplace/create`, `/marketplace/[id]` | Implemented (UI + backend TBD in audit) |
| **Learn** | `/learn`, `/learn/skill-tree`, `/learn/courses/[courseId]` | Implemented (content/UX TBD in audit) |
| **Debate** | `/debate` | Implemented (logic TBD in audit) |
| **Flow** | `/flow`, `/flow/create` | Implemented (logic TBD in audit) |
| **Knowledge** | `/knowledge` | Implemented (logic TBD in audit) |

---

## Explicitly NOT offered

- **Game generation:** Does not exist. Removed from routes, UI, logic, prompts, templates. Chat returns "Game generation is not available" for game requests.

---

## SOON (under active development)

- **Simulations** (`/simulations`): Must show "SOON — this feature is under active development". No backend logic, no fake buttons, no actions. **Permanently SOON:** Simulations are intentionally kept as SOON only; there is no planned full implementation (no simulation execution API, no removal of SOON from UI/chat).

---

## Routes (public / app — from file tree)

- `/` — Home  
- `/builder`, `/builder-v2`, `/builder/visual`  
- `/workspace`, `/workspace/create`, `/workspace/[id]`, `/workspace/all`  
- `/presentations`, `/studio`, `/studio/presentation`, `/studio/document`  
- `/chat`, `/chat/[id]`  
- `/documents`, `/simulations`  
- `/marketplace`, `/marketplace/create`, `/marketplace/[id]`, `/marketplace/creator`  
- `/learn`, `/learn/skill-tree`, `/learn/courses/[courseId]`  
- `/debate`, `/flow`, `/flow/create`, `/knowledge`  
- `/docs`, `/docs/getting-started`, `/docs/api`, `/docs/presentations`  
- `/auth/login`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/reset-password`, etc.  
- `/dashboard`, `/settings`, `/profile`, `/security`, `/notifications`, `/billing`, `/pricing`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/cookies`, `/careers`, `/blog`, etc.

---

## Phase 2 — Feature reality (claim vs code)

| Feature | Exists in code | Reachable from UI | Wired E2E | Real output | Classification |
|--------|----------------|-------------------|-----------|-------------|-----------------|
| Website/App builder | Yes (`/api/generate`, `/api/builder/generate`, `/builder`) | Yes `/builder`, `/workspace/create` (website) | Yes | Yes (Groq, code) | ✅ Fully working |
| Presentations | Yes (`/api/generate-presentation`, `/presentations`, `/studio/presentation`) | Yes | Yes | Yes | ✅ Fully working |
| Documents | Yes (`/api/generate-document`, `/api/create`, `/documents`, `/studio/document`) | Yes | Yes | Yes | ✅ Fully working |
| AI Chat | Yes (`/api/chat`) | Yes `/chat` | Yes | Yes (streaming, tool calls) | ✅ Fully working |
| Workspace create | Yes (`/workspace/create`, `/api/create`, type-specific APIs) | Yes | Yes | Yes | ✅ Fully working |
| Simulations | UI only (`/simulations`, workspace card) | Yes (card + chat) | No API, no execution | SOON message only | 🟡 SOON — under active development |
| Game generation | Removed | No | N/A | N/A | ❌ Does not exist |

- **Simulations:** Chat no longer calls `/api/generate-simulation`; returns "SOON — this feature is under active development." Workspace simulation card shows "SOON — under active development", card not selectable for create; `handleCreate` guards SOON types.
- **Games:** All game routes, UI, logic, templates, and prompts removed or disabled. Chat returns "Game generation is not available" for game requests.

---

*Last updated from codebase audit. If something is unclear → marked UNKNOWN in Phase 2/9.*
