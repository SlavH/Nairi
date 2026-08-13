// Server-side hCaptcha verification

export async function verifyHCaptcha(token: string): Promise<{
  success: boolean
  error?: string
}> {
  const secret = process.env.HCAPTCHA_SECRET_KEY

  if (!secret) {
    // No secret configured → captcha is disabled. In development this is the
    // test mode that allows signups through (with a loud warning). In every
    // other environment we FAIL CLOSED so signups are never unprotected.
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[hcaptcha] HCAPTCHA_SECRET_KEY not configured — captcha verification disabled (test mode). Signups are NOT protected by captcha.'
      )
      return { success: true }
    }
    console.warn(
      '[hcaptcha] HCAPTCHA_SECRET_KEY not configured — captcha verification failed closed. Set HCAPTCHA_SECRET_KEY (and a matching NEXT_PUBLIC_HCAPTCHA_SITE_KEY) to enable real bot protection.'
    )
    return { success: false, error: 'Captcha not configured' }
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
