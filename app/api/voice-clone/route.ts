import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 120

// Voice Cloning & Advanced TTS API
// Providers: ElevenLabs, Coqui TTS, PlayHT

interface VoiceCloneRequest {
  action: "clone" | "synthesize" | "list-voices"
  // For cloning
  audioSample?: string // base64 audio for voice cloning
  voiceName?: string
  // For synthesis
  text?: string
  voiceId?: string
  emotion?: string
  speed?: number
  pitch?: number
  language?: string
}

const EMOTIONS: Record<string, string> = {
  neutral: "neutral, natural speaking voice",
  happy: "happy, cheerful, upbeat tone",
  sad: "sad, melancholic, somber tone",
  angry: "angry, intense, forceful tone",
  excited: "excited, enthusiastic, energetic",
  calm: "calm, soothing, relaxed tone",
  serious: "serious, professional, authoritative",
  whisper: "whispered, soft, intimate"
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "pl", name: "Polish" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" }
]

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`voice:${clientId}`, { maxRequests: 10, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many voice requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: VoiceCloneRequest = await request.json()
    const { action, audioSample, voiceName, text, voiceId, emotion, speed = 1.0, pitch = 1.0, language = "en" } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isDev = process.env.NODE_ENV === 'development' || request.headers.get('host')?.includes('localhost')

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Handle different actions
    switch (action) {
      case "clone":
        return await handleVoiceClone(audioSample, voiceName, user, isValidApiKey)
      
      case "synthesize":
        return await handleSynthesize(text, voiceId, emotion, speed, pitch, language, user, isValidApiKey)
      
      case "list-voices":
        return await handleListVoices(isValidApiKey)
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

  } catch (error) {
    console.error("[VOICE] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Voice operation failed" },
      { status: 500 }
    )
  }
}

async function handleVoiceClone(
  audioSample: string | undefined, 
  voiceName: string | undefined,
  user: any,
  isValidApiKey: (key: string | undefined) => boolean
) {
  if (!audioSample) {
    return NextResponse.json({ error: "Audio sample is required for voice cloning" }, { status: 400 })
  }

  // TIER 1: ElevenLabs Voice Cloning
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  if (elevenLabsKey && isValidApiKey(elevenLabsKey)) {
    try {
      console.log("[VOICE] Attempting ElevenLabs voice cloning...")
      
      // Convert base64 to blob for upload
      const audioBuffer = Buffer.from(audioSample.replace(/^data:audio\/\w+;base64,/, ''), 'base64')
      const formData = new FormData()
      formData.append('name', voiceName || `Custom Voice ${Date.now()}`)
      formData.append('files', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'sample.mp3')
      
      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({
          success: true,
          voice: {
            id: data.voice_id,
            name: voiceName || data.name,
            provider: "elevenlabs"
          },
          message: "✅ Voice cloned successfully using ElevenLabs"
        })
      }
    } catch (error) {
      console.error("[VOICE] ElevenLabs cloning failed:", error)
    }
  }

  // TIER 2: Coqui TTS (open source, self-hosted option)
  const coquiKey = process.env.COQUI_API_KEY
  if (coquiKey && isValidApiKey(coquiKey)) {
    try {
      console.log("[VOICE] Attempting Coqui TTS voice cloning...")
      // Coqui API implementation would go here
      // Note: Coqui Studio was discontinued, but XTTS can be self-hosted
    } catch (error) {
      console.error("[VOICE] Coqui cloning failed:", error)
    }
  }

  return NextResponse.json({
    success: false,
    error: "Voice cloning service not configured",
    message: "❌ Please configure ELEVENLABS_API_KEY for voice cloning",
    suggestedTools: [
      { name: "ElevenLabs", url: "https://elevenlabs.io", description: "Professional voice cloning" },
      { name: "Play.ht", url: "https://play.ht", description: "AI voice generation" },
      { name: "Resemble AI", url: "https://resemble.ai", description: "Voice cloning platform" }
    ]
  }, { status: 503 })
}

async function handleSynthesize(
  text: string | undefined,
  voiceId: string | undefined,
  emotion: string | undefined,
  speed: number,
  pitch: number,
  language: string,
  user: any,
  isValidApiKey: (key: string | undefined) => boolean
) {
  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "Text is required for synthesis" }, { status: 400 })
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: "Text too long. Maximum 5000 characters." }, { status: 400 })
  }

  // TIER 1: ElevenLabs TTS
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  if (elevenLabsKey && isValidApiKey(elevenLabsKey)) {
    try {
      console.log("[VOICE] Attempting ElevenLabs synthesis...")
      
      const voice = voiceId || "21m00Tcm4TlvDq8ikWAM" // Default: Rachel
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: emotion === 'excited' ? 0.8 : 0.3,
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
            provider: "elevenlabs",
            voiceId: voice
          },
          settings: { emotion, speed, pitch, language },
          message: "✅ Audio synthesized successfully using ElevenLabs"
        })
      }
    } catch (error) {
      console.error("[VOICE] ElevenLabs synthesis failed:", error)
    }
  }

  // TIER 2: PlayHT
  const playhtKey = process.env.PLAYHT_API_KEY
  const playhtUser = process.env.PLAYHT_USER_ID
  if (playhtKey && playhtUser && isValidApiKey(playhtKey)) {
    try {
      console.log("[VOICE] Attempting PlayHT synthesis...")
      
      const response = await fetch('https://api.play.ht/api/v2/tts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${playhtKey}`,
          'X-User-ID': playhtUser,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice: voiceId || 's3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/original/manifest.json',
          output_format: 'mp3',
          speed,
          sample_rate: 24000
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          return NextResponse.json({
            success: true,
            audio: {
              url: data.url,
              format: "mp3",
              provider: "playht"
            },
            settings: { emotion, speed, pitch, language },
            message: "✅ Audio synthesized successfully using PlayHT"
          })
        }
      }
    } catch (error) {
      console.error("[VOICE] PlayHT synthesis failed:", error)
    }
  }

  // TIER 3: HuggingFace TTS
  const hfKey = process.env.HUGGINGFACE_API_KEY
  if (hfKey && isValidApiKey(hfKey)) {
    try {
      console.log("[VOICE] Attempting HuggingFace TTS...")
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/mms-tts-eng",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: text })
        }
      )

      if (response.ok) {
        const audioBlob = await response.blob()
        const arrayBuffer = await audioBlob.arrayBuffer()
        const base64Audio = Buffer.from(arrayBuffer).toString('base64')
        
        return NextResponse.json({
          success: true,
          audio: {
            url: `data:audio/wav;base64,${base64Audio}`,
            format: "wav",
            provider: "huggingface-mms"
          },
          settings: { emotion, speed, pitch, language },
          message: "✅ Audio synthesized successfully using HuggingFace MMS"
        })
      }
    } catch (error) {
      console.error("[VOICE] HuggingFace TTS failed:", error)
    }
  }

  // Fallback: Browser TTS instruction
  return NextResponse.json({
    success: true,
    audio: {
      url: null,
      useBrowserTTS: true,
      text,
      provider: "browser-speech-api"
    },
    settings: { emotion, speed, pitch, language },
    message: "Using browser-based text-to-speech. For higher quality, configure ELEVENLABS_API_KEY or PLAYHT_API_KEY."
  })
}

async function handleListVoices(isValidApiKey: (key: string | undefined) => boolean) {
  const voices: any[] = []

  // Get ElevenLabs voices
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  if (elevenLabsKey && isValidApiKey(elevenLabsKey)) {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': elevenLabsKey }
      })
      if (response.ok) {
        const data = await response.json()
        voices.push(...data.voices.map((v: any) => ({
          id: v.voice_id,
          name: v.name,
          provider: "elevenlabs",
          preview_url: v.preview_url,
          labels: v.labels
        })))
      }
    } catch (error) {
      console.error("[VOICE] Failed to fetch ElevenLabs voices:", error)
    }
  }

  // Add default browser voices
  voices.push(
    { id: "browser-default", name: "Browser Default", provider: "browser" },
    { id: "browser-male", name: "Browser Male", provider: "browser" },
    { id: "browser-female", name: "Browser Female", provider: "browser" }
  )

  return NextResponse.json({
    success: true,
    voices,
    count: voices.length
  })
}

export async function GET() {
  return NextResponse.json({
    name: "Voice Cloning & Advanced TTS API",
    description: "Clone voices and synthesize speech with emotions",
    actions: [
      { id: "clone", label: "Clone Voice", description: "Create a custom voice from audio sample" },
      { id: "synthesize", label: "Synthesize Speech", description: "Convert text to speech" },
      { id: "list-voices", label: "List Voices", description: "Get available voices" }
    ],
    emotions: [
      { id: "neutral", label: "Neutral" },
      { id: "happy", label: "Happy" },
      { id: "sad", label: "Sad" },
      { id: "angry", label: "Angry" },
      { id: "excited", label: "Excited" },
      { id: "calm", label: "Calm" },
      { id: "serious", label: "Serious" },
      { id: "whisper", label: "Whisper" }
    ],
    languages: LANGUAGES,
    settings: {
      speed: { min: 0.5, max: 2.0, default: 1.0 },
      pitch: { min: 0.5, max: 2.0, default: 1.0 }
    },
    providers: [
      { id: "elevenlabs", name: "ElevenLabs", tier: 1, features: ["clone", "synthesize", "emotions"] },
      { id: "playht", name: "PlayHT", tier: 2, features: ["synthesize"] },
      { id: "huggingface", name: "HuggingFace MMS", tier: 3, features: ["synthesize"] },
      { id: "browser", name: "Browser Speech API", tier: 4, features: ["synthesize"] }
    ]
  })
}
