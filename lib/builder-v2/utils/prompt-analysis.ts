/**
 * Prompt Analysis Utilities
 * Enhanced understanding of user requests (uses BitNet).
 */

import { generateWithFallback } from "@/lib/ai/groq-direct"

export interface PromptAnalysis {
  intent: 'clone' | 'create' | 'modify' | 'fix' | 'enhance'
  websiteType: string
  features: string[]
  colorScheme: string | null
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise'
  referenceUrl: string | null
  clarifyingQuestions: string[]
}

/**
 * Analyze user prompt to extract structured information
 */
export async function analyzePrompt(prompt: string, _apiKey?: string): Promise<PromptAnalysis> {
  const analysisPrompt = `Analyze this website builder request and extract structured information.

User Request: "${prompt}"

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "intent": "clone" | "create" | "modify" | "fix" | "enhance",
  "websiteType": "e-commerce" | "portfolio" | "dashboard" | "landing" | "viral" | "viral-landing" | "social" | "blog" | "saas" | "docs" | "marketing" | "education" | "real-estate" | "restaurant" | "event" | "help-center" | "other",
  "features": ["list", "of", "requested", "features"],
  "colorScheme": "dark" | "light" | "colorful" | "minimal" | null,
  "complexity": "simple" | "medium" | "complex" | "enterprise",
  "referenceUrl": "extracted URL if any" | null,
  "clarifyingQuestions": ["questions if prompt is ambiguous"]
}`

  try {
    const { text } = await generateWithFallback({
      system: "You output only valid JSON. No markdown, no explanation.",
      prompt: analysisPrompt,
      temperature: 0.1,
      maxOutputTokens: 500,
      fast: true,
    })
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error('Prompt analysis failed:', e)
  }

  // Default analysis: detect viral/ad-style from keywords
  const lower = prompt.toLowerCase()
  const isViral = /viral|ad-style|mind-blown|scroll-stopping|like in ads|viral ad|stop the scroll/i.test(lower)
  return {
    intent: lower.includes('clone') ? 'clone' : 'create',
    websiteType: isViral ? 'viral' : 'other',
    features: [],
    colorScheme: null,
    complexity: 'medium',
    referenceUrl: null,
    clarifyingQuestions: []
  }
}
