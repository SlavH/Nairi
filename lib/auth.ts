/**
 * Central auth helpers. When BYPASS_AUTH=true, protected pages allow access without login.
 * Set BYPASS_USER_ID to an existing auth user's UUID (Supabase Dashboard → Auth → Users) so
 * bypass mode works with all features (chat, creations, etc.); otherwise DB inserts may fail (FK to auth.users).
 */

const DEFAULT_BYPASS_USER_ID = "00000000-0000-0000-0000-000000000001"

/** Same as BYPASS_USER_ID; use this for comparisons so env override is respected. */
export const BYPASS_USER_ID = (process.env.BYPASS_USER_ID ?? DEFAULT_BYPASS_USER_ID).trim()

/**
 * Bypass auth in local development when explicitly enabled.
 * Must stay in sync with TESTING_MODE in `lib/supabase/session.ts`.
 */
export function isBypassAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true"
}

/** Effective bypass user id: env BYPASS_USER_ID or default. Use a real auth user's UUID so all features work. */
export function getBypassUserId(): string {
  const id = process.env.BYPASS_USER_ID?.trim()
  return id || DEFAULT_BYPASS_USER_ID
}

export type SessionUser = { id: string; email?: string | null }

/**
 * Use in server components/layouts: get effective user (real or bypass).
 * - When logged in: returns the real Supabase user (id, email).
 * - When BYPASS_AUTH=true and not logged in: returns a minimal bypass user so pages don't redirect and user.id works.
 * - Otherwise: returns null (caller should redirect to login).
 */
export async function getSessionOrBypass(
  getSupabaseUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null } }>
): Promise<{ user: SessionUser | null; isBypass: boolean }> {
  const { data: { user } } = await getSupabaseUser()
  if (user) return { user: { id: user.id, email: user.email ?? null }, isBypass: false }
  if (isBypassAuthEnabled())
    return {
      user: { id: getBypassUserId(), email: "bypass@nairi.local" },
      isBypass: true,
    }
  return { user: null, isBypass: false }
}

/**
 * Use in API routes: get effective user id (real or bypass) or null.
 * When BYPASS_AUTH=true and request has no session, returns BYPASS_USER_ID so APIs can run in dev without login.
 */
export async function getUserIdOrBypassForApi(
  getSupabaseUser: () => Promise<{ data: { user: { id: string } | null } }>
): Promise<string | null> {
  const { data: { user } } = await getSupabaseUser()
  if (user) return user.id
  if (isBypassAuthEnabled()) return getBypassUserId()
  return null
}
