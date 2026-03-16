/**
 * Device Fingerprint Check API
 * 
 * Validates device fingerprints during signup to prevent
 * multi-account abuse from the same device.
 * 
 * Limit: 3 accounts per device fingerprint
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkDeviceFingerprintLimit, analyzeFingerprintRisk } from '@/lib/device-fingerprint'
import type { DeviceFingerprint } from '@/lib/device-fingerprint'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fingerprint, fingerprintData } = body

    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json(
        { error: 'Invalid fingerprint' },
        { status: 400 }
      )
    }

    // Check device limit
    const limitCheck = await checkDeviceFingerprintLimit(fingerprint)

    // Analyze risk if fingerprint data is provided
    let riskAnalysis = null
    if (fingerprintData) {
      riskAnalysis = analyzeFingerprintRisk(fingerprintData as DeviceFingerprint)
    }

    // Determine if signup should be allowed
    const allowed = limitCheck.allowed && 
      (!riskAnalysis || riskAnalysis.recommendation !== 'block')

    return NextResponse.json({
      allowed,
      limitCheck,
      riskAnalysis,
      message: !allowed 
        ? (limitCheck.message || 'Device fingerprint check failed')
        : 'Device fingerprint verified'
    })
  } catch (error) {
    console.error('Fingerprint check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check device fingerprint',
        allowed: true // Allow on error to prevent blocking legitimate users
      },
      { status: 500 }
    )
  }
}
