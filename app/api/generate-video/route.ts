import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { getPlanLimits, getUpgradeMessage } from "@/lib/plan-limits"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { isRouterConfigured, generate as routerGenerate, pollForResult } from "@/lib/nairi-api/router"

export const maxDuration = 120

interface VideoGenerateRequest {
  prompt: string
  model?: string
  style?: string
  duration?: string
  resolution?: string
  aspectRatio?: string
}

// System prompt for video prompt enhancement
const VIDEO_PROMPT_SYSTEM = `You are an expert AI video prompt engineer. Your job is to take a user's video description and transform it into an optimized, detailed prompt for AI video generation tools.

OUTPUT FORMAT:
Provide a single, detailed prompt that includes:
1. Main subject and action with specific details
2. Camera movement suggestions (pan, zoom, tracking, etc.)
3. Lighting and atmosphere description
4. Color grading and mood
5. Pacing and timing notes
6. Style references

IMPORTANT:
- Be specific about motion and movement
- Include camera work suggestions
- Describe transitions if applicable
- Add mood and atmosphere details
- Keep the prompt under 200 words
- DO NOT include markdown formatting
- DO NOT include explanations, just the prompt`

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimitResult = checkRateLimit(`video:${clientId}`, RATE_LIMITS.video)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many video generation requests. Please slow down.",
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      )
    }

    const body: VideoGenerateRequest = await req.json()
    const { 
      prompt, 
      model = "default",
      style = "realistic",
      duration = "short",
      resolution = "720p",
      aspectRatio = "16:9"
    } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt is too long. Maximum 2000 characters." },
        { status: 400 }
      )
    }

    // Get user and check plan limits
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Dev bypass for testing - allow unauthenticated access on localhost
    const isDev = process.env.NODE_ENV === 'development' || 
                  req.headers.get('host')?.includes('localhost')
    
    // Check if user has access to video generation
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      
      const userPlan = profile?.plan || 'free'
      const limits = getPlanLimits(userPlan)
      
      if (!limits.videoGeneration) {
        return NextResponse.json(
          { 
            error: getUpgradeMessage('Video generation'),
            requiresUpgrade: true,
            feature: 'video_generation',
            currentPlan: userPlan
          },
          { status: 403 }
        )
      }
    } else if (!isDev) {
      // Require authentication for video generation (except in dev mode)
      return NextResponse.json(
        { error: "Authentication required for video generation" },
        { status: 401 }
      )
    }

    // Enhance the prompt using centralized Groq provider
    const userPrompt = `Transform this video description into an optimized prompt: "${prompt}"`

    const { text: rawEnhanced } = await generateWithFallback({
      system: VIDEO_PROMPT_SYSTEM,
      prompt: userPrompt,
      temperature: 0.8,
      maxOutputTokens: 400,
      fast: true,
    })

    const enhancedPrompt = (rawEnhanced || "").trim().replace(/^["']|["']$/g, "")

    // TIER 0: Nairi Router (when NAIRI_ROUTER_BASE_URL is set)
    if (isRouterConfigured()) {
      try {
        const { job_id } = await routerGenerate("video", enhancedPrompt, {
          duration,
          resolution,
          aspectRatio,
          style,
        })
        const raw = await pollForResult(job_id, 2_500, 60)
        const result = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
        const videoUrl = typeof result.url === "string" ? result.url : typeof result.videoUrl === "string" ? result.videoUrl : typeof result.video_url === "string" ? result.video_url : null
        const base64 = typeof result.base64 === "string" ? result.base64 : null
        const dataUrl = base64 ? `data:video/mp4;base64,${base64}` : videoUrl
        if (dataUrl) {
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "video",
              prompt,
              content: dataUrl,
              options: { model, style, duration, resolution, aspectRatio },
              metadata: { enhancedPrompt, provider: "nairi-router", status: "completed" },
            })).catch((err: unknown) => console.error("Failed to save creation:", err))
          }
          return NextResponse.json({
            success: true,
            videoUrl: dataUrl,
            videoFormat: "mp4",
            durationSeconds: duration === "short" ? 1 : duration === "medium" ? 2 : 3,
            resolution: resolution || "720p",
            enhancedPrompt,
            originalPrompt: prompt,
            settings: { model, style, duration, resolution, aspectRatio },
            status: "completed",
            provider: "nairi-router",
            fallbackUsed: false,
            message: "Video generated using Nairi Router",
          })
        }
      } catch (routerErr) {
        console.error("[VIDEO] Nairi Router failed, falling back:", routerErr)
      }
    }

    // TIER 1: Try Replicate (zeroscope-v2-xl) - FREE tier available
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey) {
      try {
        console.log("[VIDEO] Attempting Replicate (zeroscope-v2-xl)...")
        const replicateResponse = await fetch(
          "https://api.replicate.com/v1/predictions",
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
              input: {
                prompt: enhancedPrompt,
                num_frames: duration === "short" ? 24 : duration === "medium" ? 48 : 72,
                num_inference_steps: 50
              }
            })
          }
        )

        if (replicateResponse.ok) {
          const replicateData = await replicateResponse.json()
          
          // Poll for completion (Replicate is async)
          let videoUrl = null
          let attempts = 0
          const maxAttempts = 60 // 60 seconds max wait
          
          while (!videoUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${replicateData.id}`,
              {
                headers: {
                  "Authorization": `Token ${replicateKey}`,
                  "Content-Type": "application/json"
                }
              }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "succeeded" && statusData.output) {
                videoUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
                break
              } else if (statusData.status === "failed") {
                throw new Error("Replicate generation failed")
              }
            }
            attempts++
          }

          if (videoUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "video",
                prompt,
                content: videoUrl,
                options: { model, style, duration, resolution, aspectRatio },
                metadata: { 
                  originalPrompt: prompt,
                  enhancedPrompt,
                  provider: "replicate",
                  status: "completed"
                }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              videoUrl,
              videoFormat: "mp4",
              durationSeconds: duration === "short" ? 1 : duration === "medium" ? 2 : 3,
              resolution: "576x1024",
              enhancedPrompt,
              originalPrompt: prompt,
              settings: { model, style, duration, resolution, aspectRatio },
              status: "completed",
              provider: "replicate",
              fallbackUsed: false,
              message: "✅ Video generated successfully using Replicate (zeroscope-v2-xl)"
            })
          }
        }
      } catch (replicateError) {
        console.error("[VIDEO] Replicate failed:", replicateError)
      }
    }
    
    // TIER 2: Try HuggingFace (damo-vilab/text-to-video-ms-1.7b) - FREE
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey) {
      try {
        console.log("[VIDEO] Attempting HuggingFace (text-to-video-ms-1.7b)...")
        const hfResponse = await fetch(
          "https://api-inference.huggingface.co/models/damo-vilab/text-to-video-ms-1.7b",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: enhancedPrompt,
              parameters: {
                num_frames: duration === "short" ? 16 : duration === "medium" ? 24 : 32
              }
            })
          }
        )

        if (hfResponse.ok) {
          const videoBlob = await hfResponse.blob()
          
          // Convert blob to base64 for storage/transmission
          const arrayBuffer = await videoBlob.arrayBuffer()
          const base64Video = Buffer.from(arrayBuffer).toString('base64')
          const videoDataUrl = `data:video/mp4;base64,${base64Video}`

          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "video",
              prompt,
              content: videoDataUrl,
              options: { model, style, duration, resolution, aspectRatio },
              metadata: { 
                originalPrompt: prompt,
                enhancedPrompt,
                provider: "huggingface",
                status: "completed"
              }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            videoUrl: videoDataUrl,
            videoFormat: "mp4",
            durationSeconds: duration === "short" ? 1 : duration === "medium" ? 1.5 : 2,
            resolution: "256x256",
            enhancedPrompt,
            originalPrompt: prompt,
            settings: { model, style, duration, resolution, aspectRatio },
            status: "completed",
            provider: "huggingface",
            fallbackUsed: true,
            message: "✅ Video generated successfully using HuggingFace (text-to-video-ms-1.7b)"
          })
        }
      } catch (hfError) {
        console.error("[VIDEO] HuggingFace failed:", hfError)
      }
    }

    // TIER 3: Try Pollinations.ai video (if available) - FREE
    try {
      console.log("[VIDEO] Attempting Pollinations.ai video...")
      // Check if Pollinations has video endpoint
      const pollinationsVideoUrl = `https://video.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?duration=${duration}&nologo=true`
      
      const pollinationsResponse = await fetch(pollinationsVideoUrl, { method: 'HEAD' })
      
      if (pollinationsResponse.ok) {
        if (user) {
          Promise.resolve(supabase.from("creations").insert({
            user_id: user.id,
            type: "video",
            prompt,
            content: pollinationsVideoUrl,
            options: { model, style, duration, resolution, aspectRatio },
            metadata: { 
              originalPrompt: prompt,
              enhancedPrompt,
              provider: "pollinations",
              status: "completed"
            }
          })).catch((err: unknown) => {
            console.error('Failed to save creation:', err)
          })
        }

        return NextResponse.json({
          success: true,
          videoUrl: pollinationsVideoUrl,
          videoFormat: "mp4",
          durationSeconds: duration === "short" ? 3 : duration === "medium" ? 5 : 8,
          resolution: "1280x720",
          enhancedPrompt,
          originalPrompt: prompt,
          settings: { model, style, duration, resolution, aspectRatio },
          status: "completed",
          provider: "pollinations",
          fallbackUsed: true,
          message: "✅ Video generated successfully using Pollinations.ai"
        })
      }
    } catch (pollinationsError) {
      console.error("[VIDEO] Pollinations video failed:", pollinationsError)
    }

    // TIER 4: Generate image sequence as fallback (better than nothing)
    try {
      console.log("[VIDEO] Falling back to image sequence generation...")
      const frames = 8
      const framePrompts = []
      for (let i = 0; i < frames; i++) {
        const progress = (i / (frames - 1)) * 100
        framePrompts.push(`${enhancedPrompt}, animation frame ${i + 1} of ${frames}, ${progress.toFixed(0)}% progress, smooth motion, cinematic`)
      }

      const frameUrls = await Promise.all(
        framePrompts.map(async (framePrompt, index) => {
          const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(framePrompt)}?width=1280&height=720&seed=${Date.now() + index}&nologo=true`
          return pollinationsUrl
        })
      )

      if (user) {
        Promise.resolve(supabase.from("creations").insert({
          user_id: user.id,
          type: "video-frames",
          prompt,
          content: JSON.stringify(frameUrls),
          options: { model, style, duration, resolution, aspectRatio },
          metadata: { 
            originalPrompt: prompt,
            enhancedPrompt,
            provider: "pollinations-frames",
            status: "frames-only",
            frameCount: frames
          }
        })).catch((err: unknown) => {
          console.error('Failed to save creation:', err)
        })
      }

      return NextResponse.json({
        success: true,
        videoFrames: frameUrls,
        videoFormat: "image-sequence",
        frameCount: frames,
        enhancedPrompt,
        originalPrompt: prompt,
        settings: { model, style, duration, resolution, aspectRatio },
        status: "frames-only",
        provider: "pollinations-frames",
        fallbackUsed: true,
        warning: "⚠️ True video generation unavailable. Generated image sequence instead. Configure REPLICATE_API_TOKEN or HUGGINGFACE_API_KEY for real video generation.",
        message: "Image sequence generated. You can use these frames with video editing tools to create animations."
      })
    } catch (framesError) {
      console.error("[VIDEO] Frame generation failed:", framesError)
    }

    // TIER 5: Honest failure message
    return NextResponse.json({
      success: false,
      enhancedPrompt,
      originalPrompt: prompt,
      settings: { model, style, duration, resolution, aspectRatio },
      status: "failed",
      provider: "none",
      fallbackUsed: true,
      error: "Video generation failed. No API keys configured.",
      message: "❌ Video generation unavailable. Please configure one of: REPLICATE_API_TOKEN (recommended), HUGGINGFACE_API_KEY, or use external tools like Runway/Pika/Luma with the enhanced prompt provided.",
      suggestedTools: [
        { name: "Runway", url: "https://runwayml.com" },
        { name: "Pika", url: "https://pika.art" },
        { name: "Luma AI", url: "https://lumalabs.ai" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[VIDEO] Generation error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate video",
        message: "An unexpected error occurred during video generation."
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    styles: [
      { id: "realistic", label: "Realistic", description: "Photorealistic video" },
      { id: "cinematic", label: "Cinematic", description: "Movie-like quality" },
      { id: "anime", label: "Anime", description: "Japanese animation style" },
      { id: "3d", label: "3D Animation", description: "3D CGI style" },
      { id: "artistic", label: "Artistic", description: "Creative artistic style" },
      { id: "timelapse", label: "Time-lapse", description: "Accelerated motion" }
    ],
    durations: [
      { id: "short", label: "Short (1-3s)", frames: 24 },
      { id: "medium", label: "Medium (3-5s)", frames: 48 },
      { id: "long", label: "Long (5-8s)", frames: 72 }
    ],
    resolutions: [
      { id: "720p", label: "HD (1280x720)" },
      { id: "1080p", label: "Full HD (1920x1080)" },
      { id: "4k", label: "4K (3840x2160)" }
    ],
    aspectRatios: [
      { id: "16:9", label: "Landscape (16:9)" },
      { id: "9:16", label: "Portrait (9:16)" },
      { id: "1:1", label: "Square (1:1)" },
      { id: "4:3", label: "Classic (4:3)" }
    ],
    providers: [
      { 
        id: "replicate", 
        name: "Replicate (zeroscope-v2-xl)",
        tier: 1,
        free: true,
        requiresKey: true,
        keyName: "REPLICATE_API_TOKEN",
        quality: "high",
        speed: "slow"
      },
      { 
        id: "huggingface", 
        name: "HuggingFace (text-to-video-ms)",
        tier: 2,
        free: true,
        requiresKey: true,
        keyName: "HUGGINGFACE_API_KEY",
        quality: "medium",
        speed: "medium"
      },
      { 
        id: "pollinations", 
        name: "Pollinations.ai",
        tier: 3,
        free: true,
        requiresKey: false,
        quality: "medium",
        speed: "fast"
      },
      { 
        id: "frames", 
        name: "Image Sequence Fallback",
        tier: 4,
        free: true,
        requiresKey: false,
        quality: "low",
        speed: "fast",
        note: "Generates image frames, not actual video"
      }
    ]
  })
}
