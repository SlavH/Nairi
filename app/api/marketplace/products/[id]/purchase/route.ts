import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * POST - Purchase a marketplace product (free or with credits).
 * Records product_purchases and increments purchase_count.
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
      const { error: insertError } = await supabase.from("product_purchases").insert({
        user_id: user.id,
        product_id: productId,
        amount_cents: 0,
      })
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      const currentCount = (product as { purchase_count?: number }).purchase_count ?? 0
      await supabase
        .from("marketplace_products")
        .update({
          purchase_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
      return NextResponse.json({ success: true, message: "Product added to your library" })
    }

    const creditCost = Math.ceil(priceCents / 10)
    if (useCredits) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tokens_balance")
        .eq("id", user.id)
        .single()

      if (!profile || (profile.tokens_balance ?? 0) < creditCost) {
        return NextResponse.json({
          error: "Insufficient credits",
          required: creditCost,
          available: profile?.tokens_balance ?? 0,
        }, { status: 400 })
      }

      const { error: deductError } = await supabase
        .from("profiles")
        .update({
          tokens_balance: (profile.tokens_balance ?? 0) - creditCost,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (deductError) {
        return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 })
      }

      const { error: insertError } = await supabase.from("product_purchases").insert({
        user_id: user.id,
        product_id: productId,
        amount_cents: priceCents,
      })
      if (insertError) {
        await supabase
          .from("profiles")
          .update({ tokens_balance: profile.tokens_balance })
          .eq("id", user.id)
        return NextResponse.json({ error: "Failed to record purchase" }, { status: 500 })
      }

      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -creditCost,
        type: "marketplace_purchase",
        description: `Purchased: ${product.title}`,
        metadata: { productId, productTitle: product.title },
      })

      const currentCount = (product as { purchase_count?: number }).purchase_count ?? 0
      await supabase
        .from("marketplace_products")
        .update({
          purchase_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)

      if (product.creator_id) {
        const creatorShare = Math.floor(creditCost * 0.7)
        const { data: creatorProfile } = await supabase
          .from("creator_profiles")
          .select("user_id")
          .eq("id", product.creator_id)
          .single()
        if (creatorProfile?.user_id) {
          const { data: creatorProfileRow } = await supabase
            .from("profiles")
            .select("tokens_balance")
            .eq("id", creatorProfile.user_id)
            .single()
          const newBalance = (creatorProfileRow?.tokens_balance ?? 0) + creatorShare
          await supabase
            .from("profiles")
            .update({ tokens_balance: newBalance, updated_at: new Date().toISOString() })
            .eq("id", creatorProfile.user_id)
          await supabase.from("credit_transactions").insert({
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

    return NextResponse.json({
      error: "Paid products require credits or card",
      priceCents,
      creditCost,
    }, { status: 400 })
  } catch (e) {
    console.error("Product purchase error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
