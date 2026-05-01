/**
 * GET /api/presentations — list presentations (creations with type 'presentation') for the current user.
 * POST /api/presentations — create a presentation (optional; for create-with-id or client-provided slides).
 */
import { createClient } from '@/lib/supabase/server'
import { getUserIdOrBypassForApi } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

const MAX_PROMPT_LENGTH = 2000
const MAX_CONTENT_LENGTH = 100000
const RATE_LIMIT_REQUESTS = 10
const RATE_LIMIT_WINDOW_MS = 60_000

export async function GET() {
  try {
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('creations')
      .select('id, prompt, content, options, metadata, created_at, updated_at')
      .eq('user_id', userId)
      .eq('type', 'presentation')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ presentations: data ?? [] })
  } catch (err) {
    console.error('Presentations list error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimitResult = checkRateLimit(`presentations:${clientId}`, {
      maxRequests: RATE_LIMIT_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    })
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const prompt = typeof body.prompt === 'string' ? body.prompt : ''
    const content = typeof body.content === 'string' ? body.content : ''
    const options = body.options && typeof body.options === 'object' ? body.options : {}
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {}

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters.` }, { status: 400 })
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `Content too long. Maximum ${MAX_CONTENT_LENGTH} characters.` }, { status: 400 })
    }

    const { data: creation, error } = await supabase
      .from('creations')
      .insert({
        user_id: userId,
        type: 'presentation',
        prompt: prompt.trim(),
        content: content || JSON.stringify([]),
        options,
        metadata,
      })
      .select('id, prompt, content, options, metadata, created_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(creation, { status: 201 })
  } catch (err) {
    console.error('Presentation create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
