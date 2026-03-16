/**
 * GET /api/marketplace/agents — list marketplace agents for external/mobile clients.
 * Auth optional; when authenticated, response can include owned flag per agent.
 * Responses are cached (short TTL) for anonymous or repeated requests to reduce DB load.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { get, set } from '@/lib/cache/simple'

const CACHE_TTL_MS = 60 * 1000 // 1 minute

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const sort = url.searchParams.get('sort') || 'popular'
    const q = url.searchParams.get('q')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    // Cache key: only cache list data (no user-specific owned flags). When no user, cache full response.
    const cacheKey = `marketplace:agents:${category ?? 'all'}:${sort}:${q ?? ''}:${limit}:${offset}`
    if (!user) {
      const cached = get<{ agents: unknown[]; total: number }>(cacheKey)
      if (cached) return NextResponse.json(cached)
    }

    let query = supabase.from('agents').select('id, name, description, category, price_cents, icon, capabilities, is_featured, is_free, usage_count, rating, image_url, created_at, updated_at')

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    }
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'price_asc':
        query = query.order('price_cents', { ascending: true })
        break
      case 'price_desc':
        query = query.order('price_cents', { ascending: false })
        break
      case 'rating':
        query = query.order('rating', { ascending: false, nullsFirst: false })
        break
      default:
        query = query.order('is_featured', { ascending: false }).order('usage_count', { ascending: false })
    }
    query = query.range(offset, offset + limit - 1)

    const { data: agents, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let ownedAgentIds = new Set<string>()
    if (user) {
      const { data: userAgents } = await supabase.from('user_agents').select('agent_id').eq('user_id', user.id)
      ownedAgentIds = new Set(userAgents?.map((ua) => ua.agent_id) || [])
    }

    const list = (agents || []).map((a) => ({
      ...a,
      owned: user ? ownedAgentIds.has(a.id) : undefined,
    }))

    const payload = { agents: list, total: list.length }
    if (!user) set(cacheKey, payload, CACHE_TTL_MS)
    return NextResponse.json(payload)
  } catch (err) {
    console.error('Marketplace agents list error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
