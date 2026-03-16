import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Zap } from "lucide-react"
import Link from "next/link"
import { SUBSCRIPTION_PLANS } from "@/lib/products"
import { redirect } from "next/navigation"
import { getSessionOrBypass } from "@/lib/auth"

export default async function BillingPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()

  const currentPlan = subscription?.plan || "free"

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment methods.</p>
      </div>

      {/* Current Plan */}
      <Card className="bg-gradient-to-r from-[#e052a0]/10 to-[#00c9c8]/10 border-[#00c9c8]/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <h2 className="text-2xl font-bold text-foreground capitalize">{currentPlan}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan === "free"
                  ? "100 tokens per month, free agents only"
                  : subscription?.status === "active"
                    ? "Your subscription is active"
                    : "No active subscription"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tokens Balance</p>
              <p className="text-3xl font-bold text-foreground">{profile?.tokens_balance ?? 100}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Free Plan */}
          <Card className={`bg-card/50 border-border/50 ${currentPlan === "free" ? "ring-2 ring-[#00c9c8]" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Free</CardTitle>
                {currentPlan === "free" && <Badge className="bg-[#00c9c8]/20 text-[#00c9c8] border-0">Current</Badge>}
              </div>
              <CardDescription>Get started with Nairi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                {["100 tokens/month", "Free agents only", "Basic support", "Community access"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 text-[#00c9c8]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button disabled className="w-full bg-transparent" variant="outline">
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Paid Plans */}
          {SUBSCRIPTION_PLANS.map((plan, index) => (
            <Card
              key={plan.id}
              className={`bg-card/50 border-border/50 ${
                currentPlan === plan.id ? "ring-2 ring-[#00c9c8]" : ""
              } ${index === 1 ? "relative" : ""}`}
            >
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white border-0">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">{plan.name.replace(" Plan", "")}</CardTitle>
                  {currentPlan === plan.id && (
                    <Badge className="bg-[#00c9c8]/20 text-[#00c9c8] border-0">Current</Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold text-foreground">${(plan.priceInCents / 100).toFixed(0)}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.description.split(", ").map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-[#00c9c8]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {currentPlan === plan.id ? (
                  <Button disabled className="w-full bg-transparent" variant="outline">
                    Current Plan
                  </Button>
                ) : (
                  <Button asChild className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white">
                    <Link href={`/checkout/plan/${plan.id}`}>
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History would go here */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Payment History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No payment history yet</p>
        </CardContent>
      </Card>
    </div>
  )
}
