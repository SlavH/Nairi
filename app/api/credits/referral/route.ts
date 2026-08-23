import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

// GET - Get referral info and history
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get user's referral code
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single()
    
    // Get referral stats
    const { data: referrals, count } = await supabase
      .from("referrals")
      .select("*, referred:referred_id(email, full_name, created_at)", { count: "exact" })
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
    
    const completedReferrals = referrals?.filter(r => r.status === "completed") || []
    const pendingReferrals = referrals?.filter(r => r.status === "pending") || []
    
    const totalEarned = completedReferrals.reduce((sum, r) => sum + (r.credits_awarded || 500), 0)
    
    return NextResponse.json({
      referralCode: profile?.referral_code,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://nairi.ai"}/auth/sign-up?ref=${profile?.referral_code}`,
      stats: {
        total: count || 0,
        completed: completedReferrals.length,
        pending: pendingReferrals.length,
        totalCreditsEarned: totalEarned
      },
      referrals: referrals?.map(r => ({
        id: r.id,
        status: r.status,
        creditsAwarded: r.credits_awarded,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        referredUser: r.referred ? {
          name: r.referred.full_name || "Anonymous",
          joinedAt: r.referred.created_at
        } : null
      })) || []
    })
  } catch (error) {
    console.error("Referral API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Validate and process a referral code
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { referralCode } = await req.json()

    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 })
    }

    // Single atomic RPC: validates the code, blocks self-referral and
    // duplicates, inserts the referral as 'pending' and pays both parties.
    // (Previously the row was inserted as 'completed' so award_referral_credits,
    // which only matches 'pending', never awarded anything.)
    const { data, error } = await supabase.rpc("claim_referral", {
      p_referred_id: user.id,
      p_referral_code: referralCode
    })

    if (error) {
      console.error("Process referral error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const result = data as { ok?: boolean; error?: string }
    if (!result?.ok) {
      switch (result?.error) {
        case "referral_code_required":
          return NextResponse.json({ error: "Referral code required" }, { status: 400 })
        case "invalid_code":
          return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
        case "self_referral":
          return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 })
        case "already_referred":
          return NextResponse.json({ error: "Already have a referral" }, { status: 400 })
        default:
          return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Referral bonus applied! You both received 500 credits."
    })
  } catch (error) {
    console.error("Process referral error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
