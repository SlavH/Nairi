import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

// Image Inpainting & Outpainting API
// Supports: mask-based inpainting, outpainting (extend boundaries)
// Providers: Stability AI, Replicate, HuggingFace

interface InpaintRequest {
  image: string // base64 or URL
  mask?: string // base64 mask (white = edit area, black = keep)
  prompt: string
  negativePrompt?: string
  mode: "inpaint" | "outpaint"
  // Outpaint specific
  direction?: "left" | "right" | "up" | "down" | "all"
  expandPixels?: number
  // General settings
  strength?: number // 0.0-1.0, how much to change masked area
  style?: string
  seed?: number
}

const STYLE_MODIFIERS: Record<string, string> = {
  realistic: "photorealistic, highly detailed, 8k resolution",
  artistic: "artistic, painterly, creative interpretation",
  anime: "anime style, manga art, Japanese animation",
  "3d": "3D render, CGI, Blender, octane render",
  sketch: "pencil sketch, hand-drawn, line art",
  digital: "digital art, modern illustration, vibrant colors"
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`inpaint:${clientId}`, { maxRequests: 10, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many inpainting requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: InpaintRequest = await request.json()
    const { 
      image, 
      mask, 
      prompt, 
      negativePrompt,
      mode = "inpaint",
      direction = "all",
      expandPixels = 256,
      strength = 0.8,
      style,
      seed
    } = body

    // Validation
    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: "Prompt too long. Maximum 2000 characters." }, { status: 400 })
    }

    if (mode === "inpaint" && !mask) {
      return NextResponse.json({ error: "Mask is required for inpainting mode" }, { status: 400 })
    }

    // Get user session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isDev = process.env.NODE_ENV === 'development' || request.headers.get('host')?.includes('localhost')

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

    // TIER 1: Stability AI Inpainting
    const stabilityKey = process.env.STABILITY_API_KEY
    if (stabilityKey && isValidApiKey(stabilityKey)) {
      try {
        console.log(`[INPAINT] Attempting Stability AI ${mode}...`)
        
        // Prepare form data for Stability API
        const formData = new FormData()
        
        // Convert base64 to blob if needed
        const imageBlob = image.startsWith('data:') 
          ? await fetch(image).then(r => r.blob())
          : await fetch(image).then(r => r.blob())
        
        formData.append('image', imageBlob, 'image.png')
        formData.append('prompt', enhancedPrompt)
        formData.append('negative_prompt', finalNegativePrompt)
        formData.append('output_format', 'png')
        
        if (mode === "inpaint" && mask) {
          const maskBlob = mask.startsWith('data:')
            ? await fetch(mask).then(r => r.blob())
            : await fetch(mask).then(r => r.blob())
          formData.append('mask', maskBlob, 'mask.png')
        }

        const endpoint = mode === "outpaint" 
          ? "https://api.stability.ai/v2beta/stable-image/edit/outpaint"
          : "https://api.stability.ai/v2beta/stable-image/edit/inpaint"

        if (mode === "outpaint") {
          // Add outpaint-specific parameters
          if (direction === "left" || direction === "all") formData.append('left', String(expandPixels))
          if (direction === "right" || direction === "all") formData.append('right', String(expandPixels))
          if (direction === "up" || direction === "all") formData.append('up', String(expandPixels))
          if (direction === "down" || direction === "all") formData.append('down', String(expandPixels))
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stabilityKey}`,
            "Accept": "image/*"
          },
          body: formData
        })

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer()
          const base64Image = Buffer.from(imageBuffer).toString('base64')
          
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: mode,
              prompt,
              content: `data:image/png;base64,${base64Image}`,
              options: { mode, direction, expandPixels, strength, style },
              metadata: { provider: "stability-ai", enhancedPrompt }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            image: {
              url: `data:image/png;base64,${base64Image}`,
              mode,
              provider: "stability-ai"
            },
            prompt: enhancedPrompt,
            message: `✅ ${mode === 'inpaint' ? 'Inpainting' : 'Outpainting'} completed successfully using Stability AI`
          })
        } else {
          const errorText = await response.text()
          console.error("[INPAINT] Stability AI failed:", errorText)
        }
      } catch (stabilityError) {
        console.error("[INPAINT] Stability AI error:", stabilityError)
      }
    }

    // TIER 2: Replicate SDXL Inpainting
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log(`[INPAINT] Attempting Replicate SDXL ${mode}...`)
        
        const replicateResponse = await fetch(
          "https://api.replicate.com/v1/predictions",
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              // SDXL Inpainting model
              version: "c11bac58203367db93a3c552bd49a25a5418458ddffb7e90dae55780765e26d6",
              input: {
                image,
                mask: mask || undefined,
                prompt: enhancedPrompt,
                negative_prompt: finalNegativePrompt,
                strength: strength,
                num_inference_steps: 30,
                guidance_scale: 7.5,
                ...(seed ? { seed } : {})
              }
            })
          }
        )

        if (replicateResponse.ok) {
          const replicateData = await replicateResponse.json()
          
          // Poll for completion
          let resultUrl = null
          let attempts = 0
          const maxAttempts = 120
          
          while (!resultUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${replicateData.id}`,
              { headers: { "Authorization": `Token ${replicateKey}` } }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "succeeded" && statusData.output) {
                resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
                break
              } else if (statusData.status === "failed") {
                throw new Error("Replicate inpainting failed")
              }
            }
            attempts++
          }

          if (resultUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: mode,
                prompt,
                content: resultUrl,
                options: { mode, strength, style },
                metadata: { provider: "replicate-sdxl", enhancedPrompt }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              image: {
                url: resultUrl,
                mode,
                provider: "replicate-sdxl"
              },
              prompt: enhancedPrompt,
              message: `✅ ${mode === 'inpaint' ? 'Inpainting' : 'Outpainting'} completed successfully using Replicate`
            })
          }
        }
      } catch (replicateError) {
        console.error("[INPAINT] Replicate error:", replicateError)
      }
    }

    // TIER 3: HuggingFace Inpainting
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[INPAINT] Attempting HuggingFace inpainting...")
        
        const response = await fetch(
          "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting",
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
                mask,
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
              mode,
              provider: "huggingface-sd-inpaint"
            },
            prompt: enhancedPrompt,
            message: `✅ Inpainting completed successfully using HuggingFace`
          })
        }
      } catch (hfError) {
        console.error("[INPAINT] HuggingFace error:", hfError)
      }
    }

    // No providers available
    return NextResponse.json({
      success: false,
      error: "Inpainting service not configured",
      message: "❌ Please configure STABILITY_API_KEY, REPLICATE_API_TOKEN, or HUGGINGFACE_API_KEY",
      suggestedTools: [
        { name: "Stability AI", url: "https://stability.ai", description: "Best quality inpainting" },
        { name: "Replicate", url: "https://replicate.com", description: "SDXL inpainting" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[INPAINT] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Inpainting failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Image Inpainting & Outpainting API",
    description: "Edit specific parts of images or extend image boundaries",
    modes: [
      { id: "inpaint", label: "Inpaint", description: "Edit masked areas of an image" },
      { id: "outpaint", label: "Outpaint", description: "Extend image beyond its boundaries" }
    ],
    directions: [
      { id: "left", label: "Left" },
      { id: "right", label: "Right" },
      { id: "up", label: "Up" },
      { id: "down", label: "Down" },
      { id: "all", label: "All Directions" }
    ],
    styles: [
      { id: "realistic", label: "Realistic" },
      { id: "artistic", label: "Artistic" },
      { id: "anime", label: "Anime" },
      { id: "3d", label: "3D Render" },
      { id: "sketch", label: "Sketch" },
      { id: "digital", label: "Digital Art" }
    ],
    parameters: {
      strength: { min: 0.1, max: 1.0, default: 0.8, description: "How much to change the masked area" },
      expandPixels: { min: 64, max: 512, default: 256, description: "Pixels to expand for outpainting" }
    },
    providers: [
      { id: "stability", name: "Stability AI", tier: 1, quality: "high" },
      { id: "replicate", name: "Replicate SDXL", tier: 2, quality: "high" },
      { id: "huggingface", name: "HuggingFace SD", tier: 3, quality: "medium" }
    ]
  })
}
