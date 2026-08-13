import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// TEMPORARY AUTH BYPASS (dev/testing only).
// Set DISABLE_AUTH=true to disable all authentication for all functionality:
// every server-side `auth.getUser()` / `auth.getSession()` call returns a fixed
// dev user, so login redirects and API auth gates are bypassed. Revert by
// unsetting the flag. Do not enable in production.
const AUTH_BYPASS_ENABLED = process.env.DISABLE_AUTH === "true"

const DEV_USER = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "dev@nairi.local",
}

function devSession() {
  return {
    user: DEV_USER,
    access_token: "dev-bypass",
    refresh_token: "dev-bypass",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  }
}

// Minimal thenable query-chain stub used only when the auth bypass is enabled
// AND Supabase env vars are missing, so pages render with empty data instead of
// failing. Real DB calls require real Supabase credentials.
function createStubClient(): SupabaseClient {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    lt: () => chain,
    gt: () => chain,
    lte: () => chain,
    gte: () => chain,
    in: () => chain,
    not: () => chain,
    is: () => chain,
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    insert: () => chain,
    update: () => chain,
    upsert: () => chain,
    delete: () => chain,
    then: (resolve: (v: { data: never[]; error: null }) => void) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  }
  return {
    auth: {
      getUser: async () => ({ data: { user: DEV_USER }, error: null }),
      getSession: async () => ({ data: { session: devSession() }, error: null }),
    },
    from: () => chain,
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        list: async () => ({ data: [], error: null }),
      }),
    },
  } as unknown as SupabaseClient
}

function applyAuthBypass(client: SupabaseClient): SupabaseClient {
  ;(client.auth as unknown as { getUser: () => Promise<unknown> }).getUser = async () => ({
    data: { user: DEV_USER },
    error: null,
  })
  ;(client.auth as unknown as { getSession: () => Promise<unknown> }).getSession = async () => ({
    data: { session: devSession() },
    error: null,
  })
  return client
}

export async function createClient(): Promise<SupabaseClient> {
  if (AUTH_BYPASS_ENABLED && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return createStubClient()
  }

  const cookieStore = await cookies()

  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
        }
      },
    },
  })

  return AUTH_BYPASS_ENABLED ? applyAuthBypass(client) : client
}
