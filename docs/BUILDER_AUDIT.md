### Nairi Builder – End-to-End Audit (Prompt → Code → Preview)

This document summarizes how the Builder v2 flow works today, where it fails, and which mechanisms are already in place to clean and validate AI-generated code before it reaches the preview.

---

### 1. Data flow – from prompt to preview

- **Entry point**: `[app/builder/page.tsx](app/builder/page.tsx)`
  - User types into the builder chat (`handleSendMessage`) or picks a template from `TemplateGallery`.
  - Builder assembles a `GenerateRequest` with:
    - `prompt`: user intent or template text
    - `currentFiles`: current project files (e.g. `/app/page.tsx`, `/app/layout.tsx`, `globals.css`)
    - `conversationHistory`: last messages for context
  - Sends `POST /api/builder/generate` with this payload.

- **Backend generation**: `[app/api/builder/generate/route.ts](app/api/builder/generate/route.ts)`
  - Validates:
    - Rate limit via `checkRateLimit`.
    - Auth via Supabase (`getUserIdOrBypassForApi`).
    - Body JSON and presence of `prompt`.
    - Environment (`GROQ_API_KEY` must be present and non-placeholder) → otherwise returns **503** with explicit error.
  - Builds a streaming `ReadableStream`:
    - Emits `plan` (dynamic tasks) and `task-update`s for UI.
    - Builds an **enhanced generation prompt** from:
      - `V0_SYSTEM_PROMPT` (imported from `lib/builder-v2/prompts/system-prompt.ts`; output format, preview constraints, design quality, behavior).
      - Prompt analysis (intent, websiteType, complexity, features).
      - Design guidance from `lib/builder-v2/utils/design-intelligence.ts` (layout patterns by website type) injected into the user message as DESIGN GUIDANCE.
    - Calls `generateWithFallback` with this prompt to obtain raw code.
  - **Critical cleaning & validation pipeline (server-side)**:
    - Uses `cleanGeneratedCode` (from `@/lib/builder-v2/generators/code-cleaner`) to normalize the AI output:
      - Removes markdown fences and explanations.
      - Ensures a single `export default` component.
      - Fixes many common hook/arrow-function/useState syntactic errors.
      - Avoids HTML document wrappers (`<html>`, `<head>`, `<body>`).
    - Uses `validateTypeScriptCode` on the cleaned code.
    - If validation reports fixable problems, applies `autoFixCommonErrors` to the cleaned content.
    - Only then streams `file-update` events, typically targeting `/app/page.tsx`.

- **Frontend consumption**: `[app/builder/page.tsx](app/builder/page.tsx)`
  - Reads the streaming response line by line:
    - `plan` → initializes a dynamic task list.
    - `task-update` → updates individual task statuses.
    - `file-update` → updates `files` state and `selectedFile` if applicable.
    - `message` → appends assistant chat content and shows **toast errors only for real failures**.
    - `complete` → marks plan as completed or failed.
  - On successful completion, writes a new `ProjectVersion` with the updated `files`.
  - `getPreviewCode()` always reads the current `/app/page.tsx` from state for preview.

- **Preview sandbox**: `[components/builder-v2/live-preview-v2.tsx](components/builder-v2/live-preview-v2.tsx)`
  - Uses `buildSandpackFiles` to construct:
    - `/App.tsx`: cleaned and JS/TS syntax-fixed code.
    - `/index.tsx`: standard React entry using `ReactDOM.createRoot`.
    - `/styles.css`: base CSS with Inter font.
  - **Client-side sanitization**:
    - `fixCommonSyntaxErrors` and `cleanCodeForSandpack` further normalize the code:
      - Replace Unicode arrows with `=>`.
      - Normalize `className` template literals.
      - Strip stray backticks and fix unmatched braces/parentheses.
      - Remove unsupported `customStyles` references.
      - Fix stray `>` after JSX opening tags (`<main ...> >` → `<main ...>`).
  - **Validation**:
    - `isValidReactCode` rejects obviously wrong payloads (JSON plans, markdown, insufficient length, no JSX).
  - **Execution**:
    - Hands the constructed files to Sandpack (`template="react-ts"`).
    - `SandpackStatusListener` reports:
      - `onReady` when the preview loads without errors.
      - `onError` when the bundler/runtime throws, which is surfaced in the UI as a **Preview Error** overlay and via `handleAutoFixError`.

---

### 2. Failure modes (today)

#### 2.1 Backend (`/api/builder/generate`)

- **Env misconfiguration**
  - Missing or placeholder `GROQ_API_KEY` → returns 503 with message:
    - “Builder requires GROQ_API_KEY to be set in environment. Add a valid key in .env to use AI code generation.”
  - Effect: no partial code, no preview; front-end shows the error from the response.

- **Prompt analysis / reference analysis failures**
  - `analyzePrompt`, `analyzeDesign`, `analyzeReferenceUrl`, and web-search utilities can fail due to:
    - Network issues fetching external sites.
    - Unexpected HTML/CSS structures during analysis.
  - Mitigation:
    - Wrapped in `try/catch` and fall back to simpler planning; builder still attempts generation anyway.

- **Code generation failures**
  - Model may output:
    - Extra explanation text or markdown code fences.
    - Invalid JSX/TSX: unclosed tags, stray `>`, malformed hooks, merged lines.
  - Mitigation:
    - `cleanGeneratedCode` aggressively strips explanations and markdown.
    - Applies a battery of regex fixes for hooks, destructuring, and arrow functions.
    - `validateTypeScriptCode` + `autoFixCommonErrors` run before emitting `file-update`.
  - Residual risk:
    - Some complex syntax edge-cases still leak through (especially nested generics or unconventional JSX).

- **Streaming protocol**
  - Each event is `JSON.stringify(data) + "\\n"`.
  - Frontend streaming loop maintains a `buffer` for incomplete lines and attempts final parse on trailing `buffer` at the end.
  - Residual risk:
    - Malformed JSON lines would be logged and skipped; `receivedComplete` might stay false, leading to a “Generation did not complete successfully” error for the user.

#### 2.2 Frontend builder (`app/builder/page.tsx`)

- **Partial stream handling**
  - Streaming loop splits on newlines and re-buffers the last fragment; partial JSON lines are retried on the next chunk.
  - Parse failures are logged to console but do not crash the UI.
  - If the final `buffer` cannot be parsed, `complete` may never be seen and the plan stays in failed state.

- **State sync issues**
  - `files` are updated in place on each `file-update`.
  - `selectedFile` is replaced if its path matches `data.file.path`.
  - `getPreviewCode()` always pulls current `/app/page.tsx`; if no `file-update` is emitted for that path, preview renders the last known version.

- **User messaging**
  - On backend errors (non-2xx), builder reads the body, tries to parse `error` or `message`, and surfaces a friendly toast.
  - On stream errors, a short, derived message is added as an assistant chat message and the plan is marked failed.

#### 2.3 Preview (`LivePreviewV2` + Sandpack)

- **Invalid code reaching Sandpack**
  - Despite server-side cleaning, some invalid JSX/TSX can still reach the client.
  - `fixCommonSyntaxErrors` + `cleanCodeForSandpack` handle many patterns:
    - Stray backticks.
    - Unmatched braces/parentheses.
    - Mixed `className` quoting.
    - Stray `>` after opening tags.
  - If bundler still fails, Sandpack reports an error which is:
    - Emitted via `onErrorDetected`.
    - Shown as a **Preview Error** overlay with a “Retry” and “Fix Error” button.

- **Timeouts**
  - If preview does not load within 5 seconds, `LivePreviewV2` auto-retries up to 3 times and then shows:
    - “Preview failed to load after multiple attempts. Click refresh to try again.”

---

### 3. Summary of reliability-focused mitigations

- **Generation phase**
  - Clear constraints in the builder system prompt (in `lib/builder-v2/prompts/system-prompt.ts`: output format, no document tags, nav/main/section, Tailwind, etc.).
  - Pre-clean AI output with `cleanGeneratedCode`.
  - Validate via `validateTypeScriptCode` and, where safe, correct via `autoFixCommonErrors`.

- **Transport phase**
  - Streaming protocol with `plan`, `task-update`, `file-update`, `message`, and `complete` events.
  - Robust buffering/parsing on the client. Failures do not crash React; instead they log and lead to a clear “Generation did not complete successfully.” status.

- **Preview phase**
  - Additional client-side sanitization and validation to catch syntax issues that escaped the backend.
  - Sandpack-based compilation/runtime environment isolated from the main app.
  - Clear error overlay and toast when preview fails, with an explicit manual **Fix Error** path instead of hidden infinite auto-fix loops.

### 4. Builder system prompt

The builder system prompt lives in **`lib/builder-v2/prompts/system-prompt.ts`**. The route (`app/api/builder/generate/route.ts`) imports `V0_SYSTEM_PROMPT` from that module; the prompt is not defined inline in the route.

- **Layout patterns and website types** are defined in `lib/builder-v2/utils/design-intelligence.ts` (e.g. `layoutPatterns`, `getDesignGuidance`). The route injects design guidance into the **user message** as DESIGN GUIDANCE so the model receives layout patterns by website type; the system prompt does not repeat the full website-type list.
- **Output format and forbidden patterns** (JSON only, no `<html>`/`<body>`, no single-div, nav/main/section required, etc.) are in the system prompt. The prompt is structured in four tiers: critical (output format, preview constraints), behavior (role, interpreting requests, Bolt rules), design (design quality, website-type reference), reference (multi-page, patterns, common failures, quality checklist).
- **How to change it**: Edit the segments or composed string in `lib/builder-v2/prompts/system-prompt.ts`, then run the builder flow. For variants or A/B tests, swap or extend segments in that module.

---

This document is the reference for builder architecture and current reliability mechanisms. Further changes to prompts, sanitizers, or preview behavior should update this file to keep the mental model accurate.

