/**
 * Simulation generation API — DISABLED.
 * This route is not exposed because the folder name ends with _disabled (Next.js ignores it).
 * When the simulation feature is ready for production, rename the folder from
 * generate-simulation_disabled to generate-simulation to enable POST /api/generate-simulation.
 * See also: workspace create "Simulation" type (coming soon) and app/api/create game/simulation.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { generateWithFallback } from '@/lib/ai/groq-direct';

export const maxDuration = 60;

interface SimulationRequest {
  prompt: string;
  type?: 'physics' | 'chemistry' | 'biology' | 'math' | 'custom';
  complexity?: 'simple' | 'medium' | 'complex';
}

// Simulation rate limit config
const SIMULATION_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 1000
};

// Generate simulation code based on prompt
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(`simulation:${clientId}`, SIMULATION_RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many simulation generation requests. Please slow down.',
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

    const { prompt, type = 'physics', complexity = 'simple' }: SimulationRequest = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Input validation - limit prompt length
    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt too long. Maximum 2000 characters.' },
        { status: 400 }
      );
    }

    // Use centralized Groq provider with model fallback
    const systemPrompt = `You are an expert at creating interactive simulations using HTML5 Canvas and JavaScript.

Generate a complete, self-contained HTML simulation based on the user's request.

RULES:
1. Output ONLY valid HTML code, no explanations
2. Include all CSS in <style> tags
3. Include all JavaScript in <script> tags
4. Use HTML5 Canvas for rendering
5. Make it interactive (mouse/keyboard controls)
6. Add clear instructions for the user
7. Use requestAnimationFrame for smooth animation
8. Include physics calculations if relevant
9. Make it visually appealing with colors
10. Add reset/pause controls

The simulation should be educational and engaging.`;

    const userPrompt = `Create an interactive ${type} simulation: ${prompt}\n\nComplexity level: ${complexity}\n\nInclude:\n- Canvas-based visualization\n- Interactive controls\n- Physics/math calculations\n- Clear labels and instructions`;

    const { text: rawCode } = await generateWithFallback({
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 4000,
      fast: true,
    });

    let simulationCode = rawCode || '';

    // Clean up the code (remove markdown code blocks if present)
    simulationCode = simulationCode.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // If code doesn't start with HTML, wrap it
    if (!simulationCode.toLowerCase().startsWith('<!doctype') && !simulationCode.toLowerCase().startsWith('<html')) {
      simulationCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${prompt}</title>
</head>
<body>
${simulationCode}
</body>
</html>`;
    }

    // Save to database if user is logged in
    if (user) {
      Promise.resolve(supabase.from('creations').insert({
        user_id: user.id,
        type: 'simulation',
        prompt,
        content: simulationCode,
        options: { type, complexity },
        metadata: {
          originalPrompt: prompt,
          simulationType: type,
          complexity,
          status: 'completed',
        },
      })).catch((err: unknown) => {
        console.error('Failed to save creation:', err)
      })
    }

    return NextResponse.json({
      success: true,
      simulationCode,
      simulationHtml: simulationCode,
      prompt,
      type,
      complexity,
      status: 'completed',
    });

  } catch (error) {
    console.error('Simulation generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate simulation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for available simulation types
export async function GET() {
  return NextResponse.json({
    status: 'Simulation Generation API Active',
    types: [
      { id: 'physics', name: 'Physics', examples: ['pendulum', 'projectile motion', 'gravity'] },
      { id: 'chemistry', name: 'Chemistry', examples: ['molecular structure', 'reactions', 'periodic table'] },
      { id: 'biology', name: 'Biology', examples: ['cell division', 'ecosystem', 'DNA'] },
      { id: 'math', name: 'Mathematics', examples: ['fractals', 'graphs', 'geometry'] },
      { id: 'custom', name: 'Custom', examples: ['any interactive visualization'] },
    ],
    complexity: ['simple', 'medium', 'complex'],
    features: [
      'Interactive controls',
      'Real-time physics',
      'Canvas-based rendering',
      'Educational content',
    ],
  });
}
