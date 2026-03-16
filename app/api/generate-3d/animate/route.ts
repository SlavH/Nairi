import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 180

// 3D Animation API
// Animate 3D models with AI
// Integrates with Mixamo, DeepMotion style services

interface AnimateRequest {
  model?: string // URL or base64 of 3D model (GLB/FBX)
  character?: string // Description for character generation
  animation: string // Animation type or description
  duration?: number // seconds
  loop?: boolean
  style?: string
  // Advanced
  fps?: number
  format?: string
}

const ANIMATION_TYPES = [
  // Basic
  { id: "idle", label: "Idle", description: "Standing idle animation" },
  { id: "walk", label: "Walk", description: "Walking cycle" },
  { id: "run", label: "Run", description: "Running cycle" },
  { id: "jump", label: "Jump", description: "Jump animation" },
  // Actions
  { id: "wave", label: "Wave", description: "Waving hand" },
  { id: "dance", label: "Dance", description: "Dancing animation" },
  { id: "sit", label: "Sit", description: "Sitting down" },
  { id: "crouch", label: "Crouch", description: "Crouching" },
  // Combat
  { id: "punch", label: "Punch", description: "Punching" },
  { id: "kick", label: "Kick", description: "Kicking" },
  { id: "block", label: "Block", description: "Blocking stance" },
  // Emotions
  { id: "celebrate", label: "Celebrate", description: "Victory celebration" },
  { id: "sad", label: "Sad", description: "Sad gesture" },
  { id: "angry", label: "Angry", description: "Angry gesture" },
  // Custom
  { id: "custom", label: "Custom", description: "Describe your animation" }
]

const STYLES = [
  "realistic", "cartoon", "anime", "game", "cinematic"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`3danimate:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: AnimateRequest = await request.json()
    const { 
      model,
      character,
      animation,
      duration = 3,
      loop = true,
      style = "realistic",
      fps = 30,
      format = "glb"
    } = body

    // Validation
    if (!animation) {
      return NextResponse.json({ error: "Animation type is required" }, { status: 400 })
    }

    if (!model && !character) {
      return NextResponse.json({ error: "Either model or character description is required" }, { status: 400 })
    }

    const validDuration = Math.max(1, Math.min(10, duration))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Build animation prompt
    const animPrompt = `3D character ${animation} animation, ${style} style, ${loop ? 'looping' : 'single'}, ${fps}fps, smooth motion`

    // TIER 1: Replicate animation models
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[3DANIMATE] Attempting Replicate...")
        
        // If we have a character description but no model, generate one first
        let modelUrl = model
        
        if (!modelUrl && character) {
          // Generate 3D model first
          const modelResponse = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              version: "3cab4b0a9f1c7e8f7e0e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e",
              input: {
                prompt: `${character}, T-pose, rigged character, ${style} style`,
                output_format: "glb"
              }
            })
          })

          if (modelResponse.ok) {
            const modelData = await modelResponse.json()
            
            // Poll for model completion
            let attempts = 0
            while (!modelUrl && attempts < 120) {
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              const statusResponse = await fetch(
                `https://api.replicate.com/v1/predictions/${modelData.id}`,
                { headers: { "Authorization": `Token ${replicateKey}` } }
              )
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                if (statusData.status === "succeeded" && statusData.output) {
                  modelUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
                  break
                } else if (statusData.status === "failed") {
                  break
                }
              }
              attempts++
            }
          }
        }

        if (modelUrl) {
          // Now apply animation
          // Note: True 3D animation requires specialized models
          // This is a placeholder for when such models become available
          
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "3d-animation",
              prompt: animPrompt,
              content: modelUrl,
              options: { animation, duration: validDuration, loop, style },
              metadata: { provider: "replicate", needsAnimation: true }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            model: {
              url: modelUrl,
              format,
              provider: "replicate"
            },
            animation: {
              type: animation,
              duration: validDuration,
              loop,
              fps,
              status: "model-ready"
            },
            message: "✅ 3D model generated. Animation requires Mixamo or similar service.",
            nextSteps: [
              "1. Download the GLB model",
              "2. Upload to Mixamo (mixamo.com) for auto-rigging",
              "3. Select and apply animation",
              "4. Download animated model"
            ],
            mixamoUrl: "https://www.mixamo.com"
          })
        }
      } catch (error) {
        console.error("[3DANIMATE] Replicate failed:", error)
      }
    }

    // Return guidance for manual animation
    return NextResponse.json({
      success: false,
      error: "Automated 3D animation not yet available",
      message: "⚠️ Full 3D animation requires external services",
      manualWorkflow: {
        description: "Use these free tools to animate your 3D model:",
        steps: [
          {
            step: 1,
            tool: "Mixamo",
            url: "https://www.mixamo.com",
            action: "Upload your 3D model for auto-rigging and animation"
          },
          {
            step: 2,
            tool: "Blender",
            url: "https://www.blender.org",
            action: "Free 3D software for custom animations"
          },
          {
            step: 3,
            tool: "DeepMotion",
            url: "https://www.deepmotion.com",
            action: "AI-powered motion capture from video"
          }
        ]
      },
      suggestedAnimations: ANIMATION_TYPES.slice(0, 8)
    }, { status: 503 })

  } catch (error) {
    console.error("[3DANIMATE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Animation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "3D Animation API",
    description: "Animate 3D models with AI-assisted workflows",
    parameters: {
      model: { type: "string", optional: true, description: "URL or base64 of 3D model (GLB/FBX)" },
      character: { type: "string", optional: true, description: "Character description (will generate model)" },
      animation: { type: "string", required: true, description: "Animation type or description" },
      duration: { type: "number", min: 1, max: 10, default: 3, unit: "seconds" },
      loop: { type: "boolean", default: true },
      style: { type: "string", enum: STYLES, default: "realistic" },
      fps: { type: "number", enum: [24, 30, 60], default: 30 },
      format: { type: "string", enum: ["glb", "fbx"], default: "glb" }
    },
    animationTypes: ANIMATION_TYPES,
    styles: STYLES,
    externalTools: [
      { name: "Mixamo", url: "https://mixamo.com", description: "Free auto-rigging and animations" },
      { name: "DeepMotion", url: "https://deepmotion.com", description: "AI motion capture" },
      { name: "Blender", url: "https://blender.org", description: "Free 3D animation software" }
    ],
    notes: [
      "Full automated 3D animation is complex and requires specialized models",
      "Current workflow: Generate model -> Use Mixamo for animation",
      "Future updates will include direct animation generation"
    ]
  })
}
