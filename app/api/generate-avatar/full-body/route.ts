import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 180

// Full Body Avatar Generation API
// Generate and animate full body avatars
// Not just face/head but complete character

interface FullBodyAvatarRequest {
  action: "generate" | "animate" | "pose"
  // For generation
  prompt?: string
  style?: string
  gender?: string
  bodyType?: string
  clothing?: string
  // For animation/pose
  avatarImage?: string
  animation?: string
  pose?: string
  // Settings
  format?: string
  resolution?: string
}

const STYLES = [
  "realistic", "cartoon", "anime", "3d-render", "pixel-art",
  "comic", "chibi", "semi-realistic", "stylized"
]

const BODY_TYPES = [
  "average", "athletic", "slim", "muscular", "curvy", "petite", "tall"
]

const POSES = [
  "standing", "walking", "running", "sitting", "jumping",
  "arms-crossed", "hands-on-hips", "waving", "pointing",
  "action-pose", "relaxed", "confident", "dynamic"
]

const ANIMATIONS = [
  "idle", "walk-cycle", "run-cycle", "dance", "wave",
  "jump", "sit-down", "stand-up", "turn-around"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`fullbodyavatar:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: FullBodyAvatarRequest = await request.json()
    const { 
      action,
      prompt,
      style = "realistic",
      gender,
      bodyType = "average",
      clothing,
      avatarImage,
      animation,
      pose = "standing",
      format = "png",
      resolution = "1024"
    } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    switch (action) {
      case "generate":
        return await handleGenerate(body, user, isValidApiKey)
      case "animate":
        return await handleAnimate(body, user, isValidApiKey)
      case "pose":
        return await handlePose(body, user, isValidApiKey)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("[FULLBODYAVATAR] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Avatar generation failed" },
      { status: 500 }
    )
  }
}

async function handleGenerate(
  body: FullBodyAvatarRequest,
  user: any,
  isValidApiKey: (key: string | undefined) => boolean
) {
  const { prompt, style, gender, bodyType, clothing, pose, resolution = "1024" } = body

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required for generation" }, { status: 400 })
  }

  // Build full body avatar prompt
  let avatarPrompt = `Full body character, ${prompt}`
  if (gender) avatarPrompt += `, ${gender}`
  if (bodyType) avatarPrompt += `, ${bodyType} body type`
  if (clothing) avatarPrompt += `, wearing ${clothing}`
  avatarPrompt += `, ${pose} pose`
  avatarPrompt += `, ${style} style`
  avatarPrompt += ", full body visible, head to toe, character design, high quality"

  // TIER 1: Replicate character generation
  const replicateKey = process.env.REPLICATE_API_TOKEN
  if (replicateKey && isValidApiKey(replicateKey)) {
    try {
      console.log("[FULLBODYAVATAR] Attempting Replicate...")
      
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${replicateKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          input: {
            prompt: avatarPrompt,
            negative_prompt: "cropped, partial body, cut off, blurry, low quality",
            width: parseInt(resolution || "1024"),
            height: parseInt(resolution || "1024"),
            num_inference_steps: 30
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        let resultUrl = null
        let attempts = 0
        
        while (!resultUrl && attempts < 60) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
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
              break
            }
          }
          attempts++
        }

        if (resultUrl) {
          return NextResponse.json({
            success: true,
            avatar: {
              url: resultUrl,
              type: "full-body",
              style,
              pose,
              provider: "replicate"
            },
            prompt: avatarPrompt,
            message: "✅ Full body avatar generated successfully"
          })
        }
      }
    } catch (error) {
      console.error("[FULLBODYAVATAR] Replicate failed:", error)
    }
  }

  // TIER 2: Pollinations fallback
  try {
    const encodedPrompt = encodeURIComponent(avatarPrompt)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${resolution}&height=${resolution}&nologo=true&seed=${Date.now()}`
    
    const response = await fetch(pollinationsUrl)
    
    if (response.ok) {
      const imageBlob = await response.blob()
      const arrayBuffer = await imageBlob.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      
      return NextResponse.json({
        success: true,
        avatar: {
          url: `data:image/jpeg;base64,${base64}`,
          type: "full-body",
          style,
          pose,
          provider: "pollinations-ai"
        },
        prompt: avatarPrompt,
        message: "✅ Full body avatar generated"
      })
    }
  } catch (error) {
    console.error("[FULLBODYAVATAR] Pollinations failed:", error)
  }

  return NextResponse.json({
    success: false,
    error: "Avatar generation failed"
  }, { status: 500 })
}

async function handleAnimate(
  body: FullBodyAvatarRequest,
  user: any,
  isValidApiKey: (key: string | undefined) => boolean
) {
  const { avatarImage, animation } = body

  if (!avatarImage) {
    return NextResponse.json({ error: "Avatar image is required" }, { status: 400 })
  }

  if (!animation) {
    return NextResponse.json({ error: "Animation type is required" }, { status: 400 })
  }

  // Full body animation requires specialized services
  return NextResponse.json({
    success: false,
    error: "Full body animation requires external services",
    message: "⚠️ Use these tools for full body animation:",
    workflow: [
      {
        step: 1,
        tool: "Remove background",
        endpoint: "/api/image-tools",
        action: "remove-background"
      },
      {
        step: 2,
        tool: "Animated Drawings (Meta)",
        url: "https://sketch.metademolab.com",
        description: "Upload character drawing for animation"
      },
      {
        step: 3,
        tool: "D-ID / HeyGen",
        endpoint: "/api/generate-avatar",
        description: "For talking head animation"
      }
    ],
    suggestedTools: [
      { name: "Animated Drawings", url: "https://sketch.metademolab.com", description: "Free character animation" },
      { name: "Viggle AI", url: "https://viggle.ai", description: "AI character animation" },
      { name: "Pika", url: "https://pika.art", description: "Image-to-video animation" }
    ]
  }, { status: 503 })
}

async function handlePose(
  body: FullBodyAvatarRequest,
  user: any,
  isValidApiKey: (key: string | undefined) => boolean
) {
  const { avatarImage, pose } = body

  if (!avatarImage) {
    return NextResponse.json({ error: "Avatar image is required" }, { status: 400 })
  }

  if (!pose) {
    return NextResponse.json({ error: "Pose is required" }, { status: 400 })
  }

  // Use ControlNet or similar for pose transfer
  const replicateKey = process.env.REPLICATE_API_TOKEN
  if (replicateKey && isValidApiKey(replicateKey)) {
    try {
      console.log("[FULLBODYAVATAR] Attempting pose transfer...")
      
      const posePrompt = `Same character, ${pose} pose, full body, maintain character appearance`
      
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Token ${replicateKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // ControlNet pose model
          version: "a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90",
          input: {
            image: avatarImage,
            prompt: posePrompt
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        let resultUrl = null
        let attempts = 0
        
        while (!resultUrl && attempts < 60) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
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
              break
            }
          }
          attempts++
        }

        if (resultUrl) {
          return NextResponse.json({
            success: true,
            avatar: {
              url: resultUrl,
              pose,
              provider: "replicate"
            },
            message: `✅ Avatar posed in ${pose} position`
          })
        }
      }
    } catch (error) {
      console.error("[FULLBODYAVATAR] Pose transfer failed:", error)
    }
  }

  return NextResponse.json({
    success: false,
    error: "Pose transfer requires REPLICATE_API_TOKEN"
  }, { status: 503 })
}

export async function GET() {
  return NextResponse.json({
    name: "Full Body Avatar Generation API",
    description: "Generate and manipulate full body character avatars",
    actions: [
      { id: "generate", label: "Generate", description: "Create a new full body avatar" },
      { id: "animate", label: "Animate", description: "Animate an existing avatar" },
      { id: "pose", label: "Pose", description: "Change avatar pose" }
    ],
    parameters: {
      generate: {
        prompt: { type: "string", required: true },
        style: { type: "string", enum: STYLES, default: "realistic" },
        gender: { type: "string", optional: true },
        bodyType: { type: "string", enum: BODY_TYPES, default: "average" },
        clothing: { type: "string", optional: true },
        pose: { type: "string", enum: POSES, default: "standing" }
      },
      animate: {
        avatarImage: { type: "string", required: true },
        animation: { type: "string", enum: ANIMATIONS, required: true }
      },
      pose: {
        avatarImage: { type: "string", required: true },
        pose: { type: "string", enum: POSES, required: true }
      }
    },
    styles: STYLES,
    bodyTypes: BODY_TYPES,
    poses: POSES,
    animations: ANIMATIONS,
    providers: [
      { id: "replicate", name: "Replicate", tier: 1, features: ["generate", "pose"] },
      { id: "pollinations", name: "Pollinations", tier: 2, features: ["generate"] },
      { id: "external", name: "External Tools", features: ["animate"] }
    ]
  })
}
