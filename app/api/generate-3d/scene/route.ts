import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 180

// 3D Scene Generation API
// Generate complete 3D scenes and environments
// Includes skybox generation (Blockade Labs style)

interface SceneRequest {
  prompt: string
  type: "skybox" | "environment" | "room" | "landscape"
  style?: string
  resolution?: string
  format?: string
  // Skybox specific
  skyboxStyle?: string
  // Environment specific
  lighting?: string
  timeOfDay?: string
}

const SCENE_TYPES = [
  { id: "skybox", label: "360° Skybox", description: "Panoramic environment" },
  { id: "environment", label: "3D Environment", description: "Full 3D scene" },
  { id: "room", label: "Interior Room", description: "Indoor space" },
  { id: "landscape", label: "Landscape", description: "Outdoor terrain" }
]

const STYLES = [
  "realistic", "stylized", "anime", "fantasy", "sci-fi",
  "cartoon", "low-poly", "voxel", "photorealistic", "painterly"
]

const SKYBOX_STYLES = [
  "digital-painting", "realistic-photo", "anime-art", "surreal",
  "nebula", "interior", "exterior", "fantasy-landscape"
]

const LIGHTING_OPTIONS = [
  "natural", "studio", "dramatic", "soft", "neon", "golden-hour", "blue-hour"
]

const TIME_OF_DAY = [
  "dawn", "morning", "noon", "afternoon", "sunset", "dusk", "night", "midnight"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`scene:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many scene generation requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: SceneRequest = await request.json()
    const { 
      prompt, 
      type = "skybox",
      style = "realistic",
      resolution = "2048",
      format = "equirectangular",
      skyboxStyle = "digital-painting",
      lighting = "natural",
      timeOfDay = "noon"
    } = body

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Scene description is required" }, { status: 400 })
    }

    if (prompt.length > 500) {
      return NextResponse.json({ error: "Description too long. Maximum 500 characters." }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Build enhanced prompt
    let enhancedPrompt = prompt
    enhancedPrompt += `, ${style} style`
    enhancedPrompt += `, ${lighting} lighting`
    enhancedPrompt += `, ${timeOfDay}`
    if (type === "skybox") {
      enhancedPrompt += ", 360 degree panorama, seamless, equirectangular"
    }

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Blockade Labs Skybox API
    const blockadeKey = process.env.BLOCKADE_LABS_API_KEY
    if (blockadeKey && isValidApiKey(blockadeKey) && type === "skybox") {
      try {
        console.log("[SCENE] Attempting Blockade Labs Skybox...")
        
        const response = await fetch("https://backend.blockadelabs.com/api/v1/skybox", {
          method: "POST",
          headers: {
            "x-api-key": blockadeKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: enhancedPrompt,
            skybox_style_id: getSkyboxStyleId(skyboxStyle),
            webhook_url: null
          })
        })

        if (response.ok) {
          const data = await response.json()
          const skyboxId = data.id
          
          // Poll for completion
          let skyboxUrl = null
          let attempts = 0
          
          while (!skyboxUrl && attempts < 120) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            const statusResponse = await fetch(
              `https://backend.blockadelabs.com/api/v1/imagine/requests/${skyboxId}`,
              { headers: { "x-api-key": blockadeKey } }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "complete" && statusData.file_url) {
                skyboxUrl = statusData.file_url
                break
              } else if (statusData.status === "error") {
                throw new Error("Skybox generation failed")
              }
            }
            attempts++
          }

          if (skyboxUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "3d-scene",
                prompt,
                content: skyboxUrl,
                options: { type, style, skyboxStyle, resolution },
                metadata: { provider: "blockade-labs" }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              scene: {
                url: skyboxUrl,
                type: "skybox",
                format: "equirectangular",
                resolution: "4096x2048",
                provider: "blockade-labs"
              },
              prompt: enhancedPrompt,
              message: "✅ 360° Skybox generated successfully using Blockade Labs"
            })
          }
        }
      } catch (error) {
        console.error("[SCENE] Blockade Labs failed:", error)
      }
    }

    // TIER 2: Replicate Skybox/Panorama models
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[SCENE] Attempting Replicate panorama generation...")
        
        // Use a panorama generation model
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            // Panorama/360 model
            version: "a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90",
            input: {
              prompt: enhancedPrompt,
              width: 2048,
              height: 1024
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Poll for completion
          let resultUrl = null
          let attempts = 0
          
          while (!resultUrl && attempts < 120) {
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
                break
              }
            }
            attempts++
          }

          if (resultUrl) {
            return NextResponse.json({
              success: true,
              scene: {
                url: resultUrl,
                type,
                format: "image",
                provider: "replicate"
              },
              prompt: enhancedPrompt,
              message: "✅ Scene generated using Replicate",
              note: "For true 360° skyboxes, configure BLOCKADE_LABS_API_KEY"
            })
          }
        }
      } catch (error) {
        console.error("[SCENE] Replicate failed:", error)
      }
    }

    // TIER 3: Generate panoramic image with Pollinations
    try {
      console.log("[SCENE] Generating panoramic image with Pollinations...")
      
      const panoramaPrompt = `${enhancedPrompt}, wide panoramic view, landscape orientation`
      const encodedPrompt = encodeURIComponent(panoramaPrompt)
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=2048&height=1024&nologo=true&seed=${Date.now()}`
      
      const response = await fetch(pollinationsUrl)
      
      if (response.ok) {
        const imageBlob = await response.blob()
        const arrayBuffer = await imageBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        
        return NextResponse.json({
          success: true,
          scene: {
            url: `data:image/jpeg;base64,${base64}`,
            type: "panorama",
            format: "image",
            resolution: "2048x1024",
            provider: "pollinations-ai"
          },
          prompt: enhancedPrompt,
          message: "⚠️ Generated panoramic image (not true 360°). Configure BLOCKADE_LABS_API_KEY for skyboxes."
        })
      }
    } catch (error) {
      console.error("[SCENE] Pollinations failed:", error)
    }

    return NextResponse.json({
      success: false,
      error: "Scene generation service not configured",
      message: "❌ Please configure BLOCKADE_LABS_API_KEY or REPLICATE_API_TOKEN",
      suggestedTools: [
        { name: "Blockade Labs", url: "https://skybox.blockadelabs.com", description: "Best for 360° skyboxes" },
        { name: "Luma AI", url: "https://lumalabs.ai", description: "3D scene capture" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[SCENE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Scene generation failed" },
      { status: 500 }
    )
  }
}

function getSkyboxStyleId(style: string): number {
  const styleMap: Record<string, number> = {
    "digital-painting": 2,
    "realistic-photo": 14,
    "anime-art": 21,
    "surreal": 5,
    "nebula": 10,
    "interior": 15,
    "exterior": 16,
    "fantasy-landscape": 7
  }
  return styleMap[style] || 2
}

export async function GET() {
  return NextResponse.json({
    name: "3D Scene Generation API",
    description: "Generate 360° skyboxes and 3D environments",
    parameters: {
      prompt: { type: "string", required: true, maxLength: 500 },
      type: { type: "string", enum: ["skybox", "environment", "room", "landscape"], default: "skybox" },
      style: { type: "string", enum: STYLES, default: "realistic" },
      resolution: { type: "string", enum: ["1024", "2048", "4096"], default: "2048" },
      skyboxStyle: { type: "string", enum: SKYBOX_STYLES, default: "digital-painting" },
      lighting: { type: "string", enum: LIGHTING_OPTIONS, default: "natural" },
      timeOfDay: { type: "string", enum: TIME_OF_DAY, default: "noon" }
    },
    sceneTypes: SCENE_TYPES,
    styles: STYLES,
    skyboxStyles: SKYBOX_STYLES,
    lightingOptions: LIGHTING_OPTIONS,
    timeOfDay: TIME_OF_DAY,
    examples: [
      { prompt: "Ancient temple ruins in a mystical forest", type: "skybox", style: "fantasy" },
      { prompt: "Futuristic city at night with neon lights", type: "skybox", style: "sci-fi" },
      { prompt: "Cozy cabin interior with fireplace", type: "room", style: "realistic" },
      { prompt: "Alien planet with two moons", type: "landscape", style: "surreal" }
    ],
    providers: [
      { id: "blockade", name: "Blockade Labs", tier: 1, quality: "highest", features: ["360° skybox"] },
      { id: "replicate", name: "Replicate", tier: 2, quality: "medium" },
      { id: "pollinations", name: "Pollinations", tier: 3, quality: "low", note: "Panoramic images only" }
    ]
  })
}
