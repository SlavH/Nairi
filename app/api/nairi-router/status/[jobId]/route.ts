/**
 * GET /api/nairi-router/status/[jobId] – proxy to Nairi HF Router GET /status/{job_id}.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkStatus, isRouterConfigured } from "@/lib/nairi-api/router"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  if (!jobId?.trim()) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 })
  }

  if (!isRouterConfigured()) {
    return NextResponse.json(
      { error: "Nairi Router not configured. Set NAIRI_ROUTER_BASE_URL." },
      { status: 503 }
    )
  }

  try {
    const status = await checkStatus(jobId.trim())
    return NextResponse.json(status)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "Status check failed", details: msg },
      { status: 502 }
    )
  }
}
