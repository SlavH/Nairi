import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

// 3D Texture Generation API
// Generate PBR textures for 3D models
// Albedo, Normal, Roughness, Metallic, AO maps

interface TextureRequest {
  prompt: string // Material description
  type?: string // Material type
  resolution?: string
  tileable?: boolean
  maps?: string[] // Which maps to generate
  style?: string
}

const MATERIAL_TYPES = [
  "metal", "wood", "stone", "fabric", "leather",
  "plastic", "glass", "concrete", "brick", "marble",
  "grass", "sand", "water", "ice", "lava",
  "rust", "gold", "silver", "copper", "carbon-fiber"
]

const TEXTURE_MAPS = [
  { id: "albedo", label: "Albedo/Diffuse", description: "Base color" },
  { id: "normal", label: "Normal Map", description: "Surface detail" },
  { id: "roughness", label: "Roughness", description: "Surface smoothness" },
  { id: "metallic", label: "Metallic", description: "Metal vs non-metal" },
  { id: "ao", label: "Ambient Occlusion", description: "Soft shadows" },
  { id: "height", label: "Height/Displacement", description: "Surface height" },
  { id: "emission", label: "Emission", description: "Glowing areas" }
]

const RESOLUTIONS = ["512", "1024", "2048", "4096"]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`3dtexture:${clientId}`, { maxRequests: 10, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: TextureRequest = await request.json()
    const { 
      prompt,
      type,
      resolution = "1024",
      tileable = true,
      maps = ["albedo", "normal", "roughness"],
      style = "realistic"
    } = body

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Material description is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Build texture prompts for each map type
    const basePrompt = `${prompt}${type ? `, ${type} material` : ''}, ${style} style, PBR texture, ${tileable ? 'seamless tileable' : ''}, ${resolution}x${resolution}`

    const texturePrompts: Record<string, string> = {
      albedo: `${basePrompt}, diffuse color map, no lighting baked in`,
      normal: `${basePrompt}, normal map, blue-purple tones, surface detail`,
      roughness: `${basePrompt}, roughness map, grayscale, white=rough black=smooth`,
      metallic: `${basePrompt}, metallic map, grayscale, white=metal black=non-metal`,
      ao: `${basePrompt}, ambient occlusion map, grayscale, soft shadows in crevices`,
      height: `${basePrompt}, height map, grayscale, displacement`,
      emission: `${basePrompt}, emission map, black background, glowing areas only`
    }

    const generatedMaps: Record<string, string> = {}

    // TIER 1: Replicate texture generation
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[3DTEXTURE] Attempting Replicate...")
        
        for (const mapType of maps) {
          const mapPrompt = texturePrompts[mapType] || `${basePrompt}, ${mapType} map`
          
          const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
              input: {
                prompt: mapPrompt,
                width: parseInt(resolution),
                height: parseInt(resolution),
                num_inference_steps: 30
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
              generatedMaps[mapType] = resultUrl
            }
          }
        }

        if (Object.keys(generatedMaps).length > 0) {
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "3d-texture",
              prompt,
              content: JSON.stringify(generatedMaps),
              options: { type, resolution, tileable, maps },
              metadata: { provider: "replicate" }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            textures: generatedMaps,
            mapCount: Object.keys(generatedMaps).length,
            resolution,
            tileable,
            provider: "replicate",
            message: `✅ Generated ${Object.keys(generatedMaps).length} texture maps`
          })
        }
      } catch (error) {
        console.error("[3DTEXTURE] Replicate failed:", error)
      }
    }

    // TIER 2: Pollinations for basic textures
    try {
      console.log("[3DTEXTURE] Attempting Pollinations...")
      
      for (const mapType of maps) {
        const mapPrompt = texturePrompts[mapType] || `${basePrompt}, ${mapType} map`
        const encodedPrompt = encodeURIComponent(mapPrompt)
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${resolution}&height=${resolution}&nologo=true&seed=${Date.now()}`
        
        const response = await fetch(url)
        
        if (response.ok) {
          const imageBlob = await response.blob()
          const arrayBuffer = await imageBlob.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          generatedMaps[mapType] = `data:image/jpeg;base64,${base64}`
        }
      }

      if (Object.keys(generatedMaps).length > 0) {
        return NextResponse.json({
          success: true,
          textures: generatedMaps,
          mapCount: Object.keys(generatedMaps).length,
          resolution,
          tileable,
          provider: "pollinations-ai",
          message: `✅ Generated ${Object.keys(generatedMaps).length} texture maps`,
          warning: "Pollinations textures may need post-processing for best PBR results"
        })
      }
    } catch (error) {
      console.error("[3DTEXTURE] Pollinations failed:", error)
    }

    return NextResponse.json({
      success: false,
      error: "Texture generation failed",
      message: "❌ Could not generate textures"
    }, { status: 500 })

  } catch (error) {
    console.error("[3DTEXTURE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Texture generation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "3D Texture Generation API",
    description: "Generate PBR texture maps for 3D models",
    parameters: {
      prompt: { type: "string", required: true, description: "Material description" },
      type: { type: "string", enum: MATERIAL_TYPES, optional: true },
      resolution: { type: "string", enum: RESOLUTIONS, default: "1024" },
      tileable: { type: "boolean", default: true },
      maps: { type: "array", items: TEXTURE_MAPS.map(m => m.id), default: ["albedo", "normal", "roughness"] },
      style: { type: "string", enum: ["realistic", "stylized", "cartoon"], default: "realistic" }
    },
    materialTypes: MATERIAL_TYPES,
    textureMaps: TEXTURE_MAPS,
    resolutions: RESOLUTIONS,
    examples: [
      { prompt: "weathered oak wood planks", type: "wood", maps: ["albedo", "normal", "roughness"] },
      { prompt: "brushed stainless steel", type: "metal", maps: ["albedo", "normal", "metallic", "roughness"] },
      { prompt: "mossy stone wall", type: "stone", maps: ["albedo", "normal", "roughness", "ao"] }
    ],
    providers: [
      { id: "replicate", name: "Replicate", tier: 1, quality: "high" },
      { id: "pollinations", name: "Pollinations", tier: 2, quality: "medium" }
    ]
  })
}
