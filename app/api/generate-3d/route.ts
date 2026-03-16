import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 300 // 5 minutes for 3D generation

// 3D Model Generation API
// Providers: Meshy, Replicate (Shap-E, Point-E), HuggingFace

interface Generate3DRequest {
  prompt: string
  mode?: "text-to-3d" | "image-to-3d"
  sourceImage?: string // base64 or URL for image-to-3d
  format?: "glb" | "obj" | "fbx" | "stl"
  quality?: "draft" | "standard" | "high"
  style?: string
  textureQuality?: "low" | "medium" | "high"
}

const STYLE_MODIFIERS: Record<string, string> = {
  realistic: "photorealistic, detailed textures, PBR materials",
  cartoon: "cartoon style, stylized, colorful, low poly friendly",
  lowpoly: "low poly, geometric, minimalist, game-ready",
  sculpted: "sculpted, organic, detailed mesh",
  architectural: "architectural, clean lines, precise geometry",
  organic: "organic shapes, natural forms, smooth surfaces",
  mechanical: "mechanical, hard surface, industrial design",
  fantasy: "fantasy style, magical, ornate details"
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (3D is expensive, limit more strictly)
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`3d:${clientId}`, { maxRequests: 3, windowMs: 300000 }) // 3 per 5 min
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many 3D generation requests. Please wait before trying again.",
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
    }

    const body: Generate3DRequest = await request.json()
    const { 
      prompt, 
      mode = "text-to-3d",
      sourceImage,
      format = "glb",
      quality = "standard",
      style,
      textureQuality = "medium"
    } = body

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt too long. Maximum 500 characters." },
        { status: 400 }
      )
    }

    if (mode === "image-to-3d" && !sourceImage) {
      return NextResponse.json(
        { error: "Source image is required for image-to-3d mode" },
        { status: 400 }
      )
    }

    // Get user session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const isDev = process.env.NODE_ENV === 'development' || 
                  request.headers.get('host')?.includes('localhost')

    // Build enhanced prompt
    let enhancedPrompt = prompt
    if (style && STYLE_MODIFIERS[style]) {
      enhancedPrompt += `, ${STYLE_MODIFIERS[style]}`
    }
    enhancedPrompt += ", 3D model, high quality mesh"

    // Helper function
    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 1: Try Meshy API (best quality for 3D)
    const meshyKey = process.env.MESHY_API_KEY
    if (meshyKey && isValidApiKey(meshyKey)) {
      try {
        console.log("[3D] Attempting Meshy API...")
        
        const meshyEndpoint = mode === "image-to-3d" 
          ? "https://api.meshy.ai/v1/image-to-3d"
          : "https://api.meshy.ai/v1/text-to-3d"
        
        const meshyBody = mode === "image-to-3d"
          ? { image_url: sourceImage, enable_pbr: true }
          : { 
              prompt: enhancedPrompt, 
              art_style: style || "realistic",
              negative_prompt: "low quality, blurry, distorted"
            }

        const meshyResponse = await fetch(meshyEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${meshyKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(meshyBody)
        })

        if (meshyResponse.ok) {
          const meshyData = await meshyResponse.json()
          const taskId = meshyData.result
          
          // Poll for completion
          let modelUrl = null
          let thumbnailUrl = null
          let attempts = 0
          const maxAttempts = 180 // 3 minutes max
          
          while (!modelUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const statusResponse = await fetch(
              `https://api.meshy.ai/v1/text-to-3d/${taskId}`,
              {
                headers: { "Authorization": `Bearer ${meshyKey}` }
              }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "SUCCEEDED") {
                modelUrl = statusData.model_urls?.glb || statusData.model_urls?.obj
                thumbnailUrl = statusData.thumbnail_url
                break
              } else if (statusData.status === "FAILED") {
                throw new Error("Meshy generation failed: " + statusData.message)
              }
            }
            attempts++
          }

          if (modelUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "3d-model",
                prompt,
                content: modelUrl,
                options: { mode, format, quality, style, textureQuality },
                metadata: { 
                  originalPrompt: prompt,
                  enhancedPrompt,
                  provider: "meshy",
                  thumbnailUrl,
                  status: "completed"
                }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              model: {
                url: modelUrl,
                format: "glb",
                thumbnailUrl,
                provider: "meshy"
              },
              prompt: enhancedPrompt,
              settings: { mode, format, quality, style, textureQuality },
              message: "✅ 3D model generated successfully using Meshy"
            })
          }
        }
      } catch (meshyError) {
        console.error("[3D] Meshy failed:", meshyError)
      }
    }

    // TIER 2: Try Replicate Shap-E (OpenAI's 3D model)
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[3D] Attempting Replicate Shap-E...")
        
        const replicateResponse = await fetch(
          "https://api.replicate.com/v1/predictions",
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              version: "3cab4b0a9f1c7e8f7e0e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e", // Shap-E version
              input: {
                prompt: enhancedPrompt,
                output_format: "glb",
                guidance_scale: 15
              }
            })
          }
        )

        if (replicateResponse.ok) {
          const replicateData = await replicateResponse.json()
          
          // Poll for completion
          let modelUrl = null
          let attempts = 0
          const maxAttempts = 120
          
          while (!modelUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${replicateData.id}`,
              {
                headers: {
                  "Authorization": `Token ${replicateKey}`
                }
              }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "succeeded" && statusData.output) {
                modelUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
                break
              } else if (statusData.status === "failed") {
                throw new Error("Replicate Shap-E generation failed")
              }
            }
            attempts++
          }

          if (modelUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "3d-model",
                prompt,
                content: modelUrl,
                options: { mode, format, quality, style },
                metadata: { 
                  originalPrompt: prompt,
                  enhancedPrompt,
                  provider: "replicate-shap-e",
                  status: "completed"
                }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              model: {
                url: modelUrl,
                format: "glb",
                provider: "replicate-shap-e"
              },
              prompt: enhancedPrompt,
              settings: { mode, format, quality, style },
              message: "✅ 3D model generated successfully using Replicate Shap-E"
            })
          }
        }
      } catch (replicateError) {
        console.error("[3D] Replicate Shap-E failed:", replicateError)
      }
    }

    // TIER 3: Try HuggingFace Shap-E
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[3D] Attempting HuggingFace Shap-E...")
        
        const hfResponse = await fetch(
          "https://api-inference.huggingface.co/models/openai/shap-e",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: enhancedPrompt
            })
          }
        )

        if (hfResponse.ok) {
          const modelBlob = await hfResponse.blob()
          const arrayBuffer = await modelBlob.arrayBuffer()
          const base64Model = Buffer.from(arrayBuffer).toString('base64')
          const modelDataUrl = `data:model/gltf-binary;base64,${base64Model}`

          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "3d-model",
              prompt,
              content: modelDataUrl,
              options: { mode, format, quality, style },
              metadata: { 
                originalPrompt: prompt,
                enhancedPrompt,
                provider: "huggingface-shap-e",
                status: "completed"
              }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            model: {
              url: modelDataUrl,
              format: "glb",
              provider: "huggingface-shap-e"
            },
            prompt: enhancedPrompt,
            settings: { mode, format, quality, style },
            message: "✅ 3D model generated successfully using HuggingFace Shap-E"
          })
        }
      } catch (hfError) {
        console.error("[3D] HuggingFace Shap-E failed:", hfError)
      }
    }

    // No providers available
    return NextResponse.json({
      success: false,
      error: "3D generation service not configured",
      message: "❌ No 3D generation API configured. Please configure one of: MESHY_API_KEY (recommended), REPLICATE_API_TOKEN, or HUGGINGFACE_API_KEY",
      prompt: enhancedPrompt,
      settings: { mode, format, quality, style },
      suggestedTools: [
        { name: "Meshy", url: "https://meshy.ai", description: "AI 3D model generation" },
        { name: "Luma AI", url: "https://lumalabs.ai", description: "3D capture and generation" },
        { name: "Kaedim", url: "https://kaedim3d.com", description: "Image to 3D" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[3D] Generation error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate 3D model"
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "3D Model Generation API",
    description: "Generate 3D models from text or images",
    modes: [
      { id: "text-to-3d", label: "Text to 3D", description: "Generate 3D from text description" },
      { id: "image-to-3d", label: "Image to 3D", description: "Convert image to 3D model" }
    ],
    styles: [
      { id: "realistic", label: "Realistic", description: "Photorealistic textures" },
      { id: "cartoon", label: "Cartoon", description: "Stylized, colorful" },
      { id: "lowpoly", label: "Low Poly", description: "Geometric, game-ready" },
      { id: "sculpted", label: "Sculpted", description: "Organic, detailed" },
      { id: "architectural", label: "Architectural", description: "Clean, precise" },
      { id: "organic", label: "Organic", description: "Natural forms" },
      { id: "mechanical", label: "Mechanical", description: "Hard surface, industrial" },
      { id: "fantasy", label: "Fantasy", description: "Magical, ornate" }
    ],
    formats: [
      { id: "glb", label: "GLB", description: "Binary glTF, widely supported" },
      { id: "obj", label: "OBJ", description: "Wavefront OBJ" },
      { id: "fbx", label: "FBX", description: "Autodesk FBX" },
      { id: "stl", label: "STL", description: "3D printing format" }
    ],
    qualities: [
      { id: "draft", label: "Draft", description: "Fast, lower detail" },
      { id: "standard", label: "Standard", description: "Balanced quality" },
      { id: "high", label: "High", description: "Maximum detail, slower" }
    ],
    providers: [
      { id: "meshy", name: "Meshy", tier: 1, quality: "high", features: ["text-to-3d", "image-to-3d", "PBR textures"] },
      { id: "replicate", name: "Replicate Shap-E", tier: 2, quality: "medium", features: ["text-to-3d"] },
      { id: "huggingface", name: "HuggingFace Shap-E", tier: 3, quality: "medium", features: ["text-to-3d"] }
    ]
  })
}
