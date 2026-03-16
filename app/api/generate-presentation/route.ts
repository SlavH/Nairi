import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserIdOrBypassForApi } from '@/lib/auth';
import { generateWithFallback } from '@/lib/ai/groq-direct';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

export const maxDuration = 120;

interface PresentationRequest {
  prompt: string;
  slideCount?: number;
  style?: 'professional' | 'creative' | 'minimal' | 'corporate' | 'educational';
  theme?: 'light' | 'dark' | 'gradient';
  includeImages?: boolean;
  format?: 'html' | 'json' | 'markdown';
  templateId?: string;
  accent?: string;
  font?: string;
}

interface Slide {
  id: number;
  title: string;
  content: string[];
  notes?: string;
  layout?: 'title' | 'content' | 'two-column' | 'image-left' | 'image-right' | 'quote' | 'bullets';
  imagePrompt?: string;
}

// Presentation rate limit config
const PRESENTATION_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 1000
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`presentation:${clientId}`, PRESENTATION_RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many presentation generation requests. Please slow down.',
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

    const supabase = await createClient();
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser());

    const body: PresentationRequest = await request.json();
    const {
      prompt,
      slideCount = 8,
      style = 'professional',
      theme = 'dark',
      includeImages = true,
      format = 'html',
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Input validation
    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: 'Prompt too long. Maximum 5000 characters.' },
        { status: 400 }
      );
    }

    const validatedSlideCount = Math.min(Math.max(slideCount, 3), 20);

    const systemPrompt = `You are a world-class presentation designer and content strategist. Create professional, engaging slide decks that audiences remember.

TASK: Create exactly ${validatedSlideCount} slides as a valid JSON array.

SPECS:
- Style: ${style}. Match tone and density to this (e.g. professional = crisp and data-backed, creative = vivid and narrative).
- Theme: ${theme}. This affects visual tone only; your content structure stays the same.

OUTPUT: Return ONLY a single JSON array. No markdown fences, no preamble, no trailing text. Start with [ and end with ].

Each slide object MUST have exactly these fields:
{
  "id": number (1-based, sequential),
  "title": "string (clear, concise slide title)",
  "content": ["string", "string", ...] (3-5 bullets per slide; max 15 words per bullet),
  "notes": "string (1-2 sentences of speaker notes)",
  "layout": "title" | "content" | "two-column" | "bullets" | "quote",
  "imagePrompt": "string (short, visual description for AI image only when a visual would add value; otherwise empty string)"
}

RULES:
1. Slide 1: Title slide (layout "title"). content can be empty or one subtitle line.
2. Slide ${validatedSlideCount}: Closing slide (layout "title")—e.g. "Thank you", "Questions?", or key takeaway.
3. Middle slides: Mix "content", "bullets", "two-column", "quote" for variety. Use "quote" sparingly for impact.
4. Every bullet must be scannable and actionable. No filler.
5. Speaker notes: brief, natural; what the speaker would say, not a repeat of bullets.
6. imagePrompt: only for slides where a diagram, photo, or illustration clearly helps (e.g. process, product, team). Leave "" for text-only slides.
7. Content must be accurate, inclusive, and suitable for the topic. Be substantive, not generic.

Return ONLY the JSON array.`;

    const { text: slidesRaw } = await generateWithFallback({
      system: systemPrompt,
      prompt: `Create a presentation about: ${prompt}`,
      maxOutputTokens: 4000,
      temperature: 0.7,
    });
    let slidesContent = slidesRaw;

    // Parse JSON from response
    let slides: Slide[] = [];
    try {
      // Clean up the response - remove markdown code blocks if present
      slidesContent = slidesContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Find JSON array in response
      const jsonMatch = slidesContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as unknown[];
        slides = parsed.map((s: unknown, idx: number) => {
          const row = s as Record<string, unknown>;
          const validLayouts: Slide['layout'][] = ['title', 'content', 'two-column', 'bullets', 'quote', 'image-left', 'image-right'];
          const layoutValue = typeof row.layout === 'string' ? row.layout : undefined;
          const layout: Slide['layout'] = layoutValue && validLayouts.includes(layoutValue as Slide['layout']) 
            ? (layoutValue as Slide['layout']) 
            : 'bullets';
          return {
            id: typeof row.id === 'number' ? row.id : idx + 1,
            title: typeof row.title === 'string' ? row.title : `Slide ${idx + 1}`,
            content: Array.isArray(row.content) ? (row.content as string[]) : [],
            notes: typeof row.notes === 'string' ? row.notes : '',
            layout,
            imagePrompt: typeof row.imagePrompt === 'string' ? row.imagePrompt : '',
          };
        });
      } else {
        throw new Error('No valid JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse slides JSON:', parseError);
      slides = generateFallbackSlides(prompt, validatedSlideCount);
    }

    // Generate HTML presentation if requested
    let htmlPresentation = '';
    if (format === 'html') {
      htmlPresentation = generateHTMLPresentation(slides, style, theme, prompt);
    }

    // Generate markdown if requested
    let markdownPresentation = '';
    if (format === 'markdown') {
      markdownPresentation = generateMarkdownPresentation(slides, prompt);
    }

    if (userId) {
      Promise.resolve(supabase.from('creations').insert({
        user_id: userId,
        type: 'presentation',
        prompt,
        content: format === 'html' ? htmlPresentation : JSON.stringify(slides),
        options: { slideCount: validatedSlideCount, style, theme, includeImages, format },
        metadata: {
          slideCount: slides.length,
          style,
          theme,
          generatedAt: new Date().toISOString(),
        },
      })).catch((err: unknown) => {
        console.error('Failed to save creation:', err)
      });
    }

    return NextResponse.json({
      success: true,
      slides,
      html: htmlPresentation,
      markdown: markdownPresentation,
      slideCount: slides.length,
      metadata: {
        style,
        theme,
        slideCount: slides.length,
        format,
      },
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

function generateFallbackSlides(prompt: string, count: number): Slide[] {
  const slides: Slide[] = [
    {
      id: 1,
      title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
      content: ['A comprehensive overview', 'Key insights and analysis', 'Actionable recommendations'],
      notes: 'Welcome your audience and introduce the topic.',
      layout: 'title',
      imagePrompt: '',
    },
  ];

  for (let i = 2; i < count; i++) {
    slides.push({
      id: i,
      title: `Section ${i - 1}`,
      content: [
        'Key point to discuss',
        'Supporting information',
        'Additional context',
      ],
      notes: `Discuss the main points of section ${i - 1}.`,
      layout: 'bullets',
      imagePrompt: '',
    });
  }

  slides.push({
    id: count,
    title: 'Thank You',
    content: ['Questions?', 'Contact information', 'Next steps'],
    notes: 'Thank your audience and open for questions.',
    layout: 'title',
    imagePrompt: '',
  });

  return slides;
}

function generateHTMLPresentation(slides: Slide[], style: string, theme: string, title: string): string {
  const themeColors = {
    light: { bg: '#ffffff', text: '#1a1a1a', accent: '#3b82f6', secondary: '#f3f4f6' },
    dark: { bg: '#0f172a', text: '#f8fafc', accent: '#60a5fa', secondary: '#1e293b' },
    gradient: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', accent: '#fbbf24', secondary: 'rgba(255,255,255,0.1)' },
  };

  const colors = (themeColors[theme as keyof typeof themeColors] || themeColors.dark);
  const isGradient = theme === 'gradient';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: ${colors.bg};
      color: ${colors.text};
      min-height: 100vh;
    }
    .presentation {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .slide {
      ${isGradient ? `background: ${colors.bg};` : `background: ${colors.secondary};`}
      border-radius: 16px;
      padding: 60px;
      margin-bottom: 40px;
      min-height: 500px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .slide.title-slide {
      text-align: center;
      min-height: 600px;
    }
    .slide h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 30px;
      color: ${colors.accent};
    }
    .slide h2 {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 40px;
      color: ${colors.accent};
    }
    .slide ul {
      list-style: none;
      padding: 0;
    }
    .slide li {
      font-size: 1.5rem;
      margin-bottom: 20px;
      padding-left: 30px;
      position: relative;
    }
    .slide li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: ${colors.accent};
    }
    .slide-number {
      position: absolute;
      bottom: 20px;
      right: 30px;
      font-size: 0.875rem;
      opacity: 0.6;
    }
    .notes {
      margin-top: 30px;
      padding: 20px;
      background: rgba(0,0,0,0.1);
      border-radius: 8px;
      font-size: 0.875rem;
      font-style: italic;
      opacity: 0.8;
    }
    @media print {
      .slide { page-break-after: always; }
      .notes { display: none; }
    }
  </style>
</head>
<body>
  <div class="presentation">
    ${slides.map((slide, index) => `
    <div class="slide ${slide.layout === 'title' ? 'title-slide' : ''}">
      <${slide.layout === 'title' ? 'h1' : 'h2'}>${slide.title}</${slide.layout === 'title' ? 'h1' : 'h2'}>
      <ul>
        ${slide.content.map(item => `<li>${item}</li>`).join('\n        ')}
      </ul>
      ${slide.notes ? `<div class="notes">📝 ${slide.notes}</div>` : ''}
      <div class="slide-number">${index + 1} / ${slides.length}</div>
    </div>
    `).join('')}
  </div>
</body>
</html>`;
}

function generateMarkdownPresentation(slides: Slide[], title: string): string {
  let markdown = `# ${title}\n\n---\n\n`;
  
  slides.forEach((slide, index) => {
    markdown += `## Slide ${index + 1}: ${slide.title}\n\n`;
    slide.content.forEach(item => {
      markdown += `- ${item}\n`;
    });
    if (slide.notes) {
      markdown += `\n> **Speaker Notes:** ${slide.notes}\n`;
    }
    markdown += '\n---\n\n';
  });

  return markdown;
}

// GET endpoint for available options
export async function GET() {
  return NextResponse.json({
    status: 'Presentation Generation API Active',
    styles: [
      { id: 'professional', name: 'Professional', description: 'Clean, business-appropriate design' },
      { id: 'creative', name: 'Creative', description: 'Bold, artistic design' },
      { id: 'minimal', name: 'Minimal', description: 'Simple, focused design' },
      { id: 'corporate', name: 'Corporate', description: 'Formal, enterprise design' },
      { id: 'educational', name: 'Educational', description: 'Clear, instructional design' },
    ],
    themes: [
      { id: 'light', name: 'Light', description: 'White background with dark text' },
      { id: 'dark', name: 'Dark', description: 'Dark background with light text' },
      { id: 'gradient', name: 'Gradient', description: 'Colorful gradient background' },
    ],
    formats: ['html', 'json', 'markdown'],
    limits: {
      minSlides: 3,
      maxSlides: 20,
      defaultSlides: 8,
    },
  });
}
