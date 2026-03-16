import { createClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client with service role key.
 * Use only in server contexts (e.g. webhooks) where there is no user session.
 * Bypasses RLS - ensure you validate all inputs.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin client")
  }
  return createClient(url, serviceRoleKey)
}
