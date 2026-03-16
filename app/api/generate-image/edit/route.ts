import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

// Image Editing with Text Instructions API
// "Remove the car", "Change the sky to sunset", "Add a hat to the person"
// Uses InstructPix2Pix and similar models

interface ImageEditRequest {
  image: string // base64 or URL
  instruction: string // Natural language editing instruction
  strength?: number // 0.0-1.0, how much to change
  guidanceScale?: number // How closely to follow the instruction
  seed?: number
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`edit:${clientId}`, { maxRequests: 10, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many edit requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: ImageEditRequest = await request.json()
    const { 
      image, 
      instruction,
      strength = 0.8,
      guidanceScale = 7.5,
      seed
    } = body

    // Validation
    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    if (!instruction || instruction.trim().length === 0) {
      return NextResponse.json({ error: "Instruction is required" }, { status: 400 })
    }

    if (instruction.length > 500) {
      return NextResponse.json({ error: "Instruction too long. Maximum 500 characters." }, { status: 400 })
    }

    // Get user session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isDev = process.env.NODE_ENV === 'development' || request.headers.get('host')?.includes('localhost')

    // Helper function
    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Replicate InstructPix2Pix
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[EDIT] Attempting Replicate InstructPix2Pix...")
        
        const replicateResponse = await fetch(
          "https://api.replicate.com/v1/predictions",
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              // InstructPix2Pix model
              version: "30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
              input: {
                image,
                prompt: instruction,
                num_inference_steps: 50,
                image_guidance_scale: 1.5,
                guidance_scale: guidanceScale,
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
                throw new Error("InstructPix2Pix failed: " + (statusData.error || "Unknown error"))
              }
            }
            attempts++
          }

          if (resultUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "image-edit",
                prompt: instruction,
                content: resultUrl,
                options: { strength, guidanceScale },
                metadata: { provider: "replicate-instructpix2pix", originalImage: image.substring(0, 100) }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              image: {
                url: resultUrl,
                provider: "replicate-instructpix2pix"
              },
              instruction,
              message: "✅ Image edited successfully using InstructPix2Pix"
            })
          }
        }
      } catch (replicateError) {
        console.error("[EDIT] Replicate error:", replicateError)
      }
    }

    // TIER 2: HuggingFace InstructPix2Pix
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[EDIT] Attempting HuggingFace InstructPix2Pix...")
        
        const response = await fetch(
          "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: instruction,
              parameters: {
                image
              }
            })
          }
        )

        if (response.ok) {
          const imageBlob = await response.blob()
          const arrayBuffer = await imageBlob.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "image-edit",
              prompt: instruction,
              content: `data:image/png;base64,${base64}`,
              metadata: { provider: "huggingface-instructpix2pix" }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            image: {
              url: `data:image/png;base64,${base64}`,
              provider: "huggingface-instructpix2pix"
            },
            instruction,
            message: "✅ Image edited successfully using HuggingFace InstructPix2Pix"
          })
        }
      } catch (hfError) {
        console.error("[EDIT] HuggingFace error:", hfError)
      }
    }

    // No providers available
    return NextResponse.json({
      success: false,
      error: "Image editing service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN or HUGGINGFACE_API_KEY for image editing",
      suggestedTools: [
        { name: "InstructPix2Pix", url: "https://replicate.com/timbrooks/instruct-pix2pix", description: "Edit images with text instructions" },
        { name: "Adobe Firefly", url: "https://firefly.adobe.com", description: "AI image editing" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[EDIT] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Image editing failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Image Editing with Text Instructions API",
    description: "Edit images using natural language instructions",
    examples: [
      "Remove the background",
      "Change the sky to sunset",
      "Add sunglasses to the person",
      "Make it look like winter",
      "Turn the car red",
      "Add a rainbow in the sky",
      "Make the person smile",
      "Remove the text from the image"
    ],
    parameters: {
      image: { type: "string", required: true, description: "Base64 image or URL" },
      instruction: { type: "string", required: true, maxLength: 500, description: "Natural language editing instruction" },
      strength: { type: "number", min: 0.1, max: 1.0, default: 0.8, description: "How much to change the image" },
      guidanceScale: { type: "number", min: 1, max: 20, default: 7.5, description: "How closely to follow the instruction" }
    },
    providers: [
      { id: "replicate", name: "Replicate InstructPix2Pix", tier: 1, quality: "high" },
      { id: "huggingface", name: "HuggingFace InstructPix2Pix", tier: 2, quality: "medium" }
    ]
  })
}
