import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 300

// Video-to-Video Transformation API
// Apply styles, effects, and transformations to existing videos
// Similar to Runway, Pika, Kaiber

interface VideoTransformRequest {
  video: string // base64 or URL
  prompt: string // Transformation description
  style?: string
  strength?: number // 0.0-1.0
  preserveMotion?: boolean
  fps?: number
  // Advanced
  startTime?: number // seconds
  endTime?: number // seconds
  outputFormat?: string
}

const STYLES = [
  "anime", "cartoon", "oil-painting", "watercolor", "sketch",
  "cyberpunk", "vintage", "noir", "fantasy", "sci-fi",
  "pixel-art", "claymation", "comic-book", "impressionist", "pop-art"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`videotransform:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many video transform requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: VideoTransformRequest = await request.json()
    const { 
      video, 
      prompt,
      style,
      strength = 0.7,
      preserveMotion = true,
      fps = 24,
      startTime,
      endTime,
      outputFormat = "mp4"
    } = body

    // Validation
    if (!video) {
      return NextResponse.json({ error: "Video is required" }, { status: 400 })
    }

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Transformation prompt is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Build enhanced prompt
    let enhancedPrompt = prompt
    if (style) {
      enhancedPrompt += `, ${style} style`
    }
    if (preserveMotion) {
      enhancedPrompt += ", preserve original motion and timing"
    }

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Replicate video-to-video models
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[VIDEOTRANSFORM] Attempting Replicate...")
        
        // Use a video stylization model
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            // Video stylization model
            version: "a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90",
            input: {
              video,
              prompt: enhancedPrompt,
              strength,
              fps
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Poll for completion
          let resultUrl = null
          let attempts = 0
          
          while (!resultUrl && attempts < 180) { // 3 min timeout
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${data.id}`,
              { headers: { "Authorization": `Token ${replicateKey}` } }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "succeeded" && statusData.output) {
                resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
                break
              } else if (statusData.status === "failed") {
                throw new Error("Video transformation failed")
              }
            }
            attempts++
          }

          if (resultUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "video-transform",
                prompt,
                content: resultUrl,
                options: { style, strength, preserveMotion },
                metadata: { provider: "replicate" }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              video: {
                url: resultUrl,
                format: outputFormat,
                provider: "replicate"
              },
              prompt: enhancedPrompt,
              settings: { style, strength, preserveMotion, fps },
              message: "✅ Video transformed successfully"
            })
          }
        }
      } catch (error) {
        console.error("[VIDEOTRANSFORM] Replicate failed:", error)
      }
    }

    // TIER 2: Frame-by-frame transformation using img2img
    // This is a fallback that processes each frame individually
    try {
      console.log("[VIDEOTRANSFORM] Attempting frame-by-frame transformation...")
      
      // In a real implementation, this would:
      // 1. Extract frames from the video
      // 2. Apply img2img to each frame
      // 3. Reassemble into video
      
      // For now, return guidance on how to achieve this
      return NextResponse.json({
        success: false,
        error: "Direct video transformation requires REPLICATE_API_TOKEN",
        message: "⚠️ Video-to-video transformation not available without API key",
        alternative: {
          method: "frame-by-frame",
          steps: [
            "1. Extract frames from your video using ffmpeg",
            "2. Use /api/generate-image/img2img to transform each frame",
            "3. Reassemble frames into video using ffmpeg"
          ],
          command: "ffmpeg -i input.mp4 -vf fps=24 frames/frame_%04d.png"
        },
        suggestedTools: [
          { name: "Runway", url: "https://runwayml.com", description: "Professional video-to-video" },
          { name: "Pika", url: "https://pika.art", description: "AI video transformation" },
          { name: "Kaiber", url: "https://kaiber.ai", description: "Video style transfer" }
        ]
      }, { status: 503 })
    } catch (error) {
      console.error("[VIDEOTRANSFORM] Fallback failed:", error)
    }

    return NextResponse.json({
      success: false,
      error: "Video transformation service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN for video transformation"
    }, { status: 503 })

  } catch (error) {
    console.error("[VIDEOTRANSFORM] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Video transformation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Video-to-Video Transformation API",
    description: "Apply styles and effects to existing videos",
    parameters: {
      video: { type: "string", required: true, description: "Base64 video or URL" },
      prompt: { type: "string", required: true, description: "Transformation description" },
      style: { type: "string", enum: STYLES, optional: true },
      strength: { type: "number", min: 0.1, max: 1.0, default: 0.7 },
      preserveMotion: { type: "boolean", default: true, description: "Keep original motion" },
      fps: { type: "number", default: 24 },
      startTime: { type: "number", optional: true, description: "Start time in seconds" },
      endTime: { type: "number", optional: true, description: "End time in seconds" }
    },
    styles: STYLES,
    examples: [
      { prompt: "Transform into anime style", style: "anime" },
      { prompt: "Make it look like an oil painting", style: "oil-painting" },
      { prompt: "Add cyberpunk neon effects", style: "cyberpunk" },
      { prompt: "Convert to black and white film noir", style: "noir" }
    ],
    providers: [
      { id: "replicate", name: "Replicate", tier: 1, quality: "high" },
      { id: "frame-by-frame", name: "Frame-by-frame (manual)", tier: 2, quality: "medium" }
    ]
  })
}
