import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const rawNext = requestUrl.searchParams.get("next") || "/nav"
  // SECURITY: Prevent open redirect by ensuring next is a relative path
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/nav"
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")

  // Handle error from Supabase
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error("Code exchange error:", exchangeError)
        return NextResponse.redirect(
          new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        )
      }

      // Check if user needs onboarding
      if (sessionData?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", sessionData.user.id)
          .single()
        
        // Redirect to onboarding if not completed
        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(new URL("/onboarding", requestUrl.origin))
        }
      }

      // Successful verification - redirect to intended destination
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    } catch (err) {
      console.error("Auth callback exception:", err)
      return NextResponse.redirect(
        new URL("/auth/error?error=An unexpected error occurred", requestUrl.origin)
      )
    }
  }

  // No code provided
  return NextResponse.redirect(new URL("/auth/login", requestUrl.origin))
}
