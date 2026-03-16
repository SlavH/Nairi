import { NextResponse } from "next/server"
import { getLatencyPercentiles } from "@/lib/ai/latency"

export const dynamic = "force-dynamic"

export async function GET() {
  const p = getLatencyPercentiles()
  return NextResponse.json({ p50: p.p50, p95: p.p95, p99: p.p99 })
}
