import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 180

// Vocal Generation API
// Generate singing voice with specific lyrics
// Text-to-singing capability

interface VocalRequest {
  lyrics: string
  melody?: string // Description of melody or reference audio
  voice?: string // Voice type/style
  genre?: string
  tempo?: string
  key?: string
  emotion?: string
  language?: string
  // Advanced
  duration?: number
  backing?: boolean // Include backing track
}

const VOICES = [
  { id: "female-pop", label: "Female Pop", description: "Clear, modern female voice" },
  { id: "male-pop", label: "Male Pop", description: "Smooth male pop voice" },
  { id: "female-soul", label: "Female Soul", description: "Soulful female voice" },
  { id: "male-rock", label: "Male Rock", description: "Powerful rock voice" },
  { id: "female-indie", label: "Female Indie", description: "Soft indie female voice" },
  { id: "male-rnb", label: "Male R&B", description: "Smooth R&B male voice" },
  { id: "choir", label: "Choir", description: "Harmonized choir" },
  { id: "opera-female", label: "Opera Female", description: "Classical soprano" },
  { id: "opera-male", label: "Opera Male", description: "Classical tenor" }
]

const EMOTIONS = [
  "neutral", "happy", "sad", "passionate", "gentle", 
  "powerful", "dreamy", "energetic", "melancholic"
]

const GENRES = [
  "pop", "rock", "r&b", "soul", "country", "folk",
  "electronic", "jazz", "classical", "hip-hop", "indie"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`vocals:${clientId}`, { maxRequests: 5, windowMs: 300000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: VocalRequest = await request.json()
    const { 
      lyrics,
      melody,
      voice = "female-pop",
      genre = "pop",
      tempo = "medium",
      key,
      emotion = "neutral",
      language = "english",
      duration = 30,
      backing = false
    } = body

    // Validation
    if (!lyrics || lyrics.trim().length === 0) {
      return NextResponse.json({ error: "Lyrics are required" }, { status: 400 })
    }

    if (lyrics.length > 2000) {
      return NextResponse.json({ error: "Lyrics too long. Maximum 2000 characters." }, { status: 400 })
    }

    const validDuration = Math.max(10, Math.min(120, duration))

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Build vocal generation prompt
    const vocalPrompt = `Singing voice: ${voice}, genre: ${genre}, emotion: ${emotion}, tempo: ${tempo}${key ? `, key: ${key}` : ''}, language: ${language}. Lyrics: ${lyrics}`

    // TIER 1: Try Suno API (if available)
    const sunoKey = process.env.SUNO_API_KEY
    if (sunoKey && isValidApiKey(sunoKey)) {
      try {
        console.log("[VOCALS] Attempting Suno API...")
        // Suno API would go here when available
        // Suno is the best for vocals with lyrics
      } catch (error) {
        console.error("[VOCALS] Suno failed:", error)
      }
    }

    // TIER 2: Replicate Bark (text-to-speech with singing capability)
    const replicateKey = process.env.REPLICATE_API_TOKEN
    if (replicateKey && isValidApiKey(replicateKey)) {
      try {
        console.log("[VOCALS] Attempting Replicate Bark...")
        
        // Bark can do singing with special notation
        const barkPrompt = `♪ ${lyrics} ♪`
        
        const response = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            "Authorization": `Token ${replicateKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            // Bark model
            version: "b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787",
            input: {
              prompt: barkPrompt,
              text_temp: 0.7,
              waveform_temp: 0.7,
              history_prompt: voice.includes("female") ? "v2/en_speaker_9" : "v2/en_speaker_6"
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
                audioUrl = statusData.output.audio_out || statusData.output
                break
              } else if (statusData.status === "failed") {
                break
              }
            }
            attempts++
          }

          if (audioUrl) {
            if (user) {
              Promise.resolve(supabase.from("creations").insert({
                user_id: user.id,
                type: "vocals",
                prompt: lyrics,
                content: audioUrl,
                options: { voice, genre, emotion, tempo },
                metadata: { provider: "replicate-bark" }
              })).catch((err: unknown) => {
                console.error('Failed to save creation:', err)
              })
            }

            return NextResponse.json({
              success: true,
              audio: {
                url: audioUrl,
                format: "wav",
                voice,
                provider: "replicate-bark"
              },
              lyrics,
              settings: { voice, genre, emotion, tempo, language },
              message: "✅ Vocals generated using Bark",
              note: "Bark provides speech-like singing. For professional vocals, Suno AI is recommended."
            })
          }
        }
      } catch (error) {
        console.error("[VOCALS] Replicate Bark failed:", error)
      }
    }

    // TIER 3: ElevenLabs with singing style (if supported)
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY
    if (elevenLabsKey && isValidApiKey(elevenLabsKey)) {
      try {
        console.log("[VOCALS] Attempting ElevenLabs...")
        
        // ElevenLabs is primarily TTS but can approximate singing
        const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: lyrics,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.3,
              similarity_boost: 0.8,
              style: 0.8,
              use_speaker_boost: true
            }
          })
        })

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer()
          const base64Audio = Buffer.from(audioBuffer).toString('base64')
          
          return NextResponse.json({
            success: true,
            audio: {
              url: `data:audio/mpeg;base64,${base64Audio}`,
              format: "mp3",
              voice,
              provider: "elevenlabs"
            },
            lyrics,
            settings: { voice, genre, emotion },
            message: "✅ Vocal-style speech generated using ElevenLabs",
            warning: "ElevenLabs provides expressive speech, not true singing. For singing, use Suno AI."
          })
        }
      } catch (error) {
        console.error("[VOCALS] ElevenLabs failed:", error)
      }
    }

    return NextResponse.json({
      success: false,
      error: "Vocal generation service not configured",
      message: "❌ True singing voice generation requires specialized APIs",
      lyrics,
      suggestedTools: [
        { name: "Suno AI", url: "https://suno.ai", description: "Best for singing with lyrics" },
        { name: "Udio", url: "https://udio.com", description: "High-quality AI vocals" },
        { name: "ACE Studio", url: "https://ace-studio.timedomain.cn", description: "AI singing synthesis" }
      ],
      alternative: "Use /api/generate-song with lyrics parameter for full song with vocals"
    }, { status: 503 })

  } catch (error) {
    console.error("[VOCALS] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Vocal generation failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Vocal Generation API",
    description: "Generate singing voice with specific lyrics",
    parameters: {
      lyrics: { type: "string", required: true, maxLength: 2000 },
      melody: { type: "string", optional: true, description: "Melody description or reference" },
      voice: { type: "string", enum: VOICES.map(v => v.id), default: "female-pop" },
      genre: { type: "string", enum: GENRES, default: "pop" },
      tempo: { type: "string", enum: ["slow", "medium", "fast"], default: "medium" },
      key: { type: "string", optional: true, examples: ["C major", "A minor"] },
      emotion: { type: "string", enum: EMOTIONS, default: "neutral" },
      language: { type: "string", default: "english" },
      duration: { type: "number", min: 10, max: 120, default: 30 },
      backing: { type: "boolean", default: false }
    },
    voices: VOICES,
    emotions: EMOTIONS,
    genres: GENRES,
    providers: [
      { id: "suno", name: "Suno AI", tier: 1, quality: "highest", note: "Best for true singing" },
      { id: "replicate", name: "Replicate Bark", tier: 2, quality: "medium", note: "Speech-like singing" },
      { id: "elevenlabs", name: "ElevenLabs", tier: 3, quality: "medium", note: "Expressive speech" }
    ],
    notes: [
      "True AI singing requires specialized models like Suno",
      "Bark can approximate singing but sounds more like speech",
      "For best results, use /api/generate-song for full songs"
    ]
  })
}
