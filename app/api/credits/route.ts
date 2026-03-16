import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Get user's credits info
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get profile with credits info - select all needed columns
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        tokens_balance,
        daily_credits,
        credits_reset_at,
        streak_days,
        total_credits_earned,
        total_credits_spent
      `)
      .eq("id", user.id)
      .single()
    
    if (profileError) {
      // Return default values if profile fetch fails
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({
        balance: 100,
        dailyLimit: 100,
        resetIn: { hours: 24, minutes: 0, timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
        streak: 0,
        totalEarned: 0,
        totalSpent: 0,
        referralCode: user.id.slice(0, 8),
        referralCount: 0,
        todaysRewards: [],
        multiplier: 1
      })
    }
    
    // Add default values for optional columns that may not exist
    const profileWithDefaults = {
      tokens_balance: profile?.tokens_balance ?? 100,
      daily_credits: (profile as any)?.daily_credits ?? 100,
      credits_reset_at: (profile as any)?.credits_reset_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      streak_days: (profile as any)?.streak_days ?? 0,
      total_credits_earned: (profile as any)?.total_credits_earned ?? 0,
      total_credits_spent: (profile as any)?.total_credits_spent ?? 0,
    }
    
    // Check if credits need to be reset
    const resetTime = new Date(profileWithDefaults.credits_reset_at)
    const now = new Date()
    
    if (now > resetTime) {
      // Reset credits using the database function
      const { data: newBalance } = await supabase.rpc("reset_daily_credits", {
        p_user_id: user.id
      })
      
      profileWithDefaults.tokens_balance = newBalance || 1000
      profileWithDefaults.credits_reset_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }
    
    // Calculate time until reset
    const msUntilReset = new Date(profileWithDefaults.credits_reset_at).getTime() - now.getTime()
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60))
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60))
    
    // Get today's earned rewards
    const { data: todaysRewards } = await supabase
      .from("daily_rewards")
      .select("reward_type, credits_earned")
      .eq("user_id", user.id)
      .eq("reward_date", new Date().toISOString().split("T")[0])
    
    // Get referral count
    const { count: referralCount } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("status", "completed")
    
    return NextResponse.json({
      balance: profileWithDefaults.tokens_balance,
      dailyLimit: profileWithDefaults.daily_credits,
      resetIn: {
        hours: hoursUntilReset,
        minutes: minutesUntilReset,
        timestamp: profileWithDefaults.credits_reset_at
      },
      streak: profileWithDefaults.streak_days,
      totalEarned: profileWithDefaults.total_credits_earned,
      totalSpent: profileWithDefaults.total_credits_spent,
      referralCode: user.id.slice(0, 8), // Use user ID prefix as referral code
      referralCount: referralCount || 0,
      todaysRewards: todaysRewards || [],
      multiplier: Math.min(1 + (profileWithDefaults.streak_days * 0.033), 2) // Up to 2x at 30 day streak
    })
  } catch (error) {
    console.error("Credits API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Consume credits
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { amount, category, description } = await req.json()
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }
    
    // Consume credits using database function
    const { data: success, error } = await supabase.rpc("consume_credits", {
      p_user_id: user.id,
      p_amount: amount,
      p_category: category || "usage",
      p_description: description
    })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!success) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 })
    }
    
    // Get updated balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens_balance")
      .eq("id", user.id)
      .single()
    
    return NextResponse.json({
      success: true,
      newBalance: profile?.tokens_balance
    })
  } catch (error) {
    console.error("Credits consume error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
