import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

// Music Continuation API
// Extend existing music clips
// Continue from where the audio left off

interface MusicContinueRequest {
  audio: string // base64 or URL of existing audio
  prompt?: string // Optional guidance for continuation
  duration?: number // How many seconds to add (5-30)
  style?: string
  seamless?: boolean // Try to make seamless transition
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`musiccontinue:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: MusicContinueRequest = await request.json()
    const { 
      audio,
      prompt,
      duration = 15,
      style,
      seamless = true
    } = body

    // Validation
    if (!audio) {
      return NextResponse.json({ error: "Audio is required" }, { status: 400 })
    }

    const validDuration = Math.max(5, Math.min(30, duration))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Build continuation prompt
    let continuePrompt = prompt || "Continue this music naturally"
    if (style) continuePrompt += `, ${style} style`
    if (seamless) continuePrompt += ", seamless transition, maintain tempo and key"

    // TIER 1: Replicate MusicGen with melody conditioning
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[MUSICCONTINUE] Attempting Replicate MusicGen...")
        
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            // MusicGen melody model (can condition on audio)
            version: "671ac645ce5e552cc63a54a2bbff63fcf798043055f2a26f81cd21d1877f6401",
            input: {
              prompt: continuePrompt,
              input_audio: audio,
              duration: validDuration,
              continuation: true,
              continuation_start: 0,
              model_version: "stereo-melody-large",
              output_format: "mp3",
              normalization_strategy: "peak"
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Poll for completion
          let audioUrl = null
          let attempts = 0
          
          while (!audioUrl && attempts < 120) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            
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
                throw new Error("Music continuation failed")
              }
            }
            attempts++
          }

          if (audioUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "music-continuation",
                prompt: continuePrompt,
                content: audioUrl,
                options: { duration: validDuration, style, seamless },
                metadata: { provider: "replicate-musicgen" }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              audio: {
                url: audioUrl,
                format: "mp3",
                duration: validDuration,
                provider: "replicate-musicgen"
              },
              prompt: continuePrompt,
              message: `✅ Music extended by ${validDuration} seconds`
            })
          }
        }
      } catch (error) {
        console.error("[MUSICCONTINUE] Replicate failed:", error)
      }
    }

    // TIER 2: HuggingFace MusicGen
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[MUSICCONTINUE] Attempting HuggingFace MusicGen...")
        
        // Note: HuggingFace inference API may not support audio conditioning
        // This is a simplified version
        const response = await fetch(
          "https://api-inference.huggingface.co/models/facebook/musicgen-melody",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: continuePrompt,
              parameters: {
                max_new_tokens: Math.floor(validDuration * 50)
              }
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
              provider: "huggingface-musicgen"
            },
            prompt: continuePrompt,
            message: "✅ Music generated (style-matched, not true continuation)",
            warning: "HuggingFace doesn't support true audio continuation. For seamless continuation, use REPLICATE_API_TOKEN."
          })
        }
      } catch (error) {
        console.error("[MUSICCONTINUE] HuggingFace failed:", error)
      }
    }

    return NextResponse.json({
      success: false,
      error: "Music continuation service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN for music continuation",
      suggestedTools: [
        { name: "Suno AI", url: "https://suno.ai", description: "Best for song continuation" },
        { name: "Replicate MusicGen", url: "https://replicate.com", description: "Audio-conditioned generation" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[MUSICCONTINUE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Music continuation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Music Continuation API",
    description: "Extend existing music clips seamlessly",
    parameters: {
      audio: { type: "string", required: true, description: "Base64 audio or URL to continue from" },
      prompt: { type: "string", optional: true, description: "Guidance for continuation" },
      duration: { type: "number", min: 5, max: 30, default: 15, unit: "seconds" },
      style: { type: "string", optional: true },
      seamless: { type: "boolean", default: true, description: "Try to make seamless transition" }
    },
    useCases: [
      "Extend a short music clip",
      "Create longer versions of generated music",
      "Add outro to existing track",
      "Create seamless loops"
    ],
    providers: [
      { id: "replicate", name: "Replicate MusicGen", tier: 1, quality: "high", features: ["audio-conditioning"] },
      { id: "huggingface", name: "HuggingFace MusicGen", tier: 2, quality: "medium", note: "Style-matched only" }
    ]
  })
}
