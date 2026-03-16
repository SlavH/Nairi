# Nairi — Gap Closure (Phase 9)

Per-subsystem: what the UI promised vs what the code did, what was fixed, what remains intentionally SOON.

---

## Game generation

| Item | Before | After |
|------|--------|--------|
| **UI promised** | Cards/options for "Game" in workspace create, all view filter, demo modal; chat could imply game creation. | Removed: no Game card, no Game filter, no game demo template. Chat returns "Game generation is not available." |
| **Code did** | `/api/chat` could return game templates; `/api/generate` had game type and prompts; `/api/create`, design-brief, studio had game; `lib/templates/games.ts`, `lib/builder/game-templates.tsx` existed. | Removed: game type and prompts from generate, create, design-brief, studio; game templates and builder game-templates deleted; chat returns only unavailable message; `getSystemPrompt("game")` and GAME_MODE_PROMPT removed. |
| **Fixed** | All game generation code paths and UI removed or rejected (400 for `type: "game"` on generate). FAQ and workspace create examples no longer mention games. |
| **SOON** | N/A — game generation is not planned. |

---

## Simulations

| Item | Before | After |
|------|--------|--------|
| **UI promised** | `/simulations` page; workspace create "Simulation" card; chat could call simulation API and show "Interactive Simulation Generated!" or error + external links. | UI still shows simulations as a capability; card and page say "SOON — under active development"; chat never calls API and returns only SOON message. |
| **Code did** | Chat called `/api/generate-simulation` (route disabled as `generate-simulation_disabled`), then showed success or failure message. Workspace simulation had "Coming Soon" badge; create could still send simulation to `/api/create` (API returns 400). | Chat no longer calls any simulation API; returns single message: "SOON — this feature is under active development." Workspace simulation badge text: "SOON — under active development"; create button guarded so SOON types do not call API. |
| **Fixed** | Simulation API call removed from chat. Badge and copy aligned to "SOON — under active development." Client-side guard in workspace create for SOON types. |
| **SOON** | Simulations: visible in UI, no execution, no APIs, no fake output. Permanently SOON — no planned full implementation. |

---

## Website / App generator (Builder)

| Item | Status |
|------|--------|
| **UI promised** | Build websites/apps from prompt; types (website, landing-page, dashboard, app, etc.). | Implemented: `/builder` uses `/api/builder/generate`; `/workspace/create` website uses `/api/create`. `/api/generate` used by test-interface; game type removed. |
| **Code did** | End-to-end generation with design brief, Groq, code cleanup, template wrap. | No change to working flow. |
| **Fixed** | Game type and prompts removed from `/api/generate`; design-brief no longer accepts game. |
| **SOON** | None. |

---

## Presentation generator

| Item | Status |
|------|--------|
| **UI promised** | Create presentations from prompt; templates; slide count. | Implemented: `/api/generate-presentation`, `/presentations`, `/studio/presentation`, workspace create presentation. |
| **Code did** | Real API and UI. | No structural change. |
| **Fixed** | None required for this subsystem. |
| **SOON** | None. |

---

## AI Chat

| Item | Status |
|------|--------|
| **UI promised** | Chat with AI; generate images, video, audio, documents, presentations when requested; no games; simulations not yet available. | Implemented: streaming chat, tool routing to image/video/audio/document/presentation APIs; game request → unavailable message; simulation request → SOON message only (no API call). |
| **Code did** | Previously called `/api/generate-simulation` and showed success or failure. | Chat no longer calls simulation API; returns SOON message only. |
| **Fixed** | Simulation path replaced with SOON-only response. Game path already returned unavailable message. |
| **SOON** | Simulations: handled in chat with SOON message only. |

---

## Workspace create

| Item | Status |
|------|--------|
| **UI promised** | Create by type: presentation, website, document, visual, code, analysis, simulation (SOON), image, video, audio. | Implemented: type-specific APIs; simulation card is SOON, not selectable for create; API rejects simulation. |
| **Code did** | Simulation had "Coming Soon" badge; if simulation were sent, `/api/create` returned 400. | Badge text: "SOON — under active development"; `handleCreate` guards SOON types so no API call. |
| **Fixed** | Badge copy; client guard for SOON types; FAQ and examples no longer mention games. |
| **SOON** | Simulation only. |

---

## Final state

- **Working:** Website/App builder, presentations, documents, AI chat, workspace create (all non-SOON types), images, video, audio via their APIs.
- **SOON (UI only, no execution):** Simulations — visible, labeled "SOON — under active development", no API calls, no fake output.
- **Not offered:** Game generation — removed from product and code.

No user-facing feature implies working behavior when it does not; no core flow silently fails for the audited subsystems.
