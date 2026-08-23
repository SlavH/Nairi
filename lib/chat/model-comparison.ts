/**
 * Model Comparison – routes each requested model through the Nairi AI
 * fallback chain. The primary backend honours the requested model name;
 * the result reports the model that actually served the response.
 */

import { generateWithFallback } from "@/lib/ai/groq-direct"

export interface ModelComparisonResult {
  model: string
  provider: string
  response: string
  tokensUsed?: number
  latency?: number
}

export class ModelComparison {
  static async compareModels(
    prompt: string,
    models: Array<{ provider: string; model: string }>,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<ModelComparisonResult[]> {
    const results: ModelComparisonResult[] = []
    const messages = [
      ...conversationHistory.filter((m) => m.role && m.content),
      { role: "user" as const, content: prompt },
    ]

    for (const { provider, model } of models) {
      const startTime = Date.now()
      try {
        const { text, model: servedModel } = await generateWithFallback({
          system: "You are a helpful assistant. Answer concisely.",
          messages: messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
          temperature: 0.7,
          maxOutputTokens: 2048,
          model,
        })
        results.push({
          model: servedModel || model,
          provider,
          response: text,
          latency: Date.now() - startTime,
        })
      } catch (error) {
        results.push({
          model,
          provider,
          response: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          latency: Date.now() - startTime,
        })
      }
    }

    return results
  }

  static async getModelMetrics(
    _model: string,
    _provider: string
  ): Promise<{ averageLatency: number; successRate: number; averageTokens: number }> {
    return { averageLatency: 0, successRate: 0, averageTokens: 0 }
  }
}
