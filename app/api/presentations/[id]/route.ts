/**
 * GET /api/presentations/[id] — get a single presentation.
 * PATCH /api/presentations/[id] — update a presentation.
 * DELETE /api/presentations/[id] — delete a presentation.
 */
import { createClient } from '@/lib/supabase/server'
import { getUserIdOrBypassForApi } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('creations')
      .select('id, prompt, content, options, metadata, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('type', 'presentation')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Presentation get error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from('creations')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('type', 'presentation')
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof body.prompt === 'string') updates.prompt = body.prompt
    if (typeof body.content === 'string') updates.content = body.content
    if (body.options && typeof body.options === 'object') updates.options = body.options
    if (body.metadata && typeof body.metadata === 'object') updates.metadata = body.metadata

    const { data, error } = await supabase
      .from('creations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .eq('type', 'presentation')
      .select('id, prompt, content, options, metadata, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('Presentation patch error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('creations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('type', 'presentation')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Presentation delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
