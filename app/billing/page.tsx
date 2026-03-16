'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Zap,
  Crown,
  Rocket,
  Check,
  CreditCard,
  CalendarDays,
  ArrowLeft,
  AlertTriangle,
  Download,
} from 'lucide-react'

export default function BillingPage() {
  const [currentPlan] = useState('pro')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Zap,
      features: ['100 messages/month', '10 image generations', '5 code generations', 'Basic support', 'Community access'],
      gradient: 'from-muted-foreground/80 to-muted-foreground',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$20',
      period: '/month',
      icon: Crown,
      popular: true,
      features: ['Unlimited messages', '500 image generations', 'Unlimited code generations', 'Priority support', 'Advanced models', 'API access', 'Custom agents'],
      gradient: 'from-[#22d3ee] to-[#e879f9]',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      icon: Rocket,
      features: ['Everything in Pro', 'Unlimited everything', 'Dedicated support', 'Custom integrations', 'SLA guarantee', 'Team management', 'Advanced analytics', 'White-label options'],
      gradient: 'from-[#e879f9] to-[#f472b6]',
    },
  ]

  const invoices = [
    { id: 'INV-001', date: 'Jan 1, 2026', amount: '$20.00', status: 'Paid' },
    { id: 'INV-002', date: 'Dec 1, 2025', amount: '$20.00', status: 'Paid' },
    { id: 'INV-003', date: 'Nov 1, 2025', amount: '$20.00', status: 'Paid' },
  ]

  const paymentMethods = [
    { id: 1, type: 'visa', last4: '4242', expiry: '12/26', isDefault: true },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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
        {/* Current Plan Banner */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-[#e879f9]/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[#e879f9]" />
                  <span className="text-2xl font-bold">Pro Plan</span>
                </div>
                <p className="text-muted-foreground mt-1">$20/month - Renews on Feb 1, 2026</p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm text-muted-foreground mb-1">Usage This Month</p>
                <p className="text-lg font-semibold">1,234 / Unlimited messages</p>
                <p className="text-sm text-muted-foreground">156 / 500 images</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <Card
                key={plan.id}
                className={`relative transition-all ${plan.id === currentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#22d3ee] to-[#e879f9] text-white border-0">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-2`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm py-1.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full min-h-[44px] ${
                      plan.id === currentPlan
                        ? ''
                        : 'bg-gradient-to-r from-[#22d3ee] to-[#e879f9] text-white hover:opacity-90'
                    }`}
                    variant={plan.id === currentPlan ? 'secondary' : 'default'}
                    disabled={plan.id === currentPlan}
                  >
                    {plan.id === currentPlan ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Payment Methods + Billing History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-muted rounded flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-sm">{'****'} {method.last4}</p>
                      <p className="text-xs text-muted-foreground">Expires {method.expiry}</p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full min-h-[44px] border-dashed bg-transparent">
                + Add Payment Method
              </Button>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                Billing History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{invoice.id}</p>
                    <p className="text-xs text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{invoice.amount}</span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-xs">
                      {invoice.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Download invoice ${invoice.id}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Cancel Subscription */}
        <Card className="mt-8 border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Cancel Subscription</p>
                  <p className="text-sm text-muted-foreground">Your subscription will remain active until the end of the billing period</p>
                </div>
              </div>
              <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 bg-transparent min-h-[44px] shrink-0">
                Cancel Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
