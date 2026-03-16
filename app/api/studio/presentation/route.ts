import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithFallback } from '@/lib/ai/groq-direct';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

export const maxDuration = 60;

// Rate limit config for presentations: 10 per minute
const PRESENTATION_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000
};

interface PresentationRequest {
  topic: string;
  description?: string;
  slideCount?: number;
  style?: string;
}

interface Slide {
  title: string;
  content: string[];
  layout: 'title' | 'content' | 'two-column' | 'image';
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`presentation:${clientId}`, PRESENTATION_RATE_LIMIT);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait before generating another presentation.',
          retryAfter: rateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetTime)
          }
        }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body: PresentationRequest = await request.json();
    const { topic, description = '', slideCount = 10, style = 'professional' } = body;

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert presentation designer. Generate a complete presentation outline with engaging content.

RULES:
1. Create exactly ${slideCount} slides
2. First slide is always a title slide
3. Last slide is always a conclusion/summary
4. Each slide should have a clear title
5. Content should be concise bullet points (3-5 per slide)
6. Make it ${style} in tone
7. Include speaker notes for each slide to help the presenter
8. Output ONLY valid JSON in this exact format:
{
  "slides": [
    {
      "title": "Slide Title",
      "content": ["Point 1", "Point 2", "Point 3"],
      "layout": "title" or "content",
      "notes": "Speaker notes for this slide"
    }
  ]
}

DO NOT include any markdown, explanations, or text outside the JSON.`;

    const userPrompt = `Create a ${slideCount}-slide presentation about: ${topic}${description ? `\n\nAdditional context: ${description}` : ''}`;

    const { text: rawContent } = await generateWithFallback({
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: slideCount > 15 ? 8000 : 4000,
      temperature: 0.7,
    });
    let content = rawContent;

    // Clean up the response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let slides: Slide[];
    try {
      const parsed = JSON.parse(content);
      slides = parsed.slides || [];
    } catch (parseError) {
      // Fallback: create basic slides if parsing fails
      slides = [
        {
          title: topic,
          content: [],
          layout: 'title' as const,
        },
        {
          title: 'Overview',
          content: [
            'Introduction to the topic',
            'Key concepts and definitions',
            'Main objectives',
          ],
          layout: 'content' as const,
        },
        {
          title: 'Conclusion',
          content: [
            'Summary of key points',
            'Next steps',
            'Questions?',
          ],
          layout: 'content' as const,
        },
      ];
    }

    // Ensure first slide is title slide
    if (slides.length > 0) {
      slides[0].layout = 'title';
    }

    // Save to database if user is logged in
    if (user) {
      Promise.resolve(supabase.from('creations').insert({
        user_id: user.id,
        type: 'presentation',
        prompt: topic,
        content: JSON.stringify(slides),
        options: { slideCount, style, description },
        metadata: {
          slideCount: slides.length,
          style,
          generatedAt: new Date().toISOString(),
        },
      })).catch((err: unknown) => {
        console.error('Failed to save creation:', err)
      })
    }

    return NextResponse.json({
      success: true,
      slides,
      topic,
      slideCount: slides.length,
    });

  } catch (error) {
    console.error('Presentation generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate presentation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Presentation Generator API Active',
    styles: ['professional', 'creative', 'minimal', 'academic', 'startup'],
    maxSlides: 30,
    minSlides: 5,
  });
}
