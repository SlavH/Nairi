/**
 * Central auth helpers.
 * Uses real Supabase Auth (sign up, sign in, email verification, captcha).
 * No bypass mode - all features require authentication.
 */

export type SessionUser = { id: string; email?: string | null }

/**
 * Get session from Supabase (real user or null).
 * No bypass - returns null if not logged in.
 */
export async function getSession(
  getSupabaseUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null } }>
): Promise<SessionUser | null> {
  const { data: { user } } = await getSupabaseUser()
  if (user) return { id: user.id, email: user.email ?? null }
  return null
}

/**
 * Get user id or null (for API routes).
 * No bypass - returns null if not authenticated.
 */
export async function getUserIdOrBypassForApi(
  getSupabaseUser: () => Promise<{ data: { user: { id: string } | null } }>
): Promise<string | null> {
  const { data: { user } } = await getSupabaseUser()
  if (user) return user.id
  return null
}

/**
 * Get session or bypass (backward compat).
 * No bypass mode - always returns real session or null.
 */
export async function getSessionOrBypass(
  getSupabaseUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null } }>
): Promise<SessionUser | null> {
  return getSession(getSupabaseUser)
}

/**
 * Get bypass user id (backward compat).
 * No bypass mode - always returns null.
 */
export function getBypassUserId(): string | null {
  return null
}
