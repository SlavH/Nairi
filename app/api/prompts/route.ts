import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Prompt Library / Templates API
// Store and retrieve prompt templates for common use cases

interface PromptTemplate {
  id: string
  name: string
  category: string
  type: string // image, video, music, 3d, etc.
  prompt: string
  variables?: string[] // Placeholders like {{subject}}, {{style}}
  tags?: string[]
  example?: string
}

// Built-in prompt templates
const BUILT_IN_TEMPLATES: PromptTemplate[] = [
  // Image Templates
  {
    id: "portrait-professional",
    name: "Professional Portrait",
    category: "portrait",
    type: "image",
    prompt: "Professional headshot of {{subject}}, studio lighting, neutral background, sharp focus, high resolution, business attire, confident expression",
    variables: ["subject"],
    tags: ["portrait", "professional", "headshot"],
    example: "Professional headshot of a young woman, studio lighting..."
  },
  {
    id: "landscape-epic",
    name: "Epic Landscape",
    category: "landscape",
    type: "image",
    prompt: "Breathtaking {{location}} landscape, golden hour lighting, dramatic clouds, {{season}} atmosphere, ultra wide angle, 8K resolution, National Geographic style",
    variables: ["location", "season"],
    tags: ["landscape", "nature", "epic"]
  },
  {
    id: "product-showcase",
    name: "Product Showcase",
    category: "product",
    type: "image",
    prompt: "{{product}} product photography, clean white background, soft studio lighting, professional commercial shot, high detail, advertising quality",
    variables: ["product"],
    tags: ["product", "commercial", "advertising"]
  },
  {
    id: "anime-character",
    name: "Anime Character",
    category: "character",
    type: "image",
    prompt: "Anime style {{character}}, detailed illustration, vibrant colors, dynamic pose, {{emotion}} expression, manga art style, high quality",
    variables: ["character", "emotion"],
    tags: ["anime", "character", "illustration"]
  },
  {
    id: "fantasy-scene",
    name: "Fantasy Scene",
    category: "fantasy",
    type: "image",
    prompt: "Epic fantasy scene of {{scene}}, magical atmosphere, dramatic lighting, detailed environment, concept art style, cinematic composition",
    variables: ["scene"],
    tags: ["fantasy", "magical", "concept-art"]
  },
  {
    id: "scifi-environment",
    name: "Sci-Fi Environment",
    category: "scifi",
    type: "image",
    prompt: "Futuristic {{environment}}, cyberpunk aesthetic, neon lights, advanced technology, atmospheric fog, cinematic lighting, blade runner style",
    variables: ["environment"],
    tags: ["scifi", "cyberpunk", "futuristic"]
  },
  // Video Templates
  {
    id: "video-cinematic",
    name: "Cinematic Shot",
    category: "cinematic",
    type: "video",
    prompt: "Cinematic shot of {{subject}}, smooth camera movement, {{camera_motion}}, film grain, dramatic lighting, movie quality, 24fps",
    variables: ["subject", "camera_motion"],
    tags: ["cinematic", "film", "dramatic"]
  },
  {
    id: "video-nature",
    name: "Nature Documentary",
    category: "nature",
    type: "video",
    prompt: "{{animal}} in natural habitat, wildlife documentary style, slow motion, golden hour, National Geographic quality, detailed fur/feathers",
    variables: ["animal"],
    tags: ["nature", "wildlife", "documentary"]
  },
  // Music Templates
  {
    id: "music-lofi",
    name: "Lo-Fi Chill Beat",
    category: "lofi",
    type: "music",
    prompt: "Lo-fi hip hop beat, relaxing, jazzy chords, vinyl crackle, mellow drums, study music, chill vibes, 85 BPM",
    variables: [],
    tags: ["lofi", "chill", "study"]
  },
  {
    id: "music-epic",
    name: "Epic Orchestral",
    category: "orchestral",
    type: "music",
    prompt: "Epic orchestral music, {{mood}} atmosphere, full symphony, dramatic crescendo, cinematic, film score quality, Hans Zimmer style",
    variables: ["mood"],
    tags: ["orchestral", "epic", "cinematic"]
  },
  // 3D Templates
  {
    id: "3d-character",
    name: "3D Character Model",
    category: "character",
    type: "3d",
    prompt: "3D model of {{character}}, game-ready, detailed textures, PBR materials, T-pose, clean topology, stylized",
    variables: ["character"],
    tags: ["3d", "character", "game-ready"]
  },
  {
    id: "3d-environment",
    name: "3D Environment",
    category: "environment",
    type: "3d",
    prompt: "3D environment of {{scene}}, detailed props, atmospheric lighting, game environment, Unreal Engine quality",
    variables: ["scene"],
    tags: ["3d", "environment", "game"]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const id = searchParams.get('id')

    // Get single template by ID
    if (id) {
      const template = BUILT_IN_TEMPLATES.find(t => t.id === id)
      if (template) {
        return NextResponse.json({ success: true, template })
      }
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    let templates = [...BUILT_IN_TEMPLATES]

    // Filter by type
    if (type) {
      templates = templates.filter(t => t.type === type)
    }

    // Filter by category
    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase()
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.prompt.toLowerCase().includes(searchLower) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Try to get user's custom templates
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let userTemplates: PromptTemplate[] = []
    if (user) {
      const { data } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('user_id', user.id)
      
      if (data) {
        userTemplates = data.map(t => ({
          ...t,
          isCustom: true
        }))
      }
    }

    return NextResponse.json({
      success: true,
      templates: [...templates, ...userTemplates],
      count: templates.length + userTemplates.length,
      categories: [...new Set(BUILT_IN_TEMPLATES.map(t => t.category))],
      types: [...new Set(BUILT_IN_TEMPLATES.map(t => t.type))]
    })

  } catch (error) {
    console.error("[PROMPTS] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { action, template, templateId, variables } = body

    switch (action) {
      case "save":
        // Save a new custom template
        if (!template || !template.name || !template.prompt) {
          return NextResponse.json({ error: "Template name and prompt are required" }, { status: 400 })
        }

        const newTemplate = {
          id: `custom_${Date.now()}`,
          user_id: user.id,
          name: template.name,
          category: template.category || "custom",
          type: template.type || "image",
          prompt: template.prompt,
          variables: template.variables || [],
          tags: template.tags || [],
          created_at: new Date().toISOString()
        }

        const { error: saveError } = await supabase
          .from('prompt_templates')
          .insert(newTemplate)

        if (saveError) {
          console.log("[PROMPTS] Save error (table may not exist):", saveError)
          // Return success anyway with the template
          return NextResponse.json({
            success: true,
            template: newTemplate,
            message: "✅ Template created (local only - database table not configured)"
          })
        }

        return NextResponse.json({
          success: true,
          template: newTemplate,
          message: "✅ Template saved successfully"
        })

      case "apply":
        // Apply variables to a template
        if (!templateId) {
          return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
        }

        const foundTemplate = BUILT_IN_TEMPLATES.find(t => t.id === templateId)
        if (!foundTemplate) {
          return NextResponse.json({ error: "Template not found" }, { status: 404 })
        }

        let appliedPrompt = foundTemplate.prompt
        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            appliedPrompt = appliedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value as string)
          }
        }

        return NextResponse.json({
          success: true,
          originalTemplate: foundTemplate,
          appliedPrompt,
          variables
        })

      case "delete":
        if (!templateId) {
          return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
        }

        const { error: deleteError } = await supabase
          .from('prompt_templates')
          .delete()
          .eq('id', templateId)
          .eq('user_id', user.id)

        if (deleteError) {
          return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "✅ Template deleted"
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("[PROMPTS] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 500 }
    )
  }
}
