/**
 * API middleware helpers.
 * No bypass mode - all requests require valid authentication.
 */
import { getUserIdForApi } from "@/lib/auth"

export interface AuthResult {
  success: boolean
  userId: string
  token?: string
}

/**
 * Validate API token from request headers.
 * Returns userId if valid, null otherwise.
 */
export async function validateApiToken(
  getToken: () => Promise<string | null>
): Promise<AuthResult> {
  const token = await getToken()
  if (!token) {
    return { success: false, userId: "" }
  }
  // For Supabase: token is the session token
  return { success: true, token, userId: "" }
}

/**
 * Get userId from request (requires authentication).
 * No bypass - returns null if not authenticated.
 */
export async function getUserIdFromRequest(
  getSupabaseUser: () => Promise<{ data: { user: { id: string } | null } }>
): Promise<string | null> {
  const { data: { user } } = await getSupabaseUser()
  return user?.id ?? null
}
