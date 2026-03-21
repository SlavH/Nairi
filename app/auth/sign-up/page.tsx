"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessibleInput } from "@/components/ui/accessible-input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"
import { checkTempmailRisk, logTempmailUsage } from "@/lib/tempmail-detection"
import { HCaptcha } from "@/components/hcaptcha-wrapper"
import { LiveRegion } from "@/components/ui/live-region"
import { Chrome } from "lucide-react"

export default function SignUpPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  // If user is already signed in, redirect so they don't see sign-up again until they log out
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: unknown } }) => {
      setCheckingSession(false)
      if (user) router.replace("/nav")
    })
  }, [router])

  const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001' // Test key

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setStatusMessage("Creating your account...")

    // Normalize email - trim whitespace and lowercase
    const normalizedEmail = email.trim().toLowerCase()

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      const errorMsg = t.signUp.invalidEmailFormat || "Please enter a valid email address"
      setError(errorMsg)
      setStatusMessage(`Error: ${errorMsg}`)
      setIsLoading(false)
      return
    }

    // Check for disposable/temporary email domains with risk assessment
    const tempmailCheck = await checkTempmailRisk(normalizedEmail)
    
    if (tempmailCheck.isTempmail) {
      // Log tempmail usage for monitoring
      await logTempmailUsage(normalizedEmail, 'signup', {
        riskLevel: tempmailCheck.riskLevel,
        accountsFromDomain: tempmailCheck.accountsFromDomain
      })
      
      // Block only if risk is critical
      if (!tempmailCheck.allowed) {
        const errorMsg = tempmailCheck.reason || "This email domain has been used excessively. Please use a different email provider."
        setError(errorMsg)
        setStatusMessage(`Error: ${errorMsg}`)
        setIsLoading(false)
        return
      }
      
      // For medium/high risk, show warning but allow signup
      if (tempmailCheck.riskLevel === 'medium' || tempmailCheck.riskLevel === 'high') {
        console.warn('[TEMPMAIL WARNING]', tempmailCheck.reason)
        // Could show a warning toast here in the future
      }
    }

    if (password !== repeatPassword) {
      const errorMsg = t.signUp.passwordsDontMatch
      setError(errorMsg)
      setStatusMessage(`Error: ${errorMsg}`)
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      const errorMsg = t.signUp.passwordTooShort
      setError(errorMsg)
      setStatusMessage(`Error: ${errorMsg}`)
      setIsLoading(false)
      return
    }
    
    // Check captcha token (skip in development for testing)
    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
    if (!captchaToken && !isDev) {
      const errorMsg = "Please complete the captcha verification"
      setError(errorMsg)
      setStatusMessage(`Error: ${errorMsg}`)
      setIsLoading(false)
      return
    }
    
    // Use a test token in development if no captcha token
    const tokenToUse = captchaToken || (isDev ? 'dev-test-token' : null)

    try {
      // Verify captcha and check IP limits on backend
      const verifyResponse = await fetch('/api/auth/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          captchaToken: tokenToUse,
        }),
      })
      
      const verifyData = await verifyResponse.json()
      
      if (!verifyResponse.ok) {
        const errorMsg = verifyData.error || 'Verification failed'
        setError(errorMsg)
        setStatusMessage(`Error: ${errorMsg}`)
        setIsLoading(false)
        setCaptchaToken(null) // Reset captcha
        return
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/nav`,
          data: {
            full_name: fullName.trim(),
          },
        },
      })
      
      if (error) {
        throw error
      }
      
      // Check if user already exists (Supabase returns user but no session for existing users)
      if (data?.user && !data?.session && data.user.identities?.length === 0) {
        const errorMsg = t.signUp.emailAlreadyInUse || "This email is already registered. Please sign in instead."
        setError(errorMsg)
        setStatusMessage(`Error: ${errorMsg}`)
        setIsLoading(false)
        return
      }
      
      setStatusMessage("Account created successfully! Redirecting...")
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      
      // Provide user-friendly error messages
      // Handle Supabase's "Email address 'X' is invalid" error which can occur due to:
      // - Email provider restrictions in Supabase dashboard
      // - CAPTCHA validation issues
      // - Rate limiting on sign-ups
      if (errorMessage.toLowerCase().includes("email") && 
          (errorMessage.toLowerCase().includes("invalid") || errorMessage.includes("is invalid"))) {
        // Check if it's specifically the Supabase email validation error
        let finalError: string
        if (errorMessage.includes("Email address") && errorMessage.includes("is invalid")) {
          finalError = t.signUp.emailServiceError || "We're having trouble verifying this email address. Please ensure you're using a valid email and try again. If the problem persists, contact support."
        } else if (errorMessage.includes("already registered") || errorMessage.includes("already been registered")) {
          finalError = t.signUp.emailAlreadyInUse || "This email is already registered. Please sign in instead."
        } else if (errorMessage.includes("rate") || errorMessage.includes("too many")) {
          finalError = "Too many sign-up attempts. Please wait a few minutes and try again."
        } else if (errorMessage.includes("captcha") || errorMessage.includes("CAPTCHA")) {
          finalError = "Verification failed. Please refresh the page and try again."
        } else {
          finalError = errorMessage
        }
        setError(finalError)
        setStatusMessage(`Error: ${finalError}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    const supabase = createClient()
    setError(null)
    setStatusMessage("Redirecting to Google...")
    const redirectToUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent("/nav")}`
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectToUrl },
    })
    if (oauthError) {
      setError(oauthError.message)
      setStatusMessage(`Error: ${oauthError.message}`)
      return
    }
    if (data?.url) window.location.href = data.url
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Checking session" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <LiveRegion politeness={error ? "assertive" : "polite"} role={error ? "alert" : "status"}>
        {statusMessage}
      </LiveRegion>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/images/nairi-logo-header.jpg" alt="Nairi" width={80} height={80} className="mb-4" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent">
            {t.signUp.createAccount}
          </h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">{t.signUp.signUpTitle}</CardTitle>
            <CardDescription>{t.signUp.signUpDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <AccessibleInput
                  label={t.signUp.fullName}
                  type="text"
                  placeholder={t.signUp.fullName}
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background/50"
                />
                <AccessibleInput
                  label={t.signUp.email}
                  type="email"
                  placeholder={t.signUp.email}
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                />
                <AccessibleInput
                  label={t.signUp.password}
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  description="Minimum 6 characters"
                  className="bg-background/50"
                />
                <AccessibleInput
                  label={t.signUp.confirmPassword}
                  type="password"
                  required
                  autoComplete="new-password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  error={repeatPassword && password !== repeatPassword ? "Passwords do not match" : undefined}
                  className="bg-background/50"
                />
                
                <HCaptcha
                  sitekey={HCAPTCHA_SITE_KEY}
                  onVerify={(token) => {
                    setCaptchaToken(token)
                    setError(null)
                  }}
                  onError={() => {
                    setCaptchaToken(null)
                    setError("Captcha verification failed. Please try again.")
                  }}
                  onExpire={() => {
                    setCaptchaToken(null)
                    setError("Captcha expired. Please verify again.")
                  }}
                />
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? t.signUp.creatingAccount : t.signUp.createAccountButton}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t.auth?.orContinueWith ?? "Or continue with"}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border gap-2"
                  disabled={isLoading}
                  onClick={handleGoogleSignUp}
                  aria-label="Sign up with Google"
                >
                  <Chrome className="h-4 w-4" />
                  {t.auth?.google ?? "Google"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t.signUp.alreadyHaveAccount}{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  {t.signUp.signIn}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t.signUp.backToHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
