import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

// Image Blending / Remix API
// Combine multiple images into one
// Similar to Midjourney blend feature

interface BlendRequest {
  images: string[] // Array of base64 or URLs (2-5 images)
  prompt?: string // Optional guidance prompt
  weights?: number[] // Weight for each image (0.0-1.0)
  style?: string
  blendMode?: string
}

const BLEND_MODES = [
  "balanced", // Equal weight to all images
  "first-dominant", // First image is primary
  "style-transfer", // First image content, others for style
  "morph", // Smooth transition between images
  "collage" // Artistic combination
]

const STYLES = [
  "realistic", "artistic", "anime", "3d", "sketch", "digital"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`blend:${clientId}`, { maxRequests: 10, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: BlendRequest = await request.json()
    const { 
      images, 
      prompt,
      weights,
      style,
      blendMode = "balanced"
    } = body

    // Validation
    if (!images || !Array.isArray(images) || images.length < 2) {
      return NextResponse.json({ error: "At least 2 images are required" }, { status: 400 })
    }

    if (images.length > 5) {
      return NextResponse.json({ error: "Maximum 5 images allowed" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Calculate weights
    let imageWeights = weights || images.map(() => 1 / images.length)
    if (blendMode === "first-dominant") {
      imageWeights = [0.6, ...images.slice(1).map(() => 0.4 / (images.length - 1))]
    }

    // Build prompt for blending
    let blendPrompt = prompt || "Blend these images together seamlessly"
    if (style) blendPrompt += `, ${style} style`
    blendPrompt += ", high quality, cohesive composition"

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Replicate IP-Adapter for image blending
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[BLEND] Attempting Replicate image blending...")
        
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            // IP-Adapter or similar blending model
            version: "a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90",
            input: {
              prompt: blendPrompt,
              image: images[0],
              image_2: images[1],
              ...(images[2] ? { image_3: images[2] } : {}),
              blend_weight: imageWeights[0]
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Poll for completion
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
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "image-blend",
                prompt: blendPrompt,
                content: resultUrl,
                options: { imageCount: images.length, blendMode, style, weights: imageWeights },
                metadata: { provider: "replicate" }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              image: {
                url: resultUrl,
                blendMode,
                imageCount: images.length,
                provider: "replicate"
              },
              prompt: blendPrompt,
              message: `✅ ${images.length} images blended successfully`
            })
          }
        }
      } catch (error) {
        console.error("[BLEND] Replicate failed:", error)
      }
    }

    // TIER 2: Use prompt-based generation with image descriptions via Pollinations
    try {
      console.log("[BLEND] Attempting prompt-based blending...")
      
      // Generate a description that combines the images conceptually
      const combinedPrompt = `${blendPrompt}, combining elements from ${images.length} reference images`
      
      // Use Pollinations as fallback (free, no key needed)
      const encodedPrompt = encodeURIComponent(combinedPrompt)
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`
      
      const response = await fetch(pollinationsUrl)
      
      if (response.ok) {
        const imageBlob = await response.blob()
        const arrayBuffer = await imageBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        
        return NextResponse.json({
          success: true,
          image: {
            url: `data:image/jpeg;base64,${base64}`,
            blendMode,
            imageCount: images.length,
            provider: "pollinations-ai"
          },
          prompt: combinedPrompt,
          message: "Generated conceptual blend. For true image blending, configure REPLICATE_API_TOKEN.",
          warning: "This is a prompt-based blend, not a true pixel-level blend."
        })
      }
    } catch (error) {
      console.error("[BLEND] Fallback failed:", error)
    }

    return NextResponse.json({
      success: false,
      error: "Image blending service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN for image blending",
      suggestedTools: [
        { name: "Midjourney", url: "https://midjourney.com", description: "Best image blending" },
        { name: "Replicate", url: "https://replicate.com", description: "IP-Adapter blending" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[BLEND] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Image blending failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Image Blending / Remix API",
    description: "Combine multiple images into one cohesive image",
    parameters: {
      images: { type: "array", required: true, minItems: 2, maxItems: 5, description: "Array of base64 images or URLs" },
      prompt: { type: "string", optional: true, description: "Guidance for how to blend" },
      weights: { type: "array", optional: true, description: "Weight for each image (0.0-1.0)" },
      style: { type: "string", enum: STYLES, optional: true },
      blendMode: { type: "string", enum: BLEND_MODES, default: "balanced" }
    },
    blendModes: BLEND_MODES.map(mode => ({
      id: mode,
      description: mode === "balanced" ? "Equal weight to all images" :
                   mode === "first-dominant" ? "First image is primary" :
                   mode === "style-transfer" ? "First image content, others for style" :
                   mode === "morph" ? "Smooth transition between images" :
                   "Artistic combination"
    })),
    styles: STYLES,
    examples: [
      { images: ["cat.jpg", "dog.jpg"], blendMode: "morph", prompt: "A hybrid animal" },
      { images: ["portrait.jpg", "painting.jpg"], blendMode: "style-transfer" }
    ],
    providers: [
      { id: "replicate", name: "Replicate", tier: 1, quality: "high" },
      { id: "pollinations", name: "Pollinations", tier: 2, quality: "medium", note: "Conceptual blend only" }
    ]
  })
}
