/**
 * Device Fingerprinting System
 * 
 * Generates unique device fingerprints to detect multi-account abuse
 * from the same device. Uses browser characteristics to create a
 * stable identifier that persists across sessions.
 * 
 * Limits: 3 accounts per device fingerprint
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Generate device fingerprint from browser characteristics
 * This runs on the client side and sends the fingerprint to the server
 */
export interface DeviceFingerprint {
  userAgent: string
  language: string
  timezone: string
  screen: {
    width: number
    height: number
    colorDepth: number
  }
  canvas: string
  webgl: string
  fonts: string[]
  plugins: string[]
  audio: string
}

/**
 * Hash a fingerprint object into a stable string identifier
 */
export function hashFingerprint(fingerprint: DeviceFingerprint): string {
  const str = JSON.stringify(fingerprint)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Check if a device fingerprint has exceeded the account limit
 * Limit: 3 accounts per device
 */
export async function checkDeviceFingerprintLimit(
  fingerprint: string
): Promise<{
  allowed: boolean
  count: number
  limit: number
  message?: string
}> {
  const supabase = await createClient()
  
  try {
    // Count accounts with this fingerprint
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('device_fingerprint', fingerprint)
    
    if (error) {
      console.error('Error checking device fingerprint:', error)
      // Allow on error to prevent blocking legitimate users
      return {
        allowed: true,
        count: 0,
        limit: 3,
        message: 'Fingerprint check failed, allowing signup'
      }
    }
    
    const accountCount = count || 0
    const limit = 3
    const allowed = accountCount < limit
    
    return {
      allowed,
      count: accountCount,
      limit,
      message: allowed 
        ? `${limit - accountCount} account(s) remaining for this device`
        : `Device limit reached. Maximum ${limit} accounts per device.`
    }
  } catch (error) {
    console.error('Device fingerprint check error:', error)
    // Allow on error
    return {
      allowed: true,
      count: 0,
      limit: 3,
      message: 'Fingerprint check failed, allowing signup'
    }
  }
}

/**
 * Store device fingerprint for a user
 */
export async function storeDeviceFingerprint(
  userId: string,
  fingerprint: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ device_fingerprint: fingerprint })
      .eq('id', userId)
    
    if (error) {
      console.error('Error storing device fingerprint:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Store fingerprint error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all accounts associated with a device fingerprint
 */
export async function getAccountsByFingerprint(
  fingerprint: string
): Promise<{
  accounts: Array<{
    id: string
    email: string
    created_at: string
  }>
  count: number
}> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('device_fingerprint', fingerprint)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching accounts by fingerprint:', error)
      return { accounts: [], count: 0 }
    }
    
    return {
      accounts: data || [],
      count: data?.length || 0
    }
  } catch (error) {
    console.error('Get accounts by fingerprint error:', error)
    return { accounts: [], count: 0 }
  }
}

/**
 * Detect suspicious fingerprint patterns
 * Returns risk score: 0 (safe) to 100 (high risk)
 */
export function analyzeFingerprintRisk(fingerprint: DeviceFingerprint): {
  riskScore: number
  flags: string[]
  recommendation: 'allow' | 'review' | 'block'
} {
  const flags: string[] = []
  let riskScore = 0
  
  // Check for headless browser indicators
  if (fingerprint.userAgent.includes('HeadlessChrome')) {
    flags.push('Headless browser detected')
    riskScore += 50
  }
  
  // Check for automation tools
  const automationKeywords = ['selenium', 'puppeteer', 'playwright', 'webdriver']
  if (automationKeywords.some(keyword => 
    fingerprint.userAgent.toLowerCase().includes(keyword)
  )) {
    flags.push('Automation tool detected')
    riskScore += 40
  }
  
  // Check for suspicious screen dimensions
  if (fingerprint.screen.width === 0 || fingerprint.screen.height === 0) {
    flags.push('Invalid screen dimensions')
    riskScore += 30
  }
  
  // Check for missing canvas fingerprint
  if (!fingerprint.canvas || fingerprint.canvas.length < 10) {
    flags.push('Missing or invalid canvas fingerprint')
    riskScore += 20
  }
  
  // Check for missing WebGL
  if (!fingerprint.webgl || fingerprint.webgl.length < 10) {
    flags.push('Missing or invalid WebGL fingerprint')
    riskScore += 15
  }
  
  // Check for no plugins (suspicious for real browsers)
  if (fingerprint.plugins.length === 0) {
    flags.push('No browser plugins detected')
    riskScore += 10
  }
  
  // Check for no fonts (very suspicious)
  if (fingerprint.fonts.length === 0) {
    flags.push('No fonts detected')
    riskScore += 25
  }
  
  // Determine recommendation
  let recommendation: 'allow' | 'review' | 'block'
  if (riskScore >= 70) {
    recommendation = 'block'
  } else if (riskScore >= 40) {
    recommendation = 'review'
  } else {
    recommendation = 'allow'
  }
  
  return {
    riskScore,
    flags,
    recommendation
  }
}
