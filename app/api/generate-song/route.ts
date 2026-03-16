import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { isRouterConfigured, generate as routerGenerate, pollForResult } from "@/lib/nairi-api/router"

export const maxDuration = 300 // 5 minutes for song generation

// Full Song Generation API (2-4 minutes)
// Generate complete songs with structure, lyrics, and vocals
// Similar to Suno AI, Udio

interface SongRequest {
  prompt: string // Song description or theme
  lyrics?: string // Optional custom lyrics
  genre?: string
  mood?: string
  tempo?: string
  duration?: number // in seconds (30-240)
  instrumental?: boolean // No vocals
  style?: string
  // Advanced
  structure?: string // verse-chorus-verse, etc.
  key?: string // Musical key
  bpm?: number
  vocals?: "male" | "female" | "duet" | "choir"
}

const GENRES = [
  "pop", "rock", "hip-hop", "r&b", "electronic", "edm",
  "jazz", "blues", "country", "folk", "classical", "orchestral",
  "metal", "punk", "indie", "alternative", "soul", "funk",
  "reggae", "latin", "k-pop", "j-pop", "lo-fi", "ambient"
]

const MOODS = [
  "happy", "sad", "energetic", "calm", "romantic", "angry",
  "melancholic", "uplifting", "dark", "dreamy", "epic", "nostalgic"
]

const STRUCTURES = [
  "intro-verse-chorus-verse-chorus-bridge-chorus-outro",
  "verse-chorus-verse-chorus",
  "intro-verse-chorus-outro",
  "aaba", // Jazz standard
  "verse-prechorus-chorus",
  "freeform"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`song:${clientId}`, { maxRequests: 3, windowMs: 600000 }) // 3 per 10 min
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many song generation requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: SongRequest = await request.json()
    const { 
      prompt, 
      lyrics,
      genre = "pop",
      mood = "uplifting",
      tempo = "medium",
      duration = 120,
      instrumental = false,
      style,
      structure = "verse-chorus-verse-chorus",
      key,
      bpm,
      vocals = "female"
    } = body

    // Validation
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Song prompt/theme is required" }, { status: 400 })
    }

    if (prompt.length > 1000) {
      return NextResponse.json({ error: "Prompt too long. Maximum 1000 characters." }, { status: 400 })
    }

    // Validate duration (30-240 seconds)
    const validDuration = Math.max(30, Math.min(240, duration))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Build enhanced prompt for music generation
    let musicPrompt = prompt
    musicPrompt += `, ${genre} genre`
    musicPrompt += `, ${mood} mood`
    musicPrompt += `, ${tempo} tempo`
    if (style) musicPrompt += `, ${style} style`
    if (bpm) musicPrompt += `, ${bpm} BPM`
    if (key) musicPrompt += `, key of ${key}`
    if (!instrumental) musicPrompt += `, ${vocals} vocals`
    else musicPrompt += ", instrumental, no vocals"

    // Generate lyrics if not provided and not instrumental
    let generatedLyrics = lyrics
    if (!instrumental && !lyrics) {
      try {
        const { text } = await generateWithFallback({
          system: `You are a professional songwriter. Write song lyrics based on the given theme. 
Structure: ${structure}
Genre: ${genre}
Mood: ${mood}

Output ONLY the lyrics with section markers like [Verse 1], [Chorus], [Bridge], etc.
Keep it appropriate for all audiences.`,
          prompt: `Write lyrics for a song about: ${prompt}`,
          temperature: 0.8,
          maxOutputTokens: 800,
        })
        generatedLyrics = text?.trim() || undefined
      } catch (error) {
        console.log("[SONG] Lyrics generation failed")
      }
    }

    // TIER 0: Nairi Router (music) – full song with optional lyrics
    if (isRouterConfigured()) {
      try {
        const { job_id } = await routerGenerate("music", musicPrompt, {
          duration: validDuration,
          genre,
          mood,
          lyrics: generatedLyrics,
          structure,
        })
        const raw = await pollForResult(job_id, 2_500, 90)
        const result = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
        const url = typeof result.url === "string" ? result.url : typeof result.audioUrl === "string" ? result.audioUrl : null
        const base64 = typeof result.audio === "string" ? result.audio : typeof result.base64 === "string" ? result.base64 : null
        if (url || base64) {
          const songUrl = url ?? (base64 ? `data:audio/mp3;base64,${base64}` : null)
          if (songUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "song",
                prompt,
                content: songUrl,
                options: { genre, mood, tempo, duration: validDuration, instrumental, vocals },
                metadata: { provider: "nairi-router", lyrics: generatedLyrics },
              })).catch((err: unknown) => console.error("Failed to save creation:", err))
            }
            return NextResponse.json({
              success: true,
              song: { url: songUrl, segments: [songUrl] },
              lyrics: generatedLyrics,
              durationSeconds: validDuration,
              provider: "nairi-router",
              message: "Song generated using Nairi Router",
            })
          }
        }
      } catch (routerErr) {
        console.error("[SONG] Nairi Router failed, falling back:", routerErr)
      }
    }

    // TIER 1: Try Suno API (if available - requires special access)
    const sunoKey = process.env.SUNO_API_KEY
    if (sunoKey && isValidApiKey(sunoKey)) {
      try {
        console.log("[SONG] Attempting Suno API...")
        // Suno API implementation would go here
        // Note: Suno doesn't have a public API yet
      } catch (error) {
        console.error("[SONG] Suno failed:", error)
      }
    }

    // TIER 2: Try Udio API (if available)
    const udioKey = process.env.UDIO_API_KEY
    if (udioKey && isValidApiKey(udioKey)) {
      try {
        console.log("[SONG] Attempting Udio API...")
        // Udio API implementation would go here
      } catch (error) {
        console.error("[SONG] Udio failed:", error)
      }
    }

    // TIER 3: Replicate MusicGen for longer duration
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[SONG] Attempting Replicate MusicGen (extended)...")
        
        // Generate multiple segments and concatenate
        const segmentDuration = 30 // MusicGen max
        const numSegments = Math.ceil(validDuration / segmentDuration)
        const audioSegments: string[] = []

        for (let i = 0; i < Math.min(numSegments, 4); i++) { // Max 4 segments (2 min)
          const segmentPrompt = i === 0 
            ? `${musicPrompt}, song intro and first section`
            : i === numSegments - 1
            ? `${musicPrompt}, song ending and outro, fade out`
            : `${musicPrompt}, song middle section ${i}, continuation`

          const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Token ${replicateKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              version: "671ac645ce5e552cc63a54a2bbff63fcf798043055f2a26f81cd21d1877f6401",
              input: {
                prompt: segmentPrompt,
                duration: segmentDuration,
                model_version: "stereo-large",
                output_format: "mp3",
                normalization_strategy: "peak"
              }
            })
          })

          if (response.ok) {
            const data = await response.json()
            
            // Poll for completion
            let audioUrl = null
            let attempts = 0
            
            while (!audioUrl && attempts < 120) {
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              const statusResponse = await fetch(
                `https://api.replicate.com/v1/predictions/${data.id}`,
                { headers: { "Authorization": `Token ${replicateKey}` } }
              )
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json()
                if (statusData.status === "succeeded" && statusData.output) {
                  audioUrl = statusData.output
                  break
                } else if (statusData.status === "failed") {
                  break
                }
              }
              attempts++
            }

            if (audioUrl) {
              audioSegments.push(audioUrl)
              console.log(`[SONG] Segment ${i + 1}/${numSegments} completed`)
            }
          }
        }

        if (audioSegments.length > 0) {
          const totalDuration = audioSegments.length * segmentDuration
          
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: "song",
              prompt,
              content: JSON.stringify(audioSegments),
              options: { genre, mood, tempo, duration: totalDuration, instrumental, vocals },
              metadata: { 
                provider: "replicate-musicgen",
                segmentCount: audioSegments.length,
                lyrics: generatedLyrics
              }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          return NextResponse.json({
            success: true,
            song: {
              segments: audioSegments,
              segmentCount: audioSegments.length,
              totalDuration,
              format: "mp3",
              provider: "replicate-musicgen"
            },
            lyrics: generatedLyrics,
            settings: { genre, mood, tempo, structure, instrumental, vocals },
            message: `✅ Generated ${audioSegments.length} song segments (${totalDuration}s total). Segments can be joined using audio editing software.`,
            note: "For seamless full songs with vocals, Suno AI or Udio are recommended."
          })
        }
      } catch (error) {
        console.error("[SONG] Replicate MusicGen failed:", error)
      }
    }

    // TIER 4: HuggingFace MusicGen (shorter duration)
    const hfKey = process.env.HUGGINGFACE_API_KEY
    if (hfKey && isValidApiKey(hfKey)) {
      try {
        console.log("[SONG] Attempting HuggingFace MusicGen...")
        
        const response = await fetch(
          "https://api-inference.huggingface.co/models/facebook/musicgen-large",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              inputs: musicPrompt,
              parameters: {
                max_new_tokens: Math.floor(validDuration * 50)
              }
            })
          }
        )

        if (response.ok) {
          const audioBlob = await response.blob()
          const arrayBuffer = await audioBlob.arrayBuffer()
          const base64Audio = Buffer.from(arrayBuffer).toString('base64')
          
          return NextResponse.json({
            success: true,
            song: {
              url: `data:audio/wav;base64,${base64Audio}`,
              format: "wav",
              duration: Math.min(validDuration, 30),
              provider: "huggingface-musicgen"
            },
            lyrics: generatedLyrics,
            settings: { genre, mood, tempo, instrumental },
            message: "✅ Song generated using HuggingFace MusicGen",
            warning: "HuggingFace MusicGen is limited to ~30 seconds. For longer songs, configure REPLICATE_API_TOKEN."
          })
        }
      } catch (error) {
        console.error("[SONG] HuggingFace failed:", error)
      }
    }

    // Return lyrics even if music generation failed
    if (generatedLyrics) {
      return NextResponse.json({
        success: true,
        partial: true,
        lyrics: generatedLyrics,
        settings: { genre, mood, tempo, structure },
        message: "⚠️ Lyrics generated, but music generation requires API configuration",
        suggestedTools: [
          { name: "Suno AI", url: "https://suno.ai", description: "Best for full songs with vocals" },
          { name: "Udio", url: "https://udio.com", description: "High-quality AI music" },
          { name: "Replicate MusicGen", url: "https://replicate.com", description: "Instrumental music" }
        ]
      })
    }

    return NextResponse.json({
      success: false,
      error: "Song generation service not configured",
      message: "❌ Please configure REPLICATE_API_TOKEN, HUGGINGFACE_API_KEY, or access to Suno/Udio APIs"
    }, { status: 503 })

  } catch (error) {
    console.error("[SONG] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Song generation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Full Song Generation API",
    description: "Generate complete songs with lyrics and music (2-4 minutes)",
    parameters: {
      prompt: { type: "string", required: true, maxLength: 1000, description: "Song theme or description" },
      lyrics: { type: "string", optional: true, description: "Custom lyrics (auto-generated if not provided)" },
      genre: { type: "string", enum: GENRES, default: "pop" },
      mood: { type: "string", enum: MOODS, default: "uplifting" },
      tempo: { type: "string", enum: ["slow", "medium", "fast", "variable"], default: "medium" },
      duration: { type: "number", min: 30, max: 240, default: 120, unit: "seconds" },
      instrumental: { type: "boolean", default: false },
      vocals: { type: "string", enum: ["male", "female", "duet", "choir"], default: "female" },
      structure: { type: "string", enum: STRUCTURES },
      key: { type: "string", optional: true, examples: ["C major", "A minor", "G major"] },
      bpm: { type: "number", min: 60, max: 200, optional: true }
    },
    genres: GENRES,
    moods: MOODS,
    structures: STRUCTURES,
    providers: [
      { id: "suno", name: "Suno AI", tier: 1, quality: "highest", features: ["vocals", "lyrics", "full-songs"] },
      { id: "udio", name: "Udio", tier: 2, quality: "high", features: ["vocals", "lyrics"] },
      { id: "replicate", name: "Replicate MusicGen", tier: 3, quality: "medium", features: ["instrumental"] },
      { id: "huggingface", name: "HuggingFace MusicGen", tier: 4, quality: "medium", features: ["instrumental", "short"] }
    ],
    notes: [
      "Lyrics are auto-generated if not provided",
      "For best vocal quality, Suno AI or Udio are recommended",
      "MusicGen is best for instrumental music"
    ]
  })
}
