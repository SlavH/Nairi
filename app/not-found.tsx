import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Compass, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", paddingLeft: "max(1.5rem, env(safe-area-inset-left))", paddingRight: "max(1.5rem, env(safe-area-inset-right))" }}>
      <div className="page-container max-w-lg text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold gradient-text">404</h1>
          <p className="text-xl text-muted-foreground">This page could not be found.</p>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild className="btn-primary-gradient gap-2 min-h-[44px] sm:min-h-0 touch-manipulation">
            <Link href="/nav" aria-label="Open navigation">
              <Compass className="h-4 w-4" />
              Open navigation
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 border-border min-h-[44px] sm:min-h-0 touch-manipulation">
            <Link href="/dashboard" aria-label="Go to dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" className="gap-2 text-muted-foreground min-h-[44px] sm:min-h-0 touch-manipulation">
            <Link href="/" aria-label="Go to home">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
