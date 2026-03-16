/**
 * GET /api/nairi/health – proxy to Nairi HF Space GET /health.
 * Timeout 5s. Used for wake-up and connection status.
 */

import { NextResponse } from "next/server"
import {
  getNairiHealthUrl,
  isNairiConfigured,
  NAIRI_HEALTH_TIMEOUT_MS,
} from "@/lib/nairi-api/config"
import { isNairiHealthResponse } from "@/lib/nairi-api/types"

export async function GET() {
  if (!isNairiConfigured()) {
    return NextResponse.json({ ok: false, reason: "NAIRI_AI_BASE_URL not set" }, { status: 503 })
  }
  const url = getNairiHealthUrl()
  if (!url) return NextResponse.json({ ok: false }, { status: 503 })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), NAIRI_HEALTH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal })
    clearTimeout(timeoutId)
    const data: unknown = await res.json().catch(() => null)
    const ok = res.ok && isNairiHealthResponse(data) && (data as { status: string }).status === "ok"
    return NextResponse.json({
      ok,
      status: isNairiHealthResponse(data) ? (data as { status: string }).status : undefined,
      name: isNairiHealthResponse(data) ? (data as { name?: string }).name : undefined,
      model: isNairiHealthResponse(data) ? (data as { model?: string }).model : undefined,
    })
  } catch {
    clearTimeout(timeoutId)
    return NextResponse.json({ ok: false }, { status: 503 })
  }
}
