/**
 * GET /api/health/colab – health check for Colab backend.
 * Proxies to GET {COLAB_AI_BASE_URL}/health when configured.
 * Returns { ok: boolean } for easy frontend use.
 */

import { NextResponse } from "next/server"
import { checkColabHealth, isColabConfigured } from "@/lib/colab"

export async function GET() {
  if (!isColabConfigured()) {
    return NextResponse.json({ ok: false, reason: "COLAB_AI_BASE_URL not set" })
  }
  try {
    const ok = await checkColabHealth()
    return NextResponse.json({ ok })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
