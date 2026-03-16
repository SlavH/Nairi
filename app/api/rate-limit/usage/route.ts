/**
 * GET /api/rate-limit/usage — return configured rate limits for the app.
 * Current remaining/reset for a given window are returned in response headers (X-RateLimit-Remaining, X-RateLimit-Reset) on each rate-limited API request; this endpoint exposes the configured limits for display in the dashboard.
 */
import { NextResponse } from 'next/server'
import { RATE_LIMITS } from '@/lib/rate-limit'

export async function GET() {
  const limits = Object.entries(RATE_LIMITS).map(([key, config]) => ({
    key,
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    windowSec: Math.ceil(config.windowMs / 1000),
    description: getLimitDescription(key),
  }))

  return NextResponse.json({
    limits,
    note: 'Current remaining and reset time are sent in response headers (X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After) on each rate-limited API request.',
  })
}

function getLimitDescription(key: string): string {
  const map: Record<string, string> = {
    chat: 'Chat API requests per minute',
    generate: 'Code/content generation per minute',
    image: 'Image generation per minute',
    video: 'Video generation per minute',
    auth: 'Auth endpoint requests per minute',
  }
  return map[key] || `${key} requests per window`
}
