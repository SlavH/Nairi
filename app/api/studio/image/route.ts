import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60

interface ImageRequest {
  prompt: string
  negativePrompt?: string
  aspectRatio?: string
  quality?: number
  style?: string
}

// Style modifiers for image generation
const styleModifiers: Record<string, string> = {
  "photorealistic": "ultra realistic, 8K UHD, DSLR quality, natural lighting, photorealistic",
  "digital-art": "digital art, vibrant colors, detailed, trending on artstation",
  "illustration": "illustration, hand-drawn style, artistic, detailed linework",
  "anime": "anime style, manga aesthetic, vibrant, detailed",
  "3d-render": "3D render, octane render, ultra detailed, realistic lighting",
  "oil-painting": "oil painting, classical art style, brushstrokes visible, museum quality",
  "watercolor": "watercolor painting, soft edges, artistic, dreamy",
  "sketch": "pencil sketch, detailed drawing, artistic, grayscale",
  "pop-art": "pop art style, bold colors, comic book aesthetic, graphic",
  "minimalist": "minimalist design, clean, simple, modern aesthetic"
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body: ImageRequest = await req.json()
    const { prompt, negativePrompt, aspectRatio, quality, style } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Build enhanced prompt
    const styleModifier = style && styleModifiers[style] ? styleModifiers[style] : styleModifiers["photorealistic"]
    const enhancedPrompt = `${prompt}, ${styleModifier}`

    // Try HuggingFace API
    const hfKey = process.env.HUGGINGFACE_API_KEY
    console.log("HuggingFace API key present:", !!hfKey)
    
    if (hfKey) {
      try {
        const response = await fetch(
          "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
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
                guidance_scale: 7.5,
                negative_prompt: negativePrompt || "blurry, low quality, distorted, ugly"
              }
            })
          }
        )

        console.log("HuggingFace response status:", response.status)
        
        if (response.ok) {
          // HuggingFace returns image as blob
          const imageBlob = await response.blob()
          const arrayBuffer = await imageBlob.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const imageUrl = `data:image/png;base64,${base64}`

          // Save to database (non-blocking) - only if user is logged in
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "image",
              prompt,
              content: imageUrl,
              options: { negativePrompt, aspectRatio, quality, style },
              metadata: { originalPrompt: prompt, enhancedPrompt, provider: "huggingface-sdxl" }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            imageUrl,
            enhancedPrompt,
            originalPrompt: prompt,
            negativePrompt,
            provider: "huggingface-sdxl",
            settings: { aspectRatio, quality, style }
          })
        }
      } catch (hfError) {
        console.error("HuggingFace generation error:", hfError)
        console.error("HuggingFace error details:", hfError instanceof Error ? hfError.message : String(hfError))
      }
    }

    // Fallback to Pollinations.ai (free, no API key required)
    try {
      const encodedPrompt = encodeURIComponent(enhancedPrompt)
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`
      
      const response = await fetch(pollinationsUrl)
      
      if (response.ok) {
        const imageBlob = await response.blob()
        const arrayBuffer = await imageBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const imageUrl = `data:image/jpeg;base64,${base64}`

        // Save to database (non-blocking) - only if user is logged in
        if (user) {
          Promise.resolve(supabase.from("creations").insert({
            user_id: user.id,
            type: "image",
            prompt,
            content: imageUrl,
            options: { negativePrompt, aspectRatio, quality, style },
            metadata: { originalPrompt: prompt, enhancedPrompt, provider: "pollinations-ai" }
          })).catch((err: unknown) => {
            console.error('Failed to save creation:', err)
          })
        }

        return NextResponse.json({
          success: true,
          imageUrl,
          enhancedPrompt,
          originalPrompt: prompt,
          negativePrompt,
          provider: "pollinations-ai",
          settings: { aspectRatio, quality, style }
        })
      }
    } catch (pollinationsError) {
      console.error("Pollinations fallback error:", pollinationsError)
    }

    // Final fallback: return enhanced prompt for external use
    return NextResponse.json({
      success: true,
      enhancedPrompt,
      originalPrompt: prompt,
      negativePrompt,
      settings: { aspectRatio, quality, style },
      message: "Image generation API not configured. Use this prompt with external tools."
    })

  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    )
  }
}
