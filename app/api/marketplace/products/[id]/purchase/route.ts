import { NextResponse } from "next/server"

import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * POST - Purchase a marketplace product (free or with credits).
 * Records product_purchases and increments purchase_count.
 * Writes run through the admin (service role) client so they pass the
 * hardened RLS policies, while the authenticated user client is still used
 * for reads and authorization.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { useCredits } = await req.json().catch(() => ({}))

    const { data: product, error: productError } = await supabase
      .from("marketplace_products")
      .select("id, title, price_cents, creator_id, purchase_count")
      .eq("id", productId)
      .eq("is_published", true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from("product_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "You already own this product" }, { status: 400 })
    }

    const priceCents = product.price_cents ?? 0

    if (priceCents === 0) {
      const { error: insertError } = await admin.from("product_purchases").insert({
        user_id: user.id,
        product_id: productId,
        amount_cents: 0,
      })
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      await atomicIncrementCount(admin, productId)
      return NextResponse.json({ success: true, message: "Product added to your library" })
    }

    const creditCost = Math.ceil(priceCents / 10)
    if (useCredits) {
      const deduction = await atomicAdjustBalance(admin, user.id, -creditCost)

      if (!deduction.ok) {
        if (deduction.insufficient) {
          return NextResponse.json({
            error: "Insufficient credits",
            required: creditCost,
            available: deduction.balance ?? 0,
          }, { status: 400 })
        }
        return NextResponse.json({ error: deduction.error || "Failed to deduct credits" }, { status: 500 })
      }

      const { error: insertError } = await admin.from("product_purchases").insert({
        user_id: user.id,
        product_id: productId,
        amount_cents: priceCents,
      })
      if (insertError) {
        await atomicAdjustBalance(admin, user.id, creditCost)
        return NextResponse.json({ error: "Failed to record purchase" }, { status: 500 })
      }

      const { error: txError } = await admin.from("credit_transactions").insert({
        user_id: user.id,
        amount: -creditCost,
        type: "marketplace_purchase",
        description: `Purchased: ${product.title}`,
        metadata: { productId, productTitle: product.title },
      })
      if (txError) {
        await atomicAdjustBalance(admin, user.id, creditCost)
        return NextResponse.json({ error: "Failed to record purchase" }, { status: 500 })
      }

      await atomicIncrementCount(admin, productId)

      if (product.creator_id) {
        const creatorShare = Math.floor(creditCost * 0.7)
        const { data: creatorProfile } = await supabase
          .from("creator_profiles")
          .select("user_id")
          .eq("id", product.creator_id)
          .single()
        if (creatorProfile?.user_id) {
          await atomicAdjustBalance(admin, creatorProfile.user_id, creatorShare)
          await admin.from("credit_transactions").insert({
            user_id: creatorProfile.user_id,
            amount: creatorShare,
            type: "marketplace_sale",
            description: `Sale: ${product.title}`,
            metadata: { productId, buyerId: user.id },
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: "Purchased with credits",
        creditsSpent: creditCost,
      })
    }

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
              name: product.title,
              description: `Marketplace product: ${product.title}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        productId,
        type: "product_purchase",
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/marketplace/product/${productId}?purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/marketplace/product/${productId}?cancelled=true`,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (e) {
    console.error("Product purchase error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function atomicAdjustBalance(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  delta: number,
): Promise<{ ok: true; balance: number } | { ok: false; insufficient?: boolean; balance?: number; error?: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: profile } = await admin
      .from("profiles")
      .select("tokens_balance")
      .eq("id", userId)
      .single()
    const balance = profile?.tokens_balance ?? 0
    if (balance + delta < 0) {
      return { ok: false, insufficient: true, balance }
    }
    const { error, data } = await admin
      .from("profiles")
      .update({
        tokens_balance: balance + delta,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq("tokens_balance", balance)
      .select()
    if (error) {
      return { ok: false, error: error.message }
    }
    if (data && data.length === 1) {
      return { ok: true, balance: balance + delta }
    }
  }
  return { ok: false, error: "Could not update balance atomically" }
}

async function atomicIncrementCount(
  admin: ReturnType<typeof createAdminClient>,
  productId: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: product } = await admin
      .from("marketplace_products")
      .select("purchase_count")
      .eq("id", productId)
      .single()
    const current = product?.purchase_count ?? 0
    const { error, data } = await admin
      .from("marketplace_products")
      .update({
        purchase_count: current + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("purchase_count", current)
      .select()
    if (error) {
      return false
    }
    if (data && data.length === 1) {
      return true
    }
  }
  return false
}
