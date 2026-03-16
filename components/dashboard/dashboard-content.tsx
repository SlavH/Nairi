"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MessageSquare, Store, Zap, Bot, FileText } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

interface DashboardContentProps {
  profile: any
  conversations: any[]
  userAgents: any[]
  freeAgents: any[]
  creationsCount?: number
}

export function DashboardContent({ profile, conversations, userAgents, freeAgents, creationsCount = 0 }: DashboardContentProps) {
  const { t } = useTranslation()

  const stats = [
    {
      title: t.dashboard.tokensBalance,
      value: profile?.tokens_balance ?? 100,
      icon: Zap,
      change: `+10 ${t.dashboard.today}`,
      color: "from-[#e052a0] to-[#ff6b9d]",
    },
    {
      title: t.dashboard.activeAgents,
      value: (userAgents?.length ?? 0) + (freeAgents?.length ?? 0),
      icon: Bot,
      change: `${freeAgents?.length ?? 0} ${t.dashboard.free}`,
      color: "from-[#00c9c8] to-[#4fd1c5]",
    },
    {
      title: t.dashboard.conversations,
      value: conversations?.length ?? 0,
      icon: MessageSquare,
      change: t.dashboard.thisWeek,
      color: "from-[#8b5cf6] to-[#a78bfa]",
    },
    {
      title: "Creations",
      value: creationsCount,
      icon: FileText,
      change: t.dashboard.thisMonth,
      color: "from-[#f59e0b] to-[#fbbf24]",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t.dashboard.welcome}, {profile?.full_name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-muted-foreground mt-1">{t.dashboard.welcomeDescription}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card/50 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">{t.dashboard.quickActions}</CardTitle>
            <CardDescription>{t.dashboard.quickActionsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white">
              <Link href="/chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t.dashboard.startNewConversation}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/marketplace">
                <Store className="h-4 w-4 mr-2" />
                {t.dashboard.browseMarketplace}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/presentations">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Create Presentation
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/dashboard/billing">
                <Zap className="h-4 w-4 mr-2" />
                {t.dashboard.upgradePlan}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">{t.dashboard.recentConversations}</CardTitle>
            <CardDescription>{t.dashboard.recentConversationsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.title || t.dashboard.newConversation}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t.chat.newConversation}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Your Agents */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">{t.dashboard.yourAgents}</CardTitle>
              <CardDescription>{t.dashboard.yourAgentsDesc}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/marketplace">{t.dashboard.viewAll}</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {freeAgents && freeAgents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {freeAgents.map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {agent.name?.charAt(0) || "A"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {agent.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                        {t.dashboard.free}
                      </span>
                      {agent.category && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {agent.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">{t.dashboard.free} agents will appear here.</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/marketplace">{t.dashboard.browseMarketplace}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
