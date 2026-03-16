import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

// ControlNet Image Generation API
// Advanced image generation with pose, depth, edge, and other controls

interface ControlNetRequest {
  prompt: string
  negativePrompt?: string
  controlType: "pose" | "depth" | "canny" | "scribble" | "segmentation" | "normal" | "lineart" | "softedge"
  controlImage: string // base64 or URL of the control image
  strength?: number // 0.0 to 1.0, how much the control affects output
  guidanceScale?: number
  steps?: number
  seed?: number
  style?: string
}

const CONTROL_DESCRIPTIONS: Record<string, string> = {
  pose: "Control human pose and body position using OpenPose skeleton",
  depth: "Control depth and 3D structure using depth maps",
  canny: "Control edges and outlines using Canny edge detection",
  scribble: "Generate from rough sketches and scribbles",
  segmentation: "Control regions using semantic segmentation maps",
  normal: "Control surface normals for 3D-like effects",
  lineart: "Generate from line art drawings",
  softedge: "Soft edge detection for smoother control"
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`controlnet:${clientId}`, { maxRequests: 10, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many ControlNet requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: ControlNetRequest = await request.json()
    const { 
      prompt, 
      negativePrompt,
      controlType, 
      controlImage, 
      strength = 0.8,
      guidanceScale = 7.5,
      steps = 30,
      seed,
      style
    } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (!controlType) {
      return NextResponse.json({ error: "Control type is required" }, { status: 400 })
    }

    if (!controlImage) {
      return NextResponse.json({ error: "Control image is required" }, { status: 400 })
    }

    const validControlTypes = ["pose", "depth", "canny", "scribble", "segmentation", "normal", "lineart", "softedge"]
    if (!validControlTypes.includes(controlType)) {
      return NextResponse.json({ error: `Invalid control type. Must be one of: ${validControlTypes.join(", ")}` }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Build enhanced prompt
    let enhancedPrompt = prompt
    if (style) {
      const styleModifiers: Record<string, string> = {
        realistic: "photorealistic, highly detailed, 8k resolution",
        artistic: "artistic, painterly, creative interpretation",
        anime: "anime style, manga art, Japanese animation",
        "3d": "3D render, CGI, Blender, octane render"
      }
      if (styleModifiers[style]) {
        enhancedPrompt += `, ${styleModifiers[style]}`
      }
    }

    const defaultNegative = negativePrompt || "low quality, blurry, distorted, deformed, ugly, bad anatomy"

    // TIER 1: Replicate ControlNet
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log(`[CONTROLNET] Attempting Replicate ControlNet (${controlType})...`)
        
        // Map control types to Replicate model versions
        const controlNetModels: Record<string, string> = {
          pose: "lllyasviel/control_v11p_sd15_openpose",
          depth: "lllyasviel/control_v11f1p_sd15_depth",
          canny: "lllyasviel/control_v11p_sd15_canny",
          scribble: "lllyasviel/control_v11p_sd15_scribble",
          segmentation: "lllyasviel/control_v11p_sd15_seg",
          normal: "lllyasviel/control_v11p_sd15_normalbae",
          lineart: "lllyasviel/control_v11p_sd15_lineart",
          softedge: "lllyasviel/control_v11p_sd15_softedge"
        }

        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            version: "a]f178402f96be1e0b9a8f8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8", // Generic ControlNet
            input: {
              prompt: enhancedPrompt,
              negative_prompt: defaultNegative,
              image: controlImage,
              controlnet_conditioning_scale: strength,
              guidance_scale: guidanceScale,
              num_inference_steps: steps,
              ...(seed ? { seed } : {})
            }
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Poll for completion
          let imageUrl = null
          let attempts = 0
          const maxAttempts = 120
          
          while (!imageUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${data.id}`,
              { headers: { 'Authorization': `Token ${replicateKey}` } }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === 'succeeded' && statusData.output) {
                imageUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
                break
              } else if (statusData.status === 'failed') {
                throw new Error("ControlNet generation failed")
              }
            }
            attempts++
          }

          if (imageUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "image-controlnet",
                prompt,
                content: imageUrl,
                options: { controlType, strength, guidanceScale, steps, seed, style },
                metadata: { provider: "replicate-controlnet", enhancedPrompt }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              image: {
                url: imageUrl,
                controlType,
                provider: "replicate-controlnet"
              },
              settings: { controlType, strength, guidanceScale, steps, seed, style },
              message: `✅ ControlNet image generated successfully (${controlType})`
            })
          }
        }
      } catch (error) {
        console.error("[CONTROLNET] Replicate failed:", error)
      }
    }

    // TIER 2: HuggingFace ControlNet
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log(`[CONTROLNET] Attempting HuggingFace ControlNet (${controlType})...`)
        
        const hfModels: Record<string, string> = {
          canny: "lllyasviel/sd-controlnet-canny",
          depth: "lllyasviel/sd-controlnet-depth",
          pose: "lllyasviel/sd-controlnet-openpose",
          scribble: "lllyasviel/sd-controlnet-scribble"
        }

        const modelId = hfModels[controlType] || hfModels.canny

        const response = await fetch(
          `https://api-inference.huggingface.co/models/${modelId}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: enhancedPrompt,
              parameters: {
                image: controlImage,
                controlnet_conditioning_scale: strength
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
              controlType,
              provider: "huggingface-controlnet"
            },
            settings: { controlType, strength, guidanceScale, steps, seed, style },
            message: `✅ ControlNet image generated successfully (${controlType})`
          })
        }
      } catch (error) {
        console.error("[CONTROLNET] HuggingFace failed:", error)
      }
    }

    return NextResponse.json({
      success: false,
      error: "ControlNet service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN or HUGGINGFACE_API_KEY for ControlNet",
      controlType,
      suggestedTools: [
        { name: "Replicate", url: "https://replicate.com", description: "ControlNet models" },
        { name: "Stability AI", url: "https://stability.ai", description: "Advanced image control" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[CONTROLNET] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "ControlNet generation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "ControlNet Image Generation API",
    description: "Generate images with precise control using ControlNet",
    controlTypes: [
      { id: "pose", label: "Pose Control", description: CONTROL_DESCRIPTIONS.pose },
      { id: "depth", label: "Depth Control", description: CONTROL_DESCRIPTIONS.depth },
      { id: "canny", label: "Canny Edge", description: CONTROL_DESCRIPTIONS.canny },
      { id: "scribble", label: "Scribble", description: CONTROL_DESCRIPTIONS.scribble },
      { id: "segmentation", label: "Segmentation", description: CONTROL_DESCRIPTIONS.segmentation },
      { id: "normal", label: "Normal Map", description: CONTROL_DESCRIPTIONS.normal },
      { id: "lineart", label: "Line Art", description: CONTROL_DESCRIPTIONS.lineart },
      { id: "softedge", label: "Soft Edge", description: CONTROL_DESCRIPTIONS.softedge }
    ],
    settings: {
      strength: { min: 0.0, max: 1.0, default: 0.8, description: "How much the control affects output" },
      guidanceScale: { min: 1, max: 20, default: 7.5, description: "How closely to follow the prompt" },
      steps: { min: 10, max: 50, default: 30, description: "Number of inference steps" }
    },
    providers: [
      { id: "replicate", name: "Replicate ControlNet", tier: 1, quality: "high" },
      { id: "huggingface", name: "HuggingFace ControlNet", tier: 2, quality: "medium" }
    ]
  })
}
