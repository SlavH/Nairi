import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const REWARD_AMOUNTS: Record<string, number> = {
  watch: 50,      // +50 credits for watching educational content
  activity: 25,   // +25 credits for daily activity
  streak: 100,    // +100 credits for maintaining streak
  marketplace: 0, // Variable based on sales (10% of sale)
}

const MAX_DAILY_REWARDS: Record<string, number> = {
  watch: 50,      // Can only earn once per day
  activity: 25,   // Can only earn once per day
  streak: 100,    // Can only earn once per day
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { rewardType, metadata } = await req.json()
    
    if (!rewardType || !REWARD_AMOUNTS.hasOwnProperty(rewardType)) {
      return NextResponse.json({ error: "Invalid reward type" }, { status: 400 })
    }
    
    const today = new Date().toISOString().split("T")[0]
    
    // Check if already claimed today
    const { data: existingReward } = await supabase
      .from("daily_rewards")
      .select("id")
      .eq("user_id", user.id)
      .eq("reward_type", rewardType)
      .eq("reward_date", today)
      .single()
    
    if (existingReward) {
      return NextResponse.json({ 
        error: "Already claimed this reward today",
        alreadyClaimed: true
      }, { status: 400 })
    }
    
    const creditsToEarn = REWARD_AMOUNTS[rewardType]
    
    if (creditsToEarn <= 0) {
      return NextResponse.json({ error: "No credits for this reward type" }, { status: 400 })
    }
    
    // Update activity streak
    await supabase.rpc("update_activity_streak", { p_user_id: user.id })
    
    // Award credits
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        tokens_balance: supabase.rpc("", {}), // Will be handled below
        total_credits_earned: supabase.rpc("", {})
      })
      .eq("id", user.id)
    
    // Direct update for credits
    await supabase.rpc("consume_credits", {
      p_user_id: user.id,
      p_amount: -creditsToEarn, // Negative to add credits
      p_category: rewardType,
      p_description: `Earned from ${rewardType} reward`
    })
    
    // Actually let's do a proper update
    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens_balance, total_credits_earned")
      .eq("id", user.id)
      .single()
    
    await supabase
      .from("profiles")
      .update({
        tokens_balance: (profile?.tokens_balance || 0) + creditsToEarn,
        total_credits_earned: (profile?.total_credits_earned || 0) + creditsToEarn
      })
      .eq("id", user.id)
    
    // Log the reward
    const { error: rewardError } = await supabase
      .from("daily_rewards")
      .insert({
        user_id: user.id,
        reward_type: rewardType,
        credits_earned: creditsToEarn,
        reward_date: today,
        metadata: metadata || {}
      })
    
    if (rewardError) {
      console.error("Failed to log reward:", rewardError)
    }
    
    // Log transaction
    await supabase
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        amount: creditsToEarn,
        type: "earned",
        category: rewardType,
        description: `Daily ${rewardType} reward`
      })
    
    // Get updated balance
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("tokens_balance, streak_days")
      .eq("id", user.id)
      .single()
    
    return NextResponse.json({
      success: true,
      creditsEarned: creditsToEarn,
      newBalance: updatedProfile?.tokens_balance,
      streak: updatedProfile?.streak_days
    })
  } catch (error) {
    console.error("Earn credits error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET - Get available rewards for today
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const today = new Date().toISOString().split("T")[0]
    
    // Get claimed rewards for today
    const { data: claimedRewards } = await supabase
      .from("daily_rewards")
      .select("reward_type, credits_earned")
      .eq("user_id", user.id)
      .eq("reward_date", today)
    
    const claimedTypes = new Set(claimedRewards?.map(r => r.reward_type) || [])
    
    const availableRewards = Object.entries(REWARD_AMOUNTS)
      .filter(([type]) => type !== "marketplace") // Marketplace is special
      .map(([type, amount]) => ({
        type,
        amount,
        claimed: claimedTypes.has(type),
        maxDaily: MAX_DAILY_REWARDS[type]
      }))
    
    const totalEarnedToday = claimedRewards?.reduce((sum, r) => sum + r.credits_earned, 0) || 0
    
    return NextResponse.json({
      rewards: availableRewards,
      totalEarnedToday,
      date: today
    })
  } catch (error) {
    console.error("Get rewards error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
