import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getSessionOrBypass } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ArrowLeft, Check, Zap } from "lucide-react"
import Link from "next/link"
import { PurchaseButton } from "@/components/marketplace/purchase-button"
import { AgentReviews } from "@/components/marketplace/agent-reviews"
import { BreadcrumbNav } from "@/components/navigation/breadcrumb-nav"

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const { data: agent } = await supabase.from("agents").select("*").eq("id", id).single()

  if (!agent) {
    notFound()
  }

  const { data: userAgent } = await supabase
    .from("user_agents")
    .select("*")
    .eq("user_id", user.id)
    .eq("agent_id", id)
    .single()

  const isOwned = !!userAgent || agent.is_free

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <BreadcrumbNav 
          customItems={[
            { label: "Marketplace", href: "/marketplace" },
            { label: agent.name }
          ]}
        />
        <Button asChild variant="ghost" size="sm" className="gap-2 bg-transparent">
          <Link href="/marketplace">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-2xl font-bold text-white">
                {agent.name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline">{agent.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-foreground">{agent.rating || "N/A"}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{agent.usage_count} uses</span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mt-6 text-lg">{agent.description}</p>
          </div>

          <Card className="bg-white/5 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Capabilities</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {agent.capabilities?.map((cap: string) => (
                  <div key={cap} className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-[#00c9c8]/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-[#00c9c8]" />
                    </div>
                    <span className="text-foreground">{cap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <h2 className="font-semibold text-foreground mb-4">What You Can Do</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-[#e052a0] shrink-0 mt-0.5" />
                  <span>Automate complex tasks with natural language instructions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-[#e052a0] shrink-0 mt-0.5" />
                  <span>Get expert-level assistance in {agent.category.toLowerCase()}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-5 w-5 text-[#e052a0] shrink-0 mt-0.5" />
                  <span>Integrate seamlessly with your existing workflow</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <AgentReviews agentId={id} canReview={isOwned} />
        </div>

        {/* Purchase Card */}
        <div>
          <Card className="bg-white/5 backdrop-blur-md border-white/20 sticky top-6">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                {agent.is_free ? (
                  <div>
                    <span className="text-3xl font-bold text-[#00c9c8]">Free</span>
                    <p className="text-sm text-muted-foreground mt-1">No payment required</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-foreground">${(agent.price_cents / 100).toFixed(2)}</span>
                    <p className="text-sm text-muted-foreground mt-1">One-time purchase</p>
                  </div>
                )}
              </div>

              {isOwned ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-[#00c9c8]">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">You own this agent</span>
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white">
                    <Link href="/chat">Start Using</Link>
                  </Button>
                </div>
              ) : (
                <PurchaseButton agent={agent} userId={user.id} />
              )}

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Instant access after purchase</p>
                <p>30-day money-back guarantee</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
