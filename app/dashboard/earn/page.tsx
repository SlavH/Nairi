"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Play,
  Zap,
  Gift,
  Users,
  Clock,
  Check,
  Copy,
  Flame,
  Star,
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const educationalVideos = [
  {
    id: "intro-nairi",
    title: "Getting Started with Nairi",
    description: "Learn the basics of using Nairi to transform your ideas",
    duration: "3:45",
    credits: 50,
    category: "Basics",
    thumbnail: "gradient-1",
  },
  {
    id: "create-presentation",
    title: "Creating Amazing Presentations",
    description: "Master the art of AI-powered presentation creation",
    duration: "5:20",
    credits: 50,
    category: "Creation",
    thumbnail: "gradient-2",
  },
  {
    id: "marketplace-guide",
    title: "Navigating the Marketplace",
    description: "Discover powerful AI agents for your workflow",
    duration: "4:15",
    credits: 50,
    category: "Marketplace",
    thumbnail: "gradient-3",
  },
  {
    id: "advanced-prompts",
    title: "Advanced Prompting Techniques",
    description: "Get better results with optimized prompts",
    duration: "6:30",
    credits: 75,
    category: "Advanced",
    thumbnail: "gradient-4",
  },
]

const gradients: Record<string, string> = {
  "gradient-1": "from-[#e879f9] to-[#22d3ee]",
  "gradient-2": "from-orange-500 to-red-500",
  "gradient-3": "from-green-500 to-emerald-500",
  "gradient-4": "from-blue-500 to-indigo-500",
}

export default function EarnPage() {
  const [copied, setCopied] = useState(false)
  const [watchingVideo, setWatchingVideo] = useState<string | null>(null)
  const [watchProgress, setWatchProgress] = useState(0)
  const [claimingReward, setClaimingReward] = useState<string | null>(null)

  const { data: credits, mutate: mutateCredits } = useSWR("/api/credits", fetcher)
  const { data: rewards, mutate: mutateRewards } = useSWR("/api/credits/earn", fetcher)
  const { data: referralData, mutate: mutateReferrals } = useSWR("/api/credits/referral", fetcher)

  const copyReferralLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink)
      setCopied(true)
      toast.success("Referral link copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const simulateWatchVideo = async (videoId: string) => {
    setWatchingVideo(videoId)
    setWatchProgress(0)

    // Simulate watching progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 150))
      setWatchProgress(i)
    }

    // Claim watch reward
    await claimReward("watch")
    setWatchingVideo(null)
    setWatchProgress(0)
  }

  const claimReward = async (rewardType: string) => {
    setClaimingReward(rewardType)
    try {
      const res = await fetch("/api/credits/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardType }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to claim reward")
      }

      toast.success(`+${data.creditsEarned} credits earned!`)
      mutateCredits()
      mutateRewards()
    } catch (error) {
      if (error instanceof Error && error.message.includes("Already claimed")) {
        toast.info("You've already claimed this reward today")
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to claim reward")
      }
    } finally {
      setClaimingReward(null)
    }
  }

  const watchRewardClaimed = rewards?.rewards?.find((r: any) => r.type === "watch")?.claimed
  const activityRewardClaimed = rewards?.rewards?.find((r: any) => r.type === "activity")?.claimed
  const streakRewardClaimed = rewards?.rewards?.find((r: any) => r.type === "streak")?.claimed

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Earn Credits</h1>
        <p className="text-muted-foreground mt-1">
          Watch educational content, complete daily tasks, and invite friends to earn free credits.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{credits?.balance?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Current Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{rewards?.totalEarnedToday || 0}</p>
                <p className="text-xs text-muted-foreground">Earned Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{credits?.streak || 0}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{referralData?.stats?.completed || 0}</p>
                <p className="text-xs text-muted-foreground">Friends Invited</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="watch" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="watch" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Watch & Earn
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Daily Rewards
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Referrals
          </TabsTrigger>
        </TabsList>

        {/* Watch & Earn Tab */}
        <TabsContent value="watch" className="space-y-6">
          <Card className="bg-gradient-to-br from-[#e879f9]/10 to-[#22d3ee]/10 border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#e879f9]" />
                    Watch & Learn
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Earn +50 credits by watching educational content
                  </p>
                </div>
                {watchRewardClaimed ? (
                  <Badge className="bg-green-500/20 text-green-500 border-0">
                    <Check className="h-3 w-3 mr-1" />
                    Claimed Today
                  </Badge>
                ) : (
                  <Badge className="bg-[#e879f9]/20 text-[#e879f9] border-0">+50 credits available</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {educationalVideos.map((video) => (
              <Card key={video.id} className="bg-card/50 border-border overflow-hidden">
                <div
                  className={`h-32 bg-gradient-to-br ${gradients[video.thumbnail]} flex items-center justify-center relative`}
                >
                  {watchingVideo === video.id ? (
                    <div className="text-center text-white">
                      <Progress value={watchProgress} className="w-32 h-2 mb-2" />
                      <p className="text-sm">Watching... {watchProgress}%</p>
                    </div>
                  ) : (
                    <Play className="h-12 w-12 text-white/80" />
                  )}
                  <Badge className="absolute top-2 right-2 bg-black/50 text-white border-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {video.duration}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-foreground">{video.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Badge variant="outline" className="text-xs">
                      {video.category}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => simulateWatchVideo(video.id)}
                      disabled={watchingVideo !== null || watchRewardClaimed}
                      className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white"
                    >
                      {watchRewardClaimed ? (
                        "Completed"
                      ) : watchingVideo === video.id ? (
                        "Watching..."
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Watch +{video.credits}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Daily Rewards Tab */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Daily Activity */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="font-semibold text-foreground">Daily Activity</h3>
                <p className="text-sm text-muted-foreground mt-1">Use Nairi features today</p>
                <p className="text-lg font-bold text-green-500 mt-2">+25 credits</p>
                <Button
                  className="w-full mt-4"
                  variant={activityRewardClaimed ? "outline" : "default"}
                  disabled={activityRewardClaimed || claimingReward === "activity"}
                  onClick={() => claimReward("activity")}
                >
                  {activityRewardClaimed ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Claimed
                    </>
                  ) : claimingReward === "activity" ? (
                    "Claiming..."
                  ) : (
                    "Claim"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Streak Bonus */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="font-semibold text-foreground">Streak Bonus</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {credits?.streak || 0} day streak active
                </p>
                <p className="text-lg font-bold text-orange-500 mt-2">+100 credits</p>
                <Button
                  className="w-full mt-4"
                  variant={streakRewardClaimed ? "outline" : "default"}
                  disabled={streakRewardClaimed || (credits?.streak || 0) < 7 || claimingReward === "streak"}
                  onClick={() => claimReward("streak")}
                >
                  {streakRewardClaimed ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Claimed
                    </>
                  ) : (credits?.streak || 0) < 7 ? (
                    "Need 7 day streak"
                  ) : claimingReward === "streak" ? (
                    "Claiming..."
                  ) : (
                    "Claim"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Activity Multiplier */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="font-semibold text-foreground">Multiplier Active</h3>
                <p className="text-sm text-muted-foreground mt-1">Earn more with your streak</p>
                <p className="text-lg font-bold text-purple-500 mt-2">
                  {credits?.multiplier?.toFixed(1) || "1.0"}x
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Max 2x at 30 day streak
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-6">
          <Card className="bg-gradient-to-br from-[#e879f9]/10 to-[#22d3ee]/10 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-[#e879f9]" />
                Invite Friends, Earn Credits
              </CardTitle>
              <CardDescription>
                Earn 500 credits for each friend who signs up. They get 500 credits too!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your referral link:</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={referralData?.referralLink || "Loading..."}
                    className="bg-background font-mono text-sm"
                  />
                  <Button onClick={copyReferralLink} variant="outline" className="shrink-0 bg-transparent">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-4">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <p className="text-2xl font-bold text-foreground">{referralData?.stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Invites</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <p className="text-2xl font-bold text-green-500">{referralData?.stats?.completed || 0}</p>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <p className="text-2xl font-bold text-[#e879f9]">
                    +{referralData?.stats?.totalCreditsEarned || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Credits Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Referrals */}
          {referralData?.referrals?.length > 0 && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referralData.referrals.slice(0, 5).map((referral: any) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center text-white text-sm font-bold">
                          {referral.referredUser?.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{referral.referredUser?.name || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={referral.status === "completed" ? "bg-green-500/20 text-green-500 border-0" : "bg-yellow-500/20 text-yellow-500 border-0"}>
                        {referral.status === "completed" ? `+${referral.creditsAwarded}` : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
