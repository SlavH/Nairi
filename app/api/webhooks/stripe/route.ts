import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!webhookSecret) {
  console.warn("STRIPE_WEBHOOK_SECRET is not set. Stripe webhook will not verify signatures.")
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" as any })
  : null

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    )
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    )
  }

  const body = await request.text()
  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[Stripe webhook] Signature verification failed:", message)
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata as Record<string, string> | null
    const type = metadata?.type

    if (type === "subscription") {
      const userId = metadata?.userId
      const planId = metadata?.planId
      if (!userId || !planId) {
        console.error("[Stripe webhook] subscription metadata missing userId or planId")
        return NextResponse.json({ received: true })
      }

      const subscriptionId = session.subscription as string | null
      const customerId = session.customer as string | null

      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle()

      const row = {
        user_id: userId,
        stripe_customer_id: customerId ?? undefined,
        stripe_subscription_id: subscriptionId ?? undefined,
        plan: planId,
        status: "active",
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        const { error: subError } = await supabase
          .from("subscriptions")
          .update(row)
          .eq("id", existing.id)
        if (subError) {
          console.error("[Stripe webhook] subscriptions update error:", subError)
          return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
        }
      } else {
        const { error: subError } = await supabase.from("subscriptions").insert(row)
        if (subError) {
          console.error("[Stripe webhook] subscriptions insert error:", subError)
          return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ subscription_tier: planId, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (profileError) {
        console.error("[Stripe webhook] profiles update error:", profileError)
      }
    } else if (type === "agent_purchase") {
      const userId = metadata?.userId
      const agentId = metadata?.agentId
      if (!userId || !agentId) {
        console.error("[Stripe webhook] agent_purchase metadata missing userId or agentId")
        return NextResponse.json({ received: true })
      }

      const { error: insertError } = await supabase.from("user_agents").insert({
        user_id: userId,
        agent_id: agentId,
      })

      if (insertError) {
        if (insertError.code === "23505") {
          return NextResponse.json({ received: true })
        }
        console.error("[Stripe webhook] user_agents insert error:", insertError)
        return NextResponse.json({ error: "Failed to record agent purchase" }, { status: 500 })
      }
    } else if (type === "product_purchase") {
      const userId = metadata?.userId
      const productId = metadata?.productId
      if (!userId || !productId) {
        console.error("[Stripe webhook] product_purchase metadata missing userId or productId")
        return NextResponse.json({ received: true })
      }

      const { data: product } = await supabase
        .from("marketplace_products")
        .select("id, title, creator_id, purchase_count")
        .eq("id", productId)
        .single()

      const { error: insertError } = await supabase.from("product_purchases").insert({
        user_id: userId,
        product_id: productId,
        amount_cents: session.amount_total ?? 0,
      })

      if (insertError && insertError.code !== "23505") {
        console.error("[Stripe webhook] product_purchases insert error:", insertError)
        return NextResponse.json({ error: "Failed to record product purchase" }, { status: 500 })
      }

      if (product) {
        await supabase
          .from("marketplace_products")
          .update({
            purchase_count: (product.purchase_count ?? 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId)
      }
    }
  } else if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId
    const planId = subscription.items?.data?.[0]?.price?.metadata?.planId as string | undefined
    const status = subscription.status // active | canceled | past_due | unpaid | trialing | etc.
    const isActive = status === "active" || status === "trialing"

    if (!userId) {
      console.error("[Stripe webhook] subscription event missing userId in metadata")
      return NextResponse.json({ received: true })
    }

    const effectiveTier = isActive ? (planId ?? "pro") : "free"

    const { error: subError } = await supabase
      .from("subscriptions")
      .update({
        plan: isActive ? (planId ?? "pro") : (subscription.metadata?.planId as string | undefined),
        status,
        cancel_at_period_end: (subscription as any).cancel_at_period_end ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id as string)

    if (subError) {
      console.error("[Stripe webhook] subscriptions update error:", subError)
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ subscription_tier: effectiveTier, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (profileError) {
      console.error("[Stripe webhook] profiles update error:", profileError)
    }
  } else if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = (invoice as any).subscription as string | null
    if (subscriptionId) {
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscriptionId)
      if (subError) {
        console.error("[Stripe webhook] subscriptions past_due update error:", subError)
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
