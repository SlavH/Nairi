import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
    
    if (!referralCode) {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 })
    }
    
    // Check if referral code is valid
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("referral_code", referralCode)
      .single()
    
    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
    }
    
    if (referrer.id === user.id) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 })
    }
    
    // Check if user was already referred
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .single()
    
    if (existingReferral) {
      return NextResponse.json({ error: "Already have a referral" }, { status: 400 })
    }
    
    // Create referral record and award credits
    const { error: referralError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        status: "completed",
        completed_at: new Date().toISOString()
      })
    
    if (referralError) {
      return NextResponse.json({ error: referralError.message }, { status: 500 })
    }
    
    // Award credits to both parties using the database function
    await supabase.rpc("award_referral_credits", { p_referred_id: user.id })
    
    return NextResponse.json({
      success: true,
      message: "Referral bonus applied! You both received 500 credits.",
      referredBy: referrer.full_name || "A Nairi user"
    })
  } catch (error) {
    console.error("Process referral error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
