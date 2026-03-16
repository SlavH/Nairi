import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { isRouterConfigured, generate as routerGenerate, pollForResult } from '@/lib/nairi-api/router';

// Free text-to-speech using edge-tts compatible API
// Fallback chain: Browser Speech API -> Edge TTS -> Error with guidance

// Audio rate limit config (similar to image)
const AUDIO_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`audio:${clientId}`, AUDIO_RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many audio generation requests. Please slow down.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime)
          }
        }
      );
    }

    const { prompt, text, voice = 'en-US-AriaNeural', format = 'mp3' } = await request.json();
    
    // Accept both 'prompt' and 'text' parameters for flexibility
    const textToSpeak = prompt || text;

    if (!textToSpeak || textToSpeak.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt or text is required' },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (textToSpeak.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters for audio generation.' },
        { status: 400 }
      );
    }

    // Try multiple TTS services in fallback order

    // Option 0: Nairi Router (voice) when NAIRI_ROUTER_BASE_URL is set
    if (isRouterConfigured()) {
      try {
        const { job_id } = await routerGenerate('voice', textToSpeak, { voice, format });
        const raw = await pollForResult(job_id, 2_500, 60);
        const result = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
        const url = typeof result.url === 'string' ? result.url : null;
        const base64 = typeof result.audio === 'string' ? result.audio : typeof result.base64 === 'string' ? result.base64 : null;
        if (url || base64) {
          const audioUrl = url ?? (base64 ? `data:audio/${format || 'mp3'};base64,${base64}` : null);
          if (audioUrl) {
            return NextResponse.json({
              success: true,
              audio: {
                url: audioUrl,
                provider: 'nairi-router',
                voice,
                duration: Math.ceil(textToSpeak.length / 15),
              },
            });
          }
        }
      } catch (routerErr) {
        console.error('Nairi Router voice failed, falling back:', routerErr);
      }
    }

    // Option 1: Try Voicerss (free tier available)
    const voicerssKey = process.env.VOICERSS_API_KEY;
    if (voicerssKey) {
      try {
        const voicerssUrl = `https://api.voicerss.org/?key=${voicerssKey}&hl=en-us&src=${encodeURIComponent(textToSpeak)}&c=MP3&f=44khz_16bit_stereo`;
        const response = await fetch(voicerssUrl);
        
        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          
          return NextResponse.json({
            success: true,
            audio: {
              url: `data:audio/mp3;base64,${base64Audio}`,
              provider: 'voicerss',
              voice,
              duration: Math.ceil(textToSpeak.length / 15), // Approximate duration
            }
          });
        }
      } catch (error) {
        console.error('Voicerss failed:', error);
      }
    }

    // Option 2: Try Streamlabs Polly (free)
    try {
      const pollyResponse = await fetch('https://streamlabs.com/polly/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: 'Matthew',
          text: textToSpeak,
        }),
      });

      if (pollyResponse.ok) {
        const data = await pollyResponse.json();
        if (data.speak_url) {
          return NextResponse.json({
            success: true,
            audio: {
              url: data.speak_url,
              provider: 'streamlabs-polly',
              voice: 'Matthew',
              duration: Math.ceil(textToSpeak.length / 15),
            }
          });
        }
      }
    } catch (error) {
      console.error('Streamlabs Polly failed:', error);
    }

    // Option 3: Return browser-based TTS instruction
    // This allows client-side generation using Web Speech API
    return NextResponse.json({
      success: true,
      audio: {
        url: null,
        useBrowserTTS: true,
        text: textToSpeak,
        voice,
        provider: 'browser-speech-api',
        message: 'Using browser-based text-to-speech. Audio will be generated on your device.',
        duration: Math.ceil(textToSpeak.length / 15),
      }
    });

  } catch (error) {
    console.error('Audio generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate audio',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: 'browser-tts-available'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Audio Generation API Active',
    availableVoices: [
      'en-US-AriaNeural',
      'en-US-GuyNeural',
      'en-GB-SoniaNeural',
      'en-AU-NatashaNeural',
    ],
    providers: [
      { name: 'Voicerss', status: process.env.VOICERSS_API_KEY ? 'configured' : 'not-configured' },
      { name: 'Streamlabs Polly', status: 'free-tier' },
      { name: 'Browser Speech API', status: 'always-available' },
    ],
    maxLength: 5000,
  });
}
