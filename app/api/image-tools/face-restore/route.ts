import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

// Face Restoration / Enhancement API
// Improve face quality in images using GFPGAN, CodeFormer, etc.

interface FaceRestoreRequest {
  image: string // base64 or URL
  model?: string // gfpgan, codeformer
  fidelity?: number // 0.0-1.0 (higher = more faithful to original)
  upscale?: number // 1, 2, 4
  enhanceBackground?: boolean
}

const MODELS = [
  { id: "gfpgan", name: "GFPGAN", description: "Fast, good quality" },
  { id: "codeformer", name: "CodeFormer", description: "Best quality, slower" },
  { id: "restoreformer", name: "RestoreFormer", description: "Good for old photos" }
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`facerestore:${clientId}`, { maxRequests: 15, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: FaceRestoreRequest = await request.json()
    const { 
      image, 
      model = "codeformer",
      fidelity = 0.7,
      upscale = 2,
      enhanceBackground = true
    } = body

    // Validation
    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Replicate GFPGAN/CodeFormer
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log(`[FACERESTORE] Attempting Replicate ${model}...`)
        
        // Select model version based on choice
        const modelVersions: Record<string, string> = {
          gfpgan: "9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
          codeformer: "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
          restoreformer: "9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3"
        }
        
        const version = modelVersions[model] || modelVersions.codeformer
        
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            version,
            input: {
              image,
              codeformer_fidelity: fidelity,
              upscale: upscale,
              background_enhance: enhanceBackground,
              face_upsample: true
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
                resultUrl = statusData.output
                break
              } else if (statusData.status === "failed") {
                throw new Error("Face restoration failed")
              }
            }
            attempts++
          }

          if (resultUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "face-restore",
                prompt: "Face restoration",
                content: resultUrl,
                options: { model, fidelity, upscale, enhanceBackground },
                metadata: { provider: `replicate-${model}` }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              image: {
                url: resultUrl,
                model,
                upscale,
                provider: `replicate-${model}`
              },
              message: `✅ Face restored successfully using ${model.toUpperCase()}`
            })
          }
        }
      } catch (error) {
        console.error("[FACERESTORE] Replicate failed:", error)
      }
    }

    // TIER 2: HuggingFace GFPGAN
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[FACERESTORE] Attempting HuggingFace GFPGAN...")
        
        const response = await fetch(
          "https://api-inference.huggingface.co/models/Xenova/face-restoration",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: image })
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
              model: "gfpgan",
              provider: "huggingface"
            },
            message: "✅ Face restored successfully using HuggingFace"
          })
        }
      } catch (error) {
        console.error("[FACERESTORE] HuggingFace failed:", error)
      }
    }

    return NextResponse.json({
      success: false,
      error: "Face restoration service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN or HUGGINGFACE_API_KEY",
      suggestedTools: [
        { name: "GFPGAN", url: "https://replicate.com/tencentarc/gfpgan", description: "Face restoration" },
        { name: "CodeFormer", url: "https://replicate.com/sczhou/codeformer", description: "Best quality" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[FACERESTORE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Face restoration failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Face Restoration / Enhancement API",
    description: "Improve face quality in images using AI",
    parameters: {
      image: { type: "string", required: true, description: "Base64 image or URL" },
      model: { type: "string", enum: ["gfpgan", "codeformer", "restoreformer"], default: "codeformer" },
      fidelity: { type: "number", min: 0.0, max: 1.0, default: 0.7, description: "Higher = more faithful to original" },
      upscale: { type: "number", enum: [1, 2, 4], default: 2 },
      enhanceBackground: { type: "boolean", default: true }
    },
    models: MODELS,
    useCases: [
      "Restore old/damaged photos",
      "Enhance AI-generated faces",
      "Improve low-resolution portraits",
      "Fix blurry faces in photos"
    ],
    providers: [
      { id: "replicate", name: "Replicate", tier: 1, models: ["gfpgan", "codeformer"] },
      { id: "huggingface", name: "HuggingFace", tier: 2, models: ["gfpgan"] }
    ]
  })
}
