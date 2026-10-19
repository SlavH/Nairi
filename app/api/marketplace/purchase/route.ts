import { NextResponse } from "next/server"

import { handleError } from "@/lib/errors/handler"
import { purchaseAgentAtomic } from "@/lib/marketplace/purchase-atomic"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

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

    // Free grants and credit purchases go through a single SECURITY DEFINER
    // RPC (scripts/049_atomic_agent_purchase.sql): ownership check, credit
    // deduction, purchase record, and creator payout happen in one atomic,
    // idempotent transaction. No check-then-insert in the route (F36).
    const isFree = agent.is_free || agent.price_cents === 0

    if (isFree || useCredits) {
      const result = await purchaseAgentAtomic(supabase, user.id, agentId, !isFree)

      if (!result.ok) {
        return NextResponse.json(result.body, { status: result.status })
      }

      return NextResponse.json({
        success: true,
        message: result.creditsSpent > 0 ? "Agent purchased with credits" : "Agent added successfully",
        creditsSpent: result.creditsSpent,
        newBalance: result.newBalance,
        agent: result.agent ?? agent
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
