import { createBrowserClient } from "@supabase/ssr"

// Singleton pattern to prevent multiple instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Minimal thenable chain stub used when Supabase env vars are missing, so the
// browser does not throw "@supabase/ssr: Your project's URL and API key are
// required". Real data requires real Supabase credentials. When no Supabase
// backend is configured (degraded/auth-bypass mode), the stub reports a fixed
// dev user so browser-side auth checks do not redirect to login.
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

function createStubClient() {
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
      getSession: async () => ({ data: { session: devSession() }, error: null }),
      getUser: async () => ({ data: { user: DEV_USER }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
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
    channel: () => ({
      on: () => {
        const self: any = {}
        self.on = () => self
        self.subscribe = () => ({ unsubscribe: () => {} })
        return self
      },
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
  }
}

export function createClient() {
  if (browserClient) {
    return browserClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    browserClient = createStubClient() as unknown as ReturnType<typeof createBrowserClient>
    return browserClient
  }

  browserClient = createBrowserClient(url, anonKey)

  return browserClient
}
