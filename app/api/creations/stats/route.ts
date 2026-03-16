/**
 * GET /api/creations/stats — creation counts by type and recent activity for the authenticated user.
 */
import { createClient } from '@/lib/supabase/server'
import { getUserIdOrBypassForApi } from '@/lib/auth'
import { handleError } from '@/lib/errors/handler'
import { unauthorizedError } from '@/lib/errors/types'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return handleError(unauthorizedError('Authentication required'))
    }

    const { data: creations, error: listError } = await supabase
      .from('creations')
      .select('id, type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (listError) {
      return handleError(listError)
    }

    const byType: Record<string, number> = {}
    for (const c of creations ?? []) {
      byType[c.type] = (byType[c.type] ?? 0) + 1
    }

    const recent = (creations ?? []).slice(0, 10).map((c) => ({
      id: c.id,
      type: c.type,
      created_at: c.created_at,
    }))

    return NextResponse.json({
      total: (creations ?? []).length,
      byType,
      recent,
    })
  } catch (error) {
    return handleError(error)
  }
}
