# Colab AI Backend – Integration Guide

## Backend architecture (your Colab server)

- **Stack**: FastAPI, Qwen2-0.5B-Instruct, public URL via ngrok.
- **Single endpoint**: `POST /chat`
- **Request body**:
  ```json
  {
    "messages": [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "..." }
    ],
    "max_tokens": 300
  }
  ```
- **Response**:
  ```json
  { "response": "model reply text" }
  ```
- **Behaviour**: Model loaded once at startup; no streaming (full response only); no auth or rate limiting.

### Constraints

| Constraint | Implication |
|-----------|-------------|
| Runs in Google Colab | Session and URL can change on restart. |
| Public URL changes on restart | Frontend/config must support updating base URL (e.g. in `.env`). |
| Not production-grade | No HA, no scaling; suitable for dev/demo. |
| Cannot handle heavy parallel traffic | Integration layer sends one request at a time (mutex). |
| Latency ~1–3 s (GPU) / ~5–10 s (CPU) | Timeout and loading UX must account for this. |
| No streaming | Client receives full response only. |
| No auth / no rate limiting | Add on backend or via Nairi proxy when moving to production. |

---

## Frontend integration layer (Nairi)

### Design goals

1. Send chat messages in the Colab format (`messages` + `max_tokens`).
2. Handle errors: timeout, server down, 5xx, network.
3. Support URL changes (server restarts): base URL in env, no hardcoding.
4. Support conversation history (full message list sent each time).
5. Prevent multiple parallel requests (single-flight).
6. Clear loading and fallback when backend is unavailable.

### Project structure

```
lib/colab/                    # Colab backend client (server-side)
  config.ts                   # COLAB_AI_BASE_URL, timeouts, retries, paths
  types.ts                    # Colab request/response types + validation
  request.ts                  # fetchWithRetry (timeout, retries, abort)
  mutex.ts                    # in-flight lock (one request at a time)
  health.ts                   # GET /health check
  client.ts                   # colabChat(messages, options) – main API
  index.ts                    # re-exports

app/api/
  chat/colab/route.ts          # POST /api/chat/colab – proxy to Colab
  health/colab/route.ts        # GET /api/health/colab – health proxy

hooks/
  use-colab-chat.ts            # useColabChat() – state, send, loading, error
```

### Environment config

- **`COLAB_AI_BASE_URL`** (recommended): Base URL of the Colab backend, **without** `/chat`.
  - Example: `https://xxxx.ngrok.io`
  - After a Colab/ngrok restart, update this value.
- **`BITNET_BASE_URL`**: Fallback if `COLAB_AI_BASE_URL` is not set (same semantics: base URL only).
- **`AI_REQUEST_TIMEOUT`**: Request timeout in ms (default 30000).
- **`AI_MAX_RETRIES`**: Retries for timeout/5xx/network (default 2; total attempts = 1 + retries).

All Colab requests go to `{COLAB_AI_BASE_URL}/chat` and (optional) `{COLAB_AI_BASE_URL}/health`. Switching to a VPS later = change only the base URL (and optionally add auth/rate limiting on backend or proxy).

---

## Key code files

### 1. `lib/colab/config.ts`

- Reads `COLAB_AI_BASE_URL` or `BITNET_BASE_URL`, trims and strips trailing slashes.
- Exposes `getColabChatUrl()`, `getColabHealthUrl()`, `isColabConfigured()`.
- Defines `COLAB_REQUEST_TIMEOUT_MS`, `COLAB_MAX_RETRIES`, `COLAB_CHAT_PATH` (`/chat`), `COLAB_HEALTH_PATH` (`/health`).

### 2. `lib/colab/request.ts`

- **`fetchWithRetry(url, init, options)`**:
  - Applies timeout via `AbortController` (and optional caller `signal`).
  - On 5xx, 408, 429 or retryable network errors, retries up to `COLAB_MAX_RETRIES` times.
  - Throws on final failure or non-retryable error; timeout throws a clear message.

### 3. `lib/colab/mutex.ts`

- **`withMutex(fn)`**: Runs `fn` after any previous call finishes; blocks concurrent Colab requests.
- **`isRequestInFlight()`**: Returns whether a request is currently running.

### 4. `lib/colab/client.ts`

- **`colabChat(messages, options)`**:
  - If Colab is not configured, returns a fallback message (no throw).
  - Builds `POST {base}/chat` with `{ messages, max_tokens }`.
  - Uses `withMutex`, then `fetchWithRetry`, then validates body with `isColabChatResponse`.
  - Returns `{ text, fromFallback }`; on error or invalid shape returns fallback text.

### 5. `app/api/chat/colab/route.ts`

- **POST**: Body `{ messages, max_tokens? }`. Normalizes `messages` to `ColabMessage[]`, caps `max_tokens`, calls `colabChat()`, returns `{ response, fromFallback }` or 400/503 with error message.

### 6. `app/api/health/colab/route.ts`

- **GET**: Calls `checkColabHealth()` (GET `{base}/health`). Returns `{ ok: boolean }`; if not configured, returns `{ ok: false, reason: "COLAB_AI_BASE_URL not set" }`.

### 7. `hooks/use-colab-chat.ts`

- **`useColabChat({ maxTokens, initialMessages })`**:
  - State: `messages`, `isLoading`, `error`, `isAvailable`.
  - **`sendMessage(content)`**: Appends user message, sets loading, calls `POST /api/chat/colab` with full history (using a ref to avoid stale closure), appends assistant message or fallback, clears loading, sets error on failure.
  - Prevents sending when `isLoading` (no parallel requests from the hook).
  - **`checkHealth()`**: Fetches `GET /api/health/colab`, sets `isAvailable`.
  - **`clearError()`**: Resets `error`.

---

## Integration logic summary

| Concern | Implementation |
|--------|-----------------|
| Correct request format | `lib/colab/types` + `client.ts` send `{ messages, max_tokens }` to `POST /chat`. |
| Timeout | `request.ts`: `AbortController` + timeout; abort after `AI_REQUEST_TIMEOUT` ms. |
| Retries | `request.ts`: up to 2 retries on 5xx, 408, 429, and retryable network errors. |
| Health check | `health.ts` GET `/health`; `GET /api/health/colab` exposes it to the frontend. |
| Single flight | `mutex.ts`: `withMutex` in `colabChat` so only one Colab request at a time. |
| Response validation | `types.ts`: `isColabChatResponse(data)` ensures `response` is a string. |
| Fallback when unavailable | `client.ts`: missing config, request error, or invalid response → return fallback message instead of throwing (caller can check `fromFallback`). |
| URL changes (restarts) | Base URL only in env; no `/chat` or `/health` in env. Update `.env` when ngrok URL changes. |
| Conversation history | Caller (or hook) builds full `messages` array; API forwards it as-is to Colab. |

---

## Switching from Colab to VPS

1. **Same API contract**: Deploy a server that exposes `POST /chat` and optional `GET /health` with the same request/response shape. Set `COLAB_AI_BASE_URL` (or `BITNET_BASE_URL`) to the new base URL. No code changes in Nairi.
2. **If you add streaming later**: Introduce a new endpoint or adapter that returns a stream; the current Colab integration remains for the non-streaming path. Frontend can choose transport (e.g. `useColabChat` vs streaming `useChat`) based on config or feature flag.
3. **Production hardening** (on backend or Nairi proxy): Add authentication, rate limiting, and stable URLs; the integration layer (timeout, retry, mutex, validation, fallback) remains valid.

---

## What must change when moving to production

- **Backend**: Add auth (e.g. API key or JWT), rate limiting, and a stable URL (no ngrok rotation).
- **Nairi**: If the backend requires auth, add `COLAB_AI_API_KEY` (or similar) and send it in request headers from `lib/colab/client.ts`; do not expose secrets to the browser.
- **Availability**: Use a proper deployment (VPS/container) and health checks so the frontend and monitoring can rely on `GET /health`.
- **Rate limiting**: Either on the Colab/VPS server or in Nairi (e.g. in `app/api/chat/colab/route.ts`) before calling `colabChat`.
- **Observability**: Add logging and (optionally) metrics for Colab requests and errors in `lib/colab/client.ts` and the API route.

---

## Usage example (frontend)

```tsx
import { useColabChat } from "@/hooks/use-colab-chat"

function ColabChatUI() {
  const { messages, sendMessage, isLoading, error, clearError, isAvailable, checkHealth } = useColabChat({
    maxTokens: 300,
    initialMessages: [],
  })

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  return (
    <div>
      {isAvailable === false && <p>Colab backend unavailable. Update COLAB_AI_BASE_URL in .env.</p>}
      {error && <p>{error} <button onClick={clearError}>Dismiss</button></p>}
      {messages.map((m, i) => (
        <div key={i}><strong>{m.role}:</strong> {m.content}</div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
        <input disabled={isLoading} ... />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  )
}
```

No backend logic was modified; only the client-side architecture and integration layer were added.
