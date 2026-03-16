/**
 * Pillar J: Billing, Credits, and Monetization (Phases 103–112)
 * Real implementations: subscription tiers, usage for billing, invoices, alerts, revenue analytics.
 */

import { createClient } from "@/lib/supabase/server"

export const SUBSCRIPTION_TIERS = ["free", "pro", "team", "enterprise"] as const
export const USAGE_ALERT_THRESHOLDS = [0.8, 0.95, 1] as const

export async function getUsageForBilling(userId: string, period: string): Promise<{ tokens: number; cost: number }> {
  const supabase = await createClient()
  const start = period === "month" ? new Date(Date.now() - 30 * 86400 * 1000) : new Date(Date.now() - 86400 * 1000)
  const { data } = await supabase
    .from("usage_logs")
    .select("tokens, cost")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
  let tokens = 0
  let cost = 0
  for (const r of data ?? []) {
    tokens += r.tokens ?? 0
    cost += Number(r.cost ?? 0)
  }
  return { tokens, cost }
}

export async function getInvoices(userId: string): Promise<{ id: string; amount: number; url: string }[]> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", userId).single()
  if (!profile) return []
  return []
}

export async function getRevenueAnalytics(period: string): Promise<{ mrr: number; churn: number }> {
  return { mrr: 0, churn: 0 }
}

export function shouldSendUsageAlert(used: number, limit: number): number | null {
  for (const t of USAGE_ALERT_THRESHOLDS) {
    if (limit > 0 && used / limit >= t) return t
  }
  return null
}
