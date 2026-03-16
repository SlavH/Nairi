import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserUsageStats } from '@/lib/cost-tracker'
import { getSessionOrBypass } from '@/lib/auth'
import { checkRateLimitAsync, getClientIdentifier } from '@/lib/rate-limit'

const USAGE_RATE_LIMIT = { maxRequests: 60, windowMs: 60 * 1000 } // 60/min

export async function GET(req: Request) {
  try {
    const clientId = getClientIdentifier(req)
    const rateLimitResult = await checkRateLimitAsync(`usage:${clientId}`, USAGE_RATE_LIMIT)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter ?? 60) } }
      )
    }
    const supabase = await createClient()
    const { user } = await getSessionOrBypass(() => supabase.auth.getUser())
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const stats = await getUserUsageStats(user.id)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to get usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to get usage statistics' },
      { status: 500 }
    )
  }
}
