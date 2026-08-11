import { generateImageUrl } from "@/lib/image-providers/pollinations"

export async function generateImageUrlForBuilder(prompt: string): Promise<string | null> {
  const trimmed = prompt.trim().slice(0, 1000)
  if (!trimmed) return null
  return generateImageUrl(trimmed, { width: 1024, height: 1024, seed: Date.now() })
}

/**
 * Given a website context, produce 2–4 short image prompts (hero + sections).
 * Returns an array of prompts to pass to generateImageUrlForBuilder.
 */
export function getImagePromptsForWebsite(
  websiteType: string,
  userRequest: string,
  count: number = 3
): string[] {
  const safe = userRequest.slice(0, 300)
  const prompts: string[] = []
  const type = (websiteType || "website").toLowerCase()

  if (count >= 1) {
    prompts.push(
      `Hero image for a ${type} website, high quality, professional, modern, suitable for above-the-fold banner. Theme: ${safe}`
    )
  }
  if (count >= 2) {
    prompts.push(
      `Feature or section image for a ${type} website, clean, modern, fits UI. Theme: ${safe}`
    )
  }
  if (count >= 3) {
    prompts.push(
      `Secondary section or card image for a ${type} website, cohesive style. Theme: ${safe}`
    )
  }
  if (count >= 4) {
    prompts.push(
      `Additional visual for a ${type} website, same style. Theme: ${safe}`
    )
  }
  return prompts.slice(0, count)
}
