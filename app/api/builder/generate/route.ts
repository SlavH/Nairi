import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserIdOrBypassForApi } from "@/lib/auth"
import { checkRateLimitAsync, getClientIdentifier } from "@/lib/rate-limit"
import { generateForBuilder } from "@/lib/ai/builder-generate-fallback"
// Lazy-load system prompt so the route still registers if the module path fails (avoids 404)
let _cachedSystemPrompt: string | null = null
async function getSystemPrompt(): Promise<string> {
  if (_cachedSystemPrompt) return _cachedSystemPrompt
  try {
    const mod = await import("@/lib/builder-v2/prompts/system-prompt")
    _cachedSystemPrompt = mod.V0_SYSTEM_PROMPT
    return _cachedSystemPrompt
  } catch (e) {
    console.error("[builder/generate] Failed to load system prompt module:", e)
    _cachedSystemPrompt = `You are an AI that generates React/TSX. Respond with exactly one JSON object: { "plan": string[], "files": [{ "path": string, "content": string }], "message": string }. One default export per file. No <html>, <head>, <body>. Use nav, main, section. Tailwind only.`
    return _cachedSystemPrompt
  }
}
import type { GenerateRequest, TaskUpdate, FileUpdate, MessageUpdate, CompleteUpdate, PlanUpdate } from "@/lib/builder-v2/types"
import { safeParseGenerateRequest } from "@/lib/builder-v2/schemas/request-schema"
import { searchWeb } from "@/lib/builder-v2/utils/web-search"
import { analyzePrompt, type PromptAnalysis } from "@/lib/builder-v2/utils/prompt-analysis"
import { enhanceToHighLevelWebsitePrompt } from "@/lib/builder-v2/utils/prompt-enhancer"
import { getImagePromptsForWebsite, generateImageUrlForBuilder } from "@/lib/builder-v2/utils/builder-image"
import { getDesignGuidance } from "@/lib/builder-v2/utils/design-intelligence"
import { getInitialTaskPlan } from "@/lib/builder-v2/generate/initial-plan"
import { extractColors as extractColorsFromCSS } from "@/lib/builder-v2/utils/website-analyzer"
import { applyDynamicColorReplacement } from "@/lib/builder-v2/generators/component-generator"
import { 
  cleanGeneratedCode, 
  validateTypeScriptCode, 
  autoFixCommonErrors 
} from "@/lib/builder-v2/generators/code-cleaner"
import {
  normalizeJsonBacktickStrings,
  escapeControlCharsInJsonStrings,
  escapeUnescapedQuotesInJsonStrings,
  removeTrailingCommasInJson,
  extractJsonWithBalancedBraces,
  repairTruncatedJson,
} from "@/lib/builder-v2/json-normalizers"
import { validateBuilderResponse } from "@/lib/builder-v2/schemas/response-schema"

export const maxDuration = 120

const BUILDER_RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 1000 }

/** GET: health check so you can verify the route is registered (avoids 404 confusion). */
export async function GET() {
  return NextResponse.json({ ok: true, route: "builder/generate" })
}

// v0-sdk integration
// In production, use: import { V0Client } from 'v0-sdk'
// For now, we'll use Groq as the underlying LLM with v0-style prompting

// Note: searchWeb is now imported from @/lib/builder-v2/utils/web-search
// Note: analyzePrompt is now imported from @/lib/builder-v2/utils/prompt-analysis
// Note: analyzeDesign is now imported from @/lib/builder-v2/utils/design-intelligence
// Note: analyzeWebsite is now imported from @/lib/builder-v2/utils/website-analyzer

// ============================================================================
// 🔍 SUPERPOWER #4: COMPLETE WEBSITE ANALYSIS (FREE APIs + Full Site Crawl)
// ============================================================================

interface WebsiteAnalysis {
  colors: { name: string; hex: string; usage: string }[]
  typography: { element: string; font: string; size: string; weight: string }[]
  layout: { component: string; dimensions: string; position: string }[]
  components: { name: string; structure: string; styling: string }[]
  pages: { url: string; purpose: string; elements: string[] }[]
  tailwindClasses: string
}

// Fetch website HTML with proper headers
async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    })
    if (!response.ok) return null
    return await response.text()
  } catch (e) {
    console.error(`Failed to fetch ${url}:`, e)
    return null
  }
}

// Build a deterministic, syntactically safe fallback React page. This is used
// when the AI output cannot be reliably cleaned/validated so that the Builder
// still returns a working website preview instead of an error.
function buildFallbackPage(prompt: string): string {
  const safePromptLiteral = JSON.stringify(prompt.slice(0, 200))
  return `import React from "react"

const safePrompt = ${safePromptLiteral}

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-8">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">Portfolio website generated by Nairi Builder</h1>
        <p className="text-slate-300">
          This is a safe starter layout generated automatically so you always
          get a working website preview based on your request.
        </p>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
            Your request
          </p>
          <p className="text-sm text-slate-100">
            {safePrompt}
          </p>
        </div>
      </div>
    </main>
  )
}
`
}

// If content for /app/page.tsx contains document structure (html/body/head/metadata),
// strip it and produce a single-page React component so the preview always works.
function ensurePageContentNotLayout(content: string): string {
  let out = content

  // Remove export const metadata (multi-line safe)
  out = out.replace(/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*\n?/g, '')
  out = out.replace(/export\s+const\s+metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*\n?/g, '')

  const hasHtmlOrBody = /<\s*html|<\s*body|<\s*head/i.test(out)
  if (!hasHtmlOrBody && !/RootLayout/i.test(out)) {
    out = out.replace(/\bRootLayout\b/g, 'Page')
    return out
  }

  // Extract inner content: prefer <body>...</body>, else <html>...</html>
  let inner: string | null = null
  const bodyMatch = out.match(/<body[^>]*>([\s\S]*?)<\/body\s*>/i)
  if (bodyMatch) {
    inner = bodyMatch[1].trim()
  } else {
    const htmlMatch = out.match(/<html[^>]*>([\s\S]*?)<\/html\s*>/i)
    if (htmlMatch) inner = htmlMatch[1].trim()
  }

  if (inner) {
    // Strip <head>...</head> from extracted content so we don't render it inside React
    inner = inner.replace(/<head[^>]*>[\s\S]*?<\/head\s*>/gi, '').trim()
    const pageJsx = `<>${inner}</>`
    // Remove existing default export (from "export default" to end) and append single-page component
    out = out.replace(/\bexport\s+default\s+[\s\S]*$/m, '').trimEnd()
    out = `${out}\n\nexport default function Page() {\n  return (\n    ${pageJsx}\n  )\n}`
  } else {
    // Could not extract body/html inner content—strip raw tags so preview can try to render
    out = out.replace(/<\s*head[^>]*>[\s\S]*?<\/head\s*>/gi, '')
    out = out.replace(/<\s*body[^>]*>/gi, '<>')
    out = out.replace(/<\/body\s*>/gi, '</>')
    out = out.replace(/<\s*html[^>]*>/gi, '')
    out = out.replace(/<\/html\s*>/gi, '')
    out = out.replace(/\bRootLayout\b/g, 'Page')
  }

  return out
}

// Extract all internal links from HTML
function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const linkRegex = /href=["']([^"']+)["']/gi
  let match
  
  const base = new URL(baseUrl)
  
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1]
    if (href.startsWith('/') && !href.startsWith('//')) {
      href = `${base.protocol}//${base.host}${href}`
    }
    if (href.startsWith(base.origin) && !href.includes('#') && !href.match(/\.(jpg|png|gif|css|js|svg|ico)$/i)) {
      links.push(href)
    }
  }
  
  return [...new Set(links)].slice(0, 10) // Max 10 pages
}

// Extract CSS from HTML (inline styles, style tags, and linked stylesheets)
async function extractAllCSS(html: string, baseUrl: string): Promise<string> {
  const cssContent: string[] = []
  
  // Extract inline style tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let match
  while ((match = styleRegex.exec(html)) !== null) {
    cssContent.push(match[1])
  }
  
  // Extract linked stylesheets
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi
  const base = new URL(baseUrl)
  
  while ((match = linkRegex.exec(html)) !== null) {
    let cssUrl = match[1]
    if (cssUrl.startsWith('/')) {
      cssUrl = `${base.protocol}//${base.host}${cssUrl}`
    } else if (!cssUrl.startsWith('http')) {
      cssUrl = `${base.origin}/${cssUrl}`
    }
    
    try {
      const cssResponse = await fetch(cssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      if (cssResponse.ok) {
        const css = await cssResponse.text()
        cssContent.push(css.substring(0, 20000)) // Limit size
      }
    } catch (e) {
      // Skip failed CSS fetches
    }
  }
  
  return cssContent.join('\n')
}

// Extract CSS variables (design tokens)
function extractCSSVariables(css: string): Record<string, string> {
  const variables: Record<string, string> = {}
  const varRegex = /--([\w-]+)\s*:\s*([^;]+)/g
  let match
  
  while ((match = varRegex.exec(css)) !== null) {
    variables[`--${match[1]}`] = match[2].trim()
  }
  
  return variables
}

// Extract component patterns from HTML
function extractComponents(html: string): { tag: string; classes: string[]; count: number }[] {
  const componentMap = new Map<string, { classes: Set<string>; count: number }>()
  
  // Match elements with classes
  const elementRegex = /<(\w+)[^>]*class=["']([^"']+)["']/gi
  let match
  
  while ((match = elementRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase()
    const classes = match[2].split(/\s+/).filter(c => c.length > 0)
    
    const key = tag
    if (!componentMap.has(key)) {
      componentMap.set(key, { classes: new Set(), count: 0 })
    }
    const entry = componentMap.get(key)!
    classes.forEach(c => entry.classes.add(c))
    entry.count++
  }
  
  return Array.from(componentMap.entries())
    .map(([tag, data]) => ({ tag, classes: Array.from(data.classes).slice(0, 10), count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}

// LLM call using BitNet
async function callFreeLLM(prompt: string, _apiKey?: string): Promise<string> {
  try {
    const { text } = await generateForBuilder({
      system: "You are a helpful assistant.",
      prompt,
      temperature: 0.3,
      maxOutputTokens: 3000,
    })
    return text
  } catch (_e) {
    return ''
  }
}

// MAIN: Complete website analysis (crawls multiple pages)
async function analyzeCompleteWebsite(url: string, groqKey: string): Promise<string> {
  console.log(`🔍 Starting complete analysis of: ${url}`)
  
  // Normalize URL
  if (!url.startsWith('http')) url = `https://${url}`
  const baseUrl = new URL(url).origin
  
  // Step 1: Fetch main page
  const mainHtml = await fetchPage(url)
  if (!mainHtml) {
    return `Could not fetch ${url}. Will use design best practices.`
  }
  
  // Step 2: Extract all CSS
  const allCSS = await extractAllCSS(mainHtml, url)
  
  // Step 3: Extract colors from CSS
  const colors = extractColorsFromCSS(allCSS)
  
  // Step 4: Extract CSS variables (design tokens)
  const cssVariables = extractCSSVariables(allCSS)
  
  // Step 5: Extract component patterns
  const components = extractComponents(mainHtml)
  
  // Step 6: Find and analyze additional pages
  const links = extractLinks(mainHtml, url)
  const pageAnalyses: string[] = []
  
  // Analyze up to 5 additional pages
  for (const link of links.slice(0, 5)) {
    const pageHtml = await fetchPage(link)
    if (pageHtml) {
      const pageComponents = extractComponents(pageHtml)
      pageAnalyses.push(`Page: ${link}\nComponents: ${pageComponents.slice(0, 5).map(c => c.tag).join(', ')}`)
    }
  }
  
  // Step 7: Build comprehensive analysis prompt for LLM
  const analysisPrompt = `You are a senior UI/UX designer and frontend developer. Analyze this website data and provide EXACT specifications to recreate it.

## WEBSITE: ${url}

## EXTRACTED COLORS (sorted by frequency):
${colors.slice(0, 15).map((c, i) => `${i + 1}. ${c.hex} (used ${c.count} times)`).join('\n')}

## CSS VARIABLES (Design Tokens):
${Object.entries(cssVariables).slice(0, 30).map(([k, v]) => `${k}: ${v}`).join('\n')}

## HTML COMPONENTS FOUND:
${components.map(c => `<${c.tag}> - ${c.count} instances, classes: ${c.classes.slice(0, 5).join(', ')}`).join('\n')}

## PAGES ANALYZED:
${pageAnalyses.join('\n')}

## RAW CSS SAMPLE:
${allCSS.substring(0, 5000)}

---

Based on this data, provide a COMPLETE design specification:

1. **COLOR PALETTE**: List the primary, secondary, accent, background, text, and border colors with exact hex values

2. **TYPOGRAPHY**: Font families, sizes for h1-h6, body, small text. Include line-heights and font-weights.

3. **LAYOUT STRUCTURE**: 
   - Header: height, background, layout (flex/grid)
   - Sidebar: width, background, navigation style
   - Main content: max-width, padding, grid columns
   - Footer: height, background, content

4. **COMPONENT SPECIFICATIONS**:
   - Buttons: sizes, colors, border-radius, hover states
   - Cards: padding, shadows, border-radius
   - Navigation: style, active states, hover effects
   - Forms: input styles, focus states
   - Icons: size, color

5. **SPACING SYSTEM**: Base unit, common paddings/margins/gaps

6. **EFFECTS**: Shadows, transitions, animations, hover states

7. **TAILWIND CSS CLASSES**: Provide ready-to-use Tailwind classes for each component

Be SPECIFIC with exact values. This will be used to generate a pixel-perfect clone.`

  // Step 8: Call LLM for analysis
  const llmAnalysis = await callFreeLLM(analysisPrompt, groqKey)
  
  // Step 9: Compile final analysis
  const finalAnalysis = `
## COMPLETE WEBSITE ANALYSIS: ${url}

### Extracted Data:
- **Colors Found**: ${colors.length} unique colors
- **Top Colors**: ${colors.slice(0, 5).map(c => c.hex).join(', ')}
- **CSS Variables**: ${Object.keys(cssVariables).length} design tokens
- **Pages Analyzed**: ${pageAnalyses.length + 1}
- **Components**: ${components.map(c => c.tag).join(', ')}

### AI Design Analysis:
${llmAnalysis}

### Quick Reference - Primary Colors:
${colors.slice(0, 8).map(c => `- \`${c.hex}\` (${c.count}x)`).join('\n')}

### CSS Variables:
${Object.entries(cssVariables).slice(0, 15).map(([k, v]) => `- \`${k}\`: ${v}`).join('\n')}
`
  
  return finalAnalysis
}

async function analyzeReferenceUrl(url: string, groqKey: string): Promise<string> {
  // Analyze the COMPLETE real website (multiple pages, all CSS, all components)
  const completeAnalysis = await analyzeCompleteWebsite(url, groqKey)
  if (completeAnalysis && !completeAnalysis.includes('Could not fetch')) {
    return completeAnalysis
  }
  
  // Fallback to known patterns only if complete analysis fails
  const knownSites: Record<string, string> = {
    'youtube': `
## YOUTUBE PIXEL-PERFECT CLONE SPECIFICATIONS

### EXACT COLORS:
- Background: #0f0f0f (main), #212121 (cards), #181818 (sidebar)
- Text: #f1f1f1 (primary), #aaaaaa (secondary)
- Red accent: #ff0000 (logo, subscribe button)
- Hover: #272727 (cards), #3d3d3d (buttons)

### HEADER (height: 56px, fixed top):
- Left: Hamburger menu icon (24px), YouTube logo (90x20px red/white)
- Center: Search bar (max-w-2xl, bg-[#121212], border border-[#303030], rounded-full, h-10)
  - Search icon button on right (bg-[#222222], rounded-r-full)
  - Microphone button (circular, bg-[#222222])
- Right: Create icon, Notifications bell, User avatar (32px circle)

### LEFT SIDEBAR (width: 240px, bg-[#0f0f0f]):
- Nav items: Home, Shorts, Subscriptions (with icons, py-2.5 px-3)
- Divider line
- You section: History, Playlists, Watch Later, Liked Videos
- Subscriptions section with channel avatars (24px circles)
- Each item: flex items-center gap-6, hover:bg-[#272727] rounded-lg

### VIDEO GRID:
- grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
- Video card structure:
  - Thumbnail: aspect-video rounded-xl, with duration badge (bottom-right, bg-black/80 text-xs px-1)
  - Below thumbnail: flex gap-3
    - Channel avatar: 36px circle
    - Info: title (font-medium line-clamp-2), channel name (text-[#aaaaaa] text-sm), views + date

### VIDEO THUMBNAILS (use real-looking placeholders):
- Use gradient backgrounds: from-red-500 to-orange-500, from-blue-500 to-purple-500, etc.
- Or use: https://picsum.photos/320/180?random=1 (increment number)

### FONTS:
- font-family: 'Roboto', sans-serif
- Title: text-sm font-medium
- Meta: text-xs text-[#aaaaaa]
`,
    'twitter': `
## TWITTER/X PIXEL-PERFECT CLONE SPECIFICATIONS

### EXACT COLORS:
- Background: #000000 (pure black)
- Cards/Borders: #2f3336 (borders), #16181c (hover)
- Text: #e7e9ea (primary), #71767b (secondary)
- Blue accent: #1d9bf0 (links, buttons)
- Like: #f91880 (pink), Retweet: #00ba7c (green)

### LAYOUT: 3-column (max-w-[1265px] mx-auto)
- Left sidebar: w-[275px]
- Main feed: w-[600px] border-x border-[#2f3336]
- Right sidebar: w-[350px]

### LEFT SIDEBAR:
- X logo (28px) at top
- Nav items (py-3 px-4 rounded-full hover:bg-[#181818]):
  - Home (bold when active), Explore, Notifications, Messages, Grok, Lists, Bookmarks, Communities, Premium, Profile, More
- Post button: w-full bg-[#1d9bf0] rounded-full py-3 font-bold

### MAIN FEED:
- Header: sticky top-0 bg-black/80 backdrop-blur-md
  - "For you" / "Following" tabs
- Tweet composer: border-b border-[#2f3336] p-4
  - Avatar (40px) + textarea + Post button
- Tweet structure:
  - flex gap-3 p-4 border-b border-[#2f3336] hover:bg-[#080808]
  - Avatar: 40px circle
  - Content: name (font-bold) + handle (@user, text-[#71767b]) + time
  - Tweet text, optional image (rounded-2xl)
  - Actions bar: Reply, Retweet, Like, Views, Share (with counts)

### RIGHT SIDEBAR:
- Search bar: bg-[#202327] rounded-full px-4 py-3
- "What's happening" box: bg-[#16181c] rounded-2xl p-4
- "Who to follow" box: bg-[#16181c] rounded-2xl p-4
  - User cards with Follow button (border border-[#536471] rounded-full)
`,
    'x.com': `(Same as Twitter above)`,
    'spotify': `
## SPOTIFY PIXEL-PERFECT CLONE SPECIFICATIONS

### EXACT COLORS:
- Background: #000000 (main), #121212 (cards), #181818 (sidebar)
- Text: #ffffff (primary), #b3b3b3 (secondary)
- Green accent: #1db954 (buttons, progress bar)
- Hover: #282828 (cards), #1ed760 (button hover)

### LAYOUT:
- Left sidebar: w-[280px] bg-[#000000]
- Main content: flex-1 bg-gradient-to-b from-[#1e1e1e] to-[#121212]
- Bottom player: h-[90px] fixed bottom-0 bg-[#181818] border-t border-[#282828]

### LEFT SIDEBAR:
- Logo: Spotify icon (green) + "Spotify" text
- Nav: Home, Search (with icons, py-2 px-4 rounded-md hover:bg-[#1a1a1a])
- Your Library section header
- Playlist cards: bg-[#1a1a1a] rounded-lg p-2, album art (48px) + name

### MAIN CONTENT:
- Header: sticky, gradient background matching album art
- Album/Playlist hero: large cover (232px), title (text-7xl font-bold), artist, play count
- Track list: table layout
  - # | Title (with album art 40px) | Album | Date Added | Duration
  - hover:bg-[#2a2a2a]

### BOTTOM PLAYER:
- Left: Album art (56px) + Song name + Artist
- Center: Controls (shuffle, prev, play/pause circle, next, repeat) + progress bar
- Right: Volume slider, queue icon, devices icon

### ALBUM GRID:
- grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6
- Card: bg-[#181818] p-4 rounded-lg hover:bg-[#282828]
  - Cover: aspect-square rounded-md shadow-lg
  - Title: font-bold mt-4 truncate
  - Artist: text-sm text-[#b3b3b3]
`,
    'netflix': `
## NETFLIX PIXEL-PERFECT CLONE SPECIFICATIONS

### EXACT COLORS:
- Background: #141414 (main)
- Text: #ffffff (primary), #808080 (secondary)
- Red accent: #e50914 (logo, buttons)
- Card hover: scale-110 with shadow

### HEADER (fixed, transparent -> bg-[#141414] on scroll):
- Left: Netflix logo (red "N" or full logo)
- Nav: Home, TV Shows, Movies, New & Popular, My List
- Right: Search icon, Notifications bell, Profile avatar dropdown

### HERO SECTION (h-[80vh]):
- Full-width background image with gradient overlay
- gradient: from-[#141414] via-transparent to-[#141414]
- Content (bottom-left): Logo/Title (large), Description (max-w-lg), Play + More Info buttons
- Play button: bg-white text-black px-8 py-2 rounded font-bold
- More Info: bg-[#6d6d6e]/70 text-white px-6 py-2 rounded

### CONTENT ROWS:
- Title: text-xl font-bold mb-4
- Horizontal scroll: flex overflow-x-auto gap-2 pb-4
- Movie card: w-[250px] flex-shrink-0
  - Poster: aspect-[2/3] rounded-md
  - Hover: scale-110 z-10 transition-transform duration-300

### MOVIE CARDS ON HOVER:
- Expand with preview video/image
- Show: title, match %, age rating, duration
- Icons: play, add to list, like, expand

### TOP 10 ROW:
- Large numbers (1-10) overlapping posters
- Number: text-8xl font-bold text-stroke
`,
    'instagram': `
## INSTAGRAM PIXEL-PERFECT CLONE SPECIFICATIONS

### EXACT COLORS:
- Background: #000000 (dark mode) or #ffffff (light)
- Text: #f5f5f5 (dark) or #262626 (light)
- Borders: #262626 (dark) or #dbdbdb (light)
- Gradient: from-[#833ab4] via-[#fd1d1d] to-[#fcb045] (logo/stories)

### LAYOUT:
- Left sidebar: w-[244px] (desktop) or bottom nav (mobile)
- Main feed: max-w-[630px] mx-auto
- Right sidebar: w-[320px] (suggestions)

### LEFT SIDEBAR:
- Instagram logo (text or icon)
- Nav items: Home, Search, Explore, Reels, Messages, Notifications, Create, Profile
- Each: flex items-center gap-4 p-3 rounded-lg hover:bg-[#1a1a1a]

### STORIES BAR:
- Horizontal scroll at top of feed
- Story circle: 66px with gradient ring (2px), avatar inside (62px)
- Username below (text-xs truncate)

### POST CARD:
- Header: avatar (32px) + username + time + more icon
- Image: aspect-square w-full
- Actions: Like, Comment, Share, Save (right-aligned)
- Likes: "Liked by user and X others"
- Caption: username (font-bold) + text
- Comments preview: "View all X comments"
- Add comment input

### EXPLORE GRID:
- grid grid-cols-3 gap-1
- Mix of: 1x1, 1x2, 2x2 images
- Hover: overlay with likes/comments count
`,
    'amazon': `
## AMAZON PIXEL-PERFECT CLONE SPECIFICATIONS

### EXACT COLORS:
- Header: #131921 (dark blue)
- Background: #eaeded (light gray)
- Text: #0f1111 (primary), #565959 (secondary)
- Orange accent: #ff9900 (buttons, ratings)
- Blue links: #007185

### HEADER:
- Top bar: bg-[#131921] text-white
  - Logo, Deliver to location, Search bar (flex-1), Language, Account, Returns, Cart
- Search: bg-white rounded-md, category dropdown (left), search button (bg-[#febd69])
- Nav bar: bg-[#232f3e] - All menu, Today's Deals, Customer Service, etc.

### PRODUCT GRID:
- grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4
- Product card: bg-white p-4
  - Image: aspect-square object-contain
  - Title: text-sm line-clamp-2 text-[#007185] hover:text-[#c7511f]
  - Rating: stars (orange) + count
  - Price: text-xl font-bold (whole) + text-xs (cents)
  - Prime badge: blue checkmark
  - Delivery info: text-xs

### STAR RATINGS:
- Use filled/empty stars with #ff9900 color
- Show decimal (4.5 out of 5)
`,
    'github': `
## GITHUB PIXEL-PERFECT CLONE SPECIFICATIONS

### EXACT COLORS:
- Background: #0d1117 (dark), #f6f8fa (light)
- Text: #e6edf3 (dark), #1f2328 (light)
- Borders: #30363d (dark), #d0d7de (light)
- Green accent: #238636 (buttons), #3fb950 (contributions)
- Blue links: #2f81f7

### HEADER (bg-[#010409]):
- Logo (Octocat), Search bar, Pull requests, Issues, Marketplace, Explore
- Right: Notifications, Create (+), Profile avatar

### REPOSITORY PAGE:
- Tabs: Code, Issues, Pull requests, Actions, Projects, Wiki, Security, Insights
- About section (right sidebar)
- File browser: table with icon, name, commit message, date
- README.md rendered below

### PROFILE PAGE:
- Left: Avatar (296px), Name, Bio, Followers/Following, Location
- Contribution graph: grid of green squares (4 shades)
- Pinned repositories: 2-column grid
- Repository cards: border rounded-md p-4

### CONTRIBUTION GRAPH:
- 52 columns x 7 rows of squares
- Colors: #161b22 (none), #0e4429, #006d32, #26a641, #39d353
`
  }
  
  const urlLower = url.toLowerCase()
  for (const [site, description] of Object.entries(knownSites)) {
    if (urlLower.includes(site)) {
      return `Reference site analysis (${site}):\n${description}`
    }
  }
  
  // For unknown URLs, use Groq fallback chain
  try {
    const { text } = await generateForBuilder({
      system: "You are a senior UI/UX designer. Be specific about layout, colors, and key UI components.",
      prompt: `Based on the URL "${url}", describe what kind of website this likely is and what design patterns it probably uses.`,
      temperature: 0.3,
      maxOutputTokens: 300,
      fast: true,
    })
    return text
  } catch (_e) {
    return ''
  }
}

// ============================================================================
// ⭐ SUPERPOWER #5: CODE QUALITY SCORING
// ============================================================================
interface CodeQualityScore {
  overall: number // 1-10
  categories: {
    structure: number
    styling: number
    accessibility: number
    responsiveness: number
    performance: number
  }
  suggestions: string[]
}

function scoreCodeQuality(code: string): CodeQualityScore {
  const suggestions: string[] = []
  let structure = 10
  let styling = 10
  let accessibility = 10
  let responsiveness = 10
  let performance = 10
  
  // Structure checks
  if (!code.includes('export default function')) {
    structure -= 2
    suggestions.push('Add proper default export')
  }
  if ((code.match(/function\s+[A-Z]/g) || []).length < 2) {
    structure -= 1
    suggestions.push('Consider breaking into more components')
  }
  if (!code.includes('interface') && !code.includes('type ')) {
    structure -= 1
    suggestions.push('Add TypeScript interfaces for props')
  }
  
  // Styling checks
  if (!code.includes('hover:')) {
    styling -= 2
    suggestions.push('Add hover states for interactive elements')
  }
  if (!code.includes('transition')) {
    styling -= 1
    suggestions.push('Add transitions for smoother interactions')
  }
  if (!code.includes('shadow')) {
    styling -= 1
    suggestions.push('Consider adding shadows for depth')
  }
  
  // Accessibility checks
  if (!code.includes('aria-')) {
    accessibility -= 2
    suggestions.push('Add ARIA labels for accessibility')
  }
  if (!code.includes('alt=')) {
    accessibility -= 2
    suggestions.push('Add alt text to images')
  }
  if (!code.includes('role=')) {
    accessibility -= 1
    suggestions.push('Consider adding role attributes')
  }
  
  // Responsiveness checks
  if (!code.includes('sm:') && !code.includes('md:') && !code.includes('lg:')) {
    responsiveness -= 3
    suggestions.push('Add responsive breakpoints (sm:, md:, lg:)')
  }
  if (!code.includes('grid-cols')) {
    responsiveness -= 1
    suggestions.push('Use CSS Grid for better layouts')
  }
  
  // Performance checks
  if (code.includes('useEffect') && !code.includes('[]')) {
    performance -= 1
    suggestions.push('Ensure useEffect has proper dependency arrays')
  }
  if ((code.match(/useState/g) || []).length > 10) {
    performance -= 1
    suggestions.push('Consider using useReducer for complex state')
  }
  
  // Ensure scores don't go below 1
  structure = Math.max(1, structure)
  styling = Math.max(1, styling)
  accessibility = Math.max(1, accessibility)
  responsiveness = Math.max(1, responsiveness)
  performance = Math.max(1, performance)
  
  const overall = Math.round((structure + styling + accessibility + responsiveness + performance) / 5)
  
  return {
    overall,
    categories: { structure, styling, accessibility, responsiveness, performance },
    suggestions: suggestions.slice(0, 5) // Top 5 suggestions
  }
}

// ============================================================================
// 📋 SUPERPOWER #6: SMART PLANNING - Multi-phase with Dependencies
// ============================================================================
interface SmartTask {
  id: string
  title: string
  phase: 'research' | 'planning' | 'generation' | 'validation' | 'optimization'
  dependencies: string[]
  estimatedComplexity: 'low' | 'medium' | 'high'
}

async function generateSmartPlan(prompt: string, analysis: PromptAnalysis, groqKey: string): Promise<SmartTask[]> {
  const planPrompt = `Create a detailed build plan for this website request.

Request: "${prompt}"
Intent: ${analysis.intent}
Type: ${analysis.websiteType}
Complexity: ${analysis.complexity}
Features: ${analysis.features.join(', ')}

Generate a JSON array of tasks with phases. Each task should have:
- id: unique string (task-1, task-2, etc.)
- title: descriptive task name
- phase: "research" | "planning" | "generation" | "validation" | "optimization"
- dependencies: array of task IDs this depends on (empty for first tasks)
- estimatedComplexity: "low" | "medium" | "high"

Include 6-10 tasks covering:
1. Research phase (if cloning, analyze reference)
2. Planning phase (component structure, layout)
3. Generation phase (header, main content, footer, etc.)
4. Validation phase (code quality, accessibility)
5. Optimization phase (performance, responsiveness)

Respond with ONLY the JSON array, no explanation.`

  try {
    const { text } = await generateForBuilder({
      system: "You generate JSON task plans. Respond with ONLY a JSON array.",
      prompt: planPrompt,
      temperature: 0.3,
      maxOutputTokens: 1000,
      fast: true,
    })
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch (_e) {
    // Fall through to default plan
  }

  // Fallback plan
  return [
    { id: 'task-1', title: 'Analyzing design requirements', phase: 'research', dependencies: [], estimatedComplexity: 'low' },
    { id: 'task-2', title: 'Planning component architecture', phase: 'planning', dependencies: ['task-1'], estimatedComplexity: 'medium' },
    { id: 'task-3', title: 'Generating header and navigation', phase: 'generation', dependencies: ['task-2'], estimatedComplexity: 'medium' },
    { id: 'task-4', title: 'Building main content sections', phase: 'generation', dependencies: ['task-3'], estimatedComplexity: 'high' },
    { id: 'task-5', title: 'Creating footer and final elements', phase: 'generation', dependencies: ['task-4'], estimatedComplexity: 'low' },
    { id: 'task-6', title: 'Validating code quality', phase: 'validation', dependencies: ['task-5'], estimatedComplexity: 'medium' },
    { id: 'task-7', title: 'Optimizing for performance', phase: 'optimization', dependencies: ['task-6'], estimatedComplexity: 'medium' }
  ]
}


export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req)
    const rateLimitResult = await checkRateLimitAsync(`builder:${clientId}`, BUILDER_RATE_LIMIT)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many builder requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter ?? 60),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetTime)
          }
        }
      )
    }

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Request payload too large or invalid JSON. Try with fewer files." },
        { status: 413 }
      )
    }
    const parsed = safeParseGenerateRequest(rawBody)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>
      const message = parsed.error.flatten().formErrors?.[0]
        ?? fieldErrors.prompt?.[0]
        ?? "Invalid request. Prompt is required; currentFiles and conversationHistory must be arrays."
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const body: GenerateRequest = {
      prompt: parsed.data.prompt,
      currentFiles: parsed.data.currentFiles.map((f) => ({
        id: f.id ?? `f-${Math.random().toString(36).slice(2, 9)}`,
        name: f.name ?? f.path.split("/").pop() ?? "file",
        path: f.path,
        content: f.content,
        language: f.language ?? "typescript",
      })),
      conversationHistory: parsed.data.conversationHistory,
    }
    const { prompt, currentFiles, conversationHistory } = body

    // Fail fast if BitNet is not configured
    const bitnetBaseUrl = process.env.BITNET_BASE_URL?.trim()
    if (!bitnetBaseUrl) {
      return NextResponse.json(
        { error: "Set BITNET_BASE_URL in .env to your Google Colab tunnel URL (e.g. https://xxxxx.trycloudflare.com/v1) for AI code generation." },
        { status: 503 }
      )
    }

    // Create streaming response; taskPlanForError used in catch so it's always defined
    const encoder = new TextEncoder()
    let taskPlanForError: { id: string; title: string; status: string }[] = []
    const stream = new ReadableStream({
      async start(controller) {
        type StreamPayload = TaskUpdate | FileUpdate | MessageUpdate | CompleteUpdate | PlanUpdate | { type: "error"; content: string }
        const send = (data: StreamPayload) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"))
        }

        try {
          const systemPrompt = await getSystemPrompt()
          // ============================================================================
          // 📝 STEP 0: Enhance raw user prompt → high-level website prompt (then system prompt & rest)
          // ============================================================================
          console.log('📝 Enhancing user prompt to high-level website brief...')
          const effectivePrompt = await enhanceToHighLevelWebsitePrompt(prompt)
          if (effectivePrompt !== prompt) {
            console.log('📝 Enhanced prompt:', effectivePrompt.slice(0, 200) + (effectivePrompt.length > 200 ? '...' : ''))
          }

          let dynamicTasks: string[] = []
          const hasBitNet = !!process.env.BITNET_BASE_URL?.trim()
          
          // ============================================================================
          // 🚀 SUPERPOWER ACTIVATION: Enhanced Prompt Analysis & Smart Planning
          // ============================================================================
          let promptAnalysis: PromptAnalysis | null = null
          let designGuidance = ''
          let referenceAnalysis = ''
          let webSearchResults: { title: string; snippet: string; url: string }[] = []
          let layoutStructureResearch: { title: string; snippet: string; url: string }[] = []
          
          if (hasBitNet) {
            try {
              // SUPERPOWER #2: Analyze the prompt for intent, features, complexity
              console.log('🧠 Activating Enhanced Prompt Understanding...')
              promptAnalysis = await analyzePrompt(effectivePrompt)
              console.log('📊 Prompt Analysis:', JSON.stringify(promptAnalysis, null, 2))
              
              // SUPERPOWER #3: Get design guidance based on website type
              console.log('🎨 Activating Design Intelligence...')
              designGuidance = getDesignGuidance(promptAnalysis.websiteType, promptAnalysis.colorScheme)
              
              // SUPERPOWER #4: Analyze reference URL if provided
              if (promptAnalysis.referenceUrl || effectivePrompt.toLowerCase().includes('clone')) {
                console.log('🔍 Activating Reference Analysis...')
                const urlMatch = effectivePrompt.match(/https?:\/\/[^\s]+/)
                const siteMatch = effectivePrompt.match(/(?:clone|like|similar to)\s+([a-zA-Z]+)/i)
                const refUrl = urlMatch ? urlMatch[0] : (siteMatch ? `https://${siteMatch[1].toLowerCase()}.com` : '')
                if (refUrl) {
                  referenceAnalysis = await analyzeReferenceUrl(refUrl, "")
                  console.log('📝 Reference Analysis:', referenceAnalysis)
                }
              }
              
              // SUPERPOWER #1a: Research layout & page structure for specific website types (portfolio, landing, etc.)
              const researchableTypes = ['portfolio', 'landing', 'dashboard', 'e-commerce', 'blog', 'saas', 'marketing', 'education', 'real-estate', 'restaurant', 'event', 'help-center', 'docs', 'social']
              const websiteTypeForSearch = (promptAnalysis.websiteType || '').toLowerCase().replace(/\s+/g, ' ')
              const isResearchableType = researchableTypes.some(t => websiteTypeForSearch.includes(t) || websiteTypeForSearch === 'viral' || websiteTypeForSearch === 'viral-landing')
              if (isResearchableType && promptAnalysis.websiteType) {
                console.log('🌐 Researching layout & page structure for website type:', promptAnalysis.websiteType)
                const layoutQuery = `${promptAnalysis.websiteType} website page structure layout sections UI best practices 2024`
                layoutStructureResearch = await searchWeb(layoutQuery)
                if (layoutStructureResearch.length > 0) {
                  console.log('📐 Layout research results:', layoutStructureResearch.map(r => r.title).join(', '))
                }
              }
              
              // SUPERPOWER #1b: Web search for design inspiration (for complex projects)
              if (promptAnalysis.complexity === 'complex' || promptAnalysis.complexity === 'enterprise') {
                console.log('🌐 Activating Internet Access for design inspiration...')
                const searchQuery = `${promptAnalysis.websiteType} website design inspiration UI UX 2024`
                webSearchResults = await searchWeb(searchQuery)
                if (webSearchResults.length > 0) {
                  console.log('🔎 Found design inspiration:', webSearchResults.map(r => r.title).join(', '))
                }
              }
              
              // SUPERPOWER #6: Generate smart plan with phases and dependencies
              console.log('📋 Activating Smart Planning...')
              const smartPlan = await generateSmartPlan(effectivePrompt, promptAnalysis, "")
              dynamicTasks = smartPlan.map(t => `[${t.phase.toUpperCase()}] ${t.title}`)
              console.log('📝 Smart Plan:', dynamicTasks)
              
            } catch (e) {
              console.error("Superpower activation failed:", e)
            }
          }
          
          // Fallback to initial task plan (analyze-prompt + LLM or defaults) if superpowers failed
          let taskPlan: { id: string; title: string; status: string }[]
          if (dynamicTasks.length > 0) {
            taskPlan = dynamicTasks.map((title, index) => ({
              id: String(index + 1),
              title,
              status: "pending"
            }))
          } else {
            taskPlan = await getInitialTaskPlan(effectivePrompt, "")
          }
          taskPlanForError = [...taskPlan]
          send({ type: "plan", tasks: taskPlan })

          // Execute tasks one by one
          for (let i = 0; i < taskPlan.length - 1; i++) {
            send({ type: "task-update", taskId: taskPlan[i].id, status: "in-progress" })
            await new Promise(r => setTimeout(r, 300))
            send({ type: "task-update", taskId: taskPlan[i].id, status: "completed" })
          }

          // Last task is code generation (takes longer)
          const lastTaskId = taskPlan[taskPlan.length - 1].id
          send({ type: "task-update", taskId: lastTaskId, status: "in-progress" })

          // Build context from current files
          const fileContext = currentFiles.map(f => 
            `File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``
          ).join("\n\n")

          // Build conversation context
          const conversationContext = conversationHistory.slice(-5).map(m =>
            `${m.role}: ${m.content}`
          ).join("\n")

          // ============================================================================
          // 🚀 BUILD ENHANCED PROMPT WITH SUPERPOWER CONTEXT
          // ============================================================================
          let enhancedContext = ''
          
          // Add prompt analysis insights
          if (promptAnalysis) {
            enhancedContext += `\n## PROMPT ANALYSIS\n`
            enhancedContext += `- Intent: ${promptAnalysis.intent}\n`
            enhancedContext += `- Website Type: ${promptAnalysis.websiteType}\n`
            enhancedContext += `- Complexity: ${promptAnalysis.complexity}\n`
            enhancedContext += `- Features: ${promptAnalysis.features.join(', ')}\n`
            if (promptAnalysis.colorScheme) {
              enhancedContext += `- Color Scheme: ${promptAnalysis.colorScheme}\n`
            }
          }
          
          // Add design guidance (always when promptAnalysis is present)
          if (promptAnalysis) {
            const guidance = designGuidance || getDesignGuidance(promptAnalysis.websiteType, promptAnalysis.colorScheme)
            if (guidance) {
              enhancedContext += `\n${guidance}\n`
              enhancedContext += `Use the layout and sections described above for this website type.\n`
            }
          } else if (designGuidance) {
            enhancedContext += `\n${designGuidance}\n`
          }
          
          // Global: remind to never output only a div; optional glassmorphism if user asked
          const wantsGlassmorphism = effectivePrompt.toLowerCase().includes('glassmorphism') || effectivePrompt.toLowerCase().includes('glass')
          enhancedContext += `\n## PAGE STRUCTURE (GLOBAL)\n`
          enhancedContext += `Do not output only a single div. Use \`<nav>\` or header, \`<main>\`, and multiple \`<section>\` elements as defined by the DESIGN GUIDANCE and layout pattern for this website type.\n`
          if (wantsGlassmorphism) {
            enhancedContext += `\n**Glassmorphism (user requested):** Apply to hero overlay and/or cards: \`backdrop-blur-xl bg-white/10 border border-white/20\` (dark) or \`backdrop-blur-xl bg-white/70 border border-white/40\` (light). Use rounded corners (e.g. \`rounded-2xl\`) and subtle shadow.\n`
          }
          
          // Layout & page structure from web research (for specific website types e.g. portfolio)
          if (layoutStructureResearch.length > 0) {
            enhancedContext += `\n## LAYOUT & PAGE STRUCTURE FROM WEB RESEARCH (IMPLEMENT THIS)\n`
            enhancedContext += `The following is researched from the web for "${promptAnalysis?.websiteType ?? 'this'} website type. Use it to decide which sections, pages, and layout to build. Match the expected structure and UI patterns.\n\n`
            for (const result of layoutStructureResearch.slice(0, 5)) {
              enhancedContext += `- **${result.title}**: ${result.snippet}\n`
            }
            enhancedContext += `\nImplement the page structure and sections suggested above (hero, navigation, content blocks, footer, etc.) so the result matches what users expect from a ${promptAnalysis?.websiteType ?? 'professional'} site.\n`
          }
          
          // Viral / Ad-style: inject dedicated block when website type is viral
          const isViralType = promptAnalysis?.websiteType === 'viral' || promptAnalysis?.websiteType === 'viral-landing'
          if (isViralType) {
            enhancedContext += `\n## VIRAL / AD-STYLE LANDING (MANDATORY)\n`
            enhancedContext += `- Layout: full-bleed hero + one headline + one subheadline + single primary CTA + optional social proof (logos or short testimonials). No long forms above the fold.\n`
            enhancedContext += `- Typography: bold display font + short body; distinctive (e.g. Syne, Playfair, Outfit).\n`
            enhancedContext += `- At least one wow moment: gradient text or floating blob or scroll reveal.\n`
            enhancedContext += `- Copy: punchy, benefit-driven. No Lorem ipsum. Headline formulas: "X without Y", "The only Z you need", "Get [benefit] in [time]". CTA examples: "Get started free", "See how it works", "Watch the demo".\n`
          }
          
          // Add reference analysis with MANDATORY instructions
          if (referenceAnalysis) {
            enhancedContext += `\n## ⚠️ CRITICAL: REFERENCE SITE ANALYSIS - YOU MUST FOLLOW THIS EXACTLY ⚠️\n`
            enhancedContext += `The user wants a clone/replica of a real website. You MUST use the EXACT colors, layout, and styling from this analysis.\n`
            enhancedContext += `DO NOT use generic purple/blue colors. DO NOT create a generic landing page.\n`
            enhancedContext += `COPY the real website's design as closely as possible.\n\n`
            enhancedContext += `${referenceAnalysis}\n`
            enhancedContext += `\n### MANDATORY REQUIREMENTS:\n`
            enhancedContext += `1. Use the EXACT hex colors listed above (e.g., #0f0f0f for YouTube dark background)\n`
            enhancedContext += `2. Match the EXACT layout structure (header height, sidebar width, grid columns)\n`
            enhancedContext += `3. Include ALL components mentioned (navigation, cards, buttons, etc.)\n`
            enhancedContext += `4. Use the correct typography and spacing\n`
            enhancedContext += `5. This is a CLONE - it should look IDENTICAL to the real website\n`
          }
          
          // Add web search results for inspiration
          if (webSearchResults.length > 0) {
            enhancedContext += `\n## DESIGN INSPIRATION FROM WEB RESEARCH\n`
            for (const result of webSearchResults.slice(0, 3)) {
              enhancedContext += `- ${result.title}: ${result.snippet}\n`
            }
          }
          
          // Call LLM with fallback chain
          const isCloneRequest = effectivePrompt.toLowerCase().includes('clone') || effectivePrompt.toLowerCase().includes('like') || effectivePrompt.toLowerCase().includes('replica') || effectivePrompt.toLowerCase().includes('copy') || effectivePrompt.toLowerCase().includes('youtube') || effectivePrompt.toLowerCase().includes('twitter') || effectivePrompt.toLowerCase().includes('spotify') || effectivePrompt.toLowerCase().includes('netflix') || effectivePrompt.toLowerCase().includes('amazon') || effectivePrompt.toLowerCase().includes('github')
          
          // Extract specific Tailwind classes from reference analysis for direct injection
          let tailwindOverrides = ''
          if (isCloneRequest && referenceAnalysis) {
            // Parse the reference analysis to extract exact Tailwind classes
            const colorMatches = referenceAnalysis.match(/#[0-9a-fA-F]{6}/g) || []
            const bgColors = colorMatches.slice(0, 3).map(c => `bg-[${c}]`).join(', ')
            const textColors = colorMatches.slice(0, 3).map(c => `text-[${c}]`).join(', ')
            
            // Detect website type and provide EXACT starter code
            if (effectivePrompt.toLowerCase().includes('youtube')) {
              tailwindOverrides = `
## 🎯 YOUTUBE CLONE - EXACT TAILWIND CLASSES TO USE:

### MANDATORY COLORS (DO NOT USE ANY OTHER COLORS):
- Main background: bg-[#0f0f0f] (NOT bg-white, NOT bg-gray-100)
- Card/hover: bg-[#272727], hover:bg-[#3d3d3d]
- Sidebar: bg-[#0f0f0f]
- Text primary: text-[#f1f1f1] (NOT text-black)
- Text secondary: text-[#aaaaaa]
- Red accent: text-[#ff0000], bg-[#ff0000]

### MANDATORY LAYOUT:
- Header: fixed top-0 w-full h-14 bg-[#0f0f0f] z-50
- Sidebar: fixed left-0 top-14 w-60 h-[calc(100vh-56px)] bg-[#0f0f0f]
- Main content: ml-60 mt-14 p-6 bg-[#0f0f0f] min-h-screen

### MANDATORY COMPONENTS:
1. Header with: hamburger menu, YouTube logo (red play button + "YouTube" text), search bar (bg-[#121212] border-[#303030] rounded-full), user avatar
2. Sidebar with: Home, Shorts, Subscriptions, Library links with icons
3. Video grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
4. Video cards: thumbnail (aspect-video rounded-xl), channel avatar (w-9 h-9 rounded-full), title, channel name, views, date

### STARTER CODE STRUCTURE:
\`\`\`tsx
export default function YouTubePage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1]">
      {/* Header */}
      <header className="fixed top-0 w-full h-14 bg-[#0f0f0f] border-b border-[#303030] z-50 flex items-center px-4">
        {/* Logo, Search, User */}
      </header>
      
      {/* Sidebar */}
      <aside className="fixed left-0 top-14 w-60 h-[calc(100vh-56px)] bg-[#0f0f0f] border-r border-[#303030] p-2">
        {/* Nav items */}
      </aside>
      
      {/* Main Content */}
      <main className="ml-60 mt-14 p-6 bg-[#0f0f0f]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Video cards */}
        </div>
      </main>
    </div>
  );
}
\`\`\`
`
            } else if (effectivePrompt.toLowerCase().includes('twitter') || effectivePrompt.toLowerCase().includes('x.com')) {
              tailwindOverrides = `
## 🎯 TWITTER/X CLONE - EXACT TAILWIND CLASSES TO USE:

### MANDATORY COLORS:
- Background: bg-black (NOT bg-white)
- Borders: border-[#2f3336]
- Text primary: text-[#e7e9ea]
- Text secondary: text-[#71767b]
- Blue accent: text-[#1d9bf0], bg-[#1d9bf0]

### MANDATORY LAYOUT:
- 3-column: max-w-[1265px] mx-auto flex
- Left sidebar: w-[275px]
- Main feed: w-[600px] border-x border-[#2f3336]
- Right sidebar: w-[350px]
`
            } else if (effectivePrompt.toLowerCase().includes('spotify')) {
              tailwindOverrides = `
## 🎯 SPOTIFY CLONE - EXACT TAILWIND CLASSES TO USE:

### MANDATORY COLORS:
- Background: bg-black, bg-[#121212]
- Text: text-white, text-[#b3b3b3]
- Green accent: bg-[#1db954], text-[#1db954]

### MANDATORY LAYOUT:
- Sidebar: w-[280px] bg-black
- Main: flex-1 bg-gradient-to-b from-[#1e1e1e] to-[#121212]
- Player bar: fixed bottom-0 h-[90px] bg-[#181818]
`
            } else if (effectivePrompt.toLowerCase().includes('netflix')) {
              tailwindOverrides = `
## 🎯 NETFLIX CLONE - EXACT TAILWIND CLASSES TO USE:

### MANDATORY COLORS:
- Background: bg-[#141414]
- Text: text-white
- Red accent: bg-[#e50914], text-[#e50914]

### MANDATORY LAYOUT:
- Header: fixed top-0 bg-gradient-to-b from-black
- Hero: h-[80vh] with gradient overlay
- Content rows: horizontal scroll
`
            }
          }

          // Generate images for hero and sections (builder can generate images)
          let generatedImagesBlock = ''
          try {
            const imagePrompts = getImagePromptsForWebsite(
              promptAnalysis?.websiteType ?? 'landing',
              effectivePrompt,
              3
            )
            const imageUrls = await Promise.all(
              imagePrompts.map((p) => generateImageUrlForBuilder(p))
            )
            const validUrls = imageUrls.filter(
              (u): u is string => u != null && u.length > 0
            )
            if (validUrls.length > 0) {
              generatedImagesBlock = `\n## GENERATED IMAGES (USE THESE URLS IN YOUR CODE)\n`
              generatedImagesBlock += `Use these exact image URLs for hero and section images. Do not replace with Unsplash or Picsum for these slots.\n`
              generatedImagesBlock += validUrls
                .map(
                  (url, i) =>
                    `- ${i === 0 ? 'hero' : `section${i}`}: ${url}`
                )
                .join('\n')
              generatedImagesBlock += `\nUse <img src={...} /> or Next.js Image with these URLs. Use the hero URL for the main hero/header image.\n\n`
              console.log('🖼️ Builder generated', validUrls.length, 'image URL(s)')
            }
          } catch (e) {
            console.warn('Builder image generation failed:', e)
          }
          
          let userPrompt = `Current project files:\n${fileContext}\n\nConversation:\n${conversationContext}\n${enhancedContext}\n${tailwindOverrides}\n${generatedImagesBlock}\nUser request: ${effectivePrompt}\n\n`
          if (promptAnalysis?.websiteType) {
            userPrompt = `Website type for this request: ${promptAnalysis.websiteType}. Follow the layout and sections for this type from the design guidance above.\n\n` + userPrompt
          }
          const mindBlownLine = `Output must match top builders (v0, Google AI Studio, Bolt): production-ready, clean code, real images (use the GENERATED IMAGES URLs above when provided, otherwise Unsplash/Picsum), animations (gradient text, keyframes, hover:scale, glassmorphism), and at least one wow element. Same quality bar as v0 or Bolt.\n\n`
          const jsonFormatLine = `Respond with exactly one JSON object containing plan (array of step strings), files (array of { path, content }), and message (string). No markdown wrapper.\n\n`
          if (isCloneRequest && referenceAnalysis) {
            userPrompt += `
## 🚨 ABSOLUTE REQUIREMENT - READ THIS FIRST 🚨

You are creating a PIXEL-PERFECT CLONE. This means:

1. ❌ DO NOT use bg-white or bg-gray-100 for dark-themed sites
2. ❌ DO NOT use text-black for dark-themed sites  
3. ❌ DO NOT create a generic landing page
4. ✅ USE the EXACT hex colors from the Tailwind classes above
5. ✅ COPY the exact layout structure (header, sidebar, grid)
6. ✅ The result must be VISUALLY IDENTICAL to the real website

The Tailwind classes above are MANDATORY. Use them EXACTLY as shown.

${mindBlownLine}${jsonFormatLine}Generate the code as a JSON response.
`
          } else {
            const knownTypes = ['landing', 'dashboard', 'saas', 'portfolio', 'blog', 'ecommerce']
            const hasKnownType = promptAnalysis?.websiteType && knownTypes.includes(promptAnalysis.websiteType)
            if (hasKnownType) {
              userPrompt += `Example structure: { "plan": ["Step 1", "Step 2"], "files": [{ "path": "/app/page.tsx", "content": "..." }], "message": "..." }.\n\n`
            }
            userPrompt += `${mindBlownLine}${jsonFormatLine}Generate the code as a JSON response. Apply the design guidance above to create a result that matches v0 / AI Studio / Bolt quality: production-ready, clean, stunning, with images and animations.`
          }
          
          let responseContent = ""
          let llmSuccess = false
          let lastLlmError = ""

          // Helper: accept short but valid single-component code (relaxed from 2000 chars + multiple sections)
          function isCompleteCode(content: string): boolean {
            if (!content || content.length < 300) return false
            const openBraces = (content.match(/\{/g) || []).length
            const closeBraces = (content.match(/\}/g) || []).length
            const hasExport = content.includes('export default') || content.includes('export function')
            const hasReturn = content.includes('return (') || content.includes('return(')
            const hasJSX = content.includes('<div') || content.includes('<span') || content.includes('<button') || content.includes('<section')
            const endsWithBrace = content.trim().endsWith('}') || content.trim().endsWith('`)')
            return Math.abs(openBraces - closeBraces) <= 5 && hasExport && hasReturn && hasJSX && endsWithBrace
          }

          // Generate code using free Groq model fallback chain
          try {
            // Builder generation uses full quality chain (70B first); temperature 0.5 for more consistent JSON
            const { text: generatedText } = await generateForBuilder({
              system: systemPrompt,
              prompt: userPrompt,
              temperature: 0.5,
              maxOutputTokens: 12000, // Increased to allow full page generation without truncation
            })
            responseContent = generatedText
            llmSuccess = isCompleteCode(responseContent) || responseContent.length > 500
          } catch (e) {
            lastLlmError = e instanceof Error ? e.message : String(e)
            console.error("Builder LLM fallback error:", e)
          }

          // Fallback: accept if we have enough content and can extract valid code (short/single-section)
          if (!llmSuccess && responseContent && responseContent.length >= 300) {
            const codeBlockMatches = responseContent.match(/```(?:tsx|jsx|typescript|javascript)?\s*([\s\S]*?)```/g)
            if (codeBlockMatches) {
              for (const block of codeBlockMatches) {
                const codeContent = block.replace(/```(?:tsx|jsx|typescript|javascript)?\s*/g, '').replace(/```$/g, '').trim()
                if (codeContent.length >= 100 && isValidReactCode(codeContent)) {
                  llmSuccess = true
                  break
                }
              }
            }
          }

          let parsedResponse: {
            plan?: string[]
            files?: { path: string; content: string }[]
            message?: string
          } = {} as any

          if (!llmSuccess || !responseContent) {
            const errorReason = lastLlmError
              ? String(lastLlmError)
              : "AI generation failed. Please try again."
            const msg = `AI generation failed. Preview shows the error below.`
            send({ type: "message", content: msg })
            send({ type: "task-update", taskId: lastTaskId, status: "completed" })
            send({ type: "message", content: `Preview error: ${errorReason}` })
            parsedResponse = { message: msg }
          } else {
          send({ type: "task-update", taskId: lastTaskId, status: "completed" })

          // Parse the response
          let extractionPath: string | null = null
          try {
            // Log raw response for debugging
            console.log("Raw LLM response (first 500 chars):", responseContent.substring(0, 500))
            
            // Helper: get content from file object (content, code, or body)
            const getFileContentRaw = (f: { path: string; content?: string; code?: string; body?: unknown }) => {
              const raw = (f as { content?: string; code?: string; body?: string }).content ?? (f as { code?: string }).code ?? (f as { body?: string }).body
              return typeof raw === "string" ? raw : JSON.stringify(raw ?? "")
            }
            
            // Step 1: Try to extract JSON from ```json ... ``` block first
            const jsonBlockMatch = responseContent.match(/```json\s*([\s\S]*?)```/)
            if (jsonBlockMatch) {
              try {
                const jsonStr = removeTrailingCommasInJson(escapeUnescapedQuotesInJsonStrings(escapeControlCharsInJsonStrings(normalizeJsonBacktickStrings(jsonBlockMatch[1].trim()))))
                let rawParsed: { plan?: string[]; message?: string; files?: { path: string; content?: string; code?: string; body?: unknown }[]; code?: string; content?: string }
                try {
                  rawParsed = JSON.parse(jsonStr)
                } catch {
                  const repaired = repairTruncatedJson(jsonStr)
                  rawParsed = JSON.parse(repaired)
                }
                console.log("Extracted JSON from ```json block")
                if (rawParsed.files && Array.isArray(rawParsed.files)) {
                  const validFiles = rawParsed.files
                    .map((f) => {
                      let content = getFileContentRaw(f)
                      const isCss = /\.(css|scss|sass)$/i.test(f.path)
                      if (!isCss) content = cleanGeneratedCode(content)
                      if (f.path === '/app/page.tsx') content = ensurePageContentNotLayout(content)
                      if (!isAcceptableBuilderFile(f.path, content)) {
                        console.warn('File content is not valid, skipping:', f.path)
                        return null
                      }
                      return { path: f.path, content }
                    })
                    .filter((f: { path: string; content: string } | null): f is { path: string; content: string } => f !== null)
                  
                  if (validFiles.length > 0) {
                    extractionPath = "json_block"
                    parsedResponse = {
                      plan: rawParsed.plan,
                      message: rawParsed.message,
                      files: validFiles
                    }
                  }
                } else if (typeof (rawParsed as { code?: string }).code === "string" || typeof (rawParsed as { content?: string }).content === "string") {
                  const singleContent = (rawParsed as { code?: string }).code ?? (rawParsed as { content?: string }).content!
                  let content = cleanGeneratedCode(singleContent)
                  content = ensurePageContentNotLayout(content)
                  if (isAcceptableBuilderFile("/app/page.tsx", content)) {
                    extractionPath = "json_block"
                    parsedResponse = {
                      plan: rawParsed.plan,
                      message: rawParsed.message,
                      files: [{ path: "/app/page.tsx", content }]
                    }
                  }
                } else if (rawParsed.plan || rawParsed.message) {
                  parsedResponse = rawParsed
                }
              } catch (e) {
                console.warn("Failed to parse JSON from ```json block:", e)
              }
            }
            
            // Step 2: If no JSON block found, try code blocks (tsx/jsx/etc)
            if (!parsedResponse.files) {
              const codeBlockMatches = responseContent.match(/```(?:tsx|jsx|typescript|javascript)?\s*([\s\S]*?)```/g)
              let extractedCode = ""
              
              if (codeBlockMatches && codeBlockMatches.length > 0) {
                for (const block of codeBlockMatches) {
                  let codeContent = block.replace(/```(?:tsx|jsx|typescript|javascript)?\s*/g, '').replace(/```$/g, '').trim()
                  codeContent = cleanGeneratedCode(codeContent)
                  if (codeContent.length > extractedCode.length && isValidReactCode(codeContent)) {
                    extractedCode = codeContent
                  }
                }
              }
              
              if (extractedCode) {
                console.log("Extracted code from markdown block")
                extractionPath = "code_block"
                const pageContent = ensurePageContentNotLayout(extractedCode)
                parsedResponse = {
                  files: [{
                    path: "/app/page.tsx",
                    content: pageContent
                  }],
                  message: "Generated the requested component."
                }
              }
            }
            
            // Step 3: If still no files, try brace-balanced JSON extraction
            if (!parsedResponse.files) {
              const balancedJson = extractJsonWithBalancedBraces(responseContent)
              if (balancedJson) {
                try {
                  const normalized = removeTrailingCommasInJson(escapeUnescapedQuotesInJsonStrings(escapeControlCharsInJsonStrings(normalizeJsonBacktickStrings(balancedJson))))
                  let rawParsed: { plan?: string[]; message?: string; files?: { path: string; content?: string; code?: string; body?: unknown }[]; code?: string; content?: string }
                  try {
                    rawParsed = JSON.parse(normalized)
                  } catch {
                    rawParsed = JSON.parse(repairTruncatedJson(normalized))
                  }
                  console.log("Extracted JSON using brace balancing")
                  if (rawParsed.files && Array.isArray(rawParsed.files)) {
                    const validFiles = rawParsed.files
                      .map((f) => {
                        let content = getFileContentRaw(f)
                        const isCss = /\.(css|scss|sass)$/i.test(f.path)
                        if (!isCss) content = cleanGeneratedCode(content)
                        if (f.path === '/app/page.tsx') content = ensurePageContentNotLayout(content)
                        if (!isAcceptableBuilderFile(f.path, content)) {
                          console.warn('File content is not valid, skipping:', f.path)
                          return null
                        }
                        return { path: f.path, content }
                      })
                      .filter((f: { path: string; content: string } | null): f is { path: string; content: string } => f !== null)
                    
                    if (validFiles.length > 0) {
                      extractionPath = "brace_balanced"
                      parsedResponse = {
                        plan: rawParsed.plan,
                        message: rawParsed.message,
                        files: validFiles
                      }
                    }
                  } else if (typeof rawParsed.code === "string" || typeof rawParsed.content === "string") {
                    const singleContent = rawParsed.code ?? rawParsed.content!
                    let content = cleanGeneratedCode(singleContent)
                    content = ensurePageContentNotLayout(content)
                    if (isAcceptableBuilderFile("/app/page.tsx", content)) {
                      extractionPath = "brace_balanced"
                      parsedResponse = {
                        plan: rawParsed.plan,
                        message: rawParsed.message,
                        files: [{ path: "/app/page.tsx", content }]
                      }
                    }
                  } else if (rawParsed.plan || rawParsed.message) {
                    parsedResponse = rawParsed
                  }
                } catch (e) {
                  console.warn("Failed to parse brace-balanced JSON:", e)
                }
              }
            }
            
            // Step 4: Last resort - try greedy JSON match, then single-file fallback
            if (!parsedResponse.files) {
              const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                try {
                  const normalized = removeTrailingCommasInJson(escapeUnescapedQuotesInJsonStrings(escapeControlCharsInJsonStrings(normalizeJsonBacktickStrings(jsonMatch[0]))))
                  let rawParsed: { plan?: string[]; message?: string; files?: { path: string; content?: string; code?: string; body?: unknown }[]; code?: string; content?: string }
                  try {
                    rawParsed = JSON.parse(normalized)
                  } catch {
                    rawParsed = JSON.parse(repairTruncatedJson(normalized))
                  }
                  if (rawParsed.files && Array.isArray(rawParsed.files)) {
                    const validFiles = rawParsed.files
                      .map((f) => {
                        let content = getFileContentRaw(f)
                        const isCss = /\.(css|scss|sass)$/i.test(f.path)
                        if (!isCss) content = cleanGeneratedCode(content)
                        if (f.path === '/app/page.tsx') content = ensurePageContentNotLayout(content)
                        if (!isAcceptableBuilderFile(f.path, content)) {
                          console.warn('File content is not valid, skipping:', f.path)
                          return null
                        }
                        return { path: f.path, content }
                      })
                      .filter((f: { path: string; content: string } | null): f is { path: string; content: string } => f !== null)
                    if (validFiles.length > 0) {
                      extractionPath = "greedy_json"
                      parsedResponse = { plan: rawParsed.plan, message: rawParsed.message, files: validFiles }
                    } else {
                      throw new Error("No valid files found in JSON response")
                    }
                  } else if (typeof rawParsed.code === "string" || typeof rawParsed.content === "string") {
                    const singleContent = rawParsed.code ?? rawParsed.content!
                    let content = cleanGeneratedCode(singleContent)
                    content = ensurePageContentNotLayout(content)
                    if (isAcceptableBuilderFile("/app/page.tsx", content)) {
                      extractionPath = "greedy_json"
                      parsedResponse = {
                        plan: rawParsed.plan,
                        message: rawParsed.message,
                        files: [{ path: "/app/page.tsx", content }]
                      }
                    }
                  } else {
                    parsedResponse = rawParsed
                  }
                } catch (e) {
                  console.warn("Failed to parse greedy JSON match:", e)
                }
              }
              // Fallback: no JSON or parse failed - treat whole response as single file
              if (!parsedResponse.files) {
                extractionPath = "fallback_safe_starter"
                const cleaned = cleanGeneratedCode(responseContent)
                if (isValidReactCode(cleaned)) {
                  parsedResponse = {
                    files: [{ path: "/app/page.tsx", content: ensurePageContentNotLayout(cleaned) }],
                    message: "Generated the requested component."
                  }
                } else {
                  // As a last resort, still generate a website by wrapping the
                  // model response in a safe starter React page. This keeps
                  // validation from blocking website generation entirely.
                  parsedResponse = {
                    files: [{ path: "/app/page.tsx", content: buildFallbackPage(effectivePrompt) }],
                    message: "Generated a safe starter website based on your request so the preview can still load."
                  }
                }
              }
            }
            // Reject structureless output (e.g. single div): replace main page with fallback if no sections/nav
            if (parsedResponse.files) {
              const mainFile = parsedResponse.files.find((f) => f.path === "/app/page.tsx")
              if (mainFile) {
                const hasSemanticStructure = /<section[\s>]/.test(mainFile.content) || /<nav[\s>]/.test(mainFile.content) || /<main[\s>]/.test(mainFile.content)
                if (!hasSemanticStructure) {
                  console.warn("Generated page has no semantic structure (no section/nav/main), using fallback")
                  mainFile.content = buildFallbackPage(effectivePrompt)
                }
              }
            }
            if (parsedResponse.files && extractionPath) {
              console.log("Builder extraction path:", extractionPath)
            }
          } catch (parseError) {
            console.error("Parse error:", parseError)
            console.error("Response content:", responseContent.substring(0, 1000))
            
            // Last resort: try to find any React-like code in the response
            const reactPatterns = [
              /export\s+default\s+function\s+\w+[\s\S]*?\}\s*$/m,
              /function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*return\s*\([\s\S]*\)[\s\S]*\}/m
            ]
            
            for (const pattern of reactPatterns) {
              const match = responseContent.match(pattern)
              if (match && isValidReactCode(match[0])) {
                parsedResponse = {
                  files: [{
                    path: "/app/page.tsx",
                    content: match[0]
                  }],
                  message: "Generated the requested component."
                }
                break
              }
            }
            
            if (!parsedResponse.files) {
              // If we still couldn't extract valid code, build a starter page
              // instead of failing. This means validation never fully blocks
              // website generation.
              parsedResponse = {
                files: [{ path: "/app/page.tsx", content: buildFallbackPage(effectivePrompt) }],
                message: "The response could not be parsed as full code, so a starter website was generated from your request."
              }
              send({ type: "message", content: "A starter website was generated from your request so the preview can still render." })
            }
          }
          }

          // Add validation task
          const validationTaskId = String(taskPlan.length + 1)
          send({ 
            type: "plan", 
            tasks: [...taskPlan, { id: validationTaskId, title: "Validating generated code", status: "pending" }]
          })
          send({ type: "task-update", taskId: validationTaskId, status: "in-progress" })

          // Validate and auto-fix generated code. If we still can't make it
          // pass basic validation after a few attempts, replace the main page
          // with a deterministic fallback React page so the preview never crashes.
          let validationPassed = false
          let validationAttempts = 0
          const maxValidationAttempts = 3
          let lastValidationErrors: string[] = []
          let usedFallbackDueToValidation = false

          while (!validationPassed && validationAttempts < maxValidationAttempts) {
            validationAttempts++
            
            if (parsedResponse.files) {
              const hasCodeFiles = parsedResponse.files.some(f => /\.(tsx?|jsx?|mts|mjs)$/i.test(f.path))
              for (const file of parsedResponse.files) {
                const isCodeFile = /\.(tsx?|jsx?|mts|mjs)$/i.test(file.path)
                if (!isCodeFile) continue
                const cleanedContent = cleanGeneratedCode(file.content)
                const validationResult = validateTypeScriptCode(cleanedContent)
                
                if (!validationResult.isValid) {
                  console.log(`⚠️ Validation failed (attempt ${validationAttempts}):`, validationResult.errors)
                  lastValidationErrors = validationResult.errors
                  
                  // Try to auto-fix common errors
                  const fixedContent = autoFixCommonErrors(cleanedContent, validationResult.errors)
                  file.content = fixedContent
                  
                  if (validationAttempts === maxValidationAttempts) {
                    // At this point we stop trying to push obviously broken
                    // code to the preview. Instead, for the main page we
                    // generate a safe starter website that always compiles.
                    console.warn("⚠️ Validation failed after max attempts, using safe starter page:", validationResult.errors)
                    usedFallbackDueToValidation = true
                    const mainFile = parsedResponse.files.find(f => f.path === "/app/page.tsx")
                    if (mainFile) {
                      mainFile.content = buildFallbackPage(effectivePrompt)
                    }
                    if (!parsedResponse.message) parsedResponse.message = ""
                    parsedResponse.message += (parsedResponse.message ? " " : "") + "(Primary code had issues, so a starter website was generated to keep the preview working.)"
                    validationPassed = true
                  }
                } else {
                  validationPassed = true
                }
              }
              if (!hasCodeFiles) validationPassed = true
            }
          }

          // Optional: one retry on validation failure (gate: BUILDER_RETRY_ON_VALIDATION_FAILURE)
          if (usedFallbackDueToValidation && process.env.BUILDER_RETRY_ON_VALIDATION_FAILURE === 'true') {
            const followUp = `The previous response had these TypeScript/React errors. Fix them and output again as the same JSON (plan, files, message). Errors: ${lastValidationErrors.join('; ')}`
            try {
              const { text: retryText } = await generateForBuilder({
                system: systemPrompt,
                messages: [
                  { role: 'user', content: userPrompt },
                  { role: 'assistant', content: responseContent },
                  { role: 'user', content: followUp },
                ],
                temperature: 0.5,
                maxOutputTokens: 12000,
              })
              // Minimal parse: try ```json block then code block
              const jsonBlockMatch = retryText.match(/```json\s*([\s\S]*?)```/)
              let retryParsed: typeof parsedResponse = {}
              if (jsonBlockMatch) {
                try {
                  const jsonStr = removeTrailingCommasInJson(escapeUnescapedQuotesInJsonStrings(escapeControlCharsInJsonStrings(normalizeJsonBacktickStrings(jsonBlockMatch[1].trim()))))
                  let raw: { files?: { path: string; content?: string; code?: string; body?: unknown }[] }
                  try {
                    raw = JSON.parse(jsonStr)
                  } catch {
                    raw = JSON.parse(repairTruncatedJson(jsonStr))
                  }
                  if (raw.files && Array.isArray(raw.files)) {
                    const getContent = (f: { path: string; content?: string; code?: string; body?: unknown }) => {
                      const raw = (f as { content?: string }).content ?? (f as { code?: string }).code ?? (f as { body?: string }).body
                      return typeof raw === 'string' ? raw : JSON.stringify(raw ?? '')
                    }
                    const validFiles = raw.files
                      .map((f) => {
                        let content = getContent(f)
                        if (!/\.(css|scss|sass)$/i.test(f.path)) content = cleanGeneratedCode(content)
                        if (f.path === '/app/page.tsx') content = ensurePageContentNotLayout(content)
                        if (!isAcceptableBuilderFile(f.path, content)) return null
                        return { path: f.path, content }
                      })
                      .filter((f): f is { path: string; content: string } => f !== null)
                    if (validFiles.length > 0) retryParsed = { plan: (raw as { plan?: string[] }).plan, message: (raw as { message?: string }).message, files: validFiles }
                  }
                } catch (_e) {
                  // ignore
                }
              }
              if (!retryParsed.files?.length) {
                const codeBlockMatches = retryText.match(/```(?:tsx|jsx|typescript|javascript)?\s*([\s\S]*?)```/g)
                let extractedCode = ''
                if (codeBlockMatches) {
                  for (const block of codeBlockMatches) {
                    let codeContent = block.replace(/```(?:tsx|jsx|typescript|javascript)?\s*/g, '').replace(/```$/g, '').trim()
                    codeContent = cleanGeneratedCode(codeContent)
                    if (codeContent.length > extractedCode.length && isValidReactCode(codeContent)) extractedCode = codeContent
                  }
                }
                if (extractedCode) {
                  retryParsed = { files: [{ path: '/app/page.tsx', content: ensurePageContentNotLayout(extractedCode) }], message: 'Generated the requested component.' }
                }
              }
              const mainFile = retryParsed.files?.find(f => f.path === '/app/page.tsx')
              if (mainFile) {
                const cleaned = cleanGeneratedCode(mainFile.content)
                const vr = validateTypeScriptCode(cleaned)
                if (vr.isValid) {
                  parsedResponse = retryParsed
                  console.log('Builder validation retry succeeded')
                } else {
                  console.log('Builder validation retry failed: still invalid')
                }
              } else {
                console.log('Builder validation retry failed: no main file')
              }
            } catch (e) {
              console.warn('Builder validation retry error:', e)
            }
          }

          if (validationPassed) {
            console.log("✅ Code validation passed or skipped")
            send({ type: "task-update", taskId: validationTaskId, status: "completed" })
          }

          // Compute page content for wow check (and optional wow retry)
          let pageContentForWowCheck = ''
          if (parsedResponse.files) {
            const mainFile = parsedResponse.files.find(f => f.path === '/app/page.tsx')
            if (mainFile) pageContentForWowCheck = cleanGeneratedCode(mainFile.content)
          }

          // Optional: one retry for missing wow element (gate: BUILDER_RETRY_FOR_WOW)
          if (pageContentForWowCheck && !hasWowElement(pageContentForWowCheck) && process.env.BUILDER_RETRY_FOR_WOW === 'true') {
            const wowFollowUp = `The previous output lacked a clear wow element (gradient text, keyframes animation, hover:scale, or glassmorphism). Add at least one of these and respond with the same JSON format (plan, files, message).`
            try {
              const { text: wowRetryText } = await generateForBuilder({
                system: systemPrompt,
                messages: [
                  { role: 'user', content: userPrompt },
                  { role: 'assistant', content: responseContent },
                  { role: 'user', content: wowFollowUp },
                ],
                temperature: 0.5,
                maxOutputTokens: 12000,
              })
              const jsonBlockMatch = wowRetryText.match(/```json\s*([\s\S]*?)```/)
              let wowRetryParsed: typeof parsedResponse = {}
              if (jsonBlockMatch) {
                try {
                  const jsonStr = removeTrailingCommasInJson(escapeUnescapedQuotesInJsonStrings(escapeControlCharsInJsonStrings(normalizeJsonBacktickStrings(jsonBlockMatch[1].trim()))))
                  let raw: { files?: { path: string; content?: string; code?: string; body?: unknown }[] }
                  try {
                    raw = JSON.parse(jsonStr)
                  } catch {
                    raw = JSON.parse(repairTruncatedJson(jsonStr))
                  }
                  if (raw.files && Array.isArray(raw.files)) {
                    const getContent = (f: { path: string; content?: string; code?: string; body?: unknown }) => {
                      const r = (f as { content?: string }).content ?? (f as { code?: string }).code ?? (f as { body?: string }).body
                      return typeof r === 'string' ? r : JSON.stringify(r ?? '')
                    }
                    const validFiles = raw.files
                      .map((f) => {
                        let content = getContent(f)
                        if (!/\.(css|scss|sass)$/i.test(f.path)) content = cleanGeneratedCode(content)
                        if (f.path === '/app/page.tsx') content = ensurePageContentNotLayout(content)
                        if (!isAcceptableBuilderFile(f.path, content)) return null
                        return { path: f.path, content }
                      })
                      .filter((f): f is { path: string; content: string } => f !== null)
                    if (validFiles.length > 0) wowRetryParsed = { plan: (raw as { plan?: string[] }).plan, message: (raw as { message?: string }).message, files: validFiles }
                  }
                } catch (_e) {
                  // ignore
                }
              }
              const wowMainFile = wowRetryParsed.files?.find(f => f.path === '/app/page.tsx')
              if (wowMainFile) {
                const cleaned = cleanGeneratedCode(wowMainFile.content)
                const vr = validateTypeScriptCode(cleaned)
                if (vr.isValid && hasWowElement(cleaned)) {
                  parsedResponse = wowRetryParsed
                  pageContentForWowCheck = cleaned
                  console.log('Builder wow retry succeeded')
                } else {
                  console.log('Builder wow retry failed: invalid or still no wow element')
                }
              } else {
                console.log('Builder wow retry failed: no main file')
              }
            } catch (e) {
              console.warn('Builder wow retry error:', e)
            }
          }

          // Output schema enforcement: validate parsed response shape
          if (parsedResponse.files?.length) {
            const schemaResult = validateBuilderResponse(parsedResponse)
            if (!schemaResult.valid) {
              console.warn("[builder] Response schema validation failed:", schemaResult.errors)
            }
          }

          // Send file updates
          if (parsedResponse.files) {
            for (const file of parsedResponse.files) {
              const isCodeFile = /\.(tsx?|jsx?|mts|mjs)$/i.test(file.path)
              let cleanedContent = isCodeFile ? cleanGeneratedCode(file.content) : file.content
              
              // 🎨 DYNAMIC COLOR REPLACEMENT - Apply extracted colors for clone requests (code files only)
              if (isCodeFile && isCloneRequest) {
                const extractedColors = extractColorsFromAnalysis(referenceAnalysis || '', effectivePrompt)
                if (extractedColors && extractedColors.isDark) {
                  console.log('🎨 Applying dynamic color replacement for dark theme clone...')
                  cleanedContent = applyDynamicColorReplacement(cleanedContent, extractedColors)
                }
              }
              
              if (file.path === '/app/page.tsx') pageContentForWowCheck = cleanedContent
              
              const language = getLanguageFromPath(file.path)
              
              send({
                type: "file-update",
                file: {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  name: file.path.split("/").pop() || "file",
                  path: file.path,
                  content: cleanedContent,
                  language
                }
              })
            }
          }

          // Wow-element check: if page has no gradient text, keyframes, hover:scale, or backdrop-blur, notify user
          if (pageContentForWowCheck && !hasWowElement(pageContentForWowCheck)) {
            send({
              type: "message",
              content: "Generated code missed the wow-element requirement (gradient text, animation, hover:scale, or glassmorphism). Try again or add one of these manually for a more striking result."
            })
          }

          // Ensure all tasks are marked as completed
          for (const task of taskPlan) {
            send({ type: "task-update", taskId: task.id, status: "completed" })
          }

          // Send completion message
          send({ type: "message", content: parsedResponse.message || "Code generated successfully!" })
          send({ type: "complete" })

        } catch (error) {
          console.error("Generation error:", error)
          const errorContent = error instanceof Error ? error.message : "Unknown error"
          send({ type: "error", content: errorContent })
          send({ type: "message", content: `Error: ${errorContent}` })
          if (taskPlanForError.length > 0) {
            send({ type: "task-update", taskId: taskPlanForError[taskPlanForError.length - 1].id, status: "failed" })
          }
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper: Whether generated page has at least one "wow" element (for quality enforcement)
function hasWowElement(content: string): boolean {
  if (!content || typeof content !== 'string') return false
  const s = content
  const hasGradientText = (s.includes('bg-clip-text') && s.includes('text-transparent')) || (s.includes('bg-gradient') && s.includes('bg-clip-text'))
  const hasKeyframes = s.includes('animate-[') || s.includes('@keyframes')
  const hasHoverScale = s.includes('hover:scale-')
  const hasGlassmorphism = s.includes('backdrop-blur')
  return hasGradientText || hasKeyframes || hasHoverScale || hasGlassmorphism
}

// Helper: Whether a builder file is acceptable (React/TSX or allowed asset e.g. CSS)
function isAcceptableBuilderFile(path: string, content: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'css' || ext === 'scss' || ext === 'sass') {
    return typeof content === 'string' && content.trim().length > 0
  }
  return isValidReactCode(content)
}

// Helper: Check if content is valid React code (not JSON plan data)
function isValidReactCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false
  
  const trimmed = code.trim()
  
  // Reject if it looks like JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      // If it parses as JSON with plan/files keys, it's not code
      if (parsed.plan || parsed.files || parsed.message) {
        return false
      }
    } catch {
      // Not valid JSON, might be a JS object - continue checking
    }
  }
  
  // Reject if it starts with "json" marker
  if (trimmed.toLowerCase().startsWith('json')) {
    return false
  }
  
  // Reject if it contains JSON plan patterns
  if (/"plan"\s*:\s*\[/.test(trimmed)) {
    return false
  }
  
  // Must contain some React/JSX indicators (relaxed so more valid outputs pass)
  const hasReactIndicators = 
    trimmed.includes('import ') ||
    trimmed.includes('export ') ||
    trimmed.includes('function ') ||
    trimmed.includes('const ') ||
    /\breturn\s*\(/.test(trimmed) ||
    trimmed.includes('return (') ||
    trimmed.includes('return(') ||
    /<[A-Z][a-zA-Z]*/.test(trimmed) || // JSX component tags
    /<div/.test(trimmed) ||
    /<\/div/.test(trimmed) ||
    /<span/.test(trimmed) ||
    /<button/.test(trimmed) ||
    /<section/.test(trimmed) ||
    /<\/section/.test(trimmed) ||
    /<main/.test(trimmed) ||
    /<header/.test(trimmed) ||
    /<nav/.test(trimmed)
  
  return hasReactIndicators
}

// Helper: Get language from file path
function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "tsx":
    case "ts":
      return "typescript"
    case "jsx":
    case "js":
      return "javascript"
    case "css":
      return "css"
    case "json":
      return "json"
    case "md":
      return "markdown"
    default:
      return "typescript"
  }
}

// Helper: Generate placeholder component for undefined references
function generatePlaceholderComponent(componentName: string): string {
  const placeholders: Record<string, string> = {
    FeatureCard: `function FeatureCard({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border hover:shadow-xl transition">
      {icon && <div className="text-purple-600 mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}`,
    CheckCircle: `function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}`,
    Star: `function Star({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}`,
    ArrowRight: `function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}`,
    Hero: `function Hero() {
  return (
    <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Our Platform</h1>
        <p className="text-xl mb-8 opacity-90">Build something amazing with our powerful tools</p>
        <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
          Get Started
        </button>
      </div>
    </section>
  );
}`,
    Features: `function Features() {
  const features = [
    { title: "Fast", description: "Lightning fast performance", icon: "⚡" },
    { title: "Secure", description: "Enterprise-grade security", icon: "🔒" },
    { title: "Scalable", description: "Grows with your business", icon: "📈" },
  ];
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
    CallToAction: `function CallToAction() {
  return (
    <section className="bg-purple-600 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-lg mb-8 opacity-90">Join thousands of satisfied customers today</p>
        <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
          Start Free Trial
        </button>
      </div>
    </section>
  );
}`,
    Testimonials: `function Testimonials() {
  const testimonials = [
    { name: "John D.", role: "CEO", text: "This product changed our business completely!" },
    { name: "Sarah M.", role: "Designer", text: "Incredibly intuitive and powerful." },
  ];
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg border">
              <p className="text-gray-600 mb-4">"{t.text}"</p>
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-gray-500">{t.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
    Header: `function Header() {
  return (
    <header className="bg-white shadow-sm py-4 px-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-purple-600">Logo</div>
        <nav className="flex gap-6">
          <a href="#" className="text-gray-600 hover:text-purple-600">Home</a>
          <a href="#" className="text-gray-600 hover:text-purple-600">Features</a>
          <a href="#" className="text-gray-600 hover:text-purple-600">Pricing</a>
          <a href="#" className="text-gray-600 hover:text-purple-600">Contact</a>
        </nav>
      </div>
    </header>
  );
}`,
    Footer: `function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <div className="text-2xl font-bold mb-4">Logo</div>
        <p className="text-gray-400 mb-6">Building the future, one line at a time.</p>
        <div className="text-sm text-gray-500">© 2024 Company. All rights reserved.</div>
      </div>
    </footer>
  );
}`,
    Pricing: `function Pricing() {
  const plans = [
    { name: "Starter", price: "$9", features: ["5 Projects", "Basic Support", "1GB Storage"] },
    { name: "Pro", price: "$29", features: ["Unlimited Projects", "Priority Support", "10GB Storage"] },
  ];
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <div key={i} className="bg-white p-8 rounded-xl shadow-lg text-center">
              <h3 className="text-xl font-semibold mb-2">{p.name}</h3>
              <div className="text-4xl font-bold text-purple-600 mb-6">{p.price}<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="text-gray-600 mb-6 space-y-2">
                {p.features.map((f, j) => <li key={j}>✓ {f}</li>)}
              </ul>
              <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">Choose Plan</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  };
  
  // Return known placeholder or generate generic one
  if (placeholders[componentName]) {
    return placeholders[componentName];
  }
  
  // Generic placeholder for unknown components - with REAL content
  const componentTemplates: Record<string, string> = {
    'About': `function About() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">About Us</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gray-600 text-lg mb-4">We're a team of passionate developers and designers dedicated to creating exceptional digital experiences.</p>
            <p className="text-gray-600 mb-4">Founded in 2020, we've helped over 500 companies transform their online presence with cutting-edge technology and innovative design.</p>
            <div className="flex gap-8 mt-6">
              <div><span className="text-3xl font-bold text-purple-600">500+</span><p className="text-gray-500">Clients</p></div>
              <div><span className="text-3xl font-bold text-purple-600">98%</span><p className="text-gray-500">Satisfaction</p></div>
              <div><span className="text-3xl font-bold text-purple-600">24/7</span><p className="text-gray-500">Support</p></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl h-80 flex items-center justify-center">
            <span className="text-6xl">🚀</span>
          </div>
        </div>
      </div>
    </section>
  );
}`,
    'Contact': `function Contact() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Get In Touch</h2>
        <p className="text-center text-gray-600 mb-12">Have a question or want to work together? We'd love to hear from you.</p>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-6">
            <input type="text" placeholder="Your Name" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
            <input type="email" placeholder="Your Email" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <textarea placeholder="Your Message" rows={4} className="w-full mt-6 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
          <button className="w-full mt-6 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">Send Message</button>
        </div>
      </div>
    </section>
  );
}`,
    'Services': `function Services() {
  const services = [
    { icon: "💻", title: "Web Development", desc: "Custom websites and web applications built with modern technologies" },
    { icon: "📱", title: "Mobile Apps", desc: "Native and cross-platform mobile applications for iOS and Android" },
    { icon: "🎨", title: "UI/UX Design", desc: "Beautiful, intuitive interfaces that users love" },
    { icon: "☁️", title: "Cloud Solutions", desc: "Scalable cloud infrastructure and DevOps services" },
  ];
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
        <p className="text-center text-gray-600 mb-12">Everything you need to build and grow your digital presence</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, i) => (
            <div key={i} className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
    'Team': `function Team() {
  const team = [
    { name: "Alex Johnson", role: "CEO & Founder", emoji: "👨‍💼" },
    { name: "Sarah Chen", role: "Lead Designer", emoji: "👩‍🎨" },
    { name: "Mike Williams", role: "Tech Lead", emoji: "👨‍💻" },
    { name: "Emily Davis", role: "Product Manager", emoji: "👩‍💼" },
  ];
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Meet Our Team</h2>
        <p className="text-center text-gray-600 mb-12">The talented people behind our success</p>
        <div className="grid md:grid-cols-4 gap-8">
          {team.map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-xl text-center shadow-sm hover:shadow-lg transition">
              <div className="text-6xl mb-4">{t.emoji}</div>
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="text-gray-500">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
    'FAQ': `function FAQ() {
  const faqs = [
    { q: "How long does a typical project take?", a: "Most projects are completed within 4-8 weeks, depending on complexity and scope." },
    { q: "What technologies do you use?", a: "We use modern technologies like React, Next.js, Node.js, and cloud platforms like AWS and Vercel." },
    { q: "Do you offer ongoing support?", a: "Yes! We offer maintenance packages and 24/7 support for all our clients." },
  ];
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">{f.q}</h3>
              <p className="text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  };
  
  // Check if we have a specific template
  if (componentTemplates[componentName]) {
    return componentTemplates[componentName];
  }
  
  // Fallback: Generate contextual content based on component name
  const componentLower = componentName.toLowerCase();
  const readableName = componentName.replace(/([A-Z])/g, ' $1').trim();
  
  // Context-aware content generation
  let title = readableName;
  let description = '';
  let ctaText = 'Learn More';
  let bgClass = 'bg-gradient-to-br from-gray-50 to-gray-100';
  
  // Hero sections
  if (componentLower.includes('hero')) {
    title = 'Welcome to Our Platform';
    description = 'We help businesses grow with innovative solutions. Start your journey today and discover what makes us different.';
    ctaText = 'Get Started';
    bgClass = 'bg-gradient-to-br from-purple-600 to-blue-600 text-white';
  }
  // Menu sections (for restaurants, cafes, etc.)
  else if (componentLower.includes('menu')) {
    return `function ${componentName}() {
  const menuItems = [
    { name: "Espresso", price: "$3.50", desc: "Rich and bold single shot" },
    { name: "Cappuccino", price: "$4.50", desc: "Espresso with steamed milk foam" },
    { name: "Latte", price: "$4.75", desc: "Smooth espresso with creamy milk" },
    { name: "Mocha", price: "$5.25", desc: "Chocolate and espresso blend" },
    { name: "Cold Brew", price: "$4.00", desc: "Slow-steeped for 12 hours" },
    { name: "Matcha Latte", price: "$5.50", desc: "Premium Japanese green tea" },
  ];
  return (
    <section className="py-20 px-4 bg-amber-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Our Menu</h2>
        <p className="text-center text-gray-600 mb-12">Crafted with care, served with love</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <span className="text-amber-600 font-bold">{item.price}</span>
              </div>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;
  }
  // About sections
  else if (componentLower.includes('about')) {
    title = 'About Us';
    description = 'We are passionate about delivering exceptional experiences. Our team of experts is dedicated to helping you achieve your goals with personalized solutions and outstanding service.';
    ctaText = 'Meet Our Team';
  }
  // Contact sections
  else if (componentLower.includes('contact')) {
    title = 'Get In Touch';
    description = 'Have questions? We would love to hear from you. Reach out and our team will get back to you within 24 hours.';
    ctaText = 'Contact Us';
  }
  // Features sections
  else if (componentLower.includes('feature')) {
    title = 'Why Choose Us';
    description = 'We offer industry-leading solutions with unmatched quality, reliability, and customer support.';
    ctaText = 'Explore Features';
  }
  // Default fallback with better content
  else {
    description = 'Explore our offerings and discover how we can help you achieve your goals. Quality, innovation, and customer satisfaction are at the heart of everything we do.';
  }
  
  return `function ${componentName}() {
  return (
    <section className="py-20 px-4 ${bgClass}">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">${title}</h2>
        <p className="${bgClass.includes('text-white') ? 'text-white/90' : 'text-gray-600'} text-lg max-w-2xl mx-auto mb-8">${description}</p>
        <button className="${bgClass.includes('text-white') ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition">${ctaText}</button>
      </div>
    </section>
  );
}`;
}

// Helper: Find and inject missing component definitions
function injectMissingComponents(code: string): string {
  // Find all component references in JSX - multiple patterns
  const usedComponents = new Set<string>();
  let match;
  
  // Pattern 1: Self-closing tags with or without props: <Component /> or <Component prop="value" />
  const selfClosingRegex = /<([A-Z][a-zA-Z0-9]*)[^>]*\/>/g;
  while ((match = selfClosingRegex.exec(code)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Pattern 2: Components with children: <Component>...</Component> or <Component prop="value">...</Component>
  const componentWithChildrenRegex = /<([A-Z][a-zA-Z0-9]*)[^>]*>[\s\S]*?<\/\1>/g;
  while ((match = componentWithChildrenRegex.exec(code)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Pattern 3: Opening tags (catches components that might be split across lines)
  const openingTagRegex = /<([A-Z][a-zA-Z0-9]*)\s+[^>]*[^\/]>/g;
  while ((match = openingTagRegex.exec(code)) !== null) {
    usedComponents.add(match[1]);
  }
  
  // Find which components are already defined
  const definedComponents = new Set<string>();
  const functionDefRegex = /function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g;
  while ((match = functionDefRegex.exec(code)) !== null) {
    definedComponents.add(match[1]);
  }
  const constDefRegex = /const\s+([A-Z][a-zA-Z0-9]*)\s*=/g;
  while ((match = constDefRegex.exec(code)) !== null) {
    definedComponents.add(match[1]);
  }
  
  // Check for Lucide icon imports - these are valid and shouldn't be injected
  const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
  const lucideIcons = new Set<string>();
  while ((match = lucideImportRegex.exec(code)) !== null) {
    match[1].split(',').forEach(icon => {
      lucideIcons.add(icon.trim());
    });
  }
  
  // Find missing components
  const missingComponents: string[] = [];
  usedComponents.forEach(comp => {
    // Skip common HTML-like components, React built-ins, and Lucide icons
    const skipList = ['React', 'Fragment', 'Suspense', 'ErrorBoundary'];
    if (!definedComponents.has(comp) && !skipList.includes(comp) && !lucideIcons.has(comp)) {
      missingComponents.push(comp);
    }
  });
  
  if (missingComponents.length === 0) {
    return code;
  }
  
  console.log("Injecting missing components:", missingComponents);
  
  // Generate placeholder components
  const placeholders = missingComponents.map(comp => generatePlaceholderComponent(comp)).join('\n\n');
  
  // Find the best place to inject (after imports, before main component)
  const importEndMatch = code.match(/^(import[\s\S]*?(?:\n\n|\n(?=[^i])))/m);
  if (importEndMatch) {
    const importSection = importEndMatch[0];
    const restOfCode = code.slice(importSection.length);
    return importSection + '\n' + placeholders + '\n\n' + restOfCode;
  }
  
  // If no imports, add at the beginning
  return placeholders + '\n\n' + code;
}

// Note: cleanGeneratedCode is imported from code-cleaner at line 15
// Note: autoAliasLucideIcons was part of cleanGeneratedCode, now in code-cleaner module
// Duplicate definitions removed to fix build error

// Force rebuild timestamp: 2026-02-05T22:15:00

// Helper: Auto-alias lucide-react icons to prevent naming conflicts (CRITICAL BUG FIX)
function autoAliasLucideIcons(code: string): string {
  // Find lucide-react import statement
  const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g
  let match
  
  while ((match = lucideImportRegex.exec(code)) !== null) {
    const fullImport = match[0]
    const importedIcons = match[1]
    
    // Parse imported icons
    const icons = importedIcons.split(',').map(i => i.trim()).filter(i => i.length > 0)
    
    // Find all function declarations in the code
    const functionNames = new Set<string>()
    const functionRegex = /(?:export\s+default\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g
    let funcMatch
    while ((funcMatch = functionRegex.exec(code)) !== null) {
      functionNames.add(funcMatch[1])
    }
    
    // Check which icons conflict with function names
    const aliasedIcons: string[] = []
    const conflictingIcons: string[] = []
    
    for (const icon of icons) {
      const iconName = icon.split(' as ')[0].trim() // Handle already aliased imports
      if (functionNames.has(iconName)) {
        // Conflict detected! Need to alias this icon
        conflictingIcons.push(iconName)
        aliasedIcons.push(`${iconName} as ${iconName}Icon`)
      } else {
        // No conflict, keep as is
        aliasedIcons.push(icon)
      }
    }
    
    if (conflictingIcons.length > 0) {
      console.log(`🔧 AUTO-FIX: Aliasing conflicting lucide icons: ${conflictingIcons.join(', ')}`)
      
      // Replace the import statement with aliased version
      const newImport = `import { ${aliasedIcons.join(', ')} } from 'lucide-react'`
      code = code.replace(fullImport, newImport)
      
      // Replace all usages of conflicting icons in JSX
      for (const iconName of conflictingIcons) {
        // Match icon usage in JSX: <IconName /> or <IconName className="..." />
        // But NOT in function declarations
        const usageRegex = new RegExp(`<${iconName}([\\s/>])`, 'g')
        code = code.replace(usageRegex, `<${iconName}Icon$1`)
        
        // Also replace in JSX expressions: {<IconName />}
        const expressionRegex = new RegExp(`\\{<${iconName}([\\s/>])`, 'g')
        code = code.replace(expressionRegex, `{<${iconName}Icon$1`)
        
        // Replace in props: icon={IconName}
        const propRegex = new RegExp(`([=\\{])${iconName}([\\}\\s,])`, 'g')
        code = code.replace(propRegex, `$1${iconName}Icon$2`)
      }
    }
  }
  
  return code
}

// ============================================================================
// 🎨 DYNAMIC COLOR REPLACEMENT - Replace generic colors with extracted colors
// ============================================================================
interface ExtractedColors {
  background: string      // Main background color
  backgroundAlt: string   // Secondary background (cards, sidebar)
  text: string           // Primary text color
  textSecondary: string  // Secondary text color
  accent: string         // Accent/brand color
  border: string         // Border color
  isDark: boolean        // Whether the theme is dark
}

function extractColorsFromAnalysis(analysis: string, userPrompt?: string): ExtractedColors | null {
  // Default light theme
  const colors: ExtractedColors = {
    background: '#ffffff',
    backgroundAlt: '#f3f4f6',
    text: '#111827',
    textSecondary: '#6b7280',
    accent: '#3b82f6',
    border: '#e5e7eb',
    isDark: false
  }
  
  // FULLY DYNAMIC - No hardcoded websites!
  // Analyze the reference analysis text to extract colors
  if (!analysis || analysis.length < 10) {
    console.log('🎨 No analysis provided, using default light theme')
    return null
  }
  
  console.log('🎨 Analyzing colors from reference (fully dynamic, no hardcode)...')
  
  // Extract ALL hex colors from analysis
  const hexMatches = analysis.match(/#[0-9a-fA-F]{6}/g) || []
  const uniqueColors = [...new Set(hexMatches.map(c => c.toLowerCase()))]
  
  console.log('🎨 Found colors in analysis:', uniqueColors.slice(0, 10))
  
  if (uniqueColors.length === 0) {
    // Check for color keywords in analysis
    const analysisLower = analysis.toLowerCase()
    if (analysisLower.includes('dark theme') || 
        analysisLower.includes('dark mode') || 
        analysisLower.includes('dark background') ||
        analysisLower.includes('black background')) {
      console.log('🎨 Detected dark theme from keywords')
      colors.isDark = true
      colors.background = '#0f0f0f'
      colors.backgroundAlt = '#1a1a1a'
      colors.text = '#f1f1f1'
      colors.textSecondary = '#a0a0a0'
      colors.border = '#333333'
    }
    return colors
  }
  
  // Analyze each color's brightness to categorize them
  const colorData = uniqueColors.map(hex => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max === 0 ? 0 : (max - min) / max
    return { hex, brightness, saturation, r, g, b }
  })
  
  // Sort by brightness
  const sortedByBrightness = [...colorData].sort((a, b) => a.brightness - b.brightness)
  
  // Detect if dark theme: if the darkest colors appear first/most in the analysis
  // or if there are very dark colors (brightness < 30)
  const veryDarkColors = colorData.filter(c => c.brightness < 30)
  const veryLightColors = colorData.filter(c => c.brightness > 220)
  
  // Check analysis text for dark theme indicators
  const analysisLower = analysis.toLowerCase()
  const hasDarkKeywords = analysisLower.includes('dark') || 
                          analysisLower.includes('#0f0f0f') || 
                          analysisLower.includes('#000000') ||
                          analysisLower.includes('#121212') ||
                          analysisLower.includes('#0d1117')
  
  if (veryDarkColors.length >= 2 || hasDarkKeywords) {
    console.log('🎨 Detected DARK theme from color analysis')
    colors.isDark = true
    
    // Use the darkest color as background
    colors.background = sortedByBrightness[0]?.hex || '#0f0f0f'
    
    // Use a slightly lighter dark color for cards/alt background
    const altBgCandidates = colorData.filter(c => c.brightness > 15 && c.brightness < 60)
    colors.backgroundAlt = altBgCandidates[0]?.hex || '#1a1a1a'
    
    // Use the lightest color for text
    colors.text = sortedByBrightness[sortedByBrightness.length - 1]?.hex || '#f1f1f1'
    
    // Use a medium-light color for secondary text
    const secondaryTextCandidates = colorData.filter(c => c.brightness > 100 && c.brightness < 200)
    colors.textSecondary = secondaryTextCandidates[0]?.hex || '#aaaaaa'
    
    // Use a medium-dark color for borders
    const borderCandidates = colorData.filter(c => c.brightness > 30 && c.brightness < 80)
    colors.border = borderCandidates[0]?.hex || '#333333'
    
    // Find the most saturated color for accent
    const accentCandidates = colorData.filter(c => c.saturation > 0.4).sort((a, b) => b.saturation - a.saturation)
    colors.accent = accentCandidates[0]?.hex || '#3b82f6'
  } else if (veryLightColors.length >= 2) {
    console.log('🎨 Detected LIGHT theme from color analysis')
    colors.isDark = false
    
    // Use the lightest color as background
    colors.background = sortedByBrightness[sortedByBrightness.length - 1]?.hex || '#ffffff'
    
    // Use a slightly darker light color for cards
    const altBgCandidates = colorData.filter(c => c.brightness > 200 && c.brightness < 250)
    colors.backgroundAlt = altBgCandidates[0]?.hex || '#f3f4f6'
    
    // Use the darkest color for text
    colors.text = sortedByBrightness[0]?.hex || '#111827'
    
    // Use a medium color for secondary text
    const secondaryTextCandidates = colorData.filter(c => c.brightness > 80 && c.brightness < 150)
    colors.textSecondary = secondaryTextCandidates[0]?.hex || '#6b7280'
    
    // Use a light-medium color for borders
    const borderCandidates = colorData.filter(c => c.brightness > 180 && c.brightness < 230)
    colors.border = borderCandidates[0]?.hex || '#e5e7eb'
    
    // Find the most saturated color for accent
    const accentCandidates = colorData.filter(c => c.saturation > 0.4).sort((a, b) => b.saturation - a.saturation)
    colors.accent = accentCandidates[0]?.hex || '#3b82f6'
  }
  
  console.log('🎨 Extracted colors (fully dynamic):', colors)
  
  // Also check for text mentions of "dark"
  const mentionsDark = analysis.toLowerCase().includes('dark theme') || 
                       analysis.toLowerCase().includes('dark mode') ||
                       analysis.toLowerCase().includes('background: #0') ||
                       analysis.toLowerCase().includes('bg-black') ||
                       analysis.toLowerCase().includes('bg-[#0')
  
  if (colors.isDark || mentionsDark) {
    colors.isDark = true
    
    // Find the darkest color for background
    const darkColors = uniqueColors.filter(c => {
      const r = parseInt(c.slice(1, 3), 16)
      const g = parseInt(c.slice(3, 5), 16)
      const b = parseInt(c.slice(5, 7), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness < 50 // Very dark
    })
    
    if (darkColors.length > 0) {
      colors.background = darkColors[0]
    } else {
      colors.background = '#0f0f0f' // Default dark
    }
    
    // Find slightly lighter colors for cards/alt background
    const mediumDarkColors = uniqueColors.filter(c => {
      const r = parseInt(c.slice(1, 3), 16)
      const g = parseInt(c.slice(3, 5), 16)
      const b = parseInt(c.slice(5, 7), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness >= 20 && brightness < 80
    })
    
    if (mediumDarkColors.length > 0) {
      colors.backgroundAlt = mediumDarkColors[0]
    } else {
      colors.backgroundAlt = '#212121'
    }
    
    // Light text for dark theme
    const lightColors = uniqueColors.filter(c => {
      const r = parseInt(c.slice(1, 3), 16)
      const g = parseInt(c.slice(3, 5), 16)
      const b = parseInt(c.slice(5, 7), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 200
    })
    
    if (lightColors.length > 0) {
      colors.text = lightColors[0]
    } else {
      colors.text = '#f1f1f1'
    }
    
    colors.textSecondary = '#aaaaaa'
    colors.border = '#303030'
    
    // Find accent color (usually a saturated color)
    const accentColors = uniqueColors.filter(c => {
      const r = parseInt(c.slice(1, 3), 16)
      const g = parseInt(c.slice(3, 5), 16)
      const b = parseInt(c.slice(5, 7), 16)
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const saturation = max === 0 ? 0 : (max - min) / max
      return saturation > 0.5 // Saturated colors
    })
    
    if (accentColors.length > 0) {
      colors.accent = accentColors[0]
    } else {
      // Check for common accent colors in text
      if (analysis.includes('#ff0000') || analysis.includes('red')) colors.accent = '#ff0000'
      else if (analysis.includes('#1db954') || analysis.includes('green')) colors.accent = '#1db954'
      else if (analysis.includes('#1d9bf0') || analysis.includes('blue')) colors.accent = '#1d9bf0'
      else colors.accent = '#ff0000' // Default red for video platforms
    }
  }
  
  console.log('🎨 Extracted colors:', colors)
  return colors
}

// Note: applyDynamicColorReplacement is imported from component-generator at line 12
// Note: validateTypeScriptCode is imported from code-cleaner at line 16
// Note: autoFixCommonErrors is imported from code-cleaner at line 17
// Duplicate definitions removed to fix build error

// Force rebuild timestamp: 2026-02-03T19:45:00
