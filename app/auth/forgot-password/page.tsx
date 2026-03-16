"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessibleInput } from "@/components/ui/accessible-input"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const t = useTranslation()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL 
          ? `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL}/auth/reset-password`
          : `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setIsSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <Image src="/images/nairi-logo-header.jpg" alt="Nairi" width={80} height={80} className="mb-4" />
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#22d3ee]/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-[#22d3ee]" />
              </div>
              <CardTitle className="text-xl text-foreground">{t.forgotPassword?.checkEmail || "Check your email"}</CardTitle>
              <CardDescription>
                {t.forgotPassword?.emailSent || "We've sent a password reset link to"} <span className="text-foreground font-medium">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t.forgotPassword?.checkSpam || "Didn't receive the email? Check your spam folder or try again."}
              </p>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setIsSuccess(false)}
              >
                {t.forgotPassword?.tryAgain || "Try another email"}
              </Button>
              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-[#e879f9] hover:underline">
                  {t.forgotPassword?.backToLogin || "Back to login"}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/images/nairi-logo-header.jpg" alt="Nairi" width={80} height={80} className="mb-4" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent">
            {t.forgotPassword?.title || "Reset Password"}
          </h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">{t.forgotPassword?.cardTitle || "Forgot your password?"}</CardTitle>
            <CardDescription>{t.forgotPassword?.cardDescription || "Enter your email and we'll send you a reset link."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-4">
                <AccessibleInput
                  label={t.login.email}
                  type="email"
                  placeholder={t.login.email}
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error || undefined}
                  className="bg-background/50"
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (t.forgotPassword?.sending || "Sending...") : (t.forgotPassword?.sendLink || "Send Reset Link")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            {t.forgotPassword?.backToLogin || "Back to login"}
          </Link>
        </div>
      </div>
    </div>
  )
}
