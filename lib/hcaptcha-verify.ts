// Server-side hCaptcha verification

export async function verifyHCaptcha(token: string): Promise<{
  success: boolean
  error?: string
}> {
  const secret = process.env.HCAPTCHA_SECRET_KEY
  
  if (!secret) {
    console.error('HCAPTCHA_SECRET_KEY not configured')
    // In development, allow without captcha
    if (process.env.NODE_ENV === 'development') {
      return { success: true }
    }
    return { success: false, error: 'Captcha verification not configured' }
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
