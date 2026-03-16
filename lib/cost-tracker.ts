// Cost tracking system for AI generations

import { createClient } from "@/lib/supabase/server"

export interface GenerationCost {
  type: 'text' | 'image' | 'video' | 'audio' | 'code' | 'simulation' | 'document' | 'presentation'
  cost: number // in USD
  model?: string
  tokens?: number
  metadata?: Record<string, any>
}

// Cost per generation type (approximate)
export const GENERATION_COSTS = {
  text: 0.001, // $0.001 per request (Groq free tier)
  image: 0.02, // $0.02 per image (Pollinations free)
  video: 0.30, // $0.30 per video (HuggingFace)
  audio: 0.005, // $0.005 per audio (Streamlabs free)
  code: 0.002, // $0.002 per code gen
  simulation: 0.001, // $0.001 per simulation
  document: 0.002, // $0.002 per document
  presentation: 0.003, // $0.003 per presentation
}

/**
 * Log a generation cost to the database
 */
export async function logGenerationCost(
  userId: string,
  generation: GenerationCost
): Promise<void> {
  try {
    const supabase = await createClient()
    
    await supabase.from('usage_logs').insert({
      user_id: userId,
      generation_type: generation.type,
      cost: generation.cost,
      model: generation.model,
      tokens: generation.tokens,
      metadata: generation.metadata,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to log generation cost:', error)
  }
}

/**
 * Get user's total cost for the current month
 */
export async function getMonthlyUsageCost(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const { data, error } = await supabase
      .from('usage_logs')
      .select('cost')
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth.toISOString())
    
    if (error) return 0
    return data?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0
  } catch (error) {
    return 0
  }
}

export interface UserUsageStats {
  monthlyCost: number
  totalLogs: number
  byType: Record<string, number>
}

/**
 * Get usage statistics for a user (current month and breakdown by type)
 */
export async function getUserUsageStats(userId: string): Promise<UserUsageStats> {
  try {
    const monthlyCost = await getMonthlyUsageCost(userId)
    const supabase = await createClient()
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const { data: logs, error } = await supabase
      .from('usage_logs')
      .select('cost, generation_type')
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth.toISOString())
    if (error) return { monthlyCost, totalLogs: 0, byType: {} }
    const byType: Record<string, number> = {}
    for (const log of logs || []) {
      const t = log.generation_type || 'unknown'
      byType[t] = (byType[t] || 0) + (log.cost || 0)
    }
    return {
      monthlyCost,
      totalLogs: logs?.length || 0,
      byType,
    }
  } catch {
    return { monthlyCost: 0, totalLogs: 0, byType: {} }
  }
}

/**
 * Check if user has exceeded their monthly cost limit
 */
export async function checkCostLimit(
  userId: string,
  userPlan: string,
  additionalCost: number
): Promise<{ allowed: boolean; currentCost: number; limit: number; message?: string }> {
  try {
    const currentCost = await getMonthlyUsageCost(userId)
    const limits: Record<string, number> = { free: 5.00, pro: 50.00, enterprise: -1 }
    const limit = limits[userPlan.toLowerCase()] || limits.free
    
    if (limit === -1) return { allowed: true, currentCost, limit }
    
    const projectedCost = currentCost + additionalCost
    if (projectedCost > limit) {
      return {
        allowed: false,
        currentCost,
        limit,
        message: `Monthly cost limit exceeded. You've used $${currentCost.toFixed(2)} of your $${limit.toFixed(2)} limit.`
      }
    }
    
    return { allowed: true, currentCost, limit }
  } catch (error) {
    return { allowed: true, currentCost: 0, limit: 0 }
  }
}
