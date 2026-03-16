import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 180

// Avatar & Talking Head Generation API
// Providers: D-ID, HeyGen, Synthesia

interface AvatarRequest {
  action: "generate-avatar" | "talking-head" | "lip-sync"
  // For avatar generation
  prompt?: string
  style?: string
  // For talking head
  text?: string
  voiceId?: string
  avatarId?: string
  sourceImage?: string // base64 or URL
  // For lip-sync
  audioUrl?: string
  videoUrl?: string
}

const AVATAR_STYLES: Record<string, string> = {
  realistic: "photorealistic human, detailed features",
  cartoon: "cartoon style, animated character",
  anime: "anime style, Japanese animation",
  "3d": "3D rendered character, CGI",
  professional: "professional headshot, business attire",
  casual: "casual style, friendly appearance",
  artistic: "artistic interpretation, stylized"
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`avatar:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many avatar requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: AvatarRequest = await request.json()
    const { action, prompt, style, text, voiceId, avatarId, sourceImage, audioUrl, videoUrl } = body

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
      case "generate-avatar":
        return await handleGenerateAvatar(prompt, style, user, isValidApiKey)
      
      case "talking-head":
        return await handleTalkingHead(text, voiceId, avatarId, sourceImage, user, isValidApiKey)
      
      case "lip-sync":
        return await handleLipSync(sourceImage || videoUrl, audioUrl, user, isValidApiKey)
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

  } catch (error) {
    console.error("[AVATAR] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Avatar operation failed" },
      { status: 500 }
    )
  }
}

async function handleGenerateAvatar(
  prompt: string | undefined,
  style: string | undefined,
  user: any,
  isValidApiKey: (key: string | undefined) => boolean
) {
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required for avatar generation" }, { status: 400 })
  }

  let enhancedPrompt = prompt
  if (style && AVATAR_STYLES[style]) {
    enhancedPrompt += `, ${AVATAR_STYLES[style]}`
  }
  enhancedPrompt += ", portrait, face centered, high quality"

  // Use image generation for avatar creation
  // This creates a static avatar image that can be used with talking head services
  
  // Try Pollinations for free avatar generation
  try {
    const encodedPrompt = encodeURIComponent(enhancedPrompt)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Date.now()}`
    
    const response = await fetch(pollinationsUrl)
    
    if (response.ok) {
      const imageBlob = await response.blob()
      const arrayBuffer = await imageBlob.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      
      return NextResponse.json({
        success: true,
        avatar: {
          url: `data:image/jpeg;base64,${base64}`,
          style: style || "default",
          provider: "pollinations-ai"
        },
        prompt: enhancedPrompt,
        message: "✅ Avatar generated successfully. Use this with talking-head action to animate."
      })
    }
  } catch (error) {
    console.error("[AVATAR] Generation failed:", error)
  }

  return NextResponse.json({
    success: false,
    error: "Avatar generation failed",
    message: "Could not generate avatar image"
  }, { status: 500 })
}

async function handleTalkingHead(
  text: string | undefined,
  voiceId: string | undefined,
  avatarId: string | undefined,
  sourceImage: string | undefined,
  user: any,
  isValidApiKey: (key: string | undefined) => boolean
) {
  if (!text) {
    return NextResponse.json({ error: "Text is required for talking head" }, { status: 400 })
  }

  if (!sourceImage && !avatarId) {
    return NextResponse.json({ error: "Source image or avatar ID is required" }, { status: 400 })
  }

  if (text.length > 1000) {
    return NextResponse.json({ error: "Text too long. Maximum 1000 characters." }, { status: 400 })
  }

  // TIER 1: D-ID API
  const didKey = process.env.DID_API_KEY
  if (didKey && isValidApiKey(didKey)) {
    try {
      console.log("[AVATAR] Attempting D-ID talking head...")
      
      const response = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${didKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: sourceImage,
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'microsoft',
              voice_id: voiceId || 'en-US-JennyNeural'
            }
          },
          config: {
            fluent: true,
            pad_audio: 0
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const talkId = data.id
        
        // Poll for completion
        let videoUrl = null
        let attempts = 0
        const maxAttempts = 120
        
        while (!videoUrl && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, {
            headers: { 'Authorization': `Basic ${didKey}` }
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.status === 'done' && statusData.result_url) {
              videoUrl = statusData.result_url
              break
            } else if (statusData.status === 'error') {
              throw new Error("D-ID generation failed")
            }
          }
          attempts++
        }

        if (videoUrl) {
          return NextResponse.json({
            success: true,
            video: {
              url: videoUrl,
              format: "mp4",
              provider: "d-id"
            },
            message: "✅ Talking head video generated successfully using D-ID"
          })
        }
      }
    } catch (error) {
      console.error("[AVATAR] D-ID failed:", error)
    }
  }

  // TIER 2: HeyGen API
  const heygenKey = process.env.HEYGEN_API_KEY
  if (heygenKey && isValidApiKey(heygenKey)) {
    try {
      console.log("[AVATAR] Attempting HeyGen talking head...")
      
      const response = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: {
          'X-Api-Key': heygenKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_inputs: [{
            character: {
              type: 'photo',
              photo_url: sourceImage
            },
            voice: {
              type: 'text',
              input_text: text,
              voice_id: voiceId || '1bd001e7e50f421d891986aad5158bc8'
            }
          }],
          dimension: { width: 512, height: 512 }
        })
      })

      if (response.ok) {
        const data = await response.json()
        // HeyGen returns video URL directly or needs polling
        if (data.data?.video_url) {
          return NextResponse.json({
            success: true,
            video: {
              url: data.data.video_url,
              format: "mp4",
              provider: "heygen"
            },
            message: "✅ Talking head video generated successfully using HeyGen"
          })
        }
      }
    } catch (error) {
      console.error("[AVATAR] HeyGen failed:", error)
    }
  }

  return NextResponse.json({
    success: false,
    error: "Talking head service not configured",
    message: "❌ Please configure DID_API_KEY or HEYGEN_API_KEY for talking head generation",
    suggestedTools: [
      { name: "D-ID", url: "https://d-id.com", description: "AI video generation" },
      { name: "HeyGen", url: "https://heygen.com", description: "AI avatar videos" },
      { name: "Synthesia", url: "https://synthesia.io", description: "AI video creation" }
    ]
  }, { status: 503 })
}

async function handleLipSync(
  sourceMedia: string | undefined,
  audioUrl: string | undefined,
  user: any,
  isValidApiKey: (key: string | undefined) => boolean
) {
  if (!sourceMedia) {
    return NextResponse.json({ error: "Source image or video is required" }, { status: 400 })
  }

  if (!audioUrl) {
    return NextResponse.json({ error: "Audio URL is required for lip-sync" }, { status: 400 })
  }

  // TIER 1: Replicate Wav2Lip
  const replicateKey = process.env.REPLICATE_API_TOKEN
  if (replicateKey && isValidApiKey(replicateKey)) {
    try {
      console.log("[AVATAR] Attempting Replicate Wav2Lip...")
      
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: "8d65e3f4f4298520e079198b493c25adfc43c058ffec924f2aefc8010ed25eef",
          input: {
            face: sourceMedia,
            audio: audioUrl
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Poll for completion
        let videoUrl = null
        let attempts = 0
        const maxAttempts = 120
        
        while (!videoUrl && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const statusResponse = await fetch(
            `https://api.replicate.com/v1/predictions/${data.id}`,
            { headers: { 'Authorization': `Token ${replicateKey}` } }
          )
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            if (statusData.status === 'succeeded' && statusData.output) {
              videoUrl = statusData.output
              break
            } else if (statusData.status === 'failed') {
              throw new Error("Lip-sync generation failed")
            }
          }
          attempts++
        }

        if (videoUrl) {
          return NextResponse.json({
            success: true,
            video: {
              url: videoUrl,
              format: "mp4",
              provider: "replicate-wav2lip"
            },
            message: "✅ Lip-sync video generated successfully"
          })
        }
      }
    } catch (error) {
      console.error("[AVATAR] Replicate Wav2Lip failed:", error)
    }
  }

  return NextResponse.json({
    success: false,
    error: "Lip-sync service not configured",
    message: "❌ Please configure REPLICATE_API_TOKEN for lip-sync"
  }, { status: 503 })
}

export async function GET() {
  return NextResponse.json({
    name: "Avatar & Talking Head Generation API",
    description: "Generate avatars and create talking head videos",
    actions: [
      { id: "generate-avatar", label: "Generate Avatar", description: "Create an AI avatar image" },
      { id: "talking-head", label: "Talking Head", description: "Create video of avatar speaking" },
      { id: "lip-sync", label: "Lip Sync", description: "Sync lips to audio" }
    ],
    styles: [
      { id: "realistic", label: "Realistic" },
      { id: "cartoon", label: "Cartoon" },
      { id: "anime", label: "Anime" },
      { id: "3d", label: "3D Rendered" },
      { id: "professional", label: "Professional" },
      { id: "casual", label: "Casual" },
      { id: "artistic", label: "Artistic" }
    ],
    providers: [
      { id: "d-id", name: "D-ID", tier: 1, features: ["talking-head"] },
      { id: "heygen", name: "HeyGen", tier: 2, features: ["talking-head"] },
      { id: "replicate", name: "Replicate Wav2Lip", tier: 1, features: ["lip-sync"] },
      { id: "pollinations", name: "Pollinations", tier: 1, features: ["generate-avatar"] }
    ]
  })
}
