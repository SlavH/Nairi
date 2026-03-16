"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Gift, 
  Users, 
  Play, 
  Activity,
  Flame,
  Copy,
  Check,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface CreditsData {
  balance: number
  dailyLimit: number
  resetIn: {
    hours: number
    minutes: number
    timestamp: string
  }
  streak: number
  totalEarned: number
  totalSpent: number
  referralCode: string
  referralCount: number
  multiplier: number
}

interface RewardsData {
  rewards: Array<{
    type: string
    amount: number
    claimed: boolean
  }>
  totalEarnedToday: number
}

export function CreditsPanel() {
  const [copied, setCopied] = useState(false)
  const [claimingReward, setClaimingReward] = useState<string | null>(null)
  
  const { data: credits, mutate: mutateCredits } = useSWR<CreditsData>("/api/credits", fetcher, {
    refreshInterval: 60000 // Refresh every minute
  })
  
  const { data: rewards, mutate: mutateRewards } = useSWR<RewardsData>("/api/credits/earn", fetcher)
  
  const copyReferralLink = () => {
    if (credits?.referralCode) {
      const link = `${window.location.origin}/auth/sign-up?ref=${credits.referralCode}`
      navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success("Referral link copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const claimReward = async (rewardType: string) => {
    setClaimingReward(rewardType)
    try {
      const res = await fetch("/api/credits/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardType })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to claim reward")
      }
      
      toast.success(`+${data.creditsEarned} credits earned!`)
      mutateCredits()
      mutateRewards()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to claim reward")
    } finally {
      setClaimingReward(null)
    }
  }
  
  const usagePercent = credits ? ((credits.dailyLimit - credits.balance) / credits.dailyLimit) * 100 : 0
  
  const rewardIcons: Record<string, typeof Play> = {
    watch: Play,
    activity: Activity,
    streak: Flame
  }
  
  const rewardLabels: Record<string, string> = {
    watch: "Watch & Learn",
    activity: "Daily Activity",
    streak: "Streak Bonus"
  }

  if (!credits) {
    return (
      <Card className="bg-card/50 border-border animate-pulse">
        <CardContent className="p-6 h-48" />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Credits Card */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#e879f9]" />
              Credits Balance
            </CardTitle>
            {credits.multiplier > 1 && (
              <Badge className="bg-[#e879f9]/20 text-[#e879f9] border-0">
                {credits.multiplier.toFixed(1)}x Multiplier
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">{credits.balance.toLocaleString()}</span>
            <span className="text-muted-foreground">/ {credits.dailyLimit.toLocaleString()}</span>
          </div>
          
          <Progress value={100 - usagePercent} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Resets in {credits.resetIn.hours}h {credits.resetIn.minutes}m</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-foreground">{credits.streak} day streak</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earn Credits Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#22d3ee]" />
            Earn More Credits
          </CardTitle>
          <CardDescription>
            {rewards?.totalEarnedToday || 0} credits earned today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rewards?.rewards.map((reward) => {
            const Icon = rewardIcons[reward.type] || Gift
            return (
              <div
                key={reward.type}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  reward.claimed 
                    ? "bg-muted/30 border-border" 
                    : "bg-background/50 border-border hover:border-[#22d3ee]/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    reward.claimed ? "bg-muted" : "bg-[#22d3ee]/10"
                  }`}>
                    <Icon className={`h-5 w-5 ${reward.claimed ? "text-muted-foreground" : "text-[#22d3ee]"}`} />
                  </div>
                  <div>
                    <p className={`font-medium ${reward.claimed ? "text-muted-foreground" : "text-foreground"}`}>
                      {rewardLabels[reward.type] || reward.type}
                    </p>
                    <p className="text-xs text-muted-foreground">+{reward.amount} credits</p>
                  </div>
                </div>
                
                {reward.claimed ? (
                  <Badge variant="outline" className="bg-transparent border-green-500/50 text-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Claimed
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => claimReward(reward.type)}
                    disabled={claimingReward === reward.type}
                    className="bg-[#22d3ee] text-background hover:bg-[#22d3ee]/90"
                  >
                    {claimingReward === reward.type ? "..." : "Claim"}
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-[#e879f9]" />
            Invite Friends
          </CardTitle>
          <CardDescription>
            Earn 500 credits for each friend who joins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-lg bg-background/50 border border-border font-mono text-sm truncate">
              {credits.referralCode}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyReferralLink}
              className="shrink-0 bg-transparent"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Friends invited</span>
            <span className="font-medium text-foreground">{credits.referralCount}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credits from referrals</span>
            <span className="font-medium text-[#e879f9]">+{credits.referralCount * 500}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{credits.totalEarned.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#e879f9]/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-[#e879f9]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{credits.totalSpent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
