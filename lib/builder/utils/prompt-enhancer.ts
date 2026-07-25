/**
 * Enhance raw user prompt into a high-level website prompt before analysis and generation.
 * Ensures the rest of the pipeline (system prompt, analysis, plan, codegen) receives a clear brief.
 */

import { generateForBuilder } from "@/lib/ai/builder-generate-fallback"

const ENHANCE_SYSTEM = `You are a product manager for a website builder. Your job is to turn a short or vague user request into a clear, high-level website brief.

Rules:
- Output ONLY the enhanced prompt. No preamble, no "Here is...", no markdown.
- Preserve URLs, site names (e.g. "Netflix", "YouTube"), and clone/similar-to intent.
- Add missing context: website type (landing, dashboard, portfolio, etc.), key sections (hero, features, CTA), tone (professional, viral, minimal), and technical scope (single page, multi-page) if implied.
- Keep it one concise paragraph (2-4 sentences) suitable as the single "User request" input for a code generator.
- If the user request is already detailed, lightly polish and structure it; do not rewrite entirely.`

/**
 * Enhances the user's raw prompt into a high-level website prompt.
 * Returns the enhanced string, or the original prompt if enhancement fails.
 */
export async function enhanceToHighLevelWebsitePrompt(rawPrompt: string): Promise<string> {
  const trimmed = rawPrompt.trim()
  if (!trimmed) return trimmed

  try {
    const { text } = await generateForBuilder({
      system: ENHANCE_SYSTEM,
      prompt: `User request to turn into a high-level website brief:\n\n"${trimmed.replace(/"/g, '\\"')}"`,
      temperature: 0.3,
      maxOutputTokens: 500,
      fast: true,
    })
    const enhanced = text.trim().replace(/^(?:Here is|Enhanced prompt:?)\s*/i, "").trim()
    return enhanced.length > 10 ? enhanced : trimmed
  } catch (e) {
    console.warn("Prompt enhancement failed, using original:", e)
    return trimmed
  }
}
