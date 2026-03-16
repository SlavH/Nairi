import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { generateWithFallback } from "@/lib/ai/groq-direct"

// Lyrics Generation API
// Generate song lyrics from theme/topic

interface LyricsRequest {
  theme: string // What the song is about
  genre?: string
  mood?: string
  structure?: string
  style?: string // Artist style reference
  language?: string
  // Advanced
  verses?: number
  includeChorus?: boolean
  includeBridge?: boolean
  rhymeScheme?: string
}

const GENRES = [
  "pop", "rock", "hip-hop", "r&b", "country", "folk",
  "electronic", "jazz", "blues", "metal", "indie", "soul"
]

const MOODS = [
  "happy", "sad", "romantic", "angry", "hopeful", "nostalgic",
  "empowering", "melancholic", "energetic", "peaceful", "rebellious"
]

const STRUCTURES = [
  "verse-chorus-verse-chorus-bridge-chorus",
  "verse-chorus-verse-chorus",
  "verse-prechorus-chorus-verse-prechorus-chorus-bridge-chorus",
  "aaba",
  "verse-verse-chorus",
  "freeform"
]

const RHYME_SCHEMES = [
  "ABAB", "AABB", "ABBA", "ABCABC", "free"
]

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`lyrics:${clientId}`, { maxRequests: 20, windowMs: 60000 })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      )
    }

    const body: LyricsRequest = await request.json()
    const { 
      theme, 
      genre = "pop",
      mood = "uplifting",
      structure = "verse-chorus-verse-chorus-bridge-chorus",
      style,
      language = "english",
      verses = 2,
      includeChorus = true,
      includeBridge = true,
      rhymeScheme = "ABAB"
    } = body

    // Validation
    if (!theme || theme.trim().length === 0) {
      return NextResponse.json({ error: "Theme is required" }, { status: 400 })
    }

    if (theme.length > 500) {
      return NextResponse.json({ error: "Theme too long. Maximum 500 characters." }, { status: 400 })
    }

    const isValidApiKey = (key: string | undefined): boolean => {
      if (!key) return false
      const placeholderPatterns = [/^your_/i, /^sk-your/i, /^placeholder/i, /^xxx/i, /^test_/i, /_here$/i, /^insert/i]
      return !placeholderPatterns.some(pattern => pattern.test(key))
    }

    // Build the system prompt
    const systemPrompt = `You are a professional songwriter and lyricist. Write song lyrics based on the given theme.

Guidelines:
- Genre: ${genre}
- Mood: ${mood}
- Structure: ${structure}
- Rhyme scheme: ${rhymeScheme}
- Language: ${language}
- Number of verses: ${verses}
${includeChorus ? "- Include a memorable chorus" : "- No chorus"}
${includeBridge ? "- Include a bridge section" : "- No bridge"}
${style ? `- Style inspiration: ${style}` : ""}

Format your output with section markers like:
[Verse 1]
[Chorus]
[Verse 2]
[Bridge]
etc.

Make the lyrics:
- Emotionally resonant
- Easy to sing
- Appropriate for all audiences
- Original and creative

Output ONLY the lyrics, no explanations or commentary.`

    // Use centralized Groq provider with model fallback chain
    try {
      const { text, model } = await generateWithFallback({
        system: systemPrompt,
        prompt: `Write lyrics for a song about: ${theme}`,
        temperature: 0.8,
        maxOutputTokens: 1000,
      })

      const lyrics = text?.trim()

      if (lyrics) {
        const sections = parseLyricsSections(lyrics)

        return NextResponse.json({
          success: true,
          lyrics,
          sections,
          settings: { genre, mood, structure, rhymeScheme, language },
          provider: "bitnet",
          model,
          message: "Lyrics generated successfully"
        })
      }
    } catch (error) {
      console.error("[LYRICS] Generation failed:", error)
    }

    return NextResponse.json({
      success: false,
      error: "Lyrics generation service unavailable",
      message: "Set BITNET_BASE_URL in .env to your Google Colab tunnel URL"
    }, { status: 503 })

  } catch (error) {
    console.error("[LYRICS] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lyrics generation failed" },
      { status: 500 }
    )
  }
}

function parseLyricsSections(lyrics: string): { name: string; content: string }[] {
  const sections: { name: string; content: string }[] = []
  const sectionRegex = /\[([^\]]+)\]/g
  const parts = lyrics.split(sectionRegex)
  
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i]
    const content = parts[i + 1]?.trim() || ""
    if (name && content) {
      sections.push({ name, content })
    }
  }
  
  return sections
}

export async function GET() {
  return NextResponse.json({
    name: "Lyrics Generation API",
    description: "Generate song lyrics from theme or topic",
    parameters: {
      theme: { type: "string", required: true, maxLength: 500, description: "What the song is about" },
      genre: { type: "string", enum: GENRES, default: "pop" },
      mood: { type: "string", enum: MOODS, default: "uplifting" },
      structure: { type: "string", enum: STRUCTURES },
      style: { type: "string", optional: true, description: "Artist style reference (e.g., 'Taylor Swift', 'Ed Sheeran')" },
      language: { type: "string", default: "english" },
      verses: { type: "number", min: 1, max: 4, default: 2 },
      includeChorus: { type: "boolean", default: true },
      includeBridge: { type: "boolean", default: true },
      rhymeScheme: { type: "string", enum: RHYME_SCHEMES, default: "ABAB" }
    },
    genres: GENRES,
    moods: MOODS,
    structures: STRUCTURES,
    rhymeSchemes: RHYME_SCHEMES,
    examples: [
      { theme: "falling in love for the first time", genre: "pop", mood: "romantic" },
      { theme: "overcoming challenges and never giving up", genre: "rock", mood: "empowering" },
      { theme: "missing someone who moved away", genre: "country", mood: "nostalgic" }
    ],
    providers: [
      { id: "bitnet", name: "BitNet", tier: 1, speed: "fast" },
      { id: "openai", name: "OpenAI (GPT-4o-mini)", tier: 2, speed: "medium" },
      { id: "huggingface", name: "HuggingFace (Mistral)", tier: 3, speed: "slow" }
    ]
  })
}
