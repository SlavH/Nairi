// Plan limits and feature access control

export type PlanType = 'free' | 'pro' | 'enterprise'

export interface PlanLimits {
  // Generation limits
  textGeneration: boolean
  imageGeneration: boolean
  videoGeneration: boolean
  audioGeneration: boolean
  codeGeneration: boolean
  
  // Usage limits
  messagesPerDay: number
  messagesPerConversation: number
  exportsPerMonth: number
  
  // Cost limits
  monthlyCostLimit: number // in USD
  
  // Feature access
  voiceMode: boolean
  simulations: boolean
  presentations: boolean
  documents: boolean
  
  // Quality limits
  maxImageResolution: string
  maxVideoLength: number // in seconds
  maxAudioLength: number // in seconds
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    // Generation access
    textGeneration: true,
    imageGeneration: true,
    videoGeneration: true, // ENABLED with degraded fallback (image sequence) - FREE via Pollinations
    audioGeneration: true,
    codeGeneration: true,
    
    // Usage limits
    messagesPerDay: 50,
    messagesPerConversation: 100,
    exportsPerMonth: 5,
    
    // Cost limits
    monthlyCostLimit: 5.00, // $5/month max
    
    // Feature access
    voiceMode: true,
    simulations: true,
    presentations: true,
    documents: true,
    
    // Quality limits
    maxImageResolution: '512x512',
    maxVideoLength: 3, // 3 seconds max on free tier (image sequence fallback)
    maxAudioLength: 30, // 30 seconds max
  },
  
  pro: {
    // Generation access
    textGeneration: true,
    imageGeneration: true,
    videoGeneration: true,
    audioGeneration: true,
    codeGeneration: true,
    
    // Usage limits
    messagesPerDay: 500,
    messagesPerConversation: 500,
    exportsPerMonth: 100,
    
    // Cost limits
    monthlyCostLimit: 50.00, // $50/month max
    
    // Feature access
    voiceMode: true,
    simulations: true,
    presentations: true,
    documents: true,
    
    // Quality limits
    maxImageResolution: '1024x1024',
    maxVideoLength: 30, // 30 seconds
    maxAudioLength: 300, // 5 minutes
  },
  
  enterprise: {
    // Generation access
    textGeneration: true,
    imageGeneration: true,
    videoGeneration: true,
    audioGeneration: true,
    codeGeneration: true,
    
    // Usage limits
    messagesPerDay: -1, // Unlimited
    messagesPerConversation: -1, // Unlimited
    exportsPerMonth: -1, // Unlimited
    
    // Cost limits
    monthlyCostLimit: -1, // Unlimited
    
    // Feature access
    voiceMode: true,
    simulations: true,
    presentations: true,
    documents: true,
    
    // Quality limits
    maxImageResolution: '1024x1024',
    maxVideoLength: 120, // 2 minutes
    maxAudioLength: 600, // 10 minutes
  },
}

// Helper function to get user's plan limits
export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  const planType = (plan?.toLowerCase() || 'free') as PlanType
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free
}

// Helper function to check if feature is available for plan
export function isFeatureAvailable(
  plan: string | null | undefined,
  feature: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  
  // For boolean features
  if (typeof value === 'boolean') {
    return value
  }
  
  // For numeric limits (-1 means unlimited)
  if (typeof value === 'number') {
    return value !== 0
  }
  
  return true
}

// Helper function to get upgrade message
export function getUpgradeMessage(feature: string): string {
  return `${feature} is only available on Pro and Enterprise plans. Upgrade to unlock this feature.`
}
