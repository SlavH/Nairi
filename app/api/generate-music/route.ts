import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { isRouterConfigured, generate as routerGenerate, pollForResult } from "@/lib/nairi-api/router"

export const maxDuration = 120

// Music generation API - Text to Music using free/affordable providers
// Providers: Replicate (MusicGen), HuggingFace (MusicGen), Mubert (free tier)

interface MusicGenerateRequest {
  prompt: string
  duration?: number // in seconds (5-30)
  genre?: string
  mood?: string
  tempo?: string
  instruments?: string[]
}

// Genre presets for prompt enhancement
const GENRE_MODIFIERS: Record<string, string> = {
  electronic: "electronic music, synthesizers, EDM, digital sounds",
  rock: "rock music, electric guitars, drums, bass",
  jazz: "jazz music, saxophone, piano, smooth, improvisation",
  classical: "classical music, orchestral, symphony, strings",
  hiphop: "hip hop, rap beats, 808 bass, trap",
  ambient: "ambient music, atmospheric, ethereal, soundscape",
  pop: "pop music, catchy melody, modern production",
  lofi: "lo-fi hip hop, chill beats, relaxing, vinyl crackle",
  cinematic: "cinematic music, epic, film score, orchestral",
  folk: "folk music, acoustic guitar, natural, organic"
}

const MOOD_MODIFIERS: Record<string, string> = {
  happy: "uplifting, joyful, positive energy",
  sad: "melancholic, emotional, somber",
  energetic: "high energy, exciting, dynamic",
  calm: "peaceful, relaxing, serene",
  dark: "dark, mysterious, intense",
  romantic: "romantic, emotional, heartfelt",
  epic: "epic, powerful, grandiose",
  playful: "playful, fun, lighthearted"
}

const TEMPO_MODIFIERS: Record<string, string> = {
  slow: "slow tempo, 60-80 BPM",
  medium: "medium tempo, 90-120 BPM",
  fast: "fast tempo, 130-160 BPM",
  variable: "dynamic tempo changes"
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`music:${clientId}`, { maxRequests: 5, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many music generation requests. Please slow down.",
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      )
    }

    const body: MusicGenerateRequest = await request.json()
    const { 
      prompt, 
      duration = 10,
      genre,
      mood,
      tempo,
      instruments
    } = body

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

    // Validate duration (5-30 seconds for free tiers)
    const validDuration = Math.min(Math.max(duration, 5), 30)

    // Get user session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const isDev = process.env.NODE_ENV === 'development' || 
                  request.headers.get('host')?.includes('localhost')

    // Build enhanced prompt
    let enhancedPrompt = prompt
    if (genre && GENRE_MODIFIERS[genre]) {
      enhancedPrompt += `, ${GENRE_MODIFIERS[genre]}`
    }
    if (mood && MOOD_MODIFIERS[mood]) {
      enhancedPrompt += `, ${MOOD_MODIFIERS[mood]}`
    }
    if (tempo && TEMPO_MODIFIERS[tempo]) {
      enhancedPrompt += `, ${TEMPO_MODIFIERS[tempo]}`
    }
    if (instruments && instruments.length > 0) {
      enhancedPrompt += `, featuring ${instruments.join(', ')}`
    }

    // Helper function to check if API key is valid
    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // TIER 0: Nairi Router (music)
    if (isRouterConfigured()) {
      try {
        const { job_id } = await routerGenerate("music", enhancedPrompt, { duration: validDuration, genre, mood, tempo })
        const raw = await pollForResult(job_id, 2_500, 60)
        const result = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
        const url = typeof result.url === "string" ? result.url : typeof result.audioUrl === "string" ? result.audioUrl : null
        const base64 = typeof result.audio === "string" ? result.audio : typeof result.base64 === "string" ? result.base64 : null
        if (url || base64) {
          const audioUrl = url ?? (base64 ? `data:audio/mp3;base64,${base64}` : null)
          if (audioUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "music",
                prompt,
                content: audioUrl,
                options: { genre, mood, tempo, instruments, duration: validDuration },
                metadata: { provider: "nairi-router" },
              })).catch((err: unknown) => console.error("Failed to save creation:", err))
            }
            return NextResponse.json({
              success: true,
              audioUrl,
              durationSeconds: validDuration,
              provider: "nairi-router",
              message: "Music generated using Nairi Router",
            })
          }
        }
      } catch (routerErr) {
        console.error("[MUSIC] Nairi Router failed, falling back:", routerErr)
      }
    }

    // TIER 1: Try Replicate MusicGen
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[MUSIC] Attempting Replicate MusicGen...")
        const replicateResponse = await fetch(
          "https://api.replicate.com/v1/predictions",
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              version: "671ac645ce5e552cc63a54a2bbff63fcf798043055f2a26f81cd21d1877f6401",
              input: {
                prompt: enhancedPrompt,
                duration: validDuration,
                model_version: "stereo-large",
                output_format: "mp3",
                normalization_strategy: "peak"
              }
            })
          }
        )

        if (replicateResponse.ok) {
          const replicateData = await replicateResponse.json()
          
          // Poll for completion
          let audioUrl = null
          let attempts = 0
          const maxAttempts = 120 // 2 minutes max
          
          while (!audioUrl && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const statusResponse = await fetch(
              `https://api.replicate.com/v1/predictions/${replicateData.id}`,
              {
                headers: {
                  "Authorization": `Token ${replicateKey}`,
                  "Content-Type": "application/json"
                }
              }
            )
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              if (statusData.status === "succeeded" && statusData.output) {
                audioUrl = statusData.output
                break
              } else if (statusData.status === "failed") {
                throw new Error("Replicate MusicGen generation failed")
              }
            }
            attempts++
          }

          if (audioUrl) {
            // Save to database if user is authenticated
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "music",
                prompt,
                content: audioUrl,
                options: { genre, mood, tempo, instruments, duration: validDuration },
                metadata: { 
                  originalPrompt: prompt,
                  enhancedPrompt,
                  provider: "replicate-musicgen",
                  status: "completed"
                }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              audio: {
                url: audioUrl,
                format: "mp3",
                duration: validDuration,
                provider: "replicate-musicgen"
              },
              prompt: enhancedPrompt,
              settings: { genre, mood, tempo, instruments, duration: validDuration },
              message: "✅ Music generated successfully using Replicate MusicGen"
            })
          }
        }
      } catch (replicateError) {
        console.error("[MUSIC] Replicate failed:", replicateError)
      }
    }

    // TIER 2: Try HuggingFace MusicGen
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[MUSIC] Attempting HuggingFace MusicGen...")
        const hfResponse = await fetch(
          "https://api-inference.huggingface.co/models/facebook/musicgen-small",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: enhancedPrompt,
              parameters: {
                max_new_tokens: Math.floor(validDuration * 50) // Approximate tokens for duration
              }
            })
          }
        )

        if (hfResponse.ok) {
          const audioBlob = await hfResponse.blob()
          const arrayBuffer = await audioBlob.arrayBuffer()
          const base64Audio = Buffer.from(arrayBuffer).toString('base64')
          const audioDataUrl = `data:audio/wav;base64,${base64Audio}`

          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "music",
              prompt,
              content: audioDataUrl,
              options: { genre, mood, tempo, instruments, duration: validDuration },
              metadata: { 
                originalPrompt: prompt,
                enhancedPrompt,
                provider: "huggingface-musicgen",
                status: "completed"
              }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            audio: {
              url: audioDataUrl,
              format: "wav",
              duration: validDuration,
              provider: "huggingface-musicgen"
            },
            prompt: enhancedPrompt,
            settings: { genre, mood, tempo, instruments, duration: validDuration },
            message: "✅ Music generated successfully using HuggingFace MusicGen"
          })
        } else {
          const errorText = await hfResponse.text()
          console.error("[MUSIC] HuggingFace error:", errorText)
        }
      } catch (hfError) {
        console.error("[MUSIC] HuggingFace failed:", hfError)
      }
    }

    // TIER 3: Try Mubert API (has free tier)
    const mubertKey = process.env.MUBERT_API_KEY
    if (mubertKey && isValidApiKey(mubertKey)) {
      try {
        console.log("[MUSIC] Attempting Mubert...")
        const mubertResponse = await fetch(
          "https://api-b2b.mubert.com/v2/RecordTrackTTM",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              method: "RecordTrackTTM",
              params: {
                pat: mubertKey,
                prompt: enhancedPrompt,
                duration: validDuration,
                format: "mp3"
              }
            })
          }
        )

        if (mubertResponse.ok) {
          const mubertData = await mubertResponse.json()
          if (mubertData.data?.tasks?.[0]?.download_link) {
            const audioUrl = mubertData.data.tasks[0].download_link

            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "music",
                prompt,
                content: audioUrl,
                options: { genre, mood, tempo, instruments, duration: validDuration },
                metadata: { 
                  originalPrompt: prompt,
                  enhancedPrompt,
                  provider: "mubert",
                  status: "completed"
                }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              audio: {
                url: audioUrl,
                format: "mp3",
                duration: validDuration,
                provider: "mubert"
              },
              prompt: enhancedPrompt,
              settings: { genre, mood, tempo, instruments, duration: validDuration },
              message: "✅ Music generated successfully using Mubert"
            })
          }
        }
      } catch (mubertError) {
        console.error("[MUSIC] Mubert failed:", mubertError)
      }
    }

    // No providers available - return helpful error
    return NextResponse.json({
      success: false,
      error: "Music generation service not configured",
      message: "❌ No music generation API configured. Please configure one of: REPLICATE_API_TOKEN (recommended), HUGGINGFACE_API_KEY, or MUBERT_API_KEY",
      prompt: enhancedPrompt,
      settings: { genre, mood, tempo, instruments, duration: validDuration },
      suggestedTools: [
        { name: "Suno AI", url: "https://suno.ai", description: "AI music generation" },
        { name: "Udio", url: "https://udio.com", description: "AI music creation" },
        { name: "Mubert", url: "https://mubert.com", description: "AI-generated royalty-free music" }
      ]
    }, { status: 503 })

  } catch (error) {
    console.error("[MUSIC] Generation error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate music"
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Music Generation API",
    description: "Generate AI music from text prompts",
    genres: [
      { id: "electronic", label: "Electronic", description: "EDM, synths, digital" },
      { id: "rock", label: "Rock", description: "Guitars, drums, bass" },
      { id: "jazz", label: "Jazz", description: "Smooth, improvisation" },
      { id: "classical", label: "Classical", description: "Orchestral, symphony" },
      { id: "hiphop", label: "Hip Hop", description: "Beats, rap, 808s" },
      { id: "ambient", label: "Ambient", description: "Atmospheric, ethereal" },
      { id: "pop", label: "Pop", description: "Catchy, modern" },
      { id: "lofi", label: "Lo-Fi", description: "Chill beats, relaxing" },
      { id: "cinematic", label: "Cinematic", description: "Epic, film score" },
      { id: "folk", label: "Folk", description: "Acoustic, organic" }
    ],
    moods: [
      { id: "happy", label: "Happy" },
      { id: "sad", label: "Sad" },
      { id: "energetic", label: "Energetic" },
      { id: "calm", label: "Calm" },
      { id: "dark", label: "Dark" },
      { id: "romantic", label: "Romantic" },
      { id: "epic", label: "Epic" },
      { id: "playful", label: "Playful" }
    ],
    tempos: [
      { id: "slow", label: "Slow (60-80 BPM)" },
      { id: "medium", label: "Medium (90-120 BPM)" },
      { id: "fast", label: "Fast (130-160 BPM)" },
      { id: "variable", label: "Variable" }
    ],
    duration: {
      min: 5,
      max: 30,
      default: 10,
      unit: "seconds"
    },
    providers: [
      { id: "replicate", name: "Replicate MusicGen", tier: 1, quality: "high" },
      { id: "huggingface", name: "HuggingFace MusicGen", tier: 2, quality: "medium" },
      { id: "mubert", name: "Mubert", tier: 3, quality: "medium" }
    ]
  })
}
