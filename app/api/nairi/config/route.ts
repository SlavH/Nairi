/**
 * GET /api/nairi/config – whether Nairi HF backend is enabled (BASE_URL set).
 * Client uses this to decide whether to show Nairi chat.
 */

import { NextResponse } from "next/server"

export async function GET() {
  const enabled =
    !!process.env.NAIRI_HF_BASE_URL?.trim() || !!process.env.NAIRI_AI_BASE_URL?.trim()
  return NextResponse.json({ enabled })
}
