"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"
import { CheckCircle, Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
  const t = useTranslation()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // No valid session, redirect to forgot password
        router.push("/auth/forgot-password")
      }
    }
    checkSession()
  }, [router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(t.signUp.passwordsDontMatch)
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t.signUp.passwordTooShort)
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
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
                <CheckCircle className="w-8 h-8 text-[#22d3ee]" />
              </div>
              <CardTitle className="text-xl text-foreground">{t.resetPassword?.success || "Password Updated"}</CardTitle>
              <CardDescription>
                {t.resetPassword?.successMessage || "Your password has been successfully updated."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
              >
                <Link href="/auth/login">{t.resetPassword?.continueToLogin || "Continue to Login"}</Link>
              </Button>
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
            {t.resetPassword?.title || "Set New Password"}
          </h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">{t.resetPassword?.cardTitle || "Create new password"}</CardTitle>
            <CardDescription>{t.resetPassword?.cardDescription || "Enter your new password below."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">{t.resetPassword?.newPassword || "New Password"}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">{t.resetPassword?.confirmPassword || "Confirm New Password"}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (t.resetPassword?.updating || "Updating...") : (t.resetPassword?.updatePassword || "Update Password")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
            {t.login.backToHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
