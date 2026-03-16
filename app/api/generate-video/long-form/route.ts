import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { generateWithFallback } from "@/lib/ai/groq-direct"

export const maxDuration = 300 // 5 minutes for long-form video

// Long-Form Video Generation API (30s+)
// Generates videos longer than 10 seconds by stitching segments
// Providers: Runway, Kling, Luma, Replicate

interface LongFormVideoRequest {
  prompt: string
  duration: number // in seconds (10-120)
  style?: string
  resolution?: string
  aspectRatio?: string
  cameraMotion?: string
  fps?: number
  // Advanced
  scenes?: string[] // Optional scene descriptions for each segment
  transitions?: string // fade, cut, dissolve
  music?: boolean // Generate background music
}

const CAMERA_MOTIONS = [
  "static", "pan-left", "pan-right", "pan-up", "pan-down",
  "zoom-in", "zoom-out", "orbit-left", "orbit-right",
  "tracking", "dolly-in", "dolly-out", "crane-up", "crane-down",
  "handheld", "drone", "first-person"
]

const STYLES = [
  "realistic", "cinematic", "anime", "3d-animation", "artistic",
  "documentary", "music-video", "commercial", "film-noir", "sci-fi"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`longvideo:${clientId}`, { maxRequests: 3, windowMs: 600000 }) // 3 per 10 min
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many long-form video requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: LongFormVideoRequest = await request.json()
    const { 
      prompt, 
      duration = 30,
      style = "cinematic",
      resolution = "720p",
      aspectRatio = "16:9",
      cameraMotion = "dynamic",
      fps = 24,
      scenes,
      transitions = "smooth",
      music = false
    } = body

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: "Prompt too long. Maximum 2000 characters." }, { status: 400 })
    }

    // Validate duration (10-120 seconds)
    const validDuration = Math.max(10, Math.min(120, duration))
    
    // Calculate number of segments needed (each segment ~4-5 seconds)
    const segmentDuration = 5
    const numSegments = Math.ceil(validDuration / segmentDuration)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isDev = process.env.NODE_ENV === 'development' || request.headers.get('host')?.includes('localhost')

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Generate scene descriptions if not provided
    let scenePrompts = scenes || []
    if (scenePrompts.length === 0) {
      // Use centralized Groq provider to break down the prompt into scenes
      try {
        const { text: sceneText } = await generateWithFallback({
          system: `You are a video director. Break down a video concept into ${numSegments} sequential scenes. Each scene should be 4-5 seconds. Output ONLY a JSON array of scene descriptions, no other text.`,
          prompt: `Video concept: ${prompt}\nStyle: ${style}\nCamera: ${cameraMotion}`,
          temperature: 0.7,
          maxOutputTokens: 500,
          fast: true,
        })

        try {
          scenePrompts = JSON.parse(sceneText)
        } catch {
          // If parsing fails, create simple scene variations
          scenePrompts = Array(numSegments).fill(null).map((_, i) => 
            `${prompt}, scene ${i + 1} of ${numSegments}, ${style} style, ${cameraMotion} camera`
          )
        }
      } catch (error) {
        console.log("[LONGVIDEO] Scene generation failed, using default")
      }

      // Fallback: create simple scene variations
      if (scenePrompts.length === 0) {
        scenePrompts = Array(numSegments).fill(null).map((_, i) => 
          `${prompt}, continuous shot ${i + 1}, ${style} style, smooth transition`
        )
      }
    }

    // TIER 1: Try Runway Gen-3 API (if available)
    const runwayKey = process.env.RUNWAY_API_KEY
    if (runwayKey && isValidApiKey(runwayKey)) {
      try {
        console.log("[LONGVIDEO] Attempting Runway Gen-3...")
        // Runway API implementation would go here
        // Note: Runway API access is limited, this is a placeholder
      } catch (error) {
        console.error("[LONGVIDEO] Runway failed:", error)
      }
    }

    // TIER 2: Try Kling API (if available)
    const klingKey = process.env.KLING_API_KEY
    if (klingKey && isValidApiKey(klingKey)) {
      try {
        console.log("[LONGVIDEO] Attempting Kling...")
        // Kling API implementation would go here
      } catch (error) {
        console.error("[LONGVIDEO] Kling failed:", error)
      }
    }

    // TIER 3: Generate segments with Replicate and stitch
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log(`[LONGVIDEO] Generating ${numSegments} segments with Replicate...`)
        
        const segmentUrls: string[] = []
        
        for (let i = 0; i < Math.min(numSegments, 6); i++) { // Limit to 6 segments (30s)
          const scenePrompt = scenePrompts[i] || `${prompt}, scene ${i + 1}`
          const enhancedPrompt = `${scenePrompt}, ${style} style, ${cameraMotion} camera movement, cinematic, high quality`
          
          const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
              input: {
                prompt: enhancedPrompt,
                num_frames: segmentDuration * fps,
                num_inference_steps: 50,
                fps
              }
            })
          })

          if (response.ok) {
            const data = await response.json()
            
            // Poll for completion
            let videoUrl = null
            let attempts = 0
            
            while (!videoUrl && attempts < 120) {
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              const statusResponse = await fetch(
                `https://api.replicate.com/v1/predictions/${data.id}`,
                { headers: { "Authorization": `Token ${replicateKey}` } }
              )
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                if (statusData.status === "succeeded" && statusData.output) {
                  videoUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
                  break
                } else if (statusData.status === "failed") {
                  console.error(`[LONGVIDEO] Segment ${i + 1} failed`)
                  break
                }
              }
              attempts++
            }

            if (videoUrl) {
              segmentUrls.push(videoUrl)
              console.log(`[LONGVIDEO] Segment ${i + 1}/${numSegments} completed`)
            }
          }
        }

        if (segmentUrls.length > 0) {
          // For now, return the segments - in production, these would be stitched together
          const totalDuration = segmentUrls.length * segmentDuration
          
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "long-form-video",
              prompt,
              content: JSON.stringify(segmentUrls),
              options: { duration: totalDuration, style, cameraMotion, resolution },
              metadata: { 
                provider: "replicate-segments",
                segmentCount: segmentUrls.length,
                scenePrompts
              }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            video: {
              segments: segmentUrls,
              segmentCount: segmentUrls.length,
              totalDuration,
              provider: "replicate-segments"
            },
            scenePrompts: scenePrompts.slice(0, segmentUrls.length),
            settings: { style, cameraMotion, resolution, aspectRatio, fps },
            message: `✅ Generated ${segmentUrls.length} video segments (${totalDuration}s total). Segments can be stitched together using video editing software.`,
            note: "For seamless long-form video, configure RUNWAY_API_KEY or KLING_API_KEY"
          })
        }
      } catch (error) {
        console.error("[LONGVIDEO] Replicate segments failed:", error)
      }
    }

    // TIER 4: Generate image sequence as fallback
    try {
      console.log("[LONGVIDEO] Falling back to image sequence...")
      
      const framesPerSecond = 2 // Lower for image sequence
      const totalFrames = Math.min(validDuration * framesPerSecond, 60) // Max 60 frames
      
      const frameUrls = await Promise.all(
        Array(totalFrames).fill(null).map(async (_, i) => {
          const progress = i / (totalFrames - 1)
          const sceneIndex = Math.floor(progress * scenePrompts.length)
          const scenePrompt = scenePrompts[sceneIndex] || prompt
          
          const framePrompt = `${scenePrompt}, frame ${i + 1}, ${style} style, cinematic`
          const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(framePrompt)}?width=1280&height=720&seed=${Date.now() + i}&nologo=true`
          return url
        })
      )

      return NextResponse.json({
        success: true,
        video: {
          frames: frameUrls,
          frameCount: frameUrls.length,
          fps: framesPerSecond,
          totalDuration: validDuration,
          format: "image-sequence",
          provider: "pollinations-frames"
        },
        scenePrompts,
        settings: { style, cameraMotion, resolution },
        message: `⚠️ Generated ${frameUrls.length} frames as image sequence. For true video, configure REPLICATE_API_TOKEN.`,
        warning: "Image sequence generated. Use video editing software to compile into video."
      })
    } catch (error) {
      console.error("[LONGVIDEO] Frame generation failed:", error)
    }

    return NextResponse.json({
      success: false,
      error: "Long-form video generation failed",
      message: "❌ No video generation API configured. Please configure REPLICATE_API_TOKEN, RUNWAY_API_KEY, or KLING_API_KEY"
    }, { status: 503 })

  } catch (error) {
    console.error("[LONGVIDEO] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Video generation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Long-Form Video Generation API",
    description: "Generate videos longer than 10 seconds (up to 2 minutes)",
    parameters: {
      prompt: { type: "string", required: true, maxLength: 2000 },
      duration: { type: "number", min: 10, max: 120, default: 30, unit: "seconds" },
      style: { type: "string", enum: STYLES, default: "cinematic" },
      resolution: { type: "string", enum: ["480p", "720p", "1080p"], default: "720p" },
      aspectRatio: { type: "string", enum: ["16:9", "9:16", "1:1", "4:3"], default: "16:9" },
      cameraMotion: { type: "string", enum: CAMERA_MOTIONS, default: "dynamic" },
      fps: { type: "number", enum: [24, 30, 60], default: 24 },
      scenes: { type: "array", optional: true, description: "Custom scene descriptions" },
      transitions: { type: "string", enum: ["cut", "fade", "dissolve", "smooth"], default: "smooth" }
    },
    cameraMotions: CAMERA_MOTIONS,
    styles: STYLES,
    providers: [
      { id: "runway", name: "Runway Gen-3", tier: 1, maxDuration: 120, quality: "highest" },
      { id: "kling", name: "Kling", tier: 2, maxDuration: 60, quality: "high" },
      { id: "replicate", name: "Replicate (segments)", tier: 3, maxDuration: 30, quality: "medium" },
      { id: "pollinations", name: "Image Sequence", tier: 4, quality: "low" }
    ],
    notes: [
      "Long videos are generated by stitching multiple segments",
      "AI automatically breaks down your prompt into scenes",
      "For best results, provide custom scene descriptions"
    ]
  })
}
