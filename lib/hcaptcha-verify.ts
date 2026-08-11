// Server-side hCaptcha verification

export async function verifyHCaptcha(token: string): Promise<{
  success: boolean
  error?: string
}> {
  const secret = process.env.HCAPTCHA_SECRET_KEY

  if (!secret) {
    // No secret configured → captcha is in test/disabled mode.
    // Allow signups but warn loudly so this is never mistaken for protection.
    // Set HCAPTCHA_SECRET_KEY (and a matching NEXT_PUBLIC_HCAPTCHA_SITE_KEY)
    // to enable real bot protection.
    console.warn(
      '[hcaptcha] HCAPTCHA_SECRET_KEY not configured — captcha verification disabled (test mode). Signups are NOT protected by captcha.'
    )
    return { success: true }
  }
  
  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secret}&response=${token}`,
    })
    
    const data = await response.json()
    
    if (data.success) {
      return { success: true }
    } else {
      return { 
        success: false, 
        error: data['error-codes']?.join(', ') || 'Captcha verification failed' 
      }
    }
  } catch (error) {
    console.error('hCaptcha verification error:', error)
    return { success: false, error: 'Captcha verification failed' }
  }
}
