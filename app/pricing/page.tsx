"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Get started with Nairi basics",
    credits: "1,000 credits/day",
    features: [
      "Basic AI chat capabilities",
      "Access to free marketplace agents",
      "Community support",
      "Standard response times",
      "Basic document generation",
    ],
    cta: "Start Free",
    href: "/auth/sign-up",
    popular: false,
  },
  {
    name: "Pro",
    price: "19",
    description: "For creators and professionals",
    credits: "10,000 credits/day",
    features: [
      "Everything in Free",
      "Priority response times",
      "Advanced AI models",
      "Marketplace selling enabled",
      "Extended context memory",
      "API access",
      "Email support",
    ],
    cta: "Start Pro Trial",
    href: "/checkout/plan/pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams and organizations",
    credits: "Unlimited credits",
    features: [
      "Everything in Pro",
      "Dedicated infrastructure",
      "Custom AI training",
      "Team management",
      "SSO & advanced security",
      "SLA guarantees",
      "Dedicated account manager",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e879f9]/30 bg-[#e879f9]/10 mb-6">
              <Sparkles className="w-4 h-4 text-[#e879f9]" />
              <span className="text-sm text-[#e879f9]">Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Choose your <span className="gradient-text">plan</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative bg-card/50 border-border ${plan.popular ? 'border-[#e879f9] ring-1 ring-[#e879f9]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background text-sm font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="pt-8">
                  <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price === "Custom" ? "" : "$"}{plan.price}
                    </span>
                    {plan.price !== "Custom" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-[#e879f9] mt-2">{plan.credits}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#22d3ee] shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90' : 'bg-card border border-border hover:bg-accent'}`}
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Frequently Asked Questions</h2>
            <div className="max-w-2xl mx-auto space-y-6 text-left mt-8">
              <div className="p-6 rounded-xl bg-card/50 border border-border">
                <h3 className="font-medium text-foreground mb-2">What are credits?</h3>
                <p className="text-sm text-muted-foreground">Credits are used for AI operations. Different tasks consume different amounts of credits based on complexity. Unused credits refresh daily.</p>
              </div>
              <div className="p-6 rounded-xl bg-card/50 border border-border">
                <h3 className="font-medium text-foreground mb-2">Can I upgrade or downgrade anytime?</h3>
                <p className="text-sm text-muted-foreground">Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.</p>
              </div>
              <div className="p-6 rounded-xl bg-card/50 border border-border">
                <h3 className="font-medium text-foreground mb-2">Is there a free trial for Pro?</h3>
                <p className="text-sm text-muted-foreground">Yes, Pro comes with a 14-day free trial. No credit card required to start.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
