# Chat Area Audit (CHAT)

Auditor: CHAT | Date: 2026-08-05 | Scope: `app/chat`, `app/api/chat/**`, `app/api/nairi-chat`, `app/api/nairi/chat`, `app/api/code-agent`, `components/chat/*`, `hooks/use-{nairi-chat,colab-chat,opencode*,toast,debounce,mobile}.ts`, `lib/chat/*`, `lib/colab/*`, `lib/opencode-*.ts`

## Summary (top 5 risks)

1. **CRITICAL — Chat completion endpoints are reachable without authentication.** `app/api/chat/route.ts:544` resolves `userId` but never enforces it (no `401`), and `/api/chat/colab` (route.ts:24), `/api/nairi-chat` (route.ts:26) and `/api/nairi/chat` (route.ts:28) have no auth at all. Anyone can burn the paid Colab/OpenCode/Nairi backends anonymously (rate limit only, and the limit is spoofable, see risk 5). `/api/chat/colab` additionally accepts a client-supplied `system` role (toColabMessages, colab/route.ts:18) so an anonymous caller can inject a system prompt and bypass backend guardrails.
2. **HIGH — Stored XSS in chat rendering.** `components/chat/artifacts.tsx:82` renders model-produced SVG via `dangerouslySetInnerHTML` (SVG `onload`/event-handler attributes execute on insertion), and `components/chat/chat-interface.tsx:190` builds `<a href>` from markdown links with no scheme allowlist (`[x](javascript:alert(1))` executes on click). Both inputs trace to model output and to public shared-conversation content.
3. **HIGH — Backend selection and "comparison" are misleading/broken.** `lib/chat/model-comparison.ts:28-36` ignores the user-selected `provider`/`model` entirely — all N models are sent to the same `generateWithFallback`, so "compare models" returns N copies of one answer. In `app/api/chat/route.ts:19-21,1330`, `OPENCODE_API_URL` shadows a working `NAIRI_AI_BASE_URL` and explicit OpenCode errors return 502 instead of falling through, while colab/ollama require `!NAIRI_AI_BASE_URL` — inconsistent precedence that makes a stale env var break chat.
4. **HIGH — OpenCode agent runs with all permissions pre-approved.** `hooks/use-opencode.ts:56-69` defaults `bash/edit/write/webfetch/websearch` to `"allow"`, and `hooks/use-opencode-events.ts:45` opens unauthenticated SSE to `OPENCODE_API_URL` (default `http://localhost:4096`, `lib/opencode-client.ts:6`). A prompt-injected chat message can make the agent execute arbitrary shell/file operations without any user approval.
5. **HIGH — Share/export/upload features are broken or unsafe.** `lib/features/chat/index.ts:155` generates share URLs to `/share/chat/<slug>` — no such page exists (only the API route), and RLS (`001_enable_rls_all_tables.sql:109-126`) requires `auth.uid() = user_id`, so `/api/chat/shared/[slug]` 404s for anonymous visitors; the whole feature is dead. `app/api/upload/route.ts:67` inserts the raw user-controlled `file.name` into the storage key (path traversal), and `app/api/chat/export/route.ts:64,86,105` interpolates the unescaped conversation title into `Content-Disposition` (CRLF in a title → 500; quote chars corrupt the header).

## Findings

| file:line | Severity | Issue | Suggested fix |
|---|---|---|---|
| app/api/chat/route.ts:544 | CRITICAL | `userId` resolved but never checked; unauthenticated requests get streamed LLM responses (anon abuse of paid backends). | Add `if (!userId) return 401` right after resolving the session. |
| app/api/chat/colab/route.ts:18,24 | HIGH | No auth; anonymous proxy to Colab backend; client-supplied `role:"system"` passes through unchanged → guardrail bypass. | Require auth + strip/normalize `system` role server-side. |
| app/api/nairi-chat/route.ts:26,56 | HIGH | No auth; IP rate limit only; creates a fresh OpenCode session per request (session leak, no cleanup) and no Nairi identity prompt. | Require auth; reuse/cleanup sessions; inject identity prompt. |
| app/api/nairi/chat/route.ts:28 | HIGH | No auth and no rate limit; public proxy to external Nairi HF Space. | Add auth + rate limiting; cap body size. |
| components/chat/artifacts.tsx:82 | HIGH | SVG rendered via `dangerouslySetInnerHTML`; event-handler attributes execute (DOM XSS) from model/shared content. | Never inject raw SVG; parse/sanitize or render as `<img src="data:...">`. |
| components/chat/chat-interface.tsx:190 (and 175) | HIGH | Markdown link/image URLs not scheme-filtered; `javascript:` hrefs execute on click; `img` can hit arbitrary URLs. | Allowlist `http/https/mailto`; reject `javascript:`/`data:`. |
| lib/chat/model-comparison.ts:28-36 | HIGH | `provider`/`model` params ignored; every entry goes to the same `generateWithFallback` — feature returns identical answers. | Route each model through the real provider/model selection. |
| lib/features/chat/index.ts:155 | HIGH | Share URL points to `/share/chat/[slug]`; no page exists and RLS blocks anonymous reads → share feature 404s. | Add a public page + anon RLS policy keyed on `shared_slug`, or remove the feature. |
| lib/chat/multimodal.ts:79 | MEDIUM | `fileExt` taken from unsanitized `file.name` and embedded in the storage key (traversal/overwrite risk). | Sanitize extension; use UUID-based keys only. |
| app/api/upload/route.ts:67 | MEDIUM | Same pattern: raw `file.name` appended to the Supabase storage path. | Sanitize filename / use random keys. |
| app/api/chat/export/route.ts:64,86,105 | MEDIUM | Unescaped conversation title in `Content-Disposition`; CRLF or quotes in title → 500 / broken header. | Sanitize (`replace(/["\r\n]/g,'')`) and truncate. |
| app/api/chat/export/route.ts:91-108 | LOW | `format=pdf` silently returns markdown with `.md` extension. | Implement PDF or return a clear 400. |
| app/api/chat/conversations/route.ts:80-82 | MEDIUM | `folder_id` from body accepted without verifying the folder belongs to the user. | Validate folder ownership before insert. |
| app/api/chat/conversations/[conversationId]/route.ts:20-22 | LOW | `clientForConversation()` is a stub returning null; dead bypass/admin code + unused `createAdminClient` import. | Delete the stub and imports. |
| app/api/chat/search/route.ts:36,25 | LOW | Raw query interpolation into `.or()`, un-clamped `limit` (NaN), unbounded `%` wildcards. | Clamp limit; validate query length; drop `id.ilike`. |
| app/api/chat/share/route.ts:14 | LOW | `expiresInHours` unvalidated (negative/absurd values accepted). | Clamp to 1-720h. |
| lib/features/chat/index.ts:144 | LOW | Share slug generated with `Math.random()` (predictable, not CSPRNG). | Use `crypto.randomUUID()`. |
| app/api/code-agent/route.ts:4 | MEDIUM | Imports `checkRateLimit/getClientIdentifier/RATE_LIMITS` but never calls them; unlimited paid code-gen per user. | Add rate limiting; drop dead imports. |
| app/api/code-agent/route.ts:89 | LOW | No size validation, `filterInput`, or `detectPromptInjection` on prompt (inconsistent with /api/chat). | Reuse request-validator + content filters. |
| app/api/chat/route.ts:84-98 | MEDIUM | `shouldRefuse` = 3 narrow regexes, applied only to the last user message; trivially bypassed (obfuscation, older messages in history). | Check all user messages; rely on model-level refusal + hardened system prompt. |
| app/api/chat/route.ts:560-584 | MEDIUM | Injection/filter checks only on `lastUserMessage`; full history (including prior injected content) is sent to the model. | Scan every user message in history. |
| app/api/chat/route.ts:1330-1337 | MEDIUM | OpenCode wins whenever `OPENCODE_API_URL` is set, even with a healthy `NAIRI_AI_BASE_URL`; explicit 502s don't fall through to the direct path. | Reorder precedence + let OpenCode failures fall through consistently. |
| app/api/chat/route.ts:1436 | MEDIUM | OpenCode message timeout 300s > route `maxDuration` 180s; platform kills route before the backend replies. | Lower timeout to <180s and match route limits. |
| app/api/chat/route.ts:1428-1434 | MEDIUM | Nairi identity prompt is prepended to the user text in the same message part; user text can steer/override it. | Send identity as a separate system message; delimit user input. |
| app/api/chat/route.ts:1395-1409 | LOW | Stale-session cleanup selects/deletes by `opencode_session_last_used` only (no explicit user filter, relies on RLS), may kill sessions still in use. | Filter by `user_id` and active window. |
| app/api/chat/route.ts:551 | LOW | `useStreaming` computed, never used (all paths return streaming). | Remove or implement non-streaming path. |
| app/api/chat/route.ts:1225 | MEDIUM | `truncateMessages(…, 20, 80_000)` applies one size regardless of target model context (small local Ollama models overrun). | Pass the routed model's context limit. |
| app/api/chat/route.ts:1199-1213 | LOW | Message insert + `conversations.update` without explicit `.eq("user_id", userId)`; RLS covers it, but failures are silent. | Add ownership filters; check insert error. |
| lib/colab/mutex.ts:8-20 | MEDIUM | Single in-process mutex serializes ALL Colab chat; one slow request (60s timeout) blocks every user → availability DoS. | Per-user/per-conversation keying or queue limit. |
| lib/rate-limit.ts:86-101 | MEDIUM | `getClientIdentifier` trusts client-supplied `x-forwarded-for`/`x-real-ip` → rate-limit bypass when not behind a trusted proxy. | Use trusted proxy config or bind on `req.socket` remote address. |
| lib/ai/groq-direct.ts:93-115 | MEDIUM | Router fallback fabricates a `streamText`-like object with an empty `toDataStream()` → silent empty responses via `streamChatWithFallback`. | Return real UIMessage stream; keep `toDataStream` functional. |
| lib/chat/context-manager.ts:151-163 | LOW | `importContext` parses JSON then does nothing (stub); `generateSummary` is a placeholder despite "summarizes old messages" contract. | Implement or remove; document the placeholder. |
| lib/chat/multimodal.ts:104-133 | LOW | `handleImageInput`/`handleVoiceInput`/`processInput` are stubs ("In production, would …"). | Implement transcription/analysis or remove. |
| hooks/use-opencode.ts:56-69 | HIGH | Default permissions grant `bash/edit/write/…` `"allow"` with no approval gate; injected prompts can run commands. | Default to `"ask"`; gate destructive tools. |
| hooks/use-opencode-events.ts:45 + lib/opencode-client.ts:6 | MEDIUM | Browser EventSource to `OPENCODE_API_URL` (default localhost:4096) without auth/origin check. | Require auth token; validate origin. |
| hooks/use-nairi-chat.ts:74-75,208 | LOW | `activity`/`sessionId` never set; dead TODO referencing deleted `/api/opencode-events`. | Remove dead state or wire the events endpoint. |
| app/api/chat/upload/route.ts:47 | MEDIUM | Client-controlled `file.type` (MIME) trusted without content sniffing; route appears unused by chat UI (which posts to `/api/upload`). | Sniff magic bytes; unify with `/api/upload` or delete. |
| app/api/chat/route.ts:598-610 | LOW | Internal video/image fetches forward raw `Cookie` and have no timeout; failure falls through inconsistently. | Re-auth internally or use server service role; add timeout. |
| lib/ai/model-router.ts:17-35 | LOW | `routeForChat` ignores preference and always returns the same provider/model; result only feeds trace bookkeeping. | Wire real routing or remove. |

## Test gaps

- **No unit tests for any `app/api/chat/**` route.** Add to `__tests__/api/chat/`: `conversations/route.test.ts` (401 anon, folder ownership), `conversations/[conversationId]/route.test.ts` (403/404 on other user's conversation for GET/PATCH/DELETE), `history/route.test.ts`, `search/route.test.ts` (ownership scope + wildcard abuse), `export/route.test.ts` (header injection with `\r\n`/quote titles), `colab/route.test.ts` (auth required, system-role stripping), `nairi-chat/route.test.ts` (auth, history typo), `code-agent/route.test.ts` (rate limit).
- **Main `/api/chat` auth regression test**: `__tests__/api/chat/route.test.ts` must assert unauthenticated POST → 401 (currently the integration test passes only because an empty body returns 400, masking the missing auth check).
- **`lib/chat/model-comparison.ts`**: `__tests__/lib/chat/model-comparison.test.ts` should assert each requested model is actually routed (currently returns identical answers for different models).
- **`lib/colab/*`**: `__tests__/unit/lib/colab/mutex.test.ts` (serialization/availability), `client.test.ts` (fallback message + validation).
- **`lib/chat/context-manager.ts`**: `__tests__/lib/chat/context-manager.test.ts` (truncation threshold, summary placeholder, `importContext` no-op).
- **XSS regression**: `__tests__/unit/components/chat/artifacts.test.tsx` (SVG `onload` not executed) and chat-interface markdown renderer test (javascript:/data: hrefs rejected).
- **Rate-limit spoofing**: `__tests__/unit/lib/rate-limit.test.ts` add case for spoofed `x-forwarded-for`.
- **`lib/ai/context-window.ts`** truncation boundaries currently untested; add `__tests__/unit/lib/ai/context-window.test.ts`.

## Quick wins

1. Require auth on the 4 chat completion routes (`/api/chat`, `/api/chat/colab`, `/api/nairi-chat`, `/api/nairi/chat`) — one guard, biggest exposure reduction.
2. Scheme-allowlist `href`/`src` in `chat-interface.tsx:190` and replace SVG `dangerouslySetInnerHTML` in `artifacts.tsx:82` — closes both stored-XSS paths.
3. Fix `lib/features/chat/index.ts:155` share URL (add the page or remove the feature) and swap `Math.random()` slug for `crypto.randomUUID()`.
4. Sanitize upload filenames in `app/api/upload/route.ts:67` and `lib/chat/multimodal.ts:79` (UUID keys).
5. Add `.eq("user_id", userId)` to `conversations.update` in `app/api/chat/route.ts:1208` and verify insert errors.
6. Make OpenCode backend precedence consistent and timeout-aware (`app/api/chat/route.ts:1330,1436`); default `hooks/use-opencode.ts` permissions to `"ask"`.
7. Remove the `"assitant"` typo filter at `app/api/nairi-chat/route.ts:113` so assistant history survives.
