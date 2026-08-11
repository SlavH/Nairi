# NairiBook / LEARN Audit

**Scope:** `app/learn/**`, `app/api/learn/**`, `components/learn/**`, `lib/nairibook/**`, `lib/learn/**`, `lib/features/learn`, `lib/features/knowledge`, `app/knowledge/**`, `app/api/knowledge/**`, `app/api/nairi/**`, `app/api/nairi-chat/**`, related migrations and tests. Audit only; no code was modified. Priority: Security → Correctness → Dead/broken → Test gaps.

---

## Summary — Top 5 Risks

1. **Quiz answers are exposed to every authenticated user (Security).**
   `quiz_questions_read` is `FOR SELECT USING (TRUE)` (008:203) and the quiz page passes full rows — including `correct_answer` and `explanation` — to the browser client (`app/learn/quiz/[quizId]/page.tsx:20`). Any logged-in user can enumerate any quiz's questions and answers, and answers are trivially viewable in the page bundle. Quizzes are effectively cheat-by-design, and this also leaks paid course content.

2. **LLM abuse surface: unbounded prompt context and missing rate limits (Security/Cost).**
   The notebook chat and generate routes embed **all** source text (up to 80,000 chars × *unbounded* number of sources) into the system prompt with no total cap (`app/api/learn/notebooks/[id]/chat/route.ts:47-57`, `generate/route.ts:64-67`) and impose no per-user rate limit. `POST /api/nairi-chat` (`app/api/nairi-chat/route.ts:26-36`) is unauthenticated and proxies to the OpenCode backend/Groq (IP-only limit of 10 req/min). A malicious user can burn provider credits or inject instructions via their own source content.

3. **RAG chat history persistence is completely broken (Correctness).**
   The `rag_chat`/`rag_feedback` stores are created with composite key path `["notebookId", "turnId"]` (`lib/nairibook/db.ts:47-48`), but `chat-store.ts` saves records with only `{notebookId, turns, updatedAt}` and reads with a single string key. IndexedDB throws `DataError` on both `put()` and `get()` — chat history is silently lost every session, and the failing `loadChatHistory` in the panel's mount effect (`components/learn/rag-chat-panel.tsx:63`) also drops the cached document.

4. **Achievements and learning analytics were disabled by the RLS hardening migration and nobody noticed (Correctness/Regression).**
   `supabase/migrations/20260804_harden_rls_policies.sql:93` replaced the user-achievements INSERT policy with `WITH CHECK (false)` and `:113` made `learning_analytics` INSERT service-role-only. The app still writes through the user-scoped server client (`lib/learn/achievements.ts:43`, `lib/learn/progress-tracker.ts:131`) with ignored/partial error handling, so achievements never persist and all analytics metrics (except `time_spent`, which has a fallback) are silently dropped.

5. **The Skill Tree feature is dead on arrival (Dead/broken).**
   `app/learn/skill-tree/page.tsx:17-20` queries an embedded `skill_nodes(*)` relation (no such table exists; only `skills`) and filters on `is_published` (the column is `is_public`). `SkillTreeView` reads `user_skills` fields that don't exist (`skill_node_id`, `proficiency_level`, `xp_earned` — real schema is `skill_id`, `current_xp`, `mastery_level`), and its "Unlock Skill" button has no click handler. The page renders empty and nothing in the UI can be unlocked or progressed.

---

## Findings

| file:line | Severity | Issue | Suggested fix |
|---|---|---|---|
| `scripts/008_create_education_tables.sql:203` + `app/learn/quiz/[quizId]/page.tsx:20` | High | `quiz_questions_read` policy is `USING (TRUE)`; the page passes `correct_answer`/`explanation` to the client. Any authenticated user can read any quiz's answers; answers ship in the browser bundle. | Scope quiz reads to enrolled/owner users (e.g., `user_id = auth.uid()` or via course enrollment) and return questions to the client **without** correct answers (grade server-side on attempt submit). |
| `app/api/learn/notebooks/[id]/chat/route.ts:47-57` | High | All sources (80k chars each, unbounded count) embedded in the system prompt; no rate limit; single-turn only (conversation history never sent). Prompt-injection surface plus LLM cost abuse by any authenticated user. | Cap total context (e.g., 60k chars), add a per-user rate limit, and either send conversation history or relabel as single-turn Q&A. |
| `app/api/learn/notebooks/[id]/generate/route.ts:64-67` | High | Same unbounded context (60k chars × N sources), no rate limit; authenticated users can spam expensive generations. | Add a total-context cap and per-user rate limiting. |
| `app/api/nairi-chat/route.ts:26-36, 88` | Medium | Unauthenticated LLM proxy (IP-only 10 req/min). On empty text it returns `JSON.stringify(msgData)` which can leak backend internals. | Require auth; return a generic message instead of raw backend JSON. |
| `lib/nairibook/zen.ts:33-36, 101` | Medium | User BYOK API key stored in `localStorage` and sent to third-party `https://opencode.ai`; `Bearer public` fallback for "free" models. Personal/corporate data can be sent to a third party. | Document third-party data flow in UI (opt-in), support `sessionStorage`, and let users revoke stored keys. |
| `app/api/learn/notebooks/[id]/sources/upload/route.ts:15, 43` | Low | No server-side MIME/content validation (only HTML `accept`); any file up to 20 MB is parsed as text or fed to `pdf-parse`. | Validate file type by magic bytes; restrict to `.txt/.md/.pdf`. |
| `lib/learn/ai-mentors.ts:93` | Low | Update omits `.eq("user_id", userId)` — RLS happens to guard it, but this is fragile defense-in-depth. | Add the `user_id` filter to all mentor updates. |
| `app/api/nairi-chat/health/route.ts:8-25`, `app/api/nairi/config/route.ts:8-12` | Low | Reveal which AI providers are configured (info disclosure for unauthenticated callers). | If unneeded publicly, gate behind auth. |
| `lib/nairibook/db.ts:47-48` + `lib/nairibook/chat-store.ts:32-49` | High | `rag_chat`/`rag_feedback` use keyPath `["notebookId","turnId"]` but records lack `turnId` and reads use a single string key → IndexedDB `DataError`; history save/load/feedback all throw. | Use `keyPath: "notebookId"` (single record per notebook) or pass `[notebookId, turnId]` keys and per-turn records. |
| `components/learn/rag-chat-panel.tsx:63, 118` | High | Unhandled rejection from `loadChatHistory` kills the mount effect (cached doc never applied); `saveChatTurns` rejection during `persist` breaks message saves. | Fix the store mismatch above; wrap loads/saves in try/catch. |
| `supabase/migrations/20260804_harden_rls_policies.sql:93` + `lib/learn/achievements.ts:43` | High | `user_achievements` INSERT is `WITH CHECK (false)`; the app inserts via user-scoped client with the error ignored, so achievements never persist yet are reported as "unlocked". | Grant achievements via service role (trigger/edge function) or re-add `WITH CHECK (auth.uid() = user_id)`; surface insert errors. |
| `supabase/migrations/20260804_harden_rls_policies.sql:113` + `lib/learn/progress-tracker.ts:131-145` | Medium | `learning_analytics` INSERT is service-role-only; all metrics except `time_spent` are silently dropped (fallback only covers `time_spent`). | Insert analytics via service role/trigger, or scope a per-user insert policy. |
| `app/learn/skill-tree/page.tsx:17-20` | High | Queries `skill_nodes(*)` (table does not exist) and filters `is_published` (column is `is_public`) → PostgREST error, page always empty. | Rename relation to `skills(*)` and filter on `is_public`. |
| `components/learn/skill-tree-view.tsx:12-35, 46-64, 195-200` | High | Reads `user_skills.skill_node_id/proficiency_level/xp_earned` (schema: `skill_id/current_xp/mastery_level`); "Unlock Skill" button has no onClick; no unlock/persist path exists anywhere. | Align with real schema, wire unlock to an API/DB write, or remove the feature. |
| `app/learn/courses/[courseId]/page.tsx:42-45` | Medium | `is_free: true` hardcoded for every lesson, so all paid-gating/locking logic in the UI is dead. | Select the real `is_free` column or remove gating UI. |
| `components/learn/course-detail.tsx:61-77` | Medium | "Start lesson" only inserts a `lesson_progress` row; no lesson viewer exists (comment: "would be implemented with actual lesson viewer"). Course learning path is a stub. | Build the lesson viewer or hide the button; at minimum check the insert error. |
| `app/api/nairi-chat/route.ts:113` | Medium | Role filter typo `"assitant"` drops all assistant turns from history, producing lopsided prompt context. | Change to `"assistant"`. |
| `lib/nairibook/chunking.ts:45-49` | Medium | Overlap offset is computed **after** `current` is reassigned to the overlap slice, so `startOffset` never advances → every chunk after an overlap reports wrong start/end offsets. | Save `const prevLen = current.length` before slicing; advance `startOffset` by `prevLen - overlap.length`. |
| `lib/nairibook/embeddings.ts:22-32, 49-56` | Medium | `isWebGPUAvailable()` only checks `navigator.gpu`; a WebGPU init failure throws with no WASM retry despite the "WebGPU preferred, WASM/CPU fallback" comment. `out.data ?? out.tolist()` yields NaN vectors when `.data` is absent (nested arrays → `dim = 1`); `Array.isArray(data) ? data : data` is a no-op. | Wrap `pipeline` in try/catch and retry with `device: "wasm"`; use flat data or `tolist()` correctly. |
| `components/learn/concept-graph-view.tsx:202-206` | Low | "Never studied" uses `filter(st => !st)` on Map values (never falsy) → always 0; "Total concepts" counts only reviewed concepts, not all concepts. | Iterate over all concept ids, not `srStates.values()`. |
| `components/learn/limit-card.tsx:73, 80` | Low | Inline `style` uses Tailwind color class strings (`"amber-500/30"`) which are not valid CSS → decorative border/title colors silently don't render. | Use real hex colors or drop the inline styles. |
| `app/learn/mentors/[domain]/page.tsx:16` | Low | `decodeURIComponent` on an already-decoded Next.js param can throw on a literal `%` in a mentor domain. | Remove the double decode. |
| `app/api/nairi/chat/route.ts:28-34` | Low | No auth/rate limit on the proxy (mitigated by config gating). | Add auth + rate limit for consistency. |

---

## Test gaps

**Existing coverage (unit):** `__tests__/lib/nairibook/{core, exercises, photo-check, problem, retrieval}.test.ts` — 5 files, all pure-logic.

**e2e:** `e2e/learn.spec.ts` has 3 smoke tests only (learn page loads, courses/skill tree visible, courses list). The "courses list page loads" test targets `/learn/courses`, which has **no** `page.tsx` (only `[courseId]`), so it fails/404s.

**Missing coverage (highest-value first):**
- `lib/nairibook/db.ts` + `chat-store.ts` — a single test would have caught the broken composite keyPath (finding above).
- `lib/nairibook/chunking.ts` — overlap offset correctness (bug above).
- `lib/nairibook/embeddings.ts` — batch row slicing and WebGPU→WASM fallback.
- `lib/nairibook/concepts.ts`, `graph.ts`, `srs.ts`, `gamification.ts`, `pipeline.ts`, `opfs.ts`, `store.ts` — no tests at all.
- `lib/nairibook/zen.ts` / `photo-check.ts` — model fallback and error paths untested.
- `lib/learn/quizzes.ts`, `ai-mentors.ts`, `achievements.ts`, `progress-tracker.ts` — none (RLS regressions went undetected).
- API routes: `upload`, `chat`, `generate`, `sources`, `notebooks`, `knowledge/*` — no route tests.
- e2e: notebooks CRUD + source upload, RAG chat persistence, quiz attempt, skill tree, mentor chat — all untested.

---

## Quick wins

1. **Restore RAG chat persistence:** change `db.ts:47-48` keyPath to `"notebookId"` (single record per notebook). Unblocks findings 3, 9, 10.
2. **Fix the `"assitant"` typo** in `app/api/nairi-chat/route.ts:113`.
3. **Re-enable achievements:** add `WITH CHECK (auth.uid() = user_id)` for `user_achievements` INSERT or grant via service role, and check insert errors in `achievements.ts`.
4. **Fix chunk overlap offsets** in `lib/nairibook/chunking.ts:45-49` (capture `prevLen` before slicing).
5. **Fix skill tree query:** `skills(*)` + `is_public` in `app/learn/skill-tree/page.tsx`; align `SkillTreeView` with real `user_skills` columns or remove the feature.
6. **Cap LLM context + rate limit** chat/generate routes (single total limit, e.g., 60k chars; reuse the existing per-IP limiter keyed by user id).
7. **Remove hardcoded `is_free: true`** in the courses page or select the real column.
8. **Embeddings:** wrap WebGPU init in try/catch with a WASM retry; delete the dead ternary and slice from `out.data` only.
9. **Fix concept-graph "never studied" stats** by iterating over concepts.
10. **Add `.eq("user_id", userId)`** to all `ai_mentors` updates and drop the double `decodeURIComponent` in the mentors domain page.
