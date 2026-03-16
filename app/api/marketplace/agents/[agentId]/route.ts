/**
 * GET /api/marketplace/agents/[agentId] — get a single marketplace agent.
 * Auth optional; when authenticated, response includes owned flag.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    let owned = false
    if (user) {
      const { data: purchase } = await supabase
        .from('user_agents')
        .select('id')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .single()
      owned = !!purchase
    }

    return NextResponse.json({ ...agent, owned })
  } catch (err) {
    console.error('Marketplace agent detail error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
