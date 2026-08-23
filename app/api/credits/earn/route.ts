import { NextResponse, type NextRequest } from "next/server"

import { assertSameOrigin } from "@/lib/security/request-validator"
import { createClient } from "@/lib/supabase/server"

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

// Must stay in sync with the CASE in public.earn_daily_reward (migration
// 20260823_f25_atomic_rewards_and_referrals.sql).
const CLAIMABLE_REWARD_TYPES = new Set(["watch", "activity", "streak"])

export async function POST(req: NextRequest) {
  const originGuard = assertSameOrigin(req)
  if (originGuard) return originGuard

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: { rewardType?: unknown; metadata?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const rewardType = body.rewardType
    if (!rewardType || !CLAIMABLE_REWARD_TYPES.has(String(rewardType))) {
      return NextResponse.json({ error: "Invalid reward type" }, { status: 400 })
    }

    // Cap unverified client-supplied metadata before persisting it.
    let metadata = {}
    if (body.metadata != null && typeof body.metadata === "object") {
      const serialized = JSON.stringify(body.metadata)
      if (serialized.length <= 2048) metadata = body.metadata
    }

    // Single atomic RPC: unique-constrained insert + balance increment +
    // transaction log. No check-then-write races.
    const { data, error } = await supabase.rpc("earn_daily_reward", {
      p_user_id: user.id,
      p_reward_type: String(rewardType),
      p_metadata: metadata,
    })

    if (error) {
      console.error("Earn credits error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    const result = data as {
      ok?: boolean
      already_claimed?: boolean
      credits_earned?: number
      new_balance?: number
      streak?: number
    }

    if (!result?.ok) {
      return NextResponse.json({ error: "Invalid reward type" }, { status: 400 })
    }

    if (result.already_claimed) {
      return NextResponse.json({
        error: "Already claimed this reward today",
        alreadyClaimed: true
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      creditsEarned: result.credits_earned ?? REWARD_AMOUNTS[String(rewardType)],
      newBalance: result.new_balance,
      streak: result.streak
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
