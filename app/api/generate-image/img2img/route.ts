import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

// Image-to-Image Generation with Strength Control
// Transform existing images with adjustable influence

interface Img2ImgRequest {
  image: string // base64 or URL - source image
  prompt: string // What to transform it into
  negativePrompt?: string
  strength?: number // 0.0-1.0, how much to change (0 = keep original, 1 = ignore original)
  style?: string
  seed?: number
  guidanceScale?: number
}

const STYLE_MODIFIERS: Record<string, string> = {
  realistic: "photorealistic, highly detailed, 8k resolution",
  artistic: "artistic, painterly, creative interpretation",
  anime: "anime style, manga art, Japanese animation",
  "3d": "3D render, CGI, Blender, octane render",
  sketch: "pencil sketch, hand-drawn, line art",
  watercolor: "watercolor painting, soft colors, artistic",
  oil: "oil painting, classical art style, textured",
  digital: "digital art, modern illustration, vibrant colors",
  cyberpunk: "cyberpunk style, neon lights, futuristic",
  fantasy: "fantasy art, magical, ethereal",
  vintage: "vintage style, retro, film grain",
  minimalist: "minimalist, simple, clean design"
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`img2img:${clientId}`, { maxRequests: 10, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: Img2ImgRequest = await request.json()
    const { 
      image, 
      prompt, 
      negativePrompt,
      strength = 0.75,
      style,
      seed,
      guidanceScale = 7.5
    } = body

    // Validation
    if (!image) {
      return NextResponse.json({ error: "Source image is required" }, { status: 400 })
    }

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: "Prompt too long. Maximum 2000 characters." }, { status: 400 })
    }

    // Validate strength
    const validStrength = Math.max(0.1, Math.min(1.0, strength))

    // Get user session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Build enhanced prompt
    let enhancedPrompt = prompt
    if (style && STYLE_MODIFIERS[style]) {
      enhancedPrompt += `, ${STYLE_MODIFIERS[style]}`
    }

    const defaultNegativePrompt = "blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark"
    const finalNegativePrompt = negativePrompt || defaultNegativePrompt

    // Helper function
    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Stability AI Image-to-Image
    const stabilityKey = process.env.STABILITY_API_KEY
    if (stabilityKey && isValidApiKey(stabilityKey)) {
      try {
        console.log("[IMG2IMG] Attempting Stability AI...")
        
        const formData = new FormData()
        
        // Convert base64 to blob if needed
        const imageBlob = image.startsWith('data:') 
          ? await fetch(image).then(r => r.blob())
          : await fetch(image).then(r => r.blob())
        
        formData.append('image', imageBlob, 'image.png')
        formData.append('prompt', enhancedPrompt)
        formData.append('negative_prompt', finalNegativePrompt)
        formData.append('strength', String(validStrength))
        formData.append('output_format', 'png')

        const response = await fetch(
          "https://api.stability.ai/v2beta/stable-image/generate/sd3",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${stabilityKey}`,
              "Accept": "image/*"
            },
            body: formData
          }
        )

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer()
          const base64Image = Buffer.from(imageBuffer).toString('base64')
          
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "img2img",
              prompt,
              content: `data:image/png;base64,${base64Image}`,
              options: { strength: validStrength, style, guidanceScale },
              metadata: { provider: "stability-ai", enhancedPrompt }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            image: {
              url: `data:image/png;base64,${base64Image}`,
              strength: validStrength,
              provider: "stability-ai"
            },
            prompt: enhancedPrompt,
            message: "✅ Image transformed successfully using Stability AI"
          })
        }
      } catch (error) {
        console.error("[IMG2IMG] Stability AI failed:", error)
      }
    }

    // TIER 2: Replicate SDXL img2img
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[IMG2IMG] Attempting Replicate SDXL...")
        
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input: {
              image,
              prompt: enhancedPrompt,
              negative_prompt: finalNegativePrompt,
              prompt_strength: validStrength,
              num_inference_steps: 30,
              guidance_scale: guidanceScale,
              ...(seed ? { seed } : {})
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Poll for completion
          let resultUrl = null
          let attempts = 0
          
          while (!resultUrl && attempts < 120) {
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
                throw new Error("Replicate img2img failed")
              }
            }
            attempts++
          }

          if (resultUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "img2img",
                prompt,
                content: resultUrl,
                options: { strength: validStrength, style },
                metadata: { provider: "replicate-sdxl" }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              image: {
                url: resultUrl,
                strength: validStrength,
                provider: "replicate-sdxl"
              },
              prompt: enhancedPrompt,
              message: "✅ Image transformed successfully using Replicate SDXL"
            })
          }
        }
      } catch (error) {
        console.error("[IMG2IMG] Replicate failed:", error)
      }
    }

    // TIER 3: HuggingFace img2img
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[IMG2IMG] Attempting HuggingFace...")
        
        const response = await fetch(
          "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-refiner-1.0",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: enhancedPrompt,
              parameters: {
                image,
                strength: validStrength,
                negative_prompt: finalNegativePrompt
              }
            })
          }
        )

        if (response.ok) {
          const imageBlob = await response.blob()
          const arrayBuffer = await imageBlob.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          
          return NextResponse.json({
            success: true,
            image: {
              url: `data:image/png;base64,${base64}`,
              strength: validStrength,
              provider: "huggingface-sdxl"
            },
            prompt: enhancedPrompt,
            message: "✅ Image transformed successfully using HuggingFace"
          })
        }
      } catch (error) {
        console.error("[IMG2IMG] HuggingFace failed:", error)
      }
    }

    // No providers available
    return NextResponse.json({
      success: false,
      error: "Image-to-image service not configured",
      message: "❌ Please configure STABILITY_API_KEY, REPLICATE_API_TOKEN, or HUGGINGFACE_API_KEY"
    }, { status: 503 })

  } catch (error) {
    console.error("[IMG2IMG] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Image transformation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Image-to-Image Generation API",
    description: "Transform existing images with adjustable influence",
    parameters: {
      image: { type: "string", required: true, description: "Base64 image or URL" },
      prompt: { type: "string", required: true, maxLength: 2000, description: "What to transform the image into" },
      negativePrompt: { type: "string", optional: true, description: "What to avoid" },
      strength: { 
        type: "number", 
        min: 0.1, 
        max: 1.0, 
        default: 0.75, 
        description: "How much to change (0.1 = subtle, 1.0 = complete transformation)" 
      },
      style: { type: "string", optional: true },
      guidanceScale: { type: "number", min: 1, max: 20, default: 7.5 }
    },
    styles: Object.keys(STYLE_MODIFIERS).map(id => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) })),
    strengthGuide: [
      { value: 0.1, description: "Very subtle changes, mostly keeps original" },
      { value: 0.3, description: "Light transformation, original clearly visible" },
      { value: 0.5, description: "Balanced transformation" },
      { value: 0.75, description: "Strong transformation, some original features" },
      { value: 1.0, description: "Complete transformation, ignores original" }
    ],
    providers: [
      { id: "stability", name: "Stability AI", tier: 1, quality: "high" },
      { id: "replicate", name: "Replicate SDXL", tier: 2, quality: "high" },
      { id: "huggingface", name: "HuggingFace SDXL", tier: 3, quality: "medium" }
    ]
  })
}
