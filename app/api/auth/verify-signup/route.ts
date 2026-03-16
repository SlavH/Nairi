import { NextResponse } from 'next/server'
import { verifyHCaptcha } from '@/lib/hcaptcha-verify'
import { checkIPSignupLimit, checkIPTempmailLimit } from '@/lib/ip-rate-limiter'

export async function POST(req: Request) {
  try {
    const { email, captchaToken } = await req.json()
    
    if (!email || !captchaToken) {
      return NextResponse.json(
        { error: 'Email and captcha token are required' },
        { status: 400 }
      )
    }
    
    // Get client IP
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'
    
    // 1. Verify hCaptcha
    const captchaResult = await verifyHCaptcha(captchaToken)
    if (!captchaResult.success) {
      return NextResponse.json(
        { error: captchaResult.error || 'Captcha verification failed' },
        { status: 403 }
      )
    }
    
    // 2. Check IP-based daily signup limit
    const ipLimitCheck = await checkIPSignupLimit(ip)
    if (!ipLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: ipLimitCheck.message,
          attemptsToday: ipLimitCheck.attemptsToday,
          limit: ipLimitCheck.limit
        },
        { status: 429 }
      )
    }
    
    // 3. Check cross-domain tempmail limit from same IP
    const tempmailLimitCheck = await checkIPTempmailLimit(ip, email)
    if (!tempmailLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: tempmailLimitCheck.message,
          tempmailAccountsFromIP: tempmailLimitCheck.tempmailAccountsFromIP,
          limit: tempmailLimitCheck.limit
        },
        { status: 429 }
      )
    }
    
    // All checks passed
    return NextResponse.json({ 
      success: true,
      ip,
      checks: {
        captcha: true,
        ipLimit: true,
        tempmailLimit: true
      }
    })
    
  } catch (error) {
    console.error('Signup verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
