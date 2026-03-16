import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { AlertCircle, Home, LogIn, Compass } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md page-container">
        <div className="flex flex-col items-center mb-8">
          <Image src="/images/nairi-logo-header.jpg" alt="Nairi" width={80} height={80} className="mb-4 rounded-xl border border-border/50" />
        </div>

        <Card className="section-card border-border text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center" aria-hidden>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-foreground">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {params?.error ? (
              <p className="text-sm text-muted-foreground">Error: {params.error}</p>
            ) : (
              <p className="text-sm text-muted-foreground">An unspecified error occurred during authentication.</p>
            )}
            <p className="text-xs text-muted-foreground">If the service was temporarily unavailable, try again. Session timeouts prevent endless loading.</p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full btn-primary-gradient gap-2">
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full gap-2 border-border">
                <Link href="/nav">
                  <Compass className="h-4 w-4" />
                  Open navigation
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full gap-2 text-muted-foreground">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
