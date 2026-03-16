import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { generateDesignBrief, designBriefToPromptEnhancement, type DesignBrief } from "@/lib/ai/design-brief"

export const maxDuration = 120

// Creation types supported by Nairi (game does not exist)
export type CreationType = 
  | "presentation"
  | "website"
  | "document"
  | "visual"
  | "code"
  | "analysis"
  | "simulation"

const COMING_SOON_TYPES: CreationType[] = []

interface CreateRequest {
  type: CreationType
  prompt: string
  options?: {
    style?: string
    format?: string
    length?: "short" | "medium" | "long"
    audience?: string
  }
}

// System prompts for different creation types
const CREATION_PROMPTS: Record<CreationType, string> = {
  presentation: `You are a presentation designer. Create a detailed slide-by-slide outline with:
- Title slide with compelling headline
- Problem/opportunity statement
- Key points (3-5 main slides)
- Data/evidence slides with suggested visualizations
- Summary and call-to-action
Format each slide as: **Slide X: [Title]** followed by bullet points for content and [Speaker notes: ...] for guidance.`,
  
  website: `You are a web designer. Create a detailed website specification with:
- Page structure and hierarchy
- Hero section with headline and subheadline
- Feature sections with content suggestions
- Call-to-action placements
- Color scheme and typography recommendations
- Mobile responsiveness notes
Format as HTML-like sections with content placeholders.`,
  
  document: `You are a technical writer. Create a well-structured document with:
- Executive summary
- Table of contents
- Main sections with clear headings
- Supporting details and examples
- Conclusion and recommendations
Use proper markdown formatting with headers, lists, and emphasis.`,

  simulation: `You are a simulation designer. Create a simulation concept with:
- Simulation overview and purpose
- Key variables and parameters
- Rules and interactions
- Visualization suggestions
- Implementation notes
Format with clear sections.`,
  
  visual: `You are a visual concept artist. Describe in detail:
- Overall composition and layout
- Color palette with hex codes
- Key visual elements and their placement
- Mood and atmosphere
- Style references
- Technical specifications (dimensions, format)
Be specific enough that a designer could recreate it.`,
  
  code: `You are a senior software developer. Create:
- Clean, well-documented code
- Type definitions where applicable
- Error handling
- Usage examples
- Test cases
Follow best practices for the relevant language/framework.`,
  
  analysis: `You are a data analyst. Provide:
- Executive summary of findings
- Methodology explanation
- Key metrics and insights
- Data visualizations descriptions
- Recommendations based on analysis
- Limitations and considerations
Use clear sections with data-driven insights.`
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: CreateRequest = await req.json()
    const { type, prompt, options } = body

    if (!type || !prompt) {
      return NextResponse.json({ error: "Type and prompt are required" }, { status: 400 })
    }

    if (COMING_SOON_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: `${type.charAt(0).toUpperCase() + type.slice(1)} generation is coming soon.`,
        comingSoon: true 
      }, { status: 400 })
    }

    // Simulation: use dedicated API; this route returns text-only creations
    if (type === 'simulation') {
      return NextResponse.json({ 
        error: 'For interactive simulations use POST /api/generate-simulation. This endpoint is for text-only creations.',
        useGenerateSimulation: true 
      }, { status: 400 })
    }

    // STEP 1: Generate design brief for presentations (V0-style workflow)
    let designBrief: DesignBrief | null = null
    if (type === 'presentation') {
      console.log('🎨 Generating presentation design brief...')
      designBrief = await generateDesignBrief('presentation', prompt, options)
      console.log('✅ Presentation design brief generated:', designBrief)
    }

    // STEP 2: Build the creation prompt
    const systemPrompt = CREATION_PROMPTS[type]
    const basePrompt = buildUserPrompt(prompt, options)
    const userPrompt = designBrief 
      ? basePrompt + designBriefToPromptEnhancement(designBrief, 'presentation')
      : basePrompt

    const maxTokens = options?.length === "long" ? 6000 : options?.length === "short" ? 1500 : 3000

    const { text: fullContent, model } = await generateWithFallback({
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: maxTokens,
      temperature: 0.7,
    })

    const provider = "bitnet"

    // Save creation to database
    const { data: creation, error: createError } = await supabase
      .from("creations")
      .insert({
        user_id: userId,
        type,
        prompt,
        content: fullContent,
        options,
        metadata: { provider, model }
      })
      .select()
      .single()

    if (createError) {
      console.error("Failed to save creation:", createError)
    }

    return NextResponse.json({
      success: true,
      content: fullContent,
      type,
      creationId: creation?.id,
      metadata: { provider, model }
    })

  } catch (error) {
    console.error("Creation API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Creation failed" },
      { status: 500 }
    )
  }
}

function buildUserPrompt(prompt: string, options?: CreateRequest["options"]): string {
  let fullPrompt = prompt

  if (options?.style) {
    fullPrompt += `\n\nStyle: ${options.style}`
  }
  if (options?.audience) {
    fullPrompt += `\nTarget audience: ${options.audience}`
  }
  if (options?.length) {
    const lengthMap = { short: "concise", medium: "moderate detail", long: "comprehensive" }
    fullPrompt += `\nLength: ${lengthMap[options.length]}`
  }
  if (options?.format) {
    fullPrompt += `\nOutput format: ${options.format}`
  }

  return fullPrompt
}
