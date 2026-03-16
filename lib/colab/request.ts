/**
 * Request wrapper: timeout, retries, and abort support.
 * Used by the Colab chat client only. No backend logic changes.
 */

import {
  COLAB_REQUEST_TIMEOUT_MS,
  COLAB_MAX_RETRIES,
} from "./config"

export type RequestInitWithSignal = RequestInit & { signal?: AbortSignal }

function isRetryable(status: number): boolean {
  return status >= 500 || status === 408 || status === 429
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError && (error as Error).message?.includes("fetch")) return true
  if (error instanceof Error) {
    const m = error.message.toLowerCase()
    return m.includes("network") || m.includes("timeout") || m.includes("abort") || m.includes("econnreset")
  }
  return false
}

/** Create abort signal that fires after timeout or when user signal aborts. Clears timeout on teardown. */
function withTimeout(
  userSignal: AbortSignal | undefined,
  timeoutMs: number
): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  const clear = () => clearTimeout(id)
  if (userSignal?.aborted) {
    clear()
    controller.abort()
    return { signal: controller.signal, clear }
  }
  if (userSignal) {
    userSignal.addEventListener("abort", () => {
      clear()
      controller.abort()
    })
  }
  return { signal: controller.signal, clear }
}

/**
 * Execute a request with timeout and up to COLAB_MAX_RETRIES retries on retryable errors.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInitWithSignal,
  options: { timeoutMs?: number; maxRetries?: number } = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? COLAB_REQUEST_TIMEOUT_MS
  const maxRetries = options.maxRetries ?? COLAB_MAX_RETRIES
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { signal, clear } = withTimeout(init.signal, timeoutMs)
    try {
      const res = await fetch(url, { ...init, signal })
      clear()
      if (res.ok) return res
      if (attempt < maxRetries && isRetryable(res.status)) {
        lastError = new Error(`Colab returned ${res.status}`)
        continue
      }
      throw new Error(`Colab returned ${res.status}: ${res.statusText}`)
    } catch (err) {
      clear()
      lastError = err
      if (attempt < maxRetries && isRetryableError(err)) continue
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`)
      }
      throw err
    }
  }
  throw lastError
}
