import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithFallback } from '@/lib/ai/groq-direct';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

export const maxDuration = 60;

interface DocumentRequest {
  prompt: string;
  documentType?: 'essay' | 'report' | 'article' | 'letter' | 'resume' | 'contract' | 'proposal';
  length?: 'short' | 'medium' | 'long';
  tone?: 'formal' | 'casual' | 'professional' | 'academic';
  format?: 'markdown' | 'html' | 'plain';
}

// Document rate limit config
const DOCUMENT_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`document:${clientId}`, DOCUMENT_RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many document generation requests. Please slow down.',
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
    const { data: { user } } = await supabase.auth.getUser();

    const body: DocumentRequest = await request.json();
    const {
      prompt,
      documentType = 'article',
      length = 'medium',
      tone = 'professional',
      format = 'markdown',
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Input validation - limit prompt length
    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: 'Prompt too long. Maximum 5000 characters.' },
        { status: 400 }
      );
    }

    const lengthGuidelines = {
      short: '500-800 words',
      medium: '1000-1500 words',
      long: '2000-3000 words',
    };

    const systemPrompt = `You are an expert document writer specializing in ${documentType}s.

Create a well-structured, ${tone} ${documentType} with the following specifications:
- Length: ${lengthGuidelines[length]}
- Tone: ${tone}
- Format: ${format}

RULES:
1. Create a complete, polished document
2. Include proper structure (title, sections, paragraphs)
3. Use appropriate formatting for ${format}
4. Make it engaging and well-written
5. Include relevant details and examples
6. Ensure proper grammar and style

${format === 'markdown' ? 'Use markdown formatting (# for headers, ** for bold, etc.)' : ''}
${format === 'html' ? 'Use semantic HTML tags (<h1>, <p>, <strong>, etc.)' : ''}
${format === 'plain' ? 'Use plain text with clear section breaks' : ''}`;

    const { text: documentContent } = await generateWithFallback({
      system: systemPrompt,
      prompt: `Write a ${documentType} about: ${prompt}`,
      maxOutputTokens: length === 'long' ? 4000 : length === 'medium' ? 2500 : 1500,
      temperature: 0.7,
    });

    // Generate metadata
    const wordCount = documentContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Save to database if user is logged in
    if (user) {
      Promise.resolve(supabase.from('creations').insert({
        user_id: user.id,
        type: 'document',
        prompt,
        content: documentContent,
        options: { documentType, length, tone, format },
        metadata: {
          documentType,
          wordCount,
          readingTime,
          generatedAt: new Date().toISOString(),
        },
      })).catch((err: unknown) => {
        console.error('Failed to save creation:', err)
      })
    }

    return NextResponse.json({
      success: true,
      document: documentContent,
      content: documentContent, // Alias for chat handler compatibility
      documentType,
      tone,
      wordCount,
      metadata: {
        documentType,
        wordCount,
        readingTime,
        format,
        tone,
      },
    });

  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for available options
export async function GET() {
  return NextResponse.json({
    status: 'Document Generation API Active',
    documentTypes: [
      { id: 'essay', name: 'Essay', description: 'Academic or personal essays' },
      { id: 'report', name: 'Report', description: 'Business or research reports' },
      { id: 'article', name: 'Article', description: 'Blog posts or articles' },
      { id: 'letter', name: 'Letter', description: 'Formal or informal letters' },
      { id: 'resume', name: 'Resume', description: 'Professional resumes' },
      { id: 'contract', name: 'Contract', description: 'Legal contracts' },
      { id: 'proposal', name: 'Proposal', description: 'Business proposals' },
    ],
    lengths: [
      { id: 'short', name: 'Short', words: '500-800' },
      { id: 'medium', name: 'Medium', words: '1000-1500' },
      { id: 'long', name: 'Long', words: '2000-3000' },
    ],
    tones: ['formal', 'casual', 'professional', 'academic'],
    formats: ['markdown', 'html', 'plain'],
  });
}
