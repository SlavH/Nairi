import type { SupabaseClient } from "@supabase/supabase-js"

export interface AtomicPurchaseSuccess {
  ok: true
  creditsSpent: number
  newBalance: number | null
  agent: unknown | null
}

export interface AtomicPurchaseFailure {
  ok: false
  status: number
  body: Record<string, unknown>
}

export type AtomicPurchaseResult = AtomicPurchaseSuccess | AtomicPurchaseFailure

/**
 * Grant an agent through the single SECURITY DEFINER RPC defined in
 * scripts/049_atomic_agent_purchase.sql. The RPC performs the ownership
 * check, credit deduction, purchase record, and creator payout in one
 * transaction, and is idempotent per (user, agent) via UNIQUE(user_id, agent_id).
 * Status mapping: 409 already owned, 402 insufficient credits, 404 unknown agent.
 */
export async function purchaseAgentAtomic(
  supabase: SupabaseClient,
  userId: string,
  agentId: string,
  useCredits: boolean
): Promise<AtomicPurchaseResult> {
  const { data, error } = await supabase.rpc("purchase_agent_atomic", {
    p_user_id: userId,
    p_agent_id: agentId,
    p_use_credits: useCredits,
  })

  if (error) {
    console.error("Atomic agent purchase error:", error)
    return { ok: false, status: 500, body: { error: "Failed to purchase agent" } }
  }

  const result = data as {
    ok?: boolean
    already_owned?: boolean
    error?: string
    required?: number
    available?: number
    credits_spent?: number
    new_balance?: number | null
    agent?: unknown | null
  }

  if (result?.error === "agent_not_found") {
    return { ok: false, status: 404, body: { error: "Agent not found" } }
  }

  if (result?.error === "insufficient_credits") {
    return {
      ok: false,
      status: 402,
      body: {
        error: "Insufficient credits",
        required: result.required ?? 0,
        available: result.available ?? 0,
      },
    }
  }

  if (!result?.ok) {
    console.error("Atomic agent purchase failed:", result)
    return { ok: false, status: 500, body: { error: "Failed to purchase agent" } }
  }

  if (result.already_owned) {
    return { ok: false, status: 409, body: { error: "You already own this agent" } }
  }

  return {
    ok: true,
    creditsSpent: result.credits_spent ?? 0,
    newBalance: result.new_balance ?? null,
    agent: result.agent ?? null,
  }
}
