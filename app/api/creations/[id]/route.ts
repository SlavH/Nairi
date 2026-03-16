/**
 * GET /api/creations/[id] — get a creation by ID (own or public).
 * PATCH /api/creations/[id] — update a creation (own only).
 * DELETE /api/creations/[id] — delete a creation (own only).
 */
import { createClient } from '@/lib/supabase/server'
import { getUserIdOrBypassForApi } from '@/lib/auth'
import { handleError } from '@/lib/errors/handler'
import { unauthorizedError, validationError } from '@/lib/errors/types'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateBodySchema = z.object({
  prompt: z.string().min(0).max(10000).optional(),
  content: z.string().min(0).max(500000).optional(),
  options: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  is_public: z.boolean().optional(),
})

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) {
      return handleError(validationError('Missing creation id'))
    }

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError('Authentication required'))
    }

    const { data, error } = await supabase
      .from('creations')
      .select('id, type, prompt, content, options, metadata, is_public, is_featured, likes_count, views_count, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Creation not found' }, { status: 404 })
      }
      return handleError(error)
    }

    if (!data) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) {
      return handleError(validationError('Missing creation id'))
    }

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError('Authentication required'))
    }

    const body = await req.json().catch(() => ({}))
    const parsed = updateBodySchema.safeParse(body)
    if (!parsed.success) {
      return handleError(validationError('Invalid request body', parsed.error.errors))
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.prompt !== undefined) updates.prompt = parsed.data.prompt
    if (parsed.data.content !== undefined) updates.content = parsed.data.content
    if (parsed.data.options !== undefined) updates.options = parsed.data.options
    if (parsed.data.metadata !== undefined) updates.metadata = parsed.data.metadata
    if (parsed.data.is_public !== undefined) updates.is_public = parsed.data.is_public

    const { data, error } = await supabase
      .from('creations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, type, prompt, content, options, metadata, is_public, created_at, updated_at')
      .single()

    if (error) {
      return handleError(error)
    }

    if (!data) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) {
      return handleError(validationError('Missing creation id'))
    }

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError('Authentication required'))
    }

    const { error } = await supabase
      .from('creations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return handleError(error)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleError(error)
  }
}
