/**
 * POST /api/nairi-router/generate – proxy to Nairi HF Router POST /generate.
 * Body: { type, prompt, options? }. Returns { job_id, status }.
 */

import { NextRequest, NextResponse } from "next/server"
import { generate as routerGenerate, isRouterConfigured } from "@/lib/nairi-api/router"
import type { NairiRouterGenerationType } from "@/lib/nairi-api/types"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const ROUTER_TYPES: NairiRouterGenerationType[] = [
  "text",
  "armenian",
  "website",
  "image",
  "video",
  "voice",
  "music",
  "code",
  "presentation",
  "document",
  "vision",
]
const RATE_LIMIT_REQUESTS = 30
const RATE_LIMIT_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(getClientIdentifier(req), {
    maxRequests: RATE_LIMIT_REQUESTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  })
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } }
    )
  }

  if (!isRouterConfigured()) {
    return NextResponse.json(
      { error: "Nairi Router not configured. Set NAIRI_ROUTER_BASE_URL." },
      { status: 503 }
    )
  }

  let body: { type?: string; prompt?: string; options?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const type = body.type
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""
  if (!type || !ROUTER_TYPES.includes(type as NairiRouterGenerationType)) {
    return NextResponse.json(
      { error: "Invalid or missing type. Must be one of: " + ROUTER_TYPES.join(", ") },
      { status: 400 }
    )
  }
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
  }

  try {
    const result = await routerGenerate(
      type as NairiRouterGenerationType,
      prompt,
      body.options
    )
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: "Router generate failed", details: msg },
      { status: 502 }
    )
  }
}
