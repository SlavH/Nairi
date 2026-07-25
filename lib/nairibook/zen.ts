// NairiBook Zen client. Mirrors the existing `callZenAPI` pattern
// (lib/opencode-wasm-bridge.ts) but adds structured-output (JSON schema) so
// concept/graph results parse reliably instead of via fragile regex.
//
// Endpoint: https://opencode.ai/zen/v1/chat/completions  (OpenAI-compatible)
// Auth: "Bearer public" for free models; a user-supplied BYOK key is used when
// present in localStorage["opencode-config"].apiKey (set via Settings).

const ZEN_URL = "https://opencode.ai/zen/v1/chat/completions"
const DEFAULT_MODEL = "big-pickle"

// Free-tier models that accept `Bearer public` AND are multimodal (vision).
// These are tried in order for photo/diagram checking before falling back to a
// BYOK prompt. Paid models (claude-*, gemini-*, gpt-*) require a user key.
// Order = best free vision candidate first.
export const VISION_FREE_MODELS = [
  "deepseek-v4-flash-free",
  "nemotron-3-ultra-free",
  "mimo-v2.5-free",
  "hy3-free",
] as const

// Error thrown when no free vision model is usable (all need a key or are down).
export class VisionUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "VisionUnavailableError"
  }
}

function getApiKey(): string {
  try {
    const raw = localStorage.getItem("opencode-config")
    if (raw) {
      const cfg = JSON.parse(raw)
      if (cfg?.apiKey) return cfg.apiKey
    }
  } catch {
    /* ignore */
  }
  return "public"
}

// Build a user message, optionally attaching base64 images as image_url parts
// for vision-capable models. Text-only when no images are provided.
function buildUserMessage(prompt: string, images?: string[]): ZenMessage {
  if (!images || images.length === 0) return { role: "user", content: prompt }
  const parts: ZenContentPart[] = [{ type: "text", text: prompt }]
  for (const url of images) parts.push({ type: "image_url", image_url: { url } })
  return { role: "user", content: parts }
}

export interface ZenContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: { url: string }
}

export interface ZenMessage {
  role: "system" | "user" | "assistant"
  content: string | ZenContentPart[]
}

export interface ZenOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  // When true, send response_format json_schema with the provided schema.
  schema?: {
    name: string
    schema: Record<string, unknown>
  }
  signal?: AbortSignal
  // Multi-turn conversation. When provided, it overrides the single `prompt`
  // message (used by the Socratic tutor for ongoing dialogue).
  messages?: ZenMessage[]
  // Base64 data-URL images (e.g. photo of a handwritten solution) for vision
  // models. Appended as image_url content parts to the user message.
  images?: string[]
}

// removed isVisionError (dead code after migrating to LimitCard)

async function tryModel(model: string, prompt: string, opts: ZenOptions): Promise<ZenResult> {
  const apiKey = getApiKey()
  const userMessage = buildUserMessage(prompt, opts.images)
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages && opts.messages.length > 0 ? opts.messages : [userMessage],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 2048,
  }
  if (opts.schema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: opts.schema.name, strict: true, schema: opts.schema.schema },
    }
  }
  const res = await fetch(ZEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: opts.signal,
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Zen API ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ""
  let parsed: unknown
  if (opts.schema) parsed = tryParseJson(content) ?? undefined
  return { content, parsed }
}

// Vision call that tries the free multimodal models in order. If an explicit
// model is provided it is used directly. If none of the free models work
// (auth/usage/unsupported), throws VisionUnavailableError so the UI can prompt
// for a BYOK key to a paid vision model (Claude/Gemini/GPT-5).
export async function callZenVision(prompt: string, opts: ZenOptions = {}): Promise<ZenResult> {
  const models = opts.model ? [opts.model] : VISION_FREE_MODELS
  let lastErr: unknown
  for (const m of models) {
    try {
      return await tryModel(m, prompt, opts)
    } catch (e) {
      lastErr = e
      const msg = e instanceof Error ? e.message : String(e)
      // Auth errors mean this model needs a key — stop trying others.
      if (/missing api key|auth/i.test(msg)) break
      // Otherwise (rate limit / transient) try the next free model.
    }
  }
  throw new VisionUnavailableError(
    lastErr instanceof Error ? lastErr.message : "No free vision model available."
  )
}

export interface ZenResult {
  content: string
  parsed?: unknown
}

export async function callZen(prompt: string, opts: ZenOptions = {}): Promise<ZenResult> {
  const apiKey = getApiKey()
  const model = (opts.model || DEFAULT_MODEL).replace(/^opencode\//, "")
  const userMessage = buildUserMessage(prompt, opts.images)
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages && opts.messages.length > 0 ? opts.messages : [userMessage],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 2048,
  }
  if (opts.schema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: opts.schema.name, strict: true, schema: opts.schema.schema },
    }
  }

  const res = await fetch(ZEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: opts.signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Zen API ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ""

  let parsed: unknown
  if (opts.schema) {
    parsed = tryParseJson(content) ?? undefined
  }
  return { content, parsed }
}

// Build the request body shared by callZen and streamZen.
function buildBody(prompt: string, opts: ZenOptions, stream: boolean): Record<string, unknown> {
  const model = (opts.model || DEFAULT_MODEL).replace(/^opencode\//, "")
  const userMessage = buildUserMessage(prompt, opts.images)
  const body: Record<string, unknown> = {
    model,
    stream,
    messages: opts.messages && opts.messages.length > 0 ? opts.messages : [userMessage],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 2048,
  }
  if (opts.schema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: opts.schema.name, strict: true, schema: opts.schema.schema },
    }
  }
  return body
}

// Streaming variant. Yields text deltas as they arrive. OpenAI-compatible SSE:
// lines of `data: {json}` ending with `data: [DONE]`. If the endpoint does not
// stream (returns plain JSON), we fall back to yielding the full content once.
export async function* streamZen(
  prompt: string,
  opts: ZenOptions = {}
): AsyncGenerator<string, void, unknown> {
  const apiKey = getApiKey()
  const body = buildBody(prompt, opts, true)

  const res = await fetch(ZEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: opts.signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Zen API ${res.status}: ${errText.slice(0, 200)}`)
  }

  const ct = res.headers.get("content-type") ?? ""
  if (!res.body || !ct.includes("text/event-stream")) {
    // Non-streaming fallback: parse the JSON response and yield it whole.
    const data = await res.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ""
    if (content) yield content
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const payload = trimmed.slice(5).trim()
      if (payload === "[DONE]") return
      try {
        const json = JSON.parse(payload)
        const delta: string = json?.choices?.[0]?.delta?.content ?? ""
        if (delta) yield delta
      } catch {
        /* ignore malformed keep-alive lines */
      }
    }
  }
}

// Best-effort JSON extraction: the model may wrap JSON in markdown fences or
// add prose. This is the safety net if response_format is ignored.
export function tryParseJson(text: string): unknown | null {
  if (!text) return null
  const trimmed = text.trim()
  // Direct JSON
  try {
    return JSON.parse(trimmed)
  } catch {
    /* continue */
  }
  // Strip markdown fences
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim())
    } catch {
      /* continue */
    }
  }
  // First balanced {...} or [...]
  const objMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0])
    } catch {
      /* continue */
    }
  }
  const arrMatch = trimmed.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0])
    } catch {
      /* ignore */
    }
  }
  return null
}
