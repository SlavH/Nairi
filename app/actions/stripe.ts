"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { getProduct } from "@/lib/products"

export async function createCheckoutSession(productId: string, agentId?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if this is an agent purchase
  if (agentId) {
    const { data: agent } = await supabase.from("agents").select("*").eq("id", agentId).single()

    if (!agent) {
      throw new Error("Agent not found")
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      redirect_on_completion: "never",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: agent.name,
              description: agent.description,
            },
            unit_amount: agent.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        userId: user.id,
        agentId: agent.id,
        type: "agent_purchase",
      },
    })

    return session.client_secret
  }

  // Subscription purchase
  const product = getProduct(productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: {
      userId: user.id,
      planId: product.id,
      type: "subscription",
    },
  })

  return session.client_secret
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return session
}
