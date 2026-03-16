/**
 * GET /api/nairi-router/result/[jobId] – proxy to Nairi HF Router GET /result/{job_id}.
 * If job is not completed, returns 202 with current status.
 */

import { NextRequest, NextResponse } from "next/server"
import { checkStatus, getResult, isRouterConfigured } from "@/lib/nairi-api/router"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await context.params
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
    if (status.status === "processing") {
      return NextResponse.json(
        { job_id: status.job_id, status: "processing", message: "Job not ready" },
        { status: 202 }
      )
    }
    if (status.status === "failed") {
      return NextResponse.json(
        { job_id: status.job_id, status: "failed", message: "Job failed" },
        { status: 200 }
      )
    }
    const resultResponse = await getResult(jobId.trim())
    return NextResponse.json(resultResponse)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "Get result failed", details: msg },
      { status: 502 }
    )
  }
}
