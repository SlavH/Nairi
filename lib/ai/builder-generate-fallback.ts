/**
 * Builder AI generation: single Nairi AI model only.
 * All text generation goes through the centralized Nairi AI provider.
 */

import { generateWithFallback } from "@/lib/ai/groq-direct"

export type BuilderGenerateOptions = {
  system: string
  messages?: { role: "system" | "user" | "assistant"; content: string }[]
  prompt?: string
  temperature?: number
  maxOutputTokens?: number
  fast?: boolean
}

export type BuilderGenerateResult = {
  text: string
  model: string
  provider: string
}

/**
 * Generate text for the builder using the configured Nairi AI model.
 */
export async function generateForBuilder(
  opts: BuilderGenerateOptions
): Promise<BuilderGenerateResult> {
  const { text, model } = await generateWithFallback({
    system: opts.system,
    messages: opts.messages,
    prompt: opts.prompt,
    temperature: opts.temperature ?? 0.7,
    maxOutputTokens: opts.maxOutputTokens ?? 4096,
    fast: opts.fast,
  })
  return { text, model, provider: "nairi" }
}
