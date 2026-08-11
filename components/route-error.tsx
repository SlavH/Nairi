"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  message = "An unexpected error occurred. Try again or return home.",
}: {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  message?: string
}) {
  useEffect(() => {
    console.error("Route error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="rounded-full bg-destructive/10 p-4 mx-auto w-fit">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2 min-h-[44px]">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="gap-2 min-h-[44px]">
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
