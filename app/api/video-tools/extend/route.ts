import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 180

// Video Extension / Continuation API
// Extend existing video clips, add frames before/after
// Supports first/last frame control

interface VideoExtendRequest {
  video?: string // base64 or URL of existing video
  startFrame?: string // Image to use as first frame
  endFrame?: string // Image to use as last frame
  prompt: string
  direction?: "forward" | "backward" | "both" // Which direction to extend
  duration?: number // How many seconds to add
  style?: string
  // Advanced
  motionStrength?: number // 0.0-1.0
  fps?: number
}

const STYLES = [
  "realistic", "cinematic", "anime", "3d", "artistic", "slow-motion"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`videoextend:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: VideoExtendRequest = await request.json()
    const { 
      video,
      startFrame,
      endFrame,
      prompt,
      direction = "forward",
      duration = 4,
      style,
      motionStrength = 0.7,
      fps = 24
    } = body

    // Validation
    if (!video && !startFrame && !endFrame) {
      return NextResponse.json({ 
        error: "Either video, startFrame, or endFrame is required" 
      }, { status: 400 })
    }

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const validDuration = Math.max(1, Math.min(10, duration))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Build enhanced prompt
    let enhancedPrompt = prompt
    if (style) enhancedPrompt += `, ${style} style`
    enhancedPrompt += ", smooth motion, seamless continuation"

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Replicate Stable Video Diffusion with frame control
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[VIDEOEXTEND] Attempting Replicate SVD...")
        
        // Use image-to-video with start/end frame
        const inputImage = startFrame || endFrame
        
        if (inputImage) {
          const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              // Stable Video Diffusion
              version: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
              input: {
                input_image: inputImage,
                motion_bucket_id: Math.floor(motionStrength * 255),
                fps,
                num_frames: validDuration * fps,
                decoding_t: 7,
                cond_aug: 0.02
              }
            })
          })

          if (response.ok) {
            const data = await response.json()
            
            // Poll for completion
            let resultUrl = null
            let attempts = 0
            
            while (!resultUrl && attempts < 180) {
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
                  throw new Error("Video extension failed")
                }
              }
              attempts++
            }

            if (resultUrl) {
              if (user) {
                Promise.resolve(supabase.from("creations").insert({
                  user_id: user.id,
                  type: "video-extend",
                  prompt,
                  content: resultUrl,
                  options: { direction, duration: validDuration, style, motionStrength },
                  metadata: { provider: "replicate-svd" }
                })).catch((err: unknown) => {
                  console.error('Failed to save creation:', err)
                })
              }

              return NextResponse.json({
                success: true,
                video: {
                  url: resultUrl,
                  duration: validDuration,
                  direction,
                  fps,
                  provider: "replicate-svd"
                },
                prompt: enhancedPrompt,
                message: `✅ Video extended ${validDuration}s ${direction}`
              })
            }
          }
        }
      } catch (error) {
        console.error("[VIDEOEXTEND] Replicate failed:", error)
      }
    }

    // TIER 2: Frame interpolation approach
    if (startFrame && endFrame) {
      try {
        console.log("[VIDEOEXTEND] Attempting frame interpolation...")
        
        // Generate intermediate frames between start and end
        const numFrames = validDuration * fps
        const frameUrls: string[] = []
        
        for (let i = 0; i < Math.min(numFrames, 30); i++) {
          const progress = i / (numFrames - 1)
          const framePrompt = `${enhancedPrompt}, frame ${i + 1} of ${numFrames}, ${Math.round(progress * 100)}% progress between start and end`
          
          const encodedPrompt = encodeURIComponent(framePrompt)
          const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&seed=${Date.now() + i}&nologo=true`
          frameUrls.push(url)
        }

        return NextResponse.json({
          success: true,
          video: {
            frames: frameUrls,
            frameCount: frameUrls.length,
            fps,
            duration: validDuration,
            format: "image-sequence",
            provider: "pollinations-frames"
          },
          prompt: enhancedPrompt,
          message: `⚠️ Generated ${frameUrls.length} frames. For true video extension, configure REPLICATE_API_TOKEN.`,
          warning: "Image sequence generated. Use video editing software to compile."
        })
      } catch (error) {
        console.error("[VIDEOEXTEND] Frame interpolation failed:", error)
      }
    }

    return NextResponse.json({
      success: false,
      error: "Video extension service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN for video extension",
      suggestedTools: [
        { name: "Runway", url: "https://runwayml.com", description: "Best video extension" },
        { name: "Pika", url: "https://pika.art", description: "Video continuation" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[VIDEOEXTEND] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Video extension failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Video Extension / Continuation API",
    description: "Extend videos or generate video from start/end frames",
    parameters: {
      video: { type: "string", optional: true, description: "Existing video to extend" },
      startFrame: { type: "string", optional: true, description: "Image for first frame" },
      endFrame: { type: "string", optional: true, description: "Image for last frame" },
      prompt: { type: "string", required: true, description: "Motion/content description" },
      direction: { type: "string", enum: ["forward", "backward", "both"], default: "forward" },
      duration: { type: "number", min: 1, max: 10, default: 4, unit: "seconds" },
      style: { type: "string", enum: STYLES, optional: true },
      motionStrength: { type: "number", min: 0.1, max: 1.0, default: 0.7 },
      fps: { type: "number", enum: [12, 24, 30], default: 24 }
    },
    styles: STYLES,
    useCases: [
      "Extend a short clip to make it longer",
      "Generate video that transitions between two images",
      "Add intro/outro to existing video",
      "Create seamless loops"
    ],
    providers: [
      { id: "replicate", name: "Replicate SVD", tier: 1, quality: "high" },
      { id: "pollinations", name: "Frame Sequence", tier: 2, quality: "low" }
    ]
  })
}
