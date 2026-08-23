import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

// GET - Fetch reviews for a product
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const url = new URL(req.url)
    const productId = url.searchParams.get("productId")
    const limit = parseInt(url.searchParams.get("limit") || "20")

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const { data: reviews, error } = await supabase
      .from("product_reviews")
      .select("id, product_id, user_id, rating, review_text, is_verified_purchase, helpful_count, created_at, updated_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // user_id references auth.users (no FK to profiles) — embed profiles in
    // code instead (F20). Email is never exposed.
    const userIds = [...new Set((reviews ?? []).map((r) => r.user_id))]
    const authors = new Map<string, { full_name: string | null; avatar_url: string | null }>()
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds)
      for (const p of profileRows ?? []) {
        authors.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url })
      }
    }
    const enrichedReviews = (reviews ?? []).map((r) => ({
      ...r,
      author: authors.get(r.user_id) ?? { full_name: null, avatar_url: null },
    }))

    // Calculate review stats
    const { data: stats } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId)

    const reviewStats = {
      total: stats?.length || 0,
      average: stats?.length 
        ? (stats.reduce((sum, r) => sum + r.rating, 0) / stats.length).toFixed(1)
        : 0,
      distribution: {
        5: stats?.filter(r => r.rating === 5).length || 0,
        4: stats?.filter(r => r.rating === 4).length || 0,
        3: stats?.filter(r => r.rating === 3).length || 0,
        2: stats?.filter(r => r.rating === 2).length || 0,
        1: stats?.filter(r => r.rating === 1).length || 0,
      }
    }

    return NextResponse.json({
      reviews: enrichedReviews,
      stats: reviewStats
    })

  } catch (error) {
    console.error("Reviews API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new review
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productId, rating, reviewText } = await req.json()

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Valid product ID and rating (1-5) required" }, { status: 400 })
    }

    // Check if user purchased the product
    const { data: purchase } = await supabase
      .from("product_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single()

    // Only verified purchasers may review (F20): previously the flag was
    // merely recorded and non-purchasers could inflate ratings.
    if (!purchase) {
      return NextResponse.json(
        { error: "Only verified purchasers can review this product" },
        { status: 403 }
      )
    }
    const isVerifiedPurchase = true

    // Check for existing review
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single()

    if (existingReview) {
      // Update existing review
      const { error: updateError } = await supabase
        .from("product_reviews")
        .update({
          rating,
          review_text: reviewText,
          is_verified_purchase: isVerifiedPurchase
        })
        .eq("id", existingReview.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Create new review
      const { error: insertError } = await supabase
        .from("product_reviews")
        .insert({
          user_id: user.id,
          product_id: productId,
          rating,
          review_text: reviewText,
          is_verified_purchase: isVerifiedPurchase
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    // Update product rating
    const { data: allReviews } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId)

    const avgRating = allReviews?.length
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    await supabase
      .from("marketplace_products")
      .update({
        rating: avgRating,
        review_count: allReviews?.length || 0,
        updated_at: new Date().toISOString()
      })
      .eq("id", productId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Create review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Mark review as helpful
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reviewId } = await req.json()

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 })
    }

    // Increment helpful count via the RPC only (F20): the previous direct
    // fallback update let any user inflate helpful_count without bound.
    const { error } = await supabase.rpc("increment_helpful_count", { review_id: reviewId })

    if (error) {
      return NextResponse.json(
        { error: "Helpful voting is not available right now" },
        { status: 501 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Update review error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
