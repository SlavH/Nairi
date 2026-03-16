# Nairi HF Space Integration

## Overview

When `NAIRI_AI_BASE_URL` is set in `.env`, the chat UI uses the Nairi Hugging Face Space backend. The backend has its own system prompt (Nairi / Наири / Նաիրի); the client does **not** send a system prompt.

- **Health**: `GET {BASE_URL}/health` → `{ "status": "ok", "name": "Nairi", "model": "qwen2-0.5b-instruct" }`
- **Chat**: `POST {BASE_URL}/chat` with `{ "messages": [...], "max_tokens": 200 }` → `{ "response": "...", "latency_sec": 1.234 }`

## Configuration

### Base URL

In `.env` (or `.env.local`):

```env
NAIRI_AI_BASE_URL=https://slavnairi-nairi-generation.hf.space
```

- Use the **base URL only** (no `/health` or `/chat`).
- To switch to a VPS later, change this URL only.

### Testing

1. Set `NAIRI_AI_BASE_URL` in `.env`.
2. Restart the Next.js dev server.
3. Open a chat conversation (e.g. `/chat/[id]`). The app will call `GET /api/nairi/config`; if Nairi is enabled, the Nairi chat view is shown.
4. Send a message: the client runs a health check, then `POST /api/nairi/chat` (proxied to the HF Space).

## File Structure

```
lib/
  nairi-api/
    config.ts          # NAIRI_AI_BASE_URL, timeouts, paths
    types.ts           # NairiMessage, NairiHealthResponse, NairiChatResponse, validators
    index.ts
  searxng.ts          # SearXNG search + 30min in-memory cache (web context for nairi-chat)
  hf-client.ts        # HF health + chat (wake-up retries, empty-response retry)
  rate-limit.ts       # Per-IP rate limit (used by /api/nairi-chat)
  api/
    nairi-client.ts   # Browser API: healthCheck(), sendNairiChat(messages, maxTokens)

app/api/nairi/
  config/route.ts     # GET – { enabled: boolean }
  health/route.ts     # GET – proxy to BASE/health, 5s timeout
  chat/route.ts       # POST – proxy to BASE/chat, strip system messages, 60s timeout
app/api/
  nairi-chat/route.ts # POST – SearXNG search → WEB_CONTEXT → 2-pass HF (PLAN → FINAL), sources + meta

hooks/
  use-nairi-chat.ts   # useNairiChat(): messages, connectionState (searching_web, generating), sendMessage, retry

components/chat/
  nairi-chat-view.tsx # Nairi chat UI (status, messages, sources, input, latency, retry)
  chat-page-client.tsx # Fetches config, renders NairiChatView or ChatInterface
```

## Behavior

1. **Config**  
   `GET /api/nairi/config` returns `{ enabled: true }` when `NAIRI_AI_BASE_URL` is set. The chat page uses this to show the Nairi chat view.

2. **Health before chat**  
   Before each send, the client calls `healthCheck()` (GET /api/nairi/health → proxy to HF /health). If it fails (e.g. Space sleeping), the UI shows “Waking up Nairi…” and retries health up to **2 times** with backoff **3s, 6s**.

3. **Chat retry**  
   If `POST /api/nairi/chat` fails, the client retries **once** after **2s**.

4. **Concurrency**  
   Only one send is allowed at a time; the Send button is disabled while a request is in flight.

5. **No system prompt from client**  
   The server proxy in `app/api/nairi/chat/route.ts` maps incoming messages to `user` or `assistant` only; system messages are not sent to the backend.

6. **History**  
   The last **20** messages (user + assistant) are sent in each request; older messages are trimmed.

7. **Validation**  
   Response must have a non-empty `response` string; otherwise a fallback message is shown.

8. **Connection states**  
   - **Online** – health ok  
   - **Waking up Nairi…** – health failing, retrying with backoff  
   - **Searching web…** – waiting for SearXNG (first ~2s of request)  
   - **Generating…** – HF 2-pass in flight  
   - **Connection error** – health or chat failed after retries  

9. **Latency**  
   When the backend returns `latency_sec`, it is shown in small grey text under the assistant message.

10. **Errors**  
    On error, the last assistant bubble shows the error message and a **Retry** button that resends the last user message.

## Web-grounded chat (POST /api/nairi-chat)

When Nairi chat is enabled, the frontend calls **POST /api/nairi-chat** (not the HF Space directly). The proxy:

1. Runs **web search** via **SearXNG Space** for the latest user message: `GET {SEARXNG_BASE_URL}/search?q=...&format=json&language=en` (top 3 results, 10–12s timeout). Results are cached in-memory for 30 minutes.
2. Builds **WEB_CONTEXT** (or "WEB_CONTEXT unavailable (search failed)." if search fails) and runs a **2-pass** HF pipeline: PLAN (max 160 tokens) → FINAL (max 400 tokens).
3. Returns `{ response, sources, meta }`. **Rate limit**: 10 requests/minute per IP.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NAIRI_HF_BASE_URL` | Yes (for Nairi chat) | HF Qwen Space base URL (e.g. `https://slavnairi-nairi-generation.hf.space`). Fallback: `NAIRI_AI_BASE_URL`. |
| `SEARXNG_BASE_URL` | Yes (for web context) | SearXNG Space base URL (e.g. `https://your-searxng-space.hf.space`). No trailing slash. If missing or search fails, WEB_CONTEXT is "unavailable (search failed)." |

### How to set and test locally

1. **.env** (or .env.local):
   ```env
   NAIRI_HF_BASE_URL=https://slavnairi-nairi-generation.hf.space
   SEARXNG_BASE_URL=https://your-searxng-space.hf.space
   ```

2. Restart the dev server: `npm run dev`.

3. Open a chat conversation. Send a message: you should see "Searching web…" then "Generating…", then the reply with a **Sources** list under the assistant message (if SearXNG returned results). Citations [1], [2], [3] in the text stay as plain text; source links open in a new tab.

4. Without `SEARXNG_BASE_URL` or if search fails: chat still runs; WEB_CONTEXT is "WEB_CONTEXT unavailable (search failed)." and `sources` is empty.

## Security / Validation

- Response shape is validated with `isNairiChatResponse()` / `isNairiHealthResponse()` before use.
- Empty `response` is replaced by a fallback message.
- No sensitive data in logs; keep logging minimal.
- Rate limit: 10 req/min per IP for `/api/nairi-chat`.
