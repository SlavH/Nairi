"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error("Test error for Sentry - This is intentional for testing error tracking")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-4xl font-bold text-foreground">Error Testing Page</h1>
        <p className="text-muted-foreground">
          Click the button below to trigger a test error and verify Sentry error tracking.
        </p>
        <Button
          onClick={() => setShouldError(true)}
          className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background"
        >
          Trigger Test Error
        </Button>
        <p className="text-xs text-muted-foreground">
          This will trigger the error boundary and send an error to Sentry.
        </p>
      </div>
    </div>
  )
}
