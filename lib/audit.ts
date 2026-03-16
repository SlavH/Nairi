/**
 * Audit logging for sensitive actions (Phase 35).
 * Log login, password change, billing actions, data export, delete account.
 * No PII in metadata; store only action, resource, and non-identifying metadata.
 */

import { createClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_change'
  | 'billing.checkout_started'
  | 'billing.subscription_updated'
  | 'billing.portal_accessed'
  | 'data.export_requested'
  | 'account.delete_requested'

/**
 * Record an audit event. Call from auth callbacks, billing webhooks, and account/export routes.
 * Do not pass PII in metadata.
 */
export async function auditLog(
  userId: string,
  action: AuditAction,
  resource?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('audit_log').insert({
      user_id: userId,
      action,
      resource: resource ?? null,
      metadata: metadata ?? {},
    })
  } catch (e) {
    console.error('[Audit] Failed to write audit log:', e)
  }
}
