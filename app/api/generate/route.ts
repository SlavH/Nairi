import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai/groq-direct"
import { checkRateLimitAsync, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { generateDesignBrief, designBriefToPromptEnhancement, type DesignBrief } from "@/lib/ai/design-brief"

export const maxDuration = 120

// Generation types supported by Nairi Builder (game does not exist)
export type GenerationType = 
  | "website"
  | "landing-page"
  | "dashboard"
  | "component"
  | "app"
  | "form"
  | "ecommerce"
  | "chat-interface"
  | "data-visualization"
  | "calendar-app"
  | "map-app"
  | "music-player"
  | "calculator"
  | "blog-platform"
  | "portfolio"
  | "admin-panel"
  | "settings-page"

interface GenerateRequest {
  type: GenerationType
  prompt: string
  options?: {
    framework?: "react" | "nextjs" | "html"
    styling?: "tailwind" | "css" | "styled-components"
    complexity?: "simple" | "medium" | "complex"
    features?: string[]
  }
}

// Expert code generation system prompts - V0-quality output
const CODE_GENERATION_PROMPTS: Record<GenerationType, string> = {
  "website": `You are an elite React developer creating stunning, production-ready websites.

OUTPUT RULES:
- Return ONLY valid JSX code starting with "export default function App()"
- NO markdown code blocks, NO explanations, NO text before or after the code
- Single file with all components inline
- CRITICAL: NEVER use <html>, <head>, <body>, <title>, <meta>, <link> tags - these are FORBIDDEN
- CRITICAL: The return statement must start with <div> or semantic element like <main>, NOT an HTML document
- CRITICAL SYNTAX RULES:
  * Each useState MUST be on its own line: const [value, setValue] = useState(initialValue);
  * ALWAYS use brackets for destructuring: const [state, setState] = useState()
  * NEVER merge multiple statements on one line
  * Each statement MUST end with a semicolon
  * Function body MUST start with opening brace: export default function App() {
  * className with template literals: className={\`base-class \${condition ? 'a' : 'b'}\`}
  * NEVER write className="{\`...\`}" - the quotes break the syntax
  * ALWAYS use ASCII arrow => not Unicode arrows

DESIGN SYSTEM (MANDATORY):
- Color palette: Use a cohesive 3-5 color scheme with proper contrast
- Typography: Use font-sans for body, consider weights 400/500/600/700
- Spacing: Follow 4px/8px/12px/16px/24px/32px/48px/64px scale
- Border radius: rounded-none/rounded-sm/rounded-md/rounded-lg/rounded-xl/rounded-2xl/rounded-full
- Shadows: shadow-sm/shadow-md/shadow-lg/shadow-xl for depth
- Transitions: transition-all duration-200/300 for smooth interactions

LAYOUT STRUCTURE:
1. Navigation/Header with logo area, nav links, CTA button
2. Hero section with compelling headline, subtext, primary CTA, visual element
3. Features/Benefits section with icon cards in grid
4. Social proof or testimonial section
5. Call-to-action section
6. Footer with links, copyright

TECHNICAL REQUIREMENTS:
- React hooks: useState, useEffect, useCallback
- Tailwind CSS only (no custom CSS)
- Fully responsive: mobile-first with sm:/md:/lg:/xl: breakpoints
- Dark mode support using dark: variants
- Smooth hover states on all interactive elements
- Semantic HTML: header, main, section, footer, nav, article
- Accessibility: proper ARIA labels, alt text

VISUAL EXCELLENCE:
- Use gradients sparingly: bg-gradient-to-r from-[color] to-[color]
- Add subtle animations: hover:scale-105, hover:-translate-y-1
- Include backdrop-blur for modern glass effects
- Use gap utilities for consistent spacing in flex/grid
- Professional typography hierarchy with text-xs to text-6xl`,

  "landing-page": `You are an elite conversion-focused landing page developer.

OUTPUT RULES:
- Return ONLY valid JSX code starting with "export default function App()"
- NO markdown code blocks, NO explanations, NO text before or after the code
- Single file with all components inline
- CRITICAL: NEVER use <html>, <head>, <body>, <title>, <meta>, <link> tags - these are FORBIDDEN
- CRITICAL: The return statement must start with <div> or semantic element like <main>, NOT an HTML document
- CRITICAL SYNTAX RULES:
  * Each useState MUST be on its own line: const [value, setValue] = useState(initialValue);
  * ALWAYS use brackets for destructuring: const [state, setState] = useState()
  * NEVER merge multiple statements on one line
  * Each statement MUST end with a semicolon
  * Function body MUST start with opening brace: export default function App() {
  * className with template literals: className={\`base-class \${condition ? 'a' : 'b'}\`}
  * NEVER write className="{\`...\`}" - the quotes break the syntax
  * ALWAYS use ASCII arrow => not Unicode arrows

CONVERSION-OPTIMIZED SECTIONS:
1. HERO (above the fold):
   - Bold headline (text-4xl md:text-5xl lg:text-6xl font-bold)
   - Clear value proposition subheadline
   - Primary CTA button (prominent color, hover effect)
   - Secondary CTA or social proof element
   - Hero visual (gradient background or illustration placeholder)

2. SOCIAL PROOF:
   - Company logos or user avatars
   - Statistics ("10,000+ users", "4.9/5 rating")
   - Brief testimonial quotes

3. FEATURES (3-6 items):
   - Icon + title + description cards
   - Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
   - Hover effects: hover:shadow-lg hover:-translate-y-1

4. HOW IT WORKS (3 steps):
   - Numbered steps with icons
   - Clear progression visualization

5. TESTIMONIALS:
   - Quote cards with avatar, name, role
   - Star ratings if applicable

6. PRICING (if applicable):
   - 2-3 tier cards
   - Highlight recommended plan
   - Feature comparison list

7. FAQ (collapsible):
   - Use useState for open/close state
   - Smooth height transitions

8. FINAL CTA:
   - Repeat primary value prop
   - Large CTA button

9. FOOTER:
   - Logo, nav links, social links, copyright

VISUAL DESIGN:
- Use a single accent color for CTAs
- Neutral backgrounds with proper section separation
- Consistent spacing: py-16 md:py-24 for sections
- max-w-7xl mx-auto px-4 for container
- Smooth scroll behavior with scroll-smooth on html`,

  "dashboard": `You are an elite dashboard developer creating professional admin interfaces.

OUTPUT RULES:
- Return ONLY valid JSX code starting with "export default function"
- NO markdown code blocks, NO explanations
- Single file with all components inline

DASHBOARD LAYOUT:
1. SIDEBAR (collapsible):
   - Logo/brand at top
   - Navigation items with icons
   - Active state styling (bg-accent, border-l-2)
   - Footer with user info or logout
   - Mobile: drawer pattern with overlay

2. TOP HEADER:
   - Search input (w-64)
   - Notification bell with badge
   - User avatar with dropdown
   - Mobile: hamburger menu

3. STATS CARDS (4 grid):
   - Icon + label + value + change%
   - Color coding (green for positive, red for negative)
   - Subtle hover effect

4. CHARTS (CSS-based, no libraries):
   - Bar chart: flex items with height percentages
   - Line chart: SVG polyline or dots
   - Donut: conic-gradient background
   - Include legend and labels

5. DATA TABLE:
   - Sortable headers (click to sort)
   - Search/filter input
   - Status badges with colors
   - Action buttons per row
   - Pagination controls

6. RECENT ACTIVITY:
   - Timeline or list of events
   - Timestamps
   - Action icons

VISUAL DESIGN:
- Sidebar: w-64 bg-card border-r
- Content: p-6 bg-background
- Cards: bg-card rounded-lg border shadow-sm p-6
- Tables: divide-y divide-border
- Status badges: rounded-full px-2 py-1 text-xs`,

  "component": `You are an expert React component developer. Create a reusable, well-designed component.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

REQUIREMENTS:
- Fully self-contained component
- Accept props for customization
- Include default prop values
- TypeScript types inline
- Accessible (ARIA labels)
- Multiple variants if applicable
- Smooth animations
- Tailwind CSS styling`,

  "app": `You are an elite web application developer creating production-ready apps.

OUTPUT RULES:
- Return ONLY valid JSX code starting with "export default function"
- NO markdown code blocks, NO explanations
- Single file with all components inline

APP ARCHITECTURE:
1. STATE MANAGEMENT:
   - Use useState for UI state (modals, forms, selections)
   - Use useCallback for event handlers
   - Use useMemo for computed values
   - Implement proper loading/error states

2. NAVIGATION (internal):
   - useState for current view/page
   - Render different components based on state
   - Include back/navigation buttons

3. CRUD OPERATIONS:
   - Create: Forms with validation, loading state
   - Read: List/grid/table views with filtering/sorting
   - Update: Edit modals or inline editing
   - Delete: Confirmation dialogs, optimistic updates

4. UI COMPONENTS TO INCLUDE:
   - Header with navigation/title
   - Main content area with proper padding
   - Action buttons with hover states
   - Modal/dialog components
   - Form inputs with labels and error states
   - Empty states with helpful messages
   - Loading spinners/skeletons

5. DATA HANDLING:
   - Initialize with sample data array
   - Implement search/filter functionality
   - Sort by different fields
   - Pagination if many items

VISUAL DESIGN:
- Card-based UI with shadow-sm/md
- Consistent button styles (primary, secondary, destructive)
- Form inputs with focus:ring styling
- Toast-like feedback for actions (use a simple notification component)
- Responsive: stack on mobile, side-by-side on desktop`,

  "form": `You are an expert form developer. Create a complete, validated form.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
- Multiple input types (text, email, select, checkbox, etc.)
- Real-time validation with error messages
- Submit handling with loading state
- Success/error feedback
- Accessible labels and hints
- Progress indicator if multi-step

REQUIREMENTS:
- useState for form state
- Validation logic built-in
- Professional styling
- Mobile responsive
- Clear error messaging`,

  "ecommerce": `You are an expert e-commerce developer. Create a complete shopping experience.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Product grid with images (use placeholder colors)
2. Product cards with price, rating, add-to-cart
3. Shopping cart (slide-out or page)
4. Cart item management (quantity, remove)
5. Checkout form
6. Order summary

REQUIREMENTS:
- Full cart state management
- Add/remove/update cart items
- Price calculations
- Responsive grid
- Professional product cards
- Smooth animations`,

  "chat-interface": `You are an expert UI developer. Create a complete chat interface.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Message list with user/bot differentiation
2. Message input with send button
3. Typing indicator
4. Timestamps
5. Message status indicators (sent, delivered, read)
6. Chat header with avatar and status

REQUIREMENTS:
- useState for messages array
- Scroll to bottom on new messages
- Responsive design
- Professional styling
- Smooth animations for new messages
- Keyboard submit support`,

  "data-visualization": `You are an expert data visualization developer. Create interactive charts and graphs.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Multiple chart types (bar, line, pie using CSS/divs)
2. Interactive hover states
3. Legend
4. Data labels
5. Responsive sizing
6. Filter/sort controls

REQUIREMENTS:
- Sample data built-in
- Animated chart rendering
- Hover tooltips
- Professional color scheme
- Mobile responsive
- Accessible`,

  "calendar-app": `You are an expert app developer. Create a complete calendar application.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Monthly calendar grid
2. Day/Week/Month view toggle
3. Event creation modal
4. Event display on calendar
5. Navigation (prev/next month)
6. Today button

REQUIREMENTS:
- useState for current date and events
- Event CRUD operations
- Responsive grid
- Professional styling
- Smooth transitions
- Accessible`,

  "music-player": `You are an expert media player developer. Create a music player interface.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Now playing display with album art (colored placeholder)
2. Play/pause, next, previous controls
3. Progress bar with seek
4. Volume control
5. Playlist/queue view
6. Shuffle and repeat buttons

REQUIREMENTS:
- useState for player state
- Time formatting
- Responsive design
- Professional styling
- Smooth animations
- Keyboard shortcuts`,

  "calculator": `You are an expert app developer. Create a fully functional calculator.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Display showing current input and result
2. Number buttons (0-9)
3. Operation buttons (+, -, *, /)
4. Clear and equals buttons
5. Decimal point
6. History of calculations

REQUIREMENTS:
- Full arithmetic operations
- Error handling (division by zero)
- Keyboard support
- Responsive design
- Professional calculator styling
- Smooth button animations`,

  "blog-platform": `You are an expert content platform developer. Create a blog platform.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Blog post list/grid
2. Post preview cards with image, title, excerpt
3. Full post view
4. Categories/tags filtering
5. Search functionality
6. Reading time estimate

REQUIREMENTS:
- useState for posts and current view
- Sample blog posts data
- Responsive design
- Professional typography
- Smooth transitions between views
- SEO-friendly structure`,

  "portfolio": `You are an expert portfolio developer. Create a stunning portfolio website.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Hero section with name and tagline
2. About section
3. Projects gallery with filtering
4. Skills/technologies section
5. Contact form or section
6. Smooth scroll navigation

REQUIREMENTS:
- useState for filters and form
- Sample project data
- Responsive design
- Modern, creative styling
- Hover animations
- Professional presentation`,

  "settings-page": `You are an expert settings UI developer. Create a comprehensive settings page.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Sidebar navigation for setting categories
2. Profile settings (avatar, name, email)
3. Appearance settings (theme toggle, colors)
4. Notification preferences (toggles)
5. Security settings
6. Save/cancel buttons

REQUIREMENTS:
- useState for all settings
- Toggle switches for booleans
- Dropdown selects for options
- Form validation
- Responsive design
- Professional styling`,

  "map-app": `You are an expert map application developer. Create an interactive map-based application.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Map display area (use a colored div as placeholder)
2. Location search input
3. List of locations/markers
4. Location details panel
5. Zoom controls
6. Current location button

REQUIREMENTS:
- useState for selected location and search
- Simulated map with clickable regions
- Responsive layout
- Professional styling
- Smooth transitions`,

  "admin-panel": `You are an expert admin panel developer. Create a comprehensive admin control panel.

OUTPUT FORMAT: Return ONLY valid JSX code. No explanations.

INCLUDE:
1. Sidebar with navigation menu
2. Top header with user info and notifications
3. Dashboard overview with stats cards
4. User management table
5. Quick actions panel
6. Activity log/feed

REQUIREMENTS:
- useState for navigation and data
- Responsive sidebar (collapsible on mobile)
- Data tables with sorting
- Action buttons and modals
- Professional admin styling`
}

// Template wrapper for generated code
function wrapInTemplate(code: string, type: GenerationType): string {
  return `"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

${code}`
}

export async function POST(req: Request) {
  try {
    // Rate limiting (Redis when REDIS_URL set, else in-memory)
    const clientId = getClientIdentifier(req)
    const rateLimitResult = await checkRateLimitAsync(`generate:${clientId}`, RATE_LIMITS.generate)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        { 
          status: 429, 
          headers: { 
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0'
          } 
        }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Test mode bypass - only enabled with explicit env var
    const testMode = process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true'

    const body = await req.json() as { type: string; prompt: string; options?: GenerateRequest['options'] }
    const { type, prompt, options } = body

    if (!type || !prompt) {
      return NextResponse.json({ error: "Type and prompt are required" }, { status: 400 })
    }
    if (type === 'game') {
      return NextResponse.json({ error: "Game generation is not available on Nairi." }, { status: 400 })
    }
    
    // Validate type is a valid GenerationType
    const validTypes: GenerationType[] = ["website", "landing-page", "dashboard", "component", "app", "form", "ecommerce", "chat-interface", "data-visualization", "calendar-app", "map-app", "music-player", "calculator", "blog-platform", "portfolio", "admin-panel", "settings-page"]
    if (!validTypes.includes(type as GenerationType)) {
      return NextResponse.json({ error: `Invalid generation type: ${type}` }, { status: 400 })
    }
    
    const validatedType = type as GenerationType

    // STEP 1: Generate design brief (V0-style workflow; builder types use website-style briefs)
    const briefType: "website" | "presentation" = "website"
    console.log("🎨 Generating design brief...")
    const designBrief = await generateDesignBrief(briefType, prompt, options)
    console.log('✅ Design brief generated:', designBrief)

    // STEP 2: Build the generation prompt with design brief
    const systemPrompt = CODE_GENERATION_PROMPTS[validatedType] + `

IMPORTANT RULES:
1. Return ONLY the JSX code, starting with "export default function"
2. NO markdown code blocks (\`\`\`)
3. NO explanations before or after the code
4. The code must be complete and runnable
5. Include ALL necessary sub-components inline
6. Use only React hooks from "react" (useState, useEffect, useCallback, useMemo)
7. Use only Tailwind CSS classes for styling`

    const basePrompt = buildGenerationPrompt(prompt, options)
    const designEnhancement = designBriefToPromptEnhancement(designBrief, validatedType)
    const userPrompt = basePrompt + designEnhancement

    // Generate code using free Groq model fallback chain
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send progress
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: "Generating..." })}\n\n`))

          const { text: fullContent, model: usedModel } = await generateWithFallback({
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
            maxOutputTokens: 8000,
          })

          // Clean the generated code
          const cleanedCode = cleanGeneratedCode(fullContent)
          
          // Wrap in template with actual AI-generated code
          const finalCode = wrapInTemplate(cleanedCode, validatedType)

          // Send final complete code
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            complete: true, 
            code: finalCode,
            provider: "bitnet",
            model: usedModel
          })}\n\n`))

          // Save to database (non-blocking) - only if user is logged in
          if (user) {
            Promise.resolve(supabase.from("creations").insert({
              user_id: user.id,
              type: `generated-${validatedType}`,
              prompt,
              content: finalCode,
              options,
              metadata: { provider: "bitnet", model: usedModel, generationType: validatedType }
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
    console.error("Generation API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    )
  }
}

function buildGenerationPrompt(prompt: string, options?: GenerateRequest["options"]): string {
  let fullPrompt = `Create the following: ${prompt}`

  if (options?.complexity) {
    const complexityMap = {
      simple: "Keep it simple with minimal features",
      medium: "Include standard features with good polish",
      complex: "Make it feature-rich and comprehensive"
    }
    fullPrompt += `\n\nComplexity: ${complexityMap[options.complexity]}`
  }

  if (options?.features?.length) {
    fullPrompt += `\n\nMust include these features:\n${options.features.map(f => `- ${f}`).join("\n")}`
  }

  return fullPrompt
}

function cleanGeneratedCode(code: string): string {
  // CRITICAL FIX: Replace Unicode arrow (⇒) with ASCII arrow (=>)
  // Some AI models output Unicode arrows which break JavaScript parsing
  code = code.replace(/⇒/g, "=>")
  
  // CRITICAL FIX: Fix malformed className template literals
  // CRITICAL FIX: Fix malformed className template literals
  // AI sometimes generates: className="{`w-5" h-5 ${...}`} instead of className={`w-5 h-5 ${...}`}
  
  // Step 1: Find all malformed className patterns and fix them
  // Pattern: className="{`..." ...`} where there's a quote breaking the template
  code = code.replace(/className="\{`([^"]+)"\s+([^`]+)`\}/g, (match, part1, part2) => {
    return `className={\`${part1} ${part2}\`}`;
  });
  
  // Step 2: Handle simpler cases: className="{`class`}" -> className={`class`}
  code = code.replace(/className="\{`([^`]*)`\}"/g, 'className={`$1`}')
  
  // Step 3: Fix any remaining broken starts: className="{` -> className={`
  code = code.replace(/className="\{`/g, 'className={`')
  
  // Step 4: Fix any remaining broken ends: `}" -> `}
  code = code.replace(/`\}"/g, '`}')
  
  // Step 5: Fix cases where quote appears mid-className
  // This catches: className="{`w-5" -> className={`w-5
  code = code.replace(/className="\{`([^"]+)"/g, 'className={`$1')
  
  // Remove markdown code blocks
  code = code.replace(/```(?:jsx|tsx|javascript|typescript|react)?\n?/g, "")
  code = code.replace(/```\n?/g, "")
  
  // Remove any leading explanations (everything before export or function)
  const exportMatch = code.match(/export\s+default\s+function/)
  const functionMatch = code.match(/^function\s+\w+\s*\(/)
  
  if (exportMatch?.index !== undefined && exportMatch.index > 0) {
    code = code.slice(exportMatch.index)
  } else if (!exportMatch && functionMatch?.index !== undefined && functionMatch.index > 0) {
    code = code.slice(functionMatch.index)
  }
  
  // Remove trailing explanations (anything after the last closing brace that's not part of code)
  const lastBraceIndex = code.lastIndexOf('}')
  if (lastBraceIndex > 0) {
    const afterBrace = code.slice(lastBraceIndex + 1).trim()
    // If there's substantial text after the last brace that looks like explanation
    if (afterBrace.length > 50 && !afterBrace.startsWith('export') && !afterBrace.startsWith('//')) {
      code = code.slice(0, lastBraceIndex + 1)
    }
  }
  
  // Trim whitespace
  code = code.trim()
  
  // Ensure it starts with export default or add it
  if (!code.startsWith("export default function")) {
    // Try to find and extract the component
    const componentMatch = code.match(/(export\s+default\s+function[\s\S]+)/)
    if (componentMatch) {
      code = componentMatch[1]
    } else if (code.startsWith("function ")) {
      // If it starts with "function ComponentName", add export default
      code = "export default " + code
    }
  }
  
  // Fix common AI-generated syntax errors
  // Fix missing space after keywords
  code = code.replace(/\bconst([a-zA-Z])/g, 'const $1')
  code = code.replace(/\blet([a-zA-Z])/g, 'let $1')
  code = code.replace(/\bvar([a-zA-Z])/g, 'var $1')
  code = code.replace(/\bfunction([a-zA-Z])/g, 'function $1')
  code = code.replace(/\breturn([a-zA-Z\(\{])/g, 'return $1')
  code = code.replace(/\bif([a-zA-Z\(])/g, 'if $1')
  code = code.replace(/\belse([a-zA-Z\{])/g, 'else $1')
  code = code.replace(/\bawait([a-zA-Z])/g, 'await $1')
  code = code.replace(/\basync([a-zA-Z\(])/g, 'async $1')
  
  // Fix missing = in hook declarations
  code = code.replace(/\]\s+useState\(/g, '] = useState(')
  code = code.replace(/\]\s+useEffect\(/g, '] = useEffect(')
  code = code.replace(/\]\s+useCallback\(/g, '] = useCallback(')
  code = code.replace(/\]\s+useMemo\(/g, '] = useMemo(')
  code = code.replace(/\]\s+useRef\(/g, '] = useRef(')
  code = code.replace(/\]\s+useReducer\(/g, '] = useReducer(')
  
  // Fix broken useState declarations (missing useState keyword)
  // Pattern: const [x, setX] =('value') -> const [x, setX] = useState('value')
  code = code.replace(/const\s+\[([^\]]+)\]\s*=\s*\((['"][^'"]*['"])\)/g, 'const [$1] = useState($2)')
  code = code.replace(/const\s+\[([^\]]+)\]\s*=\s*\(([^)]+)\)/g, 'const [$1] = useState($2)')
  
  // Fix missing variable name in destructuring: const [, setX] -> const [x, setX]
  code = code.replace(/const\s+\[\s*,\s*(set[A-Z]\w*)\]/g, (match, setter) => {
    const varName = setter.replace(/^set/, '').toLowerCase()
    return `const [${varName}, ${setter}]`
  })
  
  // CRITICAL FIX: Add missing 'const' before destructuring useState declarations
  // Pattern: [gameState, setGameState] = useState('menu') -> const [gameState, setGameState] = useState('menu')
  // This happens when AI forgets the 'const' keyword
  code = code.replace(
    /^(\s*)\[([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\]\s*=\s*useState\(/gm,
    '$1const [$2, $3] = useState('
  )
  // Also handle inside function body (after newline + whitespace)
  code = code.replace(
    /(\n\s+)\[([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\]\s*=\s*useState\(/g,
    '$1const [$2, $3] = useState('
  )
  // Handle useRef, useCallback, useMemo similarly
  code = code.replace(
    /^(\s*)\[([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\]\s*=\s*useRef\(/gm,
    '$1const [$2, $3] = useRef('
  )
  code = code.replace(
    /(\n\s+)\[([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\]\s*=\s*useRef\(/g,
    '$1const [$2, $3] = useRef('
  )
  // Handle single variable useRef: animationFrameId = useRef(null) -> const animationFrameId = useRef(null)
  code = code.replace(
    /^(\s*)([a-zA-Z][a-zA-Z0-9]*)\s*=\s*useRef\(/gm,
    '$1const $2 = useRef('
  )
  code = code.replace(
    /(\n\s+)([a-zA-Z][a-zA-Z0-9]*)\s*=\s*useRef\(/g,
    '$1const $2 = useRef('
  )
  
  // Fix common issues with arrow functions
  code = code.replace(/=>\s*{/g, '=> {')
  code = code.replace(/}\s*\)/g, '})')
  
  // CRITICAL FIX: Add missing 'const' keyword for arrow function declarations
  // Pattern: handleClick = () => { -> const handleClick = () => {
  // But avoid matching if it's already a const/let/var declaration
  code = code.replace(
    /^(\s*)([a-z][a-zA-Z0-9]*)\s*=\s*\(\s*\)\s*=>/gm,
    '$1const $2 = () =>'
  )
  code = code.replace(
    /^(\s*)([a-z][a-zA-Z0-9]*)\s*=\s*\(([^)]+)\)\s*=>/gm,
    '$1const $2 = ($3) =>'
  )
  // Also handle inside function body (after newline + whitespace)
  code = code.replace(
    /(\n\s+)([a-z][a-zA-Z0-9]*)\s*=\s*\(\s*\)\s*=>/g,
    '$1const $2 = () =>'
  )
  code = code.replace(
    /(\n\s+)([a-z][a-zA-Z0-9]*)\s*=\s*\(([^)]+)\)\s*=>/g,
    '$1const $2 = ($3) =>'
  )
  
  // CRITICAL FIX: Handle missing opening brace after function declaration
  // Pattern: export default function App()  const -> export default function App() { const
  code = code.replace(
    /export\s+default\s+function\s+(\w+)\s*\(\s*\)\s+(const|let|var|return|\/\/|\/\*)/g,
    'export default function $1() {\n  $2'
  )
  // Also handle function with parameters
  code = code.replace(
    /export\s+default\s+function\s+(\w+)\s*\(([^)]*)\)\s+(const|let|var|return|\/\/|\/\*)/g,
    'export default function $1($2) {\n  $3'
  )
  // Handle regular function declarations too
  code = code.replace(
    /function\s+(\w+)\s*\(\s*\)\s+(const|let|var|return|\/\/|\/\*)/g,
    'function $1() {\n  $2'
  )
  code = code.replace(
    /function\s+(\w+)\s*\(([^)]*)\)\s+(const|let|var|return|\/\/|\/\*)/g,
    'function $1($2) {\n  $3'
  )
  
  // Fix missing semicolons in common places (but be careful not to break JSX)
  code = code.replace(/const\s+\[([^\]]+)\]\s*=\s*useState\(([^)]*)\)([^;}\n])/g, 'const [$1] = useState($2);$3')
  
  // CRITICAL FIX: Fix missing brackets in useState destructuring
  // Pattern: const selectedPlan, setSelectedPlan = useState('basic') -> const [selectedPlan, setSelectedPlan] = useState('basic')
  code = code.replace(
    /const\s+([a-zA-Z][a-zA-Z0-9]*),\s*(set[A-Z][a-zA-Z0-9]*)\s*=\s*useState\(/g,
    'const [$1, $2] = useState('
  )
  
  // CRITICAL FIX: Fix merged lines - when two useState declarations are on the same line
  // Pattern: useState('basic  const [email -> useState('basic');\n  const [email
  code = code.replace(
    /useState\((['"][^'"]*)\s+const\s+\[/g,
    "useState($1);\n  const ["
  )
  code = code.replace(
    /useState\(([^)]+)\)\s*const\s+\[/g,
    "useState($1);\n  const ["
  )
  
  // CRITICAL FIX: Fix merged lines where useState value is followed by const without closing paren
  // Pattern: useState(false  const handleSignUp -> useState(false);\n  const handleSignUp
  code = code.replace(
    /useState\((true|false|null|undefined|\d+|'[^']*'|"[^"]*"|\[[^\]]*\]|\{[^}]*\})\s+(const|let|var)\s+/g,
    'useState($1);\n  $2 '
  )
  
  // CRITICAL FIX: Fix merged lines where closing paren/semicolon is missing before const
  // Pattern: );  const handleSignUp = () => { -> );\n  const handleSignUp = () => {
  code = code.replace(
    /\);\s{2,}(const|let|var)\s+/g,
    ');\n  $1 '
  )
  
  // Fix merged lines with semicolon missing
  code = code.replace(
    /\);\s*const\s+\[([^\]]+)\]\s*=\s*useState/g,
    ');\n  const [$1] = useState'
  )
  
  // CRITICAL FIX: Fix missing comma in useState destructuring
  // Pattern: const [pricing setPricing] = useState -> const [pricing, setPricing] = useState
  code = code.replace(
    /const\s+\[([a-zA-Z][a-zA-Z0-9]*)\s+(set[A-Z][a-zA-Z0-9]*)\]\s*=\s*useState\(/g,
    'const [$1, $2] = useState('
  )
  
  // CRITICAL FIX: Fix missing object key before colon
  // Pattern: {: "value" -> { title: "value"
  code = code.replace(/\{:\s*"([^"]+)"/g, '{ title: "$1"')
  code = code.replace(/\{:\s*'([^']+)'/g, "{ title: '$1'")
  
  // CRITICAL FIX: Fix missing 'title' in object with only description
  // Pattern: { title:"Name", description: -> { title: "Name", description:
  code = code.replace(/\{\s*title:([^,]+),/g, '{ title: $1,')
  
  // Ensure proper className quotes
  code = code.replace(/className=([^"'][^\s>]+)/g, 'className="$1"')
  
  // Fix double quotes in JSX attributes that should be single or template literals
  code = code.replace(/className="\$\{/g, 'className={`')
  code = code.replace(/\}"/g, '}`')
  
  // CRITICAL FIX: Fix incomplete arithmetic in function calls
  // Pattern: count + ) -> count + 1)
  code = code.replace(/(\w+)\s*\+\s*\)/g, '$1 + 1)')
  code = code.replace(/(\w+)\s*-\s*\)/g, '$1 - 1)')
  
  // CRITICAL FIX: Fix malformed arrow function syntax
  // Pattern: =(() => { -> = () => {
  code = code.replace(/=\s*\(\s*\(\s*\)\s*=>/g, '= () =>')
  
  // CRITICAL FIX: Fix incomplete useState values
  code = code.replace(/useState\(\s*\)/g, "useState('')")
  
  // CRITICAL FIX: Fix broken JSX self-closing tags
  code = code.replace(/<(\w+)([^>]*)\s+\/\s+>/g, '<$1$2 />')
  
  // CRITICAL FIX: Fix stray '>' characters after JSX opening tags
  // Pattern: <main className="..."> > -> <main className="...">
  code = code.replace(/(<[A-Za-z][^>]*>)\s*>/g, '$1')
  
  return code
}
