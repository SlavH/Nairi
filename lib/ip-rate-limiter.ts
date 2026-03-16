// IP-based rate limiting for signup attempts

import { createClient } from "@/lib/supabase/server"

export interface SignupAttempt {
  ip: string
  email: string
  success: boolean
  timestamp: string
}

/**
 * Check if IP has exceeded daily signup limit
 */
export async function checkIPSignupLimit(ip: string): Promise<{
  allowed: boolean
  attemptsToday: number
  limit: number
  message?: string
}> {
  try {
    const supabase = await createClient()
    
    // Get start of today (UTC)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Count successful signups from this IP today
    const { data, error } = await supabase
      .from('signup_attempts')
      .select('id')
      .eq('ip_address', ip)
      .eq('success', true)
      .gte('created_at', startOfDay.toISOString())
    
    if (error) {
      console.error('Failed to check IP signup limit:', error)
      // Fail open - allow signup if we can't check
      return { allowed: true, attemptsToday: 0, limit: 5 }
    }
    
    const attemptsToday = data?.length || 0
    const limit = 5 // 5 signups per IP per day
    
    if (attemptsToday >= limit) {
      return {
        allowed: false,
        attemptsToday,
        limit,
        message: `Too many accounts created from this location today. Please try again tomorrow or contact support if you need assistance.`
      }
    }
    
    return { allowed: true, attemptsToday, limit }
  } catch (error) {
    console.error('Error checking IP signup limit:', error)
    // Fail open
    return { allowed: true, attemptsToday: 0, limit: 5 }
  }
}

/**
 * Log a signup attempt
 */
export async function logSignupAttempt(
  ip: string,
  email: string,
  success: boolean,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const supabase = await createClient()
    
    await supabase.from('signup_attempts').insert({
      ip_address: ip,
      email: email.toLowerCase(),
      success,
      metadata,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to log signup attempt:', error)
    // Don't throw - logging failure shouldn't block signup
  }
}

/**
 * Check cross-domain tempmail usage from same IP
 */
export async function checkIPTempmailLimit(ip: string, email: string): Promise<{
  allowed: boolean
  tempmailAccountsFromIP: number
  limit: number
  message?: string
}> {
  try {
    const supabase = await createClient()
    
    // Get all profiles from this IP
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('email, is_tempmail')
      .eq('ip_address', ip)
    
    if (error) {
      console.error('Failed to check IP tempmail limit:', error)
      return { allowed: true, tempmailAccountsFromIP: 0, limit: 3 }
    }
    
    // Count tempmail accounts from this IP
    const tempmailCount = profiles?.filter(p => p.is_tempmail).length || 0
    const limit = 3 // Max 3 tempmail accounts per IP
    
    // Check if current email is tempmail
    const domain = email.split('@')[1]?.toLowerCase()
    const isCurrentTempmail = await isTempmailDomain(domain)
    
    if (isCurrentTempmail && tempmailCount >= limit) {
      return {
        allowed: false,
        tempmailAccountsFromIP: tempmailCount,
        limit,
        message: `Too many temporary email accounts from this location. Please use a permanent email address.`
      }
    }
    
    return { allowed: true, tempmailAccountsFromIP: tempmailCount, limit }
  } catch (error) {
    console.error('Error checking IP tempmail limit:', error)
    return { allowed: true, tempmailAccountsFromIP: 0, limit: 3 }
  }
}

// Helper to check if domain is tempmail
async function isTempmailDomain(domain: string): Promise<boolean> {
  const { checkTempmailRisk } = await import('@/lib/tempmail-detection')
  const result = await checkTempmailRisk(`test@${domain}`)
  return result.isTempmail
}
