/**
 * GET /api/nairi-chat/health — checks if any AI backend is available.
 * Returns ok if NAIRI_AI_BASE_URL (primary) or GROQ_API_KEY (fallback) is set.
 */

import { NextResponse } from "next/server"

export async function GET() {
  const nairiAiUrl = process.env.NAIRI_AI_BASE_URL?.trim()
  const groqKey = process.env.GROQ_API_KEY?.trim()
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim()

  const providers: { name: string; configured: boolean }[] = [
    { name: "NAIRI_AI_BASE_URL", configured: !!nairiAiUrl },
    { name: "GROQ_API_KEY", configured: !!groqKey },
    { name: "OPENROUTER_API_KEY", configured: !!openrouterKey },
  ]

  const anyConfigured = providers.some((p) => p.configured)

  return NextResponse.json({
    ok: anyConfigured,
    providers,
    primary: nairiAiUrl ? "nairi" : groqKey ? "groq" : "openrouter",
  })
}
