/**
 * Nairi HF Router – server-side client for async job-based generation.
 * POST /generate → job_id → poll /status → GET /result when completed.
 * Handles HF Space cold start with retries and exponential backoff.
 */

import type {
  NairiRouterGenerationType,
  NairiRouterGenerateResponse,
  NairiRouterStatusResponse,
  NairiRouterResultResponse,
} from "@/lib/nairi-api/types"
import {
  isNairiRouterGenerateResponse,
  isNairiRouterStatusResponse,
} from "@/lib/nairi-api/types"

const ROUTER_BASE = (process.env.NAIRI_ROUTER_BASE_URL ?? "").trim().replace(/\/+$/, "")
const GENERATE_TIMEOUT_MS = 60_000
const STATUS_RESULT_TIMEOUT_MS = 15_000
const POLL_INTERVAL_MS = 2_500
const POLL_MAX_ATTEMPTS = 60
const GENERATE_RETRIES = 3
const GENERATE_BACKOFF_MS = [5_000, 15_000, 30_000]
const STATUS_RETRIES = 2

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (e) {
    clearTimeout(id)
    throw e
  }
}

export function isRouterConfigured(): boolean {
  return ROUTER_BASE.length > 0
}

/**
 * POST /generate. Retries on 5xx/408/429/timeout/network with exponential backoff.
 */
export async function generate(
  type: NairiRouterGenerationType,
  prompt: string,
  options?: Record<string, unknown>
): Promise<NairiRouterGenerateResponse> {
  if (!ROUTER_BASE) throw new Error("NAIRI_ROUTER_BASE_URL is not set")
  const url = `${ROUTER_BASE}/generate`
  const body = JSON.stringify({ type, prompt, options: options ?? {} })
  let lastErr: Error | null = null
  for (let attempt = 0; attempt < GENERATE_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
        GENERATE_TIMEOUT_MS
      )
      const data: unknown = await res.json().catch(() => null)
      if (!res.ok) {
        if (isRetryableStatus(res.status) && attempt < GENERATE_RETRIES - 1) {
          lastErr = new Error((data as { detail?: string })?.detail ?? res.statusText ?? "Generate failed")
          await new Promise((r) => setTimeout(r, GENERATE_BACKOFF_MS[attempt]))
          continue
        }
        throw new Error((data as { detail?: string })?.detail ?? res.statusText ?? "Generate failed")
      }
      if (!isNairiRouterGenerateResponse(data)) {
        throw new Error("Invalid generate response shape")
      }
      return data
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e))
      const isRetryable =
        (e instanceof TypeError && e.message === "fetch failed") ||
        (e instanceof Error && e.name === "AbortError")
      if (isRetryable && attempt < GENERATE_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, GENERATE_BACKOFF_MS[attempt]))
        continue
      }
      throw lastErr
    }
  }
  throw lastErr ?? new Error("Generate failed after retries")
}

/**
 * GET /status/{job_id}. Retry once on timeout/network.
 */
export async function checkStatus(jobId: string): Promise<NairiRouterStatusResponse> {
  if (!ROUTER_BASE) throw new Error("NAIRI_ROUTER_BASE_URL is not set")
  const url = `${ROUTER_BASE}/status/${encodeURIComponent(jobId)}`
  let lastErr: Error | null = null
  for (let attempt = 0; attempt <= STATUS_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url,
        { method: "GET" },
        STATUS_RESULT_TIMEOUT_MS
      )
      const data: unknown = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error((data as { detail?: string })?.detail ?? res.statusText ?? "Status check failed")
      }
      if (!isNairiRouterStatusResponse(data)) {
        throw new Error("Invalid status response shape")
      }
      return data
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e))
      if (attempt < STATUS_RETRIES) {
        await new Promise((r) => setTimeout(r, 2_000))
        continue
      }
      throw lastErr
    }
  }
  throw lastErr ?? new Error("Status check failed")
}

/**
 * GET /result/{job_id}. Call when status is "completed".
 * Accepts multiple response shapes: result, output, data, content, text, or full body.
 */
export async function getResult(jobId: string): Promise<NairiRouterResultResponse> {
  if (!ROUTER_BASE) throw new Error("NAIRI_ROUTER_BASE_URL is not set")
  const url = `${ROUTER_BASE}/result/${encodeURIComponent(jobId)}`
  const res = await fetchWithTimeout(url, { method: "GET" }, STATUS_RESULT_TIMEOUT_MS)
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data as { detail?: string })?.detail ?? res.statusText ?? "Get result failed")
  }
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid result response shape")
  }
  const obj = data as Record<string, unknown>
  const result =
    obj.result ??
    obj.output ??
    obj.data ??
    obj.content ??
    obj.text ??
    obj
  return {
    job_id: typeof obj.job_id === "string" ? obj.job_id : jobId,
    status: typeof obj.status === "string" ? obj.status : "completed",
    result,
  }
}

/**
 * Poll checkStatus until completed or failed, then return getResult or throw.
 * interval: default 2500 ms; maxAttempts: default 60.
 */
export async function pollForResult(
  jobId: string,
  intervalMs: number = POLL_INTERVAL_MS,
  maxAttempts: number = POLL_MAX_ATTEMPTS
): Promise<unknown> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkStatus(jobId)
    if (status.status === "completed") {
      const resultResponse = await getResult(jobId)
      return resultResponse.result
    }
    if (status.status === "failed") {
      throw new Error(`Job ${jobId} failed`)
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`Job ${jobId} did not complete within ${maxAttempts} attempts`)
}
