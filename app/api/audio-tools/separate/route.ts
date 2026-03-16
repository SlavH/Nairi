import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 180

// Audio Separation (Stem Splitting) API
// Separate vocals, drums, bass, and other instruments from audio
// Uses Demucs and similar models

interface SeparateRequest {
  audio: string // base64 or URL
  stems?: string[] // Which stems to extract: vocals, drums, bass, other, piano, guitar
  model?: string // demucs, spleeter
  quality?: string
}

const AVAILABLE_STEMS = [
  "vocals", "drums", "bass", "other", // Standard 4-stem
  "piano", "guitar" // Extended 6-stem (some models)
]

const MODELS = [
  { id: "demucs", name: "Demucs (Meta)", stems: 4, quality: "high" },
  { id: "demucs-6stem", name: "Demucs 6-stem", stems: 6, quality: "high" },
  { id: "spleeter", name: "Spleeter (Deezer)", stems: 5, quality: "medium" }
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`separate:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many separation requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: SeparateRequest = await request.json()
    const { 
      audio, 
      stems = ["vocals", "drums", "bass", "other"],
      model = "demucs",
      quality = "high"
    } = body

    // Validation
    if (!audio) {
      return NextResponse.json({ error: "Audio is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Replicate Demucs
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[SEPARATE] Attempting Replicate Demucs...")
        
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            // Demucs model
            version: "25a173108cff36ef9f80f854c162d01df9e6528be175794b81f7e5e2d4e95f8e",
            input: {
              audio,
              stems: model === "demucs-6stem" ? 6 : 4
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Poll for completion
          let result = null
          let attempts = 0
          
          while (!result && attempts < 180) { // 3 min timeout
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${data.id}`,
              { headers: { "Authorization": `Token ${replicateKey}` } }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "succeeded" && statusData.output) {
                result = statusData.output
                break
              } else if (statusData.status === "failed") {
                throw new Error("Audio separation failed")
              }
            }
            attempts++
          }

          if (result) {
            // Result should contain URLs for each stem
            const stemUrls: Record<string, string> = {}
            
            if (typeof result === 'object') {
              // Demucs returns object with stem names as keys
              Object.assign(stemUrls, result)
            } else if (Array.isArray(result)) {
              // Some models return array
              const stemNames = ["vocals", "drums", "bass", "other", "piano", "guitar"]
              result.forEach((url, i) => {
                if (stemNames[i]) stemUrls[stemNames[i]] = url
              })
            }

            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "audio-separation",
                prompt: "Audio stem separation",
                content: JSON.stringify(stemUrls),
                options: { stems, model, quality },
                metadata: { provider: "replicate-demucs" }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              stems: stemUrls,
              stemCount: Object.keys(stemUrls).length,
              model,
              provider: "replicate-demucs",
              message: `✅ Audio separated into ${Object.keys(stemUrls).length} stems`
            })
          }
        }
      } catch (error) {
        console.error("[SEPARATE] Replicate Demucs failed:", error)
      }
    }

    // TIER 2: HuggingFace Demucs
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[SEPARATE] Attempting HuggingFace Demucs...")
        
        // Note: HuggingFace doesn't have a direct Demucs inference endpoint
        // This would require a custom Space or local processing
        
        // For now, return guidance
        return NextResponse.json({
          success: false,
          error: "HuggingFace Demucs requires custom Space",
          message: "⚠️ Direct HuggingFace separation not available. Configure REPLICATE_API_TOKEN for best results.",
          alternative: {
            method: "Use Replicate Demucs",
            url: "https://replicate.com/cjwbw/demucs"
          }
        }, { status: 503 })
      } catch (error) {
        console.error("[SEPARATE] HuggingFace failed:", error)
      }
    }

    return NextResponse.json({
      success: false,
      error: "Audio separation service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN for audio separation",
      suggestedTools: [
        { name: "Lalal.ai", url: "https://lalal.ai", description: "Professional stem separation" },
        { name: "Moises.ai", url: "https://moises.ai", description: "AI music separation" },
        { name: "Demucs", url: "https://github.com/facebookresearch/demucs", description: "Open source (local)" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[SEPARATE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Audio separation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Audio Separation (Stem Splitting) API",
    description: "Separate vocals, drums, bass, and other instruments from audio",
    parameters: {
      audio: { type: "string", required: true, description: "Base64 audio or URL" },
      stems: { type: "array", items: AVAILABLE_STEMS, default: ["vocals", "drums", "bass", "other"] },
      model: { type: "string", enum: ["demucs", "demucs-6stem", "spleeter"], default: "demucs" },
      quality: { type: "string", enum: ["fast", "balanced", "high"], default: "high" }
    },
    availableStems: AVAILABLE_STEMS,
    models: MODELS,
    useCases: [
      "Extract vocals for karaoke",
      "Isolate drums for remixing",
      "Remove vocals from songs",
      "Create instrumental versions",
      "Sample specific instruments"
    ],
    providers: [
      { id: "replicate", name: "Replicate Demucs", tier: 1, quality: "high" },
      { id: "lalal", name: "Lalal.ai", tier: 1, quality: "highest", note: "External service" }
    ]
  })
}
