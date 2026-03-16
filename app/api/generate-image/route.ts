import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { checkCostLimit, logGenerationCost, GENERATION_COSTS } from "@/lib/cost-tracker"
import { isRouterConfigured, generate as routerGenerate, pollForResult } from "@/lib/nairi-api/router"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`image:${clientId}`, RATE_LIMITS.image)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many image generation requests. Please slow down.",
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime)
          }
        }
      )
    }

    // Get user session for cost tracking
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Dev bypass for testing - allow unauthenticated access on localhost
    const isDev = process.env.NODE_ENV === 'development' || 
                  request.headers.get('host')?.includes('localhost')
    
    if (!user && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check cost limit before generation (skip in dev mode without user)
    if (user) {
      // Get user plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      
      const userPlan = profile?.plan || 'free'
      const costCheck = await checkCostLimit(user.id, userPlan, GENERATION_COSTS.image)
      if (!costCheck.allowed) {
        return NextResponse.json(
          { 
            error: costCheck.message,
            currentCost: costCheck.currentCost,
            limit: costCheck.limit,
            upgradeRequired: true
          },
          { status: 402 }
        )
      }
    }

    const { prompt, style, size, quality, negativePrompt, seed, variations, sourceImage } = await request.json()

    // Input validation - limit prompt length
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt too long. Maximum 2000 characters." },
        { status: 400 }
      )
    }

    // Validate negative prompt
    if (negativePrompt && negativePrompt.length > 1000) {
      return NextResponse.json(
        { error: "Negative prompt too long. Maximum 1000 characters." },
        { status: 400 }
      )
    }

    // Validate seed (must be a positive integer)
    const validSeed = seed && Number.isInteger(seed) && seed > 0 ? seed : null

    // Validate size
    const validSizes = ["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"]
    const imageSize = validSizes.includes(size) ? size : "1024x1024"

    // Validate quality
    const imageQuality = quality === "hd" ? "hd" : "standard"

    // Validate variations count (1-4)
    const variationCount = variations && Number.isInteger(variations) && variations >= 1 && variations <= 4 ? variations : 1

    // Style modifiers
    const styleModifiers: Record<string, string> = {
      realistic: "photorealistic, highly detailed, 8k resolution",
      artistic: "artistic, painterly, creative interpretation",
      anime: "anime style, manga art, Japanese animation",
      "3d": "3D render, CGI, Blender, octane render",
      sketch: "pencil sketch, hand-drawn, line art",
      watercolor: "watercolor painting, soft colors, artistic",
      oil: "oil painting, classical art style, textured",
      digital: "digital art, modern illustration, vibrant colors",
      minimalist: "minimalist, simple, clean design",
      fantasy: "fantasy art, magical, ethereal"
    }

    // Default negative prompt for quality improvement
    const defaultNegativePrompt = "blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text"
    const finalNegativePrompt = negativePrompt || defaultNegativePrompt

    // Build enhanced prompt with style
    let enhancedPrompt = style && styleModifiers[style] 
      ? `${prompt}, ${styleModifiers[style]}`
      : prompt
    
    // For DALL-E, append negative prompt as "avoid" instruction (DALL-E doesn't support native negative prompts)
    const dallePrompt = negativePrompt 
      ? `${enhancedPrompt}. Avoid: ${negativePrompt}`
      : enhancedPrompt

    // Tier 0: Nairi Router (when only NAIRI_ROUTER_BASE_URL is set)
    if (isRouterConfigured()) {
      try {
        const { job_id } = await routerGenerate("image", enhancedPrompt, {
          style: style || "default",
          size: imageSize,
          negativePrompt: finalNegativePrompt,
        })
        const raw = await pollForResult(job_id, 2_500, 60)
        // Router may return: object { url?, image?, base64? } or a plain URL string
        const result = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
        let url: string | null =
          typeof result.url === "string" ? result.url
          : typeof raw === "string" && (raw.startsWith("http") || raw.startsWith("data:"))
            ? raw
            : null
        const base64 = typeof result.image === "string" ? result.image : typeof result.base64 === "string" ? result.base64 : null
        if (url || base64) {
          let imageUrl: string = base64 ? `data:image/png;base64,${base64}` : url!
          // When we only have a URL, fetch it and return as data URL so the client gets the image inline
          if (!base64 && url && (url.startsWith("http://") || url.startsWith("https://"))) {
            try {
              const controller = new AbortController()
              const t = setTimeout(() => controller.abort(), 15_000)
              const res = await fetch(url, { signal: controller.signal })
              clearTimeout(t)
              if (res.ok) {
                const buf = await res.arrayBuffer()
                const b64 = Buffer.from(buf).toString("base64")
                const contentType = res.headers.get("content-type") || "image/png"
                imageUrl = `data:${contentType};base64,${b64}`
              }
            } catch (fetchErr) {
              console.warn("[IMAGE] Could not fetch router image URL, returning URL as-is:", fetchErr)
            }
          }
          if (imageUrl && user) {
            await logGenerationCost(user.id, { type: "image", cost: GENERATION_COSTS.image, model: "nairi-router", metadata: { style: style || "default" } })
          }
          if (imageUrl) {
            return NextResponse.json({
              success: true,
              image: {
                url: imageUrl,
                size: imageSize,
                style: style || "default",
                provider: "nairi-router",
              },
            })
          }
        }
      } catch (routerErr) {
        console.error("[IMAGE] Nairi Router failed, falling back:", routerErr)
      }
    }

    // Helper function to check if API key is valid (not a placeholder)
    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      // Check for common placeholder patterns
      const placeholderPatterns = [
        /^your_/i,
        /^sk-your/i,
        /^placeholder/i,
        /^xxx/i,
        /^test_/i,
        /_here$/i,
        /^insert/i
      ]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Try Stability AI
    const stabilityKey = process.env.STABILITY_API_KEY
    
    if (stabilityKey && isValidApiKey(stabilityKey)) {
      try {
        const response = await fetch(
          "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${stabilityKey}`,
              "Accept": "application/json"
            },
            body: JSON.stringify({
              text_prompts: [
                {
                  text: enhancedPrompt,
                  weight: 1
                },
                ...(negativePrompt ? [{ text: negativePrompt, weight: -1 }] : [])
              ],
              cfg_scale: 7,
              height: 1024,
              width: 1024,
              steps: 30,
              samples: variationCount,
              ...(validSeed ? { seed: validSeed } : {})
            })
          }
        )

        if (response.ok) {
          const data = await response.json()
          const base64Image = data.artifacts[0].base64
          
          // Log cost (only if user is authenticated)
          if (user) {
            await logGenerationCost(user.id, {
              type: 'image',
              cost: GENERATION_COSTS.image,
              model: 'stable-diffusion-xl',
              metadata: {
                size: '1024x1024',
                style: style || 'default'
              }
            })
          }
          
          return NextResponse.json({
            success: true,
            image: {
              url: `data:image/png;base64,${base64Image}`,
              size: "1024x1024",
              style: style || "default",
              provider: "stable-diffusion-xl"
            }
          })
        } else {
          const error = await response.json()
          console.error("Stability AI failed, falling back:", error.message)
        }
      } catch (stabilityError) {
        console.error("Stability AI error, falling back:", stabilityError)
      }
    }

    // Fallback to HuggingFace Inference API (free tier available)
    const hfKey = process.env.HUGGINGFACE_API_KEY
    
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        const response = await fetch(
          "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: enhancedPrompt,
              parameters: {
                num_inference_steps: 30,
                guidance_scale: 7.5
              }
            })
          }
        )

        if (response.ok) {
          // HuggingFace returns image as blob
          const imageBlob = await response.blob()
          const arrayBuffer = await imageBlob.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          
          // Log cost for HuggingFace (only if user is authenticated)
          if (user) {
            await logGenerationCost(user.id, {
              type: 'image',
              cost: GENERATION_COSTS.image,
              model: 'stable-diffusion-xl-base-1.0',
              metadata: { prompt: enhancedPrompt, size: imageSize, style, provider: 'huggingface' }
            })
          }
          
          return NextResponse.json({
            success: true,
            image: {
              url: `data:image/png;base64,${base64}`,
              size: imageSize,
              style: style || "default",
              provider: "huggingface-sdxl"
            }
          })
        }
        // If not ok, fall through to Pollinations
        console.log("HuggingFace failed, falling back to Pollinations")
      } catch (hfError) {
        console.error("HuggingFace error, falling back to Pollinations:", hfError)
      }
    }

    // Free fallback using Pollinations.ai (no API key required)
    try {
      // Pollinations supports seed and negative prompt via URL params
      const encodedPrompt = encodeURIComponent(enhancedPrompt)
      const encodedNegative = negativePrompt ? `&negative=${encodeURIComponent(negativePrompt)}` : ''
      const seedParam = validSeed ? `&seed=${validSeed}` : `&seed=${Date.now()}`
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true${seedParam}${encodedNegative}`
      
      // Generate multiple variations if requested
      const images = []
      for (let i = 0; i < variationCount; i++) {
        const varSeed = validSeed ? validSeed + i : Date.now() + i
        const varUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${varSeed}${encodedNegative}`
        
        const response = await fetch(varUrl)
        
        if (!response.ok) {
          throw new Error(`Pollinations API error: ${response.status}`)
        }
        
        const imageBlob = await response.blob()
        const arrayBuffer = await imageBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        
        images.push({
          url: `data:image/jpeg;base64,${base64}`,
          seed: varSeed
        })
      }
      
      // Return single image or array based on variation count
      if (variationCount === 1) {
        return NextResponse.json({
          success: true,
          image: {
            url: images[0].url,
            size: "1024x1024",
            style: style || "default",
            provider: "pollinations-ai",
            seed: images[0].seed
          }
        })
      } else {
        return NextResponse.json({
          success: true,
          images: images.map(img => ({
            url: img.url,
            size: "1024x1024",
            style: style || "default",
            provider: "pollinations-ai",
            seed: img.seed
          })),
          variationCount
        })
      }
    } catch (pollinationsError) {
      console.error("Pollinations fallback failed:", pollinationsError)
    }

    // No API key configured and fallback failed
    return NextResponse.json(
      { 
        error: "No image generation API configured",
        message: "Please configure STABILITY_API_KEY or HUGGINGFACE_API_KEY, or use the free Pollinations fallback."
      },
      { status: 503 }
    )

  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    styles: [
      { id: "realistic", label: "Realistic", description: "Photorealistic images" },
      { id: "artistic", label: "Artistic", description: "Creative artistic style" },
      { id: "anime", label: "Anime", description: "Japanese animation style" },
      { id: "3d", label: "3D Render", description: "3D CGI style" },
      { id: "sketch", label: "Sketch", description: "Pencil drawing style" },
      { id: "watercolor", label: "Watercolor", description: "Watercolor painting" },
      { id: "oil", label: "Oil Painting", description: "Classical oil painting" },
      { id: "digital", label: "Digital Art", description: "Modern digital illustration" },
      { id: "minimalist", label: "Minimalist", description: "Simple clean design" },
      { id: "fantasy", label: "Fantasy", description: "Magical fantasy art" }
    ],
    sizes: [
      { id: "1024x1024", label: "Square (1024x1024)" },
      { id: "1024x1792", label: "Portrait (1024x1792)" },
      { id: "1792x1024", label: "Landscape (1792x1024)" }
    ],
    qualities: [
      { id: "standard", label: "Standard" },
      { id: "hd", label: "HD" }
    ],
    // NEW: Advanced features
    advancedFeatures: {
      negativePrompt: {
        description: "Specify what to avoid in the generated image",
        maxLength: 1000,
        example: "blurry, low quality, distorted, watermark"
      },
      seed: {
        description: "Use a specific seed for reproducible results",
        type: "positive integer",
        example: 12345
      },
      variations: {
        description: "Generate multiple variations of the same prompt",
        min: 1,
        max: 4,
        default: 1
      }
    }
  })
}
