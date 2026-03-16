/**
 * GET /api/creations — list creations for the authenticated user.
 * POST /api/creations — create a creation.
 */
import { createClient } from '@/lib/supabase/server'
import { getUserIdOrBypassForApi } from '@/lib/auth'
import { handleError } from '@/lib/errors/handler'
import { unauthorizedError, validationError } from '@/lib/errors/types'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createBodySchema = z.object({
  type: z.string().min(1).max(100),
  prompt: z.string().min(0).max(10000),
  content: z.string().min(0).max(500000),
  options: z.record(z.unknown()).optional().default({}),
  metadata: z.record(z.unknown()).optional().default({}),
  is_public: z.boolean().optional().default(false),
})

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError('Authentication required'))
    }

    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    let query = supabase
      .from('creations')
      .select('id, type, prompt, content, options, metadata, is_public, is_featured, likes_count, views_count, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      return handleError(error)
    }

    return NextResponse.json({ creations: data ?? [], total: (data ?? []).length })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError('Authentication required'))
    }

    const body = await req.json().catch(() => ({}))
    const parsed = createBodySchema.safeParse(body)
    if (!parsed.success) {
      return handleError(validationError('Invalid request body', parsed.error.errors))
    }

    const { type, prompt, content, options, metadata, is_public } = parsed.data

    const { data: creation, error } = await supabase
      .from('creations')
      .insert({
        user_id: userId,
        type,
        prompt,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        options: options && typeof options === 'object' ? options : {},
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
        is_public,
      })
      .select('id, type, prompt, content, options, metadata, is_public, created_at, updated_at')
      .single()

    if (error) {
      return handleError(error)
    }

    return NextResponse.json(creation, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
