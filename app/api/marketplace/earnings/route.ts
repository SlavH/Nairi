import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Get creator earnings and stats
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get creator profile
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!creatorProfile) {
      return NextResponse.json({ 
        isCreator: false,
        message: "Not a creator yet" 
      })
    }

    // Get all products by this creator
    const { data: products } = await supabase
      .from("marketplace_products")
      .select(`
        id,
        title,
        price_cents,
        purchase_count,
        rating,
        review_count,
        is_published,
        created_at
      `)
      .eq("creator_id", creatorProfile.id)
      .order("created_at", { ascending: false })

    // Get recent sales
    const { data: recentSales } = await supabase
      .from("product_purchases")
      .select(`
        id,
        amount_cents,
        purchased_at,
        product:product_id (
          title
        )
      `)
      .in("product_id", products?.map(p => p.id) || [])
      .order("purchased_at", { ascending: false })
      .limit(20)

    // Calculate stats
    const totalSales = recentSales?.length || 0
    const totalRevenue = recentSales?.reduce((sum, s) => sum + s.amount_cents, 0) || 0
    const totalCommission = Math.floor(totalRevenue * 0.10) // 10% commission
    
    // Get sales by day for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const salesByDay: Record<string, { count: number; revenue: number }> = {}
    recentSales?.forEach(sale => {
      const date = new Date(sale.purchased_at).toISOString().split("T")[0]
      if (!salesByDay[date]) {
        salesByDay[date] = { count: 0, revenue: 0 }
      }
      salesByDay[date].count++
      salesByDay[date].revenue += sale.amount_cents
    })

    // Get marketplace credits earned
    const { data: marketplaceRewards } = await supabase
      .from("daily_rewards")
      .select("credits_earned")
      .eq("user_id", user.id)
      .eq("reward_type", "marketplace")

    const totalMarketplaceCredits = marketplaceRewards?.reduce((sum, r) => sum + r.credits_earned, 0) || 0

    return NextResponse.json({
      isCreator: true,
      profile: {
        displayName: creatorProfile.display_name,
        bio: creatorProfile.bio,
        avatarUrl: creatorProfile.avatar_url,
        isVerified: creatorProfile.is_verified,
        followerCount: creatorProfile.follower_count,
        reputationScore: creatorProfile.reputation_score,
        createdAt: creatorProfile.created_at
      },
      stats: {
        totalProducts: products?.length || 0,
        publishedProducts: products?.filter(p => p.is_published).length || 0,
        totalSales,
        totalRevenue,
        totalCommission, // What creator earns (10%)
        platformFee: totalRevenue - totalCommission, // What platform takes (90%)
        averageRating: products?.length 
          ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1)
          : 0,
        totalReviews: products?.reduce((sum, p) => sum + (p.review_count || 0), 0) || 0,
        marketplaceCredits: totalMarketplaceCredits
      },
      products: products?.map(p => ({
        id: p.id,
        title: p.title,
        priceCents: p.price_cents,
        purchaseCount: p.purchase_count,
        rating: p.rating,
        reviewCount: p.review_count,
        isPublished: p.is_published,
        createdAt: p.created_at,
        earnings: Math.floor((p.purchase_count || 0) * (p.price_cents || 0) * 0.10) // 10% of sales
      })) || [],
      recentSales: recentSales?.map(s => {
        const product = Array.isArray(s.product) ? s.product[0] : s.product;
        return {
          id: s.id,
          productTitle: (product as { title?: string } | null)?.title || "Unknown",
          amountCents: s.amount_cents,
          commission: Math.floor(s.amount_cents * 0.10),
          purchasedAt: s.purchased_at
        };
      }) || [],
      salesByDay
    })

  } catch (error) {
    console.error("Creator earnings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create or update creator profile
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { displayName, bio, specializations } = await req.json()

    if (!displayName) {
      return NextResponse.json({ error: "Display name required" }, { status: 400 })
    }

    // Check if creator profile exists
    const { data: existing } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("creator_profiles")
        .update({
          display_name: displayName,
          bio,
          specializations: specializations || []
        })
        .eq("id", existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Create new
      const { error } = await supabase
        .from("creator_profiles")
        .insert({
          user_id: user.id,
          display_name: displayName,
          bio,
          specializations: specializations || []
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Create creator profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
