import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getProduct, SUBSCRIPTION_PLANS } from "@/lib/products"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Zap,
  Crown,
  Rocket,
  Check,
  CreditCard,
  CalendarDays,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react"

const PLAN_ICONS: Record<string, typeof Crown> = {
  starter: Zap,
  pro: Crown,
  enterprise: Rocket,
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single()

  const currentPlan = subscription?.plan || "free"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 min-h-[44px]">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <h1 className="text-xl sm:text-2xl font-bold">Billing</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {subscription && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-[#e879f9]/5">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-[#e879f9]" />
                    <span className="text-2xl font-bold capitalize">{currentPlan} Plan</span>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {subscription.status === "active" ? "Active" : subscription.status}
                    {subscription.current_period_end && (
                      <> — Renews {new Date(subscription.current_period_end).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                    {subscription.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = PLAN_ICONS[plan.id] || Zap
            const isCurrent = plan.id === currentPlan
            const gradients: Record<string, string> = {
              starter: "from-muted-foreground/80 to-muted-foreground",
              pro: "from-[#22d3ee] to-[#e879f9]",
              enterprise: "from-[#e879f9] to-[#f472b6]",
            }
            return (
              <Card key={plan.id} className={`relative transition-all ${isCurrent ? "ring-2 ring-primary" : ""}`}>
                {plan.id === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#22d3ee] to-[#e879f9] text-white border-0">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[plan.id]} flex items-center justify-center mb-2`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="capitalize">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${(plan.priceInCents / 100).toFixed(2)}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6">
                    {plan.description.split(", ").map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm py-1.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full min-h-[44px] ${
                      isCurrent ? "" : "bg-gradient-to-r from-[#22d3ee] to-[#e879f9] text-white hover:opacity-90"
                    }`}
                    variant={isCurrent ? "secondary" : "default"}
                    disabled={isCurrent}
                  >
                    <Link href={isCurrent ? "#" : `/checkout/plan/${plan.id}`}>
                      {isCurrent ? "Current Plan" : "Upgrade"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage payment methods through Stripe Customer Portal.
              </p>
              <Button asChild variant="outline" className="w-full min-h-[44px]">
                <Link href={`https://billing.stripe.com/p/login/test_123`}>
                  Manage in Stripe
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                Billing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View past invoices in Stripe Customer Portal.
              </p>
              <Button asChild variant="outline" className="w-full min-h-[44px]">
                <Link href={`https://billing.stripe.com/p/login/test_123`}>
                  View Invoices
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {subscription && subscription.status === "active" && (
          <Card className="mt-8 border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Cancel Subscription</p>
                    <p className="text-sm text-muted-foreground">
                      Your subscription will remain active until the end of the billing period.
                      To cancel, visit the Stripe Customer Portal.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent min-h-[44px] shrink-0">
                  <Link href={`https://billing.stripe.com/p/login/test_123`}>
                    Manage in Stripe
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
