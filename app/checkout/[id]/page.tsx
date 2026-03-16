import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getSessionOrBypass } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { CheckoutForm } from "@/components/checkout/checkout-form"

export default async function CheckoutPage({
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

  // Check if it's an agent ID
  const { data: agent } = await supabase.from("agents").select("*").eq("id", id).single()

  if (!agent) {
    notFound()
  }

  // Check if already owned
  const { data: userAgent } = await supabase
    .from("user_agents")
    .select("*")
    .eq("user_id", user.id)
    .eq("agent_id", id)
    .single()

  if (userAgent) {
    redirect("/marketplace")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <Button asChild variant="ghost" className="gap-2 mb-6">
          <Link href={`/marketplace/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Agent
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div>
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-xl font-bold text-white">
                    {agent.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{agent.category}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${(agent.price_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground">$0.00</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">${(agent.price_cents / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 rounded-lg p-3">
                  <ShieldCheck className="h-5 w-5 text-[#00c9c8]" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 text-xs text-muted-foreground text-center space-y-1">
              <p>By completing this purchase, you agree to our Terms of Service.</p>
              <p>30-day money-back guarantee on all purchases.</p>
            </div>
          </div>

          {/* Checkout Form */}
          <div>
            <Card className="bg-card/50 border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <CheckoutForm agentId={id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
