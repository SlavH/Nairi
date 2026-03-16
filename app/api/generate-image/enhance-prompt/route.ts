import { NextRequest, NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

// Prompt Enhancement API (Magic Prompt)
// AI improves user's prompt for better image generation results

interface EnhancePromptRequest {
  prompt: string
  style?: string
  type?: "image" | "video" | "3d" | "music"
  detail?: "minimal" | "moderate" | "detailed"
}

const ENHANCEMENT_SYSTEM_PROMPT = `You are an expert AI prompt engineer specializing in creating detailed, effective prompts for AI image generation.

Your task is to enhance the user's simple prompt into a detailed, high-quality prompt that will produce better results.

Rules:
1. Keep the core intent of the original prompt
2. Add specific details about lighting, composition, style, and quality
3. Include technical terms that improve generation quality
4. Add atmosphere and mood descriptors
5. Keep the enhanced prompt under 200 words
6. Do NOT add content the user didn't ask for
7. Do NOT include harmful, violent, or inappropriate content
8. Output ONLY the enhanced prompt, no explanations

Example:
Input: "a cat"
Output: "A majestic domestic cat with soft, fluffy fur, sitting elegantly on a velvet cushion. Warm golden hour lighting streaming through a window, creating a cozy atmosphere. Sharp focus on the cat's expressive eyes, shallow depth of field. Professional pet photography, high resolution, 8K quality."`

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`enhance:${clientId}`, { maxRequests: 30, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: EnhancePromptRequest = await request.json()
    const { prompt, style, type = "image", detail = "moderate" } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > 500) {
      return NextResponse.json({ error: "Prompt too long. Maximum 500 characters." }, { status: 400 })
    }

    // Build the enhancement request
    let userMessage = `Enhance this ${type} generation prompt: "${prompt}"`
    if (style) userMessage += `\nDesired style: ${style}`
    if (detail === "minimal") userMessage += "\nKeep enhancements minimal, just add quality terms."
    if (detail === "detailed") userMessage += "\nMake it very detailed with rich descriptions."

    // Use free Groq fallback chain
    try {
      const { text: enhancedPrompt } = await generateWithFallback({
        system: ENHANCEMENT_SYSTEM_PROMPT,
        prompt: userMessage,
        maxOutputTokens: 300,
        temperature: 0.7,
        fast: true,
      })

      if (enhancedPrompt?.trim()) {
        return NextResponse.json({
          success: true,
          originalPrompt: prompt,
          enhancedPrompt: enhancedPrompt.trim(),
          provider: "bitnet",
          message: "Prompt enhanced successfully"
        })
      }
    } catch (_e) {
      // Fall through to rule-based
    }

    // Fallback: Simple rule-based enhancement
    const simpleEnhancement = enhancePromptSimple(prompt, style, type)
    return NextResponse.json({
      success: true,
      originalPrompt: prompt,
      enhancedPrompt: simpleEnhancement,
      provider: "rule-based",
      message: "Prompt enhanced using rule-based system."
    })

  } catch (error) {
    console.error("[ENHANCE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Enhancement failed" },
      { status: 500 }
    )
  }
}

function enhancePromptSimple(prompt: string, style?: string, type?: string): string {
  const qualityTerms = [
    "high quality",
    "detailed",
    "professional",
    "8K resolution",
    "sharp focus"
  ]

  const lightingTerms = [
    "beautiful lighting",
    "cinematic lighting",
    "soft natural light"
  ]

  const styleTerms: Record<string, string[]> = {
    realistic: ["photorealistic", "hyperrealistic", "lifelike"],
    artistic: ["artistic", "painterly", "creative"],
    anime: ["anime style", "manga art", "Japanese animation"],
    "3d": ["3D render", "CGI", "octane render"],
    cinematic: ["cinematic", "movie still", "film grain"]
  }

  let enhanced = prompt

  // Add style terms
  if (style && styleTerms[style]) {
    enhanced += `, ${styleTerms[style][0]}`
  }

  // Add quality terms
  enhanced += `, ${qualityTerms[Math.floor(Math.random() * qualityTerms.length)]}`
  enhanced += `, ${lightingTerms[Math.floor(Math.random() * lightingTerms.length)]}`

  // Type-specific enhancements
  if (type === "video") {
    enhanced += ", smooth motion, cinematic camera movement"
  } else if (type === "3d") {
    enhanced += ", detailed mesh, PBR textures, studio lighting"
  } else if (type === "music") {
    enhanced += ", professional production, clear mix, balanced frequencies"
  }

  return enhanced
}

export async function GET() {
  return NextResponse.json({
    name: "Prompt Enhancement API (Magic Prompt)",
    description: "AI-powered prompt enhancement for better generation results",
    parameters: {
      prompt: { type: "string", required: true, maxLength: 500 },
      style: { type: "string", optional: true, examples: ["realistic", "artistic", "anime", "3d", "cinematic"] },
      type: { type: "string", optional: true, enum: ["image", "video", "3d", "music"], default: "image" },
      detail: { type: "string", optional: true, enum: ["minimal", "moderate", "detailed"], default: "moderate" }
    },
    providers: [
      { id: "bitnet", name: "BitNet", tier: 1, speed: "fast" },
      { id: "openai", name: "OpenAI (GPT-4o-mini)", tier: 2, speed: "medium" },
      { id: "huggingface", name: "HuggingFace (Mistral)", tier: 3, speed: "slow" },
      { id: "rule-based", name: "Rule-based", tier: 4, speed: "instant", note: "Always available fallback" }
    ],
    examples: [
      { input: "a cat", output: "A majestic domestic cat with soft, fluffy fur, sitting elegantly..." },
      { input: "sunset", output: "A breathtaking sunset over the ocean, vibrant orange and purple hues..." },
      { input: "robot", output: "A sleek futuristic robot with chrome finish, glowing blue eyes..." }
    ]
  })
}
