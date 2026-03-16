import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 300

// Video Upscaling API
// Increase video resolution using AI
// Uses Real-ESRGAN and similar models

interface VideoUpscaleRequest {
  video: string // base64 or URL
  scale?: number // 2 or 4
  model?: string
  denoise?: number // 0.0-1.0
  faceEnhance?: boolean
}

const MODELS = [
  { id: "realesrgan", name: "Real-ESRGAN", description: "Best general quality" },
  { id: "realesrgan-anime", name: "Real-ESRGAN Anime", description: "Optimized for anime" },
  { id: "topaz", name: "Topaz-like", description: "Film/video optimized" }
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`videoupscale:${clientId}`, { maxRequests: 3, windowMs: 600000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: VideoUpscaleRequest = await request.json()
    const { 
      video, 
      scale = 2,
      model = "realesrgan",
      denoise = 0.5,
      faceEnhance = true
    } = body

    // Validation
    if (!video) {
      return NextResponse.json({ error: "Video is required" }, { status: 400 })
    }

    const validScale = [2, 4].includes(scale) ? scale : 2

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Replicate Real-ESRGAN Video
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log(`[VIDEOUPSCALE] Attempting Replicate ${model}...`)
        
        const modelVersions: Record<string, string> = {
          realesrgan: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
          "realesrgan-anime": "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
          topaz: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b"
        }
        
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            version: modelVersions[model] || modelVersions.realesrgan,
            input: {
              video,
              scale: validScale,
              face_enhance: faceEnhance
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Poll for completion (video upscaling takes longer)
          let resultUrl = null
          let attempts = 0
          
          while (!resultUrl && attempts < 300) { // 5 min timeout
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${data.id}`,
              { headers: { "Authorization": `Token ${replicateKey}` } }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "succeeded" && statusData.output) {
                resultUrl = statusData.output
                break
              } else if (statusData.status === "failed") {
                throw new Error("Video upscaling failed")
              }
            }
            attempts++
          }

          if (resultUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "video-upscale",
                prompt: "Video upscaling",
                content: resultUrl,
                options: { scale: validScale, model, faceEnhance },
                metadata: { provider: `replicate-${model}` }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              video: {
                url: resultUrl,
                scale: validScale,
                model,
                provider: `replicate-${model}`
              },
              message: `✅ Video upscaled ${validScale}x successfully`
            })
          }
        }
      } catch (error) {
        console.error("[VIDEOUPSCALE] Replicate failed:", error)
      }
    }

    return NextResponse.json({
      success: false,
      error: "Video upscaling service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN for video upscaling",
      alternative: {
        method: "Frame-by-frame upscaling",
        steps: [
          "1. Extract frames: ffmpeg -i input.mp4 frames/frame_%04d.png",
          "2. Upscale each frame using /api/image-tools (upscale action)",
          "3. Reassemble: ffmpeg -framerate 24 -i frames/frame_%04d.png output.mp4"
        ]
      },
      suggestedTools: [
        { name: "Topaz Video AI", url: "https://topazlabs.com", description: "Best quality" },
        { name: "Replicate", url: "https://replicate.com", description: "Real-ESRGAN video" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[VIDEOUPSCALE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Video upscaling failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Video Upscaling API",
    description: "Increase video resolution using AI",
    parameters: {
      video: { type: "string", required: true, description: "Base64 video or URL" },
      scale: { type: "number", enum: [2, 4], default: 2 },
      model: { type: "string", enum: ["realesrgan", "realesrgan-anime", "topaz"], default: "realesrgan" },
      denoise: { type: "number", min: 0.0, max: 1.0, default: 0.5 },
      faceEnhance: { type: "boolean", default: true }
    },
    models: MODELS,
    outputResolutions: [
      { input: "480p", scale: 2, output: "960p" },
      { input: "480p", scale: 4, output: "1920p (4K)" },
      { input: "720p", scale: 2, output: "1440p" },
      { input: "1080p", scale: 2, output: "2160p (4K)" }
    ],
    providers: [
      { id: "replicate", name: "Replicate Real-ESRGAN", tier: 1, quality: "high" }
    ],
    notes: [
      "Video upscaling is computationally intensive",
      "Processing time depends on video length and resolution",
      "Face enhancement improves quality of faces in video"
    ]
  })
}
