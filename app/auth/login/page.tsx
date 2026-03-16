"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessibleInput } from "@/components/ui/accessible-input"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense, useEffect } from "react"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"
import { LiveRegion } from "@/components/ui/live-region"
import { Chrome } from "lucide-react"

function LoginForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/nav"

  // If user is already signed in, redirect so they don't see login again until they log out
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCheckingSession(false)
      if (user) router.replace(redirectTo)
    })
  }, [router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setStatusMessage("Signing in...")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      setStatusMessage("Sign in successful! Redirecting...")
      router.push(redirectTo)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)
      setStatusMessage(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setError(null)
    setStatusMessage("Redirecting to Google...")
    const redirectToUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(redirectTo)}`
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
            {t.login.welcomeBack}
          </h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">{t.login.signInTitle}</CardTitle>
            <CardDescription>{t.login.signInDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <AccessibleInput
                  label={t.login.email}
                  type="email"
                  placeholder={t.login.email}
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error && email === "" ? error : undefined}
                  className="bg-background/50"
                />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium leading-none">{t.login.password}</label>
                    <Link href="/auth/forgot-password" className="text-xs text-[#e879f9] hover:underline">
                      {t.login.forgotPassword || "Forgot password?"}
                    </Link>
                  </div>
                  <AccessibleInput
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={error && password === "" ? error : undefined}
                    className="bg-background/50"
                    wrapperClassName="gap-0"
                  />
                </div>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? t.login.signingIn : t.login.signInButton}
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
                  onClick={handleGoogleLogin}
                  aria-label="Sign in with Google"
                >
                  <Chrome className="h-4 w-4" />
                  {t.auth?.google ?? "Google"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {t.login.dontHaveAccount}{" "}
                <Link href="/auth/sign-up" className="text-primary hover:underline">
                  {t.login.signUp}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            {t.login.backToHome}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
