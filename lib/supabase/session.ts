import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // If Supabase env vars are missing, skip session management entirely
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Timeout so auth never hangs the site (e.g. Supabase unreachable)
  // Increased timeout to reduce false positives
  const SESSION_TIMEOUT_MS = 5000
  const userResult = await Promise.race([
    supabase.auth.getUser(),
    new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => {
        // Only log in development to reduce noise
        if (process.env.NODE_ENV === 'development') {
          console.warn("[Session] auth.getUser() timed out, continuing without user")
        }
        resolve({ data: { user: null } })
      }, SESSION_TIMEOUT_MS)
    ),
  ])
  const {
    data: { user },
  } = userResult

  // Protected routes - require authentication (or BYPASS_AUTH in dev). Aligns with PRODUCT_SPEC (builder, dashboard, chat, workspace, studio, marketplace, learn, debate, flow, knowledge, etc.).
  const protectedRoutes = [
    "/dashboard",
    "/chat",
    "/marketplace",
    "/builder",
    "/builder-v2",
    "/studio",
    "/presentations",
    "/knowledge",
    "/flow",
    "/learn",
    "/debate",
    "/workspace",
    "/workflows",
    "/simulations",
    "/settings",
    "/profile",
    "/billing",
    "/admin",
    "/checkout",
    "/onboarding",
    "/notifications",
    "/execution-traces",
    "/documents",
    "/activity",
    "/credits",
  ]
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // TESTING MODE: Bypass authentication for testing
  // WARNING: REMOVE THIS IN PRODUCTION!
  const TESTING_MODE = process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true'
  
  if (isProtectedRoute && !user && !TESTING_MODE) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users from auth pages (except callback which handles OAuth)
  if (
    request.nextUrl.pathname.startsWith("/auth/") && 
    !request.nextUrl.pathname.startsWith("/auth/callback") &&
    !request.nextUrl.pathname.startsWith("/auth/error") &&
    user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/nav"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
