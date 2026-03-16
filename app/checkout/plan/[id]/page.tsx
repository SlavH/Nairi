import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSessionOrBypass } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck, Check } from "lucide-react"
import Link from "next/link"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { getProduct } from "@/lib/products"

export default async function PlanCheckoutPage({
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

  const plan = getProduct(id)

  if (!plan) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <Button asChild variant="ghost" className="gap-2 mb-6">
          <Link href="/dashboard/billing">
            <ArrowLeft className="h-4 w-4" />
            Back to Billing
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div>
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Subscription Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-xl font-bold text-white">
                    {plan.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.description.split(", ").map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-[#00c9c8]" />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly subscription</span>
                    <span className="text-foreground">${(plan.priceInCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                    <span className="text-foreground">Total per month</span>
                    <span className="text-foreground">${(plan.priceInCents / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 rounded-lg p-3">
                  <ShieldCheck className="h-5 w-5 text-[#00c9c8]" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 text-xs text-muted-foreground text-center space-y-1">
              <p>Cancel anytime. No long-term commitment.</p>
              <p>Your card will be charged monthly.</p>
            </div>
          </div>

          {/* Checkout Form */}
          <div>
            <Card className="bg-card/50 border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <CheckoutForm productId={id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
