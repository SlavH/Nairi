import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

// Sound Effects Generation API
// Generate specific sound effects from text descriptions

interface SFXRequest {
  prompt: string // Description of the sound effect
  duration?: number // in seconds (1-30)
  category?: string
  intensity?: string
  // Advanced
  variations?: number // Generate multiple variations
  format?: string
}

const CATEGORIES = [
  "nature", "weather", "animals", "human", "mechanical",
  "electronic", "musical", "ambient", "impact", "whoosh",
  "explosion", "water", "fire", "magic", "sci-fi",
  "horror", "cartoon", "ui", "notification", "game"
]

const INTENSITIES = ["subtle", "moderate", "intense", "extreme"]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`sfx:${clientId}`, { maxRequests: 15, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: SFXRequest = await request.json()
    const { 
      prompt, 
      duration = 3,
      category,
      intensity = "moderate",
      variations = 1,
      format = "mp3"
    } = body

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Sound effect description is required" }, { status: 400 })
    }

    if (prompt.length > 300) {
      return NextResponse.json({ error: "Description too long. Maximum 300 characters." }, { status: 400 })
    }

    // Validate duration (1-30 seconds)
    const validDuration = Math.max(1, Math.min(30, duration))
    const validVariations = Math.max(1, Math.min(4, variations))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Build enhanced prompt
    let enhancedPrompt = prompt
    if (category) enhancedPrompt += `, ${category} sound`
    enhancedPrompt += `, ${intensity} intensity`
    enhancedPrompt += ", high quality sound effect, clean audio"

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: ElevenLabs Sound Effects
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY
    if (elevenLabsKey && isValidApiKey(elevenLabsKey)) {
      try {
        console.log("[SFX] Attempting ElevenLabs Sound Effects...")
        
        const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: enhancedPrompt,
            duration_seconds: validDuration,
            prompt_influence: 0.3
          })
        })

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer()
          const base64Audio = Buffer.from(audioBuffer).toString('base64')
          
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "sfx",
              prompt,
              content: `data:audio/mpeg;base64,${base64Audio}`,
              options: { category, intensity, duration: validDuration },
              metadata: { provider: "elevenlabs" }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            audio: {
              url: `data:audio/mpeg;base64,${base64Audio}`,
              format: "mp3",
              duration: validDuration,
              provider: "elevenlabs"
            },
            prompt: enhancedPrompt,
            message: "✅ Sound effect generated successfully using ElevenLabs"
          })
        }
      } catch (error) {
        console.error("[SFX] ElevenLabs failed:", error)
      }
    }

    // TIER 2: Replicate AudioLDM
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[SFX] Attempting Replicate AudioLDM...")
        
        const sfxResults: string[] = []
        
        for (let i = 0; i < validVariations; i++) {
          const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              // AudioLDM model
              version: "b61392adecdd660326fc9cfc5398182437dbe5e97b5decfb36e1a36de68b5b95",
              input: {
                prompt: enhancedPrompt,
                duration: validDuration,
                n_candidates: 1,
                seed: Date.now() + i
              }
            })
          })

          if (response.ok) {
            const data = await response.json()
            
            // Poll for completion
            let audioUrl = null
            let attempts = 0
            
            while (!audioUrl && attempts < 60) {
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              const statusResponse = await fetch(
                `https://api.replicate.com/v1/predictions/${data.id}`,
                { headers: { "Authorization": `Token ${replicateKey}` } }
              )
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                if (statusData.status === "succeeded" && statusData.output) {
                  audioUrl = statusData.output
                  break
                } else if (statusData.status === "failed") {
                  break
                }
              }
              attempts++
            }

            if (audioUrl) {
              sfxResults.push(audioUrl)
            }
          }
        }

        if (sfxResults.length > 0) {
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "sfx",
              prompt,
              content: sfxResults.length === 1 ? sfxResults[0] : JSON.stringify(sfxResults),
              options: { category, intensity, duration: validDuration, variations: sfxResults.length },
              metadata: { provider: "replicate-audioldm" }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            audio: sfxResults.length === 1 ? {
              url: sfxResults[0],
              format: "wav",
              duration: validDuration,
              provider: "replicate-audioldm"
            } : {
              variations: sfxResults,
              count: sfxResults.length,
              format: "wav",
              duration: validDuration,
              provider: "replicate-audioldm"
            },
            prompt: enhancedPrompt,
            message: `✅ Generated ${sfxResults.length} sound effect${sfxResults.length > 1 ? 's' : ''} using AudioLDM`
          })
        }
      } catch (error) {
        console.error("[SFX] Replicate AudioLDM failed:", error)
      }
    }

    // TIER 3: HuggingFace AudioLDM
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[SFX] Attempting HuggingFace AudioLDM...")
        
        const response = await fetch(
          "https://api-inference.huggingface.co/models/cvssp/audioldm-s-full-v2",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: enhancedPrompt
            })
          }
        )

        if (response.ok) {
          const audioBlob = await response.blob()
          const arrayBuffer = await audioBlob.arrayBuffer()
          const base64Audio = Buffer.from(arrayBuffer).toString('base64')
          
          return NextResponse.json({
            success: true,
            audio: {
              url: `data:audio/wav;base64,${base64Audio}`,
              format: "wav",
              duration: validDuration,
              provider: "huggingface-audioldm"
            },
            prompt: enhancedPrompt,
            message: "✅ Sound effect generated using HuggingFace AudioLDM"
          })
        }
      } catch (error) {
        console.error("[SFX] HuggingFace failed:", error)
      }
    }

    return NextResponse.json({
      success: false,
      error: "Sound effects generation service not configured",
      message: "❌ Please configure ELEVENLABS_API_KEY, REPLICATE_API_TOKEN, or HUGGINGFACE_API_KEY",
      suggestedTools: [
        { name: "ElevenLabs", url: "https://elevenlabs.io", description: "High-quality sound effects" },
        { name: "Stability Audio", url: "https://stability.ai", description: "AI audio generation" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[SFX] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sound effect generation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Sound Effects Generation API",
    description: "Generate sound effects from text descriptions",
    parameters: {
      prompt: { type: "string", required: true, maxLength: 300, description: "Description of the sound effect" },
      duration: { type: "number", min: 1, max: 30, default: 3, unit: "seconds" },
      category: { type: "string", enum: CATEGORIES, optional: true },
      intensity: { type: "string", enum: INTENSITIES, default: "moderate" },
      variations: { type: "number", min: 1, max: 4, default: 1 },
      format: { type: "string", enum: ["mp3", "wav"], default: "mp3" }
    },
    categories: CATEGORIES,
    intensities: INTENSITIES,
    examples: [
      { prompt: "thunder rumbling in the distance", category: "weather", intensity: "moderate" },
      { prompt: "laser gun firing", category: "sci-fi", intensity: "intense" },
      { prompt: "gentle rain on a window", category: "nature", intensity: "subtle" },
      { prompt: "door creaking open slowly", category: "horror", intensity: "moderate" },
      { prompt: "coin collecting sound", category: "game", intensity: "subtle" },
      { prompt: "explosion with debris", category: "explosion", intensity: "extreme" }
    ],
    providers: [
      { id: "elevenlabs", name: "ElevenLabs", tier: 1, quality: "high" },
      { id: "replicate", name: "Replicate AudioLDM", tier: 2, quality: "medium" },
      { id: "huggingface", name: "HuggingFace AudioLDM", tier: 3, quality: "medium" }
    ]
  })
}
