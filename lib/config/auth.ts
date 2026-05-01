/**
 * Auth configuration for Nairi.
 * Uses Supabase Auth (sign up, sign in, email verification, captcha).
 * No bypass mode - all features require real authentication.
 */

export const config = {
  auth: {
    // Supabase Auth is required - no bypass mode
    requireAuth: true,
    
    // For captcha (hcaptcha or cloudflare turnstile):
    // Set in Supabase Dashboard → Authentication → Settings → Security & Policy
    captchaEnabled: false, // Set to true when you configure captcha
    
    // Email verification:
    // Enable in Supabase Dashboard → Authentication → Settings → Email Auth
    emailVerificationRequired: true,
  }
}
