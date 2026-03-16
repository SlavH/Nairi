// AI: single backend – Google Colab server (URL in .env BITNET_BASE_URL).

import { hasValidApiKey, getProviderClient } from "./client"

export interface AIProvider {
  id: string
  name: string
  model: string
  tier: number
  maxTokens: number
  supportedFeatures: string[]
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "bitnet",
    name: "Colab Model",
    model: "default",
    tier: 1,
    maxTokens: 32768,
    supportedFeatures: ["chat", "reasoning", "code", "analysis", "long-context"],
  },
]

export function getProviderByTier(tier: number): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.tier === tier)
}

export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id)
}

export function getNextFallbackProvider(currentTier: number): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.tier > currentTier)
}

export function getFirstAvailableProvider(): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => hasValidApiKey(p.id) && getProviderClient(p.id) !== null)
}

export function getNextAvailableFallbackProvider(currentTier: number): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.tier > currentTier && hasValidApiKey(p.id) && getProviderClient(p.id) !== null)
}

export function getProviderForFeature(feature: string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.supportedFeatures.includes(feature))
}

// Confidence scoring for AI responses
export interface ConfidenceScore {
  overall: number // 0-1
  factual: number // 0-1
  reasoning: number // 0-1
  source_quality: number // 0-1
  explanation: string
}

export function calculateConfidenceScore(
  response: string,
  hasSourcesContext: boolean,
  isFactualQuery: boolean,
): ConfidenceScore {
  let factual = 0.7
  let reasoning = 0.8
  const source_quality = hasSourcesContext ? 0.9 : 0.5

  // Adjust based on response characteristics
  const hasHedging = /I think|probably|might|could be|not sure/i.test(response)
  const hasCitations = /according to|based on|research shows/i.test(response)
  const hasStructure = response.includes("\n") && response.length > 200

  if (hasHedging) factual -= 0.1
  if (hasCitations) factual += 0.15
  if (hasStructure) reasoning += 0.1

  // Clamp values
  factual = Math.max(0, Math.min(1, factual))
  reasoning = Math.max(0, Math.min(1, reasoning))

  const overall = factual * 0.4 + reasoning * 0.3 + source_quality * 0.3

  let explanation = ""
  if (overall >= 0.8) {
    explanation = "High confidence based on structured reasoning and available context"
  } else if (overall >= 0.6) {
    explanation = "Moderate confidence - response is well-reasoned but may benefit from verification"
  } else {
    explanation = "Lower confidence - consider verifying with additional sources"
  }

  return { overall, factual, reasoning, source_quality, explanation }
}
