/**
 * Pillar N: Developer Ecosystem and API (Phases 145–152)
 * Real implementations: API versions, webhook events, sandbox base URL.
 */

export const API_VERSIONS = ["v1"] as const
export const WEBHOOK_EVENTS = ["conversation.created", "creation.completed", "workflow.completed"] as const
export const API_SANDBOX_BASE_URL = process.env.NAIRI_API_SANDBOX_BASE_URL ?? "https://sandbox.api.nairi.com"

const apiKeys = new Map<string, { userId: string; scopes: string[] }>()

export async function createApiKey(userId: string, scopes: string[]): Promise<{ key: string; id: string }> {
  const id = `key-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  const key = `nairi_${id}_${Math.random().toString(36).slice(2, 24)}`
  apiKeys.set(key, { userId, scopes })
  return { key, id }
}

export function validateApiKey(key: string): { userId: string; scopes: string[] } | null {
  const entry = apiKeys.get(key)
  return entry ?? null
}

export function getWebhookEvents(): readonly string[] {
  return WEBHOOK_EVENTS
}
