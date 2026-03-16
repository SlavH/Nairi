"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home, Compass } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", paddingLeft: "max(1.5rem, env(safe-area-inset-left))", paddingRight: "max(1.5rem, env(safe-area-inset-right))" }}>
      <div className="page-container max-w-lg text-center space-y-6">
        <div className="section-card p-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            An unexpected error occurred. You can try again or return home.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} className="btn-primary-gradient gap-2 min-h-[44px] sm:min-h-0 touch-manipulation" aria-label="Try again">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline" className="gap-2 border-border min-h-[44px] sm:min-h-0 touch-manipulation">
              <Link href="/nav" aria-label="Open navigation">
                <Compass className="h-4 w-4" />
                Open navigation
              </Link>
            </Button>
            <Button asChild variant="ghost" className="gap-2 text-muted-foreground min-h-[44px] sm:min-h-0 touch-manipulation">
              <Link href="/" aria-label="Go to home">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
