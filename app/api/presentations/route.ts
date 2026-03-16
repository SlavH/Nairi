/**
 * GET /api/presentations — list presentations (creations with type 'presentation') for the current user.
 * POST /api/presentations — create a presentation (optional; for create-with-id or client-provided slides).
 */
import { createClient } from '@/lib/supabase/server'
import { getUserIdOrBypassForApi } from '@/lib/auth'
import { NextResponse } from 'next/server'

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
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { prompt = '', content = '', options = {}, metadata = {} } = body

    const { data: creation, error } = await supabase
      .from('creations')
      .insert({
        user_id: userId,
        type: 'presentation',
        prompt: typeof prompt === 'string' ? prompt : '',
        content: typeof content === 'string' ? content : JSON.stringify([]),
        options: options && typeof options === 'object' ? options : {},
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
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
