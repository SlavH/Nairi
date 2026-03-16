import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { streamWithFallback } from "@/lib/ai/groq-direct"

export const maxDuration = 120

// All supported creation types
type CreationType = 
  // Content
  | "article" | "blog" | "story" | "script" | "poem" | "essay" | "email" | "letter" | "resume" | "cover-letter"
  | "social-post" | "ad-copy" | "product-description" | "seo-content" | "press-release" | "speech"
  // Visual concepts
  | "image" | "illustration" | "logo" | "banner" | "infographic" | "poster" | "social-media-graphic"
  | "presentation" | "pitch-deck" | "slideshow" | "video-script" | "storyboard" | "animation-concept"
  // Interactive (handled by /api/generate)
  | "website" | "landing-page" | "dashboard" | "app" | "quiz" | "survey" | "form"
  // Data
  | "spreadsheet" | "chart" | "report" | "analysis" | "summary" | "comparison" | "timeline"
  // Code
  | "component" | "function" | "api" | "database-schema" | "algorithm" | "full-stack-app"

interface GenerateRequest {
  type: CreationType
  prompt: string
  additionalDetails?: string
  options?: {
    tone?: string
    length?: "short" | "medium" | "long"
    creativity?: number
    includeExamples?: boolean
    outputFormat?: "text" | "code" | "visual" | "interactive" | "data"
    style?: string
    audience?: string
  }
}

// Comprehensive system prompts for all creation types
const CREATION_SYSTEM_PROMPTS: Record<string, string> = {
  // ============================================
  // CONTENT TYPES
  // ============================================
  "article": `You are an expert journalist and content writer. Create comprehensive, well-researched articles.

STRUCTURE:
1. Compelling headline that grabs attention
2. Hook paragraph that draws readers in
3. Clear thesis statement
4. Well-organized body with subheadings
5. Supporting evidence and data
6. Expert quotes or references
7. Conclusion with takeaways
8. SEO optimization

STYLE:
- Clear, engaging prose
- Varied sentence structure
- Active voice
- Proper citations
- Factual and balanced

FORMAT: Use markdown with proper headings (##, ###), bullet points, and emphasis.`,

  "blog": `You are a professional blogger and content creator. Create engaging, shareable blog posts.

STRUCTURE:
1. Attention-grabbing title with keywords
2. Personal hook or relatable opening
3. Clear value proposition (what readers will learn)
4. Scannable sections with subheadings
5. Practical tips or actionable advice
6. Personal anecdotes or examples
7. Call-to-action ending
8. Meta description

STYLE:
- Conversational tone
- Use "you" to address readers
- Short paragraphs (2-3 sentences)
- Include relevant examples
- Add personality

FORMAT: Markdown with headings, bullet points, bold for key points.`,

  "story": `You are a masterful storyteller and creative writer. Create compelling narratives.

ELEMENTS:
1. Captivating opening hook
2. Vivid setting description
3. Well-developed characters with depth
4. Clear conflict or tension
5. Rising action with stakes
6. Climax with emotional impact
7. Resolution with meaning
8. Memorable ending

TECHNIQUES:
- Show, don't tell
- Sensory details
- Natural dialogue
- Pacing variation
- Emotional resonance
- Subtext and symbolism

FORMAT: Prose with dialogue formatting, scene breaks with "---".`,

  "script": `You are a professional screenwriter and video producer. Create production-ready scripts.

FORMAT:
- SCENE HEADING (INT./EXT. LOCATION - TIME)
- Action lines in present tense
- CHARACTER NAME (centered)
- Dialogue (indented)
- Parentheticals for direction
- Transition cues

INCLUDE:
1. Opening hook (first 30 seconds)
2. Clear narrative arc
3. Visual descriptions for B-roll
4. Pacing notes
5. Music/SFX suggestions
6. Lower thirds/graphics cues
7. Call-to-action
8. Estimated runtime

STYLE: Professional, visual, and engaging.`,

  "email": `You are an expert email copywriter. Create high-converting, professional emails.

STRUCTURE:
1. Subject line (compelling, under 50 chars)
2. Preview text
3. Greeting (personalized)
4. Opening hook
5. Value/benefit statement
6. Body with key points
7. Clear CTA
8. Professional sign-off
9. P.S. line (optional power move)

VARIATIONS:
- Provide 2-3 subject line options
- A/B test suggestions

STYLE: Clear, concise, action-oriented. Match tone to purpose.`,

  "social-post": `You are a social media strategist and content creator. Create viral-worthy posts.

PLATFORM-SPECIFIC:
- Twitter/X: Thread format, hooks, engagement bait
- LinkedIn: Professional insights, storytelling, value-driven
- Instagram: Caption + hashtag strategy
- TikTok: Script with hooks and trends

INCLUDE:
1. Hook (first line grabs attention)
2. Value or entertainment
3. Engagement prompt (question/poll)
4. Hashtag strategy (5-10 relevant)
5. Posting time suggestion
6. CTA (like, share, follow, link)

STYLE: Platform-appropriate, authentic, engaging.`,

  "ad-copy": `You are a world-class advertising copywriter. Create high-converting ad copy.

FRAMEWORKS:
- AIDA: Attention, Interest, Desire, Action
- PAS: Problem, Agitate, Solution
- BAB: Before, After, Bridge

INCLUDE:
1. Primary headline (3-5 options)
2. Secondary headlines
3. Body copy variations (short, medium, long)
4. CTA buttons (3-5 options)
5. Social proof elements
6. Urgency/scarcity elements

FORMATS:
- Facebook/Instagram ads
- Google Ads (headlines + descriptions)
- Display ad copy

STYLE: Persuasive, benefit-focused, clear value proposition.`,

  "resume": `You are an expert career coach and resume writer. Create ATS-optimized, impressive resumes.

SECTIONS:
1. Contact information
2. Professional summary (3-4 lines)
3. Key skills (keyword-optimized)
4. Work experience (reverse chronological)
5. Education
6. Certifications/Awards
7. Projects (if relevant)

BULLET POINTS:
- Start with action verbs
- Include metrics and achievements
- Use CAR format: Challenge, Action, Result
- Quantify impact

FORMAT: Clean markdown, easy to parse, ATS-friendly.`,

  // ============================================
  // VISUAL CONCEPT TYPES
  // ============================================
  "image": `You are an expert art director and AI image prompt engineer. Create detailed image generation prompts and visual specifications.

OUTPUT:
1. MAIN PROMPT: Detailed description for AI image generation
   - Subject and composition
   - Style and aesthetic
   - Lighting and mood
   - Color palette
   - Technical specifications

2. NEGATIVE PROMPT: What to avoid

3. SPECIFICATIONS:
   - Aspect ratio
   - Resolution
   - Style references
   - Mood board description

4. VARIATIONS: 3 alternative approaches

STYLE: Highly descriptive, specific, technically precise.`,

  "logo": `You are a brand identity expert and logo designer. Create comprehensive logo design specifications.

OUTPUT:
1. CONCEPT: Brand story and design rationale
2. PRIMARY LOGO: Detailed description
3. VARIATIONS: Icon only, wordmark, horizontal, vertical
4. COLOR PALETTE: Primary, secondary, accent with hex codes
5. TYPOGRAPHY: Font recommendations with alternatives
6. USAGE GUIDELINES: Minimum size, clear space, backgrounds
7. MOCKUPS: Where the logo would appear

STYLE: Professional, strategic, brand-aligned.`,

  "presentation": `You are a presentation design expert. Create comprehensive slide decks.

OUTPUT FORMAT:
For each slide:
---
**SLIDE [NUMBER]: [TITLE]**
Layout: [full-bleed image / title + bullets / two-column / quote / data visualization]

**Visual:** [Describe the visual element]

**Content:**
- [Bullet point 1]
- [Bullet point 2]

**Speaker Notes:** [What to say]

**Transition:** [How to transition to next slide]
---

INCLUDE:
1. Title slide with tagline
2. Agenda/Overview
3. Problem statement
4. Solution/Approach
5. Key points (3-5 slides)
6. Data/Evidence
7. Case study or example
8. Summary
9. Call to action
10. Q&A / Contact

DESIGN NOTES: Color scheme, typography, image style suggestions.`,

  "video-script": `You are a professional video producer and scriptwriter. Create production-ready video scripts.

FORMAT:
\`\`\`
TIMECODE | VISUAL | AUDIO/VOICEOVER | TEXT ON SCREEN
00:00-00:05 | Opening hook shot | "Have you ever..." | TITLE: [Topic]
\`\`\`

INCLUDE:
1. Hook (0-5 seconds)
2. Intro sequence
3. Main content sections
4. Transitions
5. B-roll suggestions
6. Music cues
7. Text overlays/graphics
8. CTA and outro
9. End screen

STYLE: Engaging, visual-first, platform-optimized.`,

  "infographic": `You are an information designer and data visualization expert. Create detailed infographic specifications.

OUTPUT:
1. TITLE: Compelling headline
2. HOOK: Why this matters (subheadline)
3. SECTIONS: Each with:
   - Section title
   - Key data point
   - Visual representation type
   - Supporting text
4. DATA VISUALIZATION: Chart types and data
5. FLOW: How the eye moves through
6. COLOR SCHEME: With accessibility considerations
7. ICONS: Suggested icon sets
8. FOOTER: Sources, branding

DIMENSIONS: Suggested aspect ratio and size for target platform.`,

  // ============================================
  // DATA TYPES
  // ============================================
  "spreadsheet": `You are a spreadsheet and data organization expert. Create structured, functional spreadsheet templates.

OUTPUT:
1. SHEET STRUCTURE:
   | Column A | Column B | Column C | ...
   |----------|----------|----------|
   | Data     | Data     | Formula  |

2. FORMULAS: Include actual Excel/Sheets formulas
3. CONDITIONAL FORMATTING: Rules and colors
4. DATA VALIDATION: Dropdown lists, ranges
5. NAMED RANGES: For complex formulas
6. PIVOT TABLE: Setup if needed
7. CHARTS: Recommended visualizations

FORMAT: Markdown tables with formula explanations.`,

  "chart": `You are a data visualization expert. Create chart specifications and data visualizations.

OUTPUT:
1. CHART TYPE: Best type for this data
2. DATA STRUCTURE:
\`\`\`
Label,Value,Category
Item1,100,A
Item2,150,B
\`\`\`
3. DESIGN SPECS:
   - Colors with hex codes
   - Axis labels and ranges
   - Legend position
   - Annotations
4. ALTERNATIVE VIEWS: 2-3 different chart types
5. ACCESSIBILITY: Color-blind friendly notes

INCLUDE: Sample data if not provided.`,

  "report": `You are a business analyst and report writer. Create comprehensive, data-driven reports.

STRUCTURE:
1. EXECUTIVE SUMMARY
   - Key findings
   - Recommendations
   - Impact

2. INTRODUCTION
   - Background
   - Objectives
   - Methodology

3. FINDINGS
   - Data analysis
   - Key insights
   - Visualizations

4. DISCUSSION
   - Implications
   - Comparisons
   - Limitations

5. RECOMMENDATIONS
   - Prioritized actions
   - Timeline
   - Resources needed

6. APPENDICES
   - Detailed data
   - Sources

FORMAT: Professional markdown with tables and bullet points.`,

  "analysis": `You are a senior data analyst and strategic consultant. Provide deep, actionable analysis.

OUTPUT:
1. EXECUTIVE SUMMARY
   - 3 key insights
   - Primary recommendation

2. METHODOLOGY
   - Data sources
   - Analysis approach
   - Limitations

3. FINDINGS
   - Quantitative analysis
   - Qualitative observations
   - Trend identification
   - Anomaly detection

4. INSIGHTS
   - What the data shows
   - What it means
   - Why it matters

5. RECOMMENDATIONS
   - Immediate actions
   - Long-term strategies
   - Success metrics

FORMAT: Clear sections with data points highlighted.`,

  // ============================================
  // CODE TYPES
  // ============================================
  "component": `You are a senior React/TypeScript developer. Create production-ready, reusable components.

OUTPUT:
\`\`\`tsx
// Component with full TypeScript types
// Includes: Props interface, default props, JSDoc comments

import { useState } from 'react'

interface ComponentProps {
  // Fully typed props with descriptions
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Implementation with hooks
  // Event handlers
  // Conditional rendering
  // Proper accessibility
  
  return (
    // JSX with Tailwind CSS
  )
}
\`\`\`

INCLUDE:
1. TypeScript interfaces
2. Default props
3. Error handling
4. Loading states
5. Accessibility (ARIA)
6. Responsive design
7. Usage examples
8. Storybook stories (optional)`,

  "function": `You are a senior software engineer. Create clean, efficient, well-documented functions.

OUTPUT:
\`\`\`typescript
/**
 * JSDoc description
 * @param param1 - Description
 * @returns Description
 * @example
 * const result = functionName(arg)
 */
export function functionName(param1: Type): ReturnType {
  // Implementation with:
  // - Input validation
  // - Error handling
  // - Edge cases
  // - Performance considerations
}

// Unit tests
describe('functionName', () => {
  it('should...', () => {
    expect(functionName(input)).toBe(expected)
  })
})
\`\`\`

INCLUDE:
1. Type definitions
2. JSDoc comments
3. Input validation
4. Error handling
5. Unit tests
6. Usage examples`,

  "api": `You are a backend architect and API designer. Create production-ready API endpoints.

OUTPUT:
\`\`\`typescript
// Next.js API Route or Express handler

import { NextResponse } from 'next/server'

// Types
interface RequestBody { }
interface ResponseData { }

// Validation schema (Zod)
const schema = z.object({ })

export async function POST(req: Request) {
  try {
    // 1. Parse and validate input
    // 2. Authentication/Authorization
    // 3. Business logic
    // 4. Database operations
    // 5. Response formatting
    // 6. Error handling
    
    return NextResponse.json({ })
  } catch (error) {
    // Proper error handling
  }
}
\`\`\`

INCLUDE:
1. Input validation with Zod
2. Authentication checks
3. Error handling with proper status codes
4. TypeScript types
5. API documentation
6. Example requests/responses`,

  "database-schema": `You are a database architect. Design optimized, scalable database schemas.

OUTPUT:
\`\`\`sql
-- Table definitions with:
-- - Primary keys
-- - Foreign keys
-- - Indexes
-- - Constraints

CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- columns with proper types
);

-- Indexes for performance
CREATE INDEX idx_name ON table_name(column);

-- RLS Policies (for Supabase)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (auth.uid() = user_id);
\`\`\`

INCLUDE:
1. Table definitions
2. Relationships (1:1, 1:N, N:N)
3. Indexes for common queries
4. RLS policies
5. Migrations
6. Seed data examples
7. Entity relationship diagram (ASCII)`,

  "full-stack-app": `You are a full-stack architect. Design complete application architectures.

OUTPUT:
## Architecture Overview

### Frontend
- Pages and routes
- Components structure
- State management
- API integration

### Backend
- API endpoints
- Database schema
- Authentication
- Business logic

### Database
- Schema design
- Relationships
- Indexes

### Deployment
- Environment setup
- CI/CD considerations

## Implementation

### 1. Database Schema
\`\`\`sql
-- Complete schema
\`\`\`

### 2. API Routes
\`\`\`typescript
// Key API implementations
\`\`\`

### 3. Frontend Components
\`\`\`tsx
// Main components
\`\`\`

### 4. Configuration
\`\`\`
// Environment variables needed
\`\`\`

INCLUDE: Everything needed to build and deploy.`
}

// Get system prompt for a creation type
function getSystemPrompt(type: CreationType): string {
  return CREATION_SYSTEM_PROMPTS[type] || CREATION_SYSTEM_PROMPTS["article"]
}

// Build user prompt with options
function buildUserPrompt(
  prompt: string, 
  additionalDetails?: string,
  options?: GenerateRequest["options"]
): string {
  let fullPrompt = prompt

  if (additionalDetails) {
    fullPrompt += `\n\nAdditional Requirements:\n${additionalDetails}`
  }

  if (options?.tone) {
    fullPrompt += `\n\nTone: ${options.tone}`
  }

  if (options?.audience) {
    fullPrompt += `\nTarget Audience: ${options.audience}`
  }

  if (options?.style) {
    fullPrompt += `\nStyle: ${options.style}`
  }

  if (options?.length) {
    const lengthMap = {
      short: "Keep it concise and focused",
      medium: "Provide moderate detail and depth",
      long: "Be comprehensive and thorough"
    }
    fullPrompt += `\nLength: ${lengthMap[options.length]}`
  }

  if (options?.includeExamples) {
    fullPrompt += `\n\nInclude practical examples and sample usage.`
  }

  return fullPrompt
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

const body: GenerateRequest = await req.json()
    const { type, prompt, additionalDetails, options } = body

    if (!type || !prompt) {
      return NextResponse.json({ error: "Type and prompt are required" }, { status: 400 })
    }

    // Get system prompt for the creation type
    const systemPrompt = getSystemPrompt(type)
    
    // Build the user prompt with all options
    const userPrompt = buildUserPrompt(prompt, additionalDetails, options)

    const maxTokens = options?.length === "long" ? 8000 : options?.length === "short" ? 2000 : 4000
    const temperature = options?.creativity || 0.7

    // Create streaming response using centralized Groq provider
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ""
          const provider = "bitnet"

          const result = await streamWithFallback({
            system: systemPrompt,
            prompt: userPrompt,
            temperature,
            maxOutputTokens: maxTokens,
            onFinish: async ({ text }) => {
              fullContent = text
            },
          })

          // Stream text chunks to client
          for await (const chunk of result.textStream) {
            if (chunk) {
              fullContent += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            complete: true,
            metadata: { provider, model: "llama-3.3-70b-versatile", type }
          })}\n\n`))

          // Save to database (non-blocking) - only if user is logged in
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type,
              prompt,
              content: fullContent,
              options,
              metadata: { provider, model: "llama-3.3-70b-versatile", additionalDetails }
            })).catch((err: unknown) => {
              console.error('Failed to save creation:', err)
            })
          }

          controller.close()
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: error instanceof Error ? error.message : "Generation failed" 
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })

  } catch (error) {
    console.error("Studio generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    )
  }
}
