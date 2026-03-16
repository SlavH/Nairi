/**
 * POST /api/marketplace/agents/[agentId]/install — install (purchase) an agent for the current user.
 * Equivalent to POST /api/marketplace/purchase with body { agentId }. Auth required.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params
    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const useCredits = !!body.useCredits

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const { data: existingPurchase } = await supabase
      .from('user_agents')
      .select('id')
      .eq('user_id', user.id)
      .eq('agent_id', agentId)
      .single()

    if (existingPurchase) {
      return NextResponse.json({ error: 'You already own this agent' }, { status: 400 })
    }

    if (agent.is_free || agent.price_cents === 0) {
      const { error: insertError } = await supabase
        .from('user_agents')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          purchased_at: new Date().toISOString(),
        })

      if (insertError) {
        return NextResponse.json({ error: 'Failed to add agent' }, { status: 500 })
      }

      await supabase
        .from('agents')
        .update({ usage_count: (agent.usage_count || 0) + 1 })
        .eq('id', agentId)

      return NextResponse.json({
        success: true,
        message: 'Agent added successfully',
        agent,
      })
    }

    if (useCredits) {
      const creditCost = Math.ceil(agent.price_cents / 10)
      const { data: profile } = await supabase
        .from('profiles')
        .select('tokens_balance')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.tokens_balance || 0) < creditCost) {
        return NextResponse.json({
          error: 'Insufficient credits',
          required: creditCost,
          available: profile?.tokens_balance || 0,
        }, { status: 400 })
      }

      const { error: deductError } = await supabase
        .from('profiles')
        .update({
          tokens_balance: (profile.tokens_balance || 0) - creditCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (deductError) {
        return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
      }

      const { error: insertError } = await supabase
        .from('user_agents')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          purchased_at: new Date().toISOString(),
          purchase_type: 'credits',
          credits_spent: creditCost,
        })

      if (insertError) {
        await supabase
          .from('profiles')
          .update({ tokens_balance: profile.tokens_balance })
          .eq('id', user.id)
        return NextResponse.json({ error: 'Failed to add agent' }, { status: 500 })
      }

      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -creditCost,
        type: 'marketplace_purchase',
        description: `Purchased agent: ${agent.name}`,
        metadata: { agentId, agentName: agent.name },
      })

      await supabase
        .from('agents')
        .update({ usage_count: (agent.usage_count || 0) + 1 })
        .eq('id', agentId)

      if (agent.creator_id) {
        const creatorShare = Math.floor(creditCost * 0.7)
        await supabase.from('credit_transactions').insert({
          user_id: agent.creator_id,
          amount: creatorShare,
          type: 'marketplace_sale',
          description: `Sale of agent: ${agent.name}`,
          metadata: { agentId, buyerId: user.id },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Agent purchased with credits',
        creditsSpent: creditCost,
        agent,
      })
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing not configured' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: agent.name,
              description: agent.description || 'AI Agent',
              images: agent.image_url ? [agent.image_url] : [],
            },
            unit_amount: agent.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        agentId,
        type: 'agent_purchase',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace/${agentId}?purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/marketplace/${agentId}?cancelled=true`,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (err) {
    console.error('Marketplace install error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
