import { createOpenAI } from '@ai-sdk/openai'
import { isRouterConfigured } from '@/lib/nairi-api/router'

// AI backend: Nairi Router (NAIRI_ROUTER_BASE_URL) or Colab/BitNet (COLAB_AI_BASE_URL / BITNET_BASE_URL).
const AI_BASE_URL = (process.env.COLAB_AI_BASE_URL || process.env.BITNET_BASE_URL)?.trim() || ""
export const bitnetProvider = createOpenAI({
  apiKey: process.env.BITNET_API_KEY,
  baseURL: AI_BASE_URL || undefined,
})

export const PROVIDER_CLIENTS = {
  bitnet: bitnetProvider,
} as const

// API key validation function
export function isValidApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) return false

  // Check for common placeholder patterns
  const placeholders = [
    'your_',
    'api_key_here',
    'placeholder',
    'example',
  ]

  const lowerKey = apiKey.toLowerCase()

  // If it matches any placeholder pattern, it's invalid
  if (placeholders.some(placeholder => lowerKey.includes(placeholder))) {
    return false
  }

  // Special case: Google API keys often start with "AQ." but are valid
  if (lowerKey.startsWith('aq.')) {
    return apiKey.length > 20 // Google keys are usually longer
  }

  // Must be at least 10 characters (reasonable minimum for API keys)
  if (apiKey.length < 10) {
    return false
  }

  // Must contain some non-alphanumeric characters (most API keys do)
  // But allow keys that are purely alphanumeric (like some provider keys)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(apiKey) && apiKey.length < 30) {
    return false
  }

  return true
}

// Check if a provider has a valid API key configured (or Router is set for bitnet)
export function hasValidApiKey(providerId: string): boolean {
  switch (providerId) {
    case 'bitnet': {
      const url = (process.env.COLAB_AI_BASE_URL || process.env.BITNET_BASE_URL)?.trim()
      if (url) {
        const key = process.env.BITNET_API_KEY
        return key ? isValidApiKey(key) : true
      }
      return isRouterConfigured()
    }

    default:
      return false
  }
}

// Helper function to get provider client by ID
export function getProviderClient(providerId: string) {
  // First check if the provider has a valid API key
  if (!hasValidApiKey(providerId)) {
    console.warn(`[Nairi] Provider ${providerId} skipped: invalid or missing API key`)
    return null
  }

  const client = PROVIDER_CLIENTS[providerId as keyof typeof PROVIDER_CLIENTS]

  if (!client) {
    console.warn(`[Nairi] Provider ${providerId} not configured in PROVIDER_CLIENTS`)
    return null
  }

  return client
}
