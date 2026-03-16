import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { handleError } from "@/lib/errors/handler"

// POST - Initiate a purchase for an agent
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { agentId, useCredits } = await req.json()

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 })
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Check if already owned
    const { data: existingPurchase } = await supabase
      .from("user_agents")
      .select("id")
      .eq("user_id", user.id)
      .eq("agent_id", agentId)
      .single()

    if (existingPurchase) {
      return NextResponse.json({ error: "You already own this agent" }, { status: 400 })
    }

    // Free agents - just add to user
    if (agent.is_free || agent.price_cents === 0) {
      const { error: insertError } = await supabase
        .from("user_agents")
        .insert({
          user_id: user.id,
          agent_id: agentId,
          purchased_at: new Date().toISOString()
        })

      if (insertError) {
        return NextResponse.json({ error: "Failed to add agent" }, { status: 500 })
      }

      // Update agent usage count
      await supabase
        .from("agents")
        .update({ usage_count: (agent.usage_count || 0) + 1 })
        .eq("id", agentId)

      return NextResponse.json({ 
        success: true, 
        message: "Agent added successfully",
        agent 
      })
    }

    // Handle credit purchase
    if (useCredits) {
      const creditCost = Math.ceil(agent.price_cents / 10) // 10 cents = 1 credit

      // Check user's credit balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("tokens_balance")
        .eq("id", user.id)
        .single()

      if (!profile || (profile.tokens_balance || 0) < creditCost) {
        return NextResponse.json({ 
          error: "Insufficient credits",
          required: creditCost,
          available: profile?.tokens_balance || 0
        }, { status: 400 })
      }

      // Deduct credits and add agent in a transaction-like manner
      const { error: deductError } = await supabase
        .from("profiles")
        .update({ 
          tokens_balance: (profile.tokens_balance || 0) - creditCost,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)

      if (deductError) {
        return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 })
      }

      const { error: insertError } = await supabase
        .from("user_agents")
        .insert({
          user_id: user.id,
          agent_id: agentId,
          purchased_at: new Date().toISOString(),
          purchase_type: "credits",
          credits_spent: creditCost
        })

      if (insertError) {
        // Refund credits if agent add fails
        await supabase
          .from("profiles")
          .update({ tokens_balance: profile.tokens_balance })
          .eq("id", user.id)
        
        return NextResponse.json({ error: "Failed to add agent" }, { status: 500 })
      }

      // Record credit transaction
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -creditCost,
        type: "marketplace_purchase",
        description: `Purchased agent: ${agent.name}`,
        metadata: { agentId, agentName: agent.name }
      })

      // Update agent usage count
      await supabase
        .from("agents")
        .update({ usage_count: (agent.usage_count || 0) + 1 })
        .eq("id", agentId)

      // Credit the creator (if not a system agent)
      if (agent.creator_id) {
        const creatorShare = Math.floor(creditCost * 0.7) // 70% to creator
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("tokens_balance")
          .eq("id", agent.creator_id)
          .single()
        const newBalance = (creatorProfile?.tokens_balance ?? 0) + creatorShare
        await supabase
          .from("profiles")
          .update({ tokens_balance: newBalance, updated_at: new Date().toISOString() })
          .eq("id", agent.creator_id)

        await supabase.from("credit_transactions").insert({
          user_id: agent.creator_id,
          amount: creatorShare,
          type: "marketplace_sale",
          description: `Sale of agent: ${agent.name}`,
          metadata: { agentId, buyerId: user.id }
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Agent purchased with credits",
        creditsSpent: creditCost,
        agent 
      })
    }

    // Handle Stripe payment
    if (!stripe) {
      return NextResponse.json({ error: "Payment processing not configured" }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: agent.name,
              description: agent.description || "AI Agent",
              images: agent.image_url ? [agent.image_url] : []
            },
            unit_amount: agent.price_cents
          },
          quantity: 1
        }
      ],
      metadata: {
        userId: user.id,
        agentId: agentId,
        type: "agent_purchase"
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/marketplace/${agentId}?purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/marketplace/${agentId}?cancelled=true`
    })

    return NextResponse.json({ 
      success: true, 
      checkoutUrl: session.url,
      sessionId: session.id
    })

  } catch (error) {
    return handleError(error)
  }
}

// GET - Check purchase status
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const agentId = url.searchParams.get("agentId")
    const sessionId = url.searchParams.get("sessionId")

    if (agentId) {
      // Check if user owns the agent
      const { data: purchase } = await supabase
        .from("user_agents")
        .select("*, agents(*)")
        .eq("user_id", user.id)
        .eq("agent_id", agentId)
        .single()

      return NextResponse.json({ 
        owned: !!purchase,
        purchase
      })
    }

    if (sessionId && stripe) {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      return NextResponse.json({
        status: session.payment_status,
        completed: session.payment_status === "paid"
      })
    }

    return NextResponse.json({ error: "agentId or sessionId required" }, { status: 400 })

  } catch (error) {
    return handleError(error)
  }
}
