// Audio generation support added
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createUIMessageStream, createUIMessageStreamResponse } from "ai"
import { streamWithFallback, generateWithFallback } from "@/lib/ai/groq-direct"
import { routeForChat } from "@/lib/ai/model-router"
import { colabChat } from "@/lib/colab"

/** Use Colab POST /chat when this env is set; otherwise use streamWithFallback (Nairi Router or BitNet). */
function useColabBackend(): boolean {
  return !!process.env.COLAB_AI_BASE_URL?.trim()
}
import { wrapStreamWithQualityGates } from "@/lib/ai/stream-quality"
import { truncateMessages } from "@/lib/ai/context-window"
import { filterInput, filterOutput } from "@/lib/ai/content-filters"
import { getSystemPrompt, detectPromptInjection } from "@/lib/ai/system-prompts"
import { checkRateLimitAsync, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { validateRequestSize, validateContentType, sanitizeString, detectSuspiciousPatterns, MAX_REQUEST_SIZES } from "@/lib/security/request-validator"
import { getUserIdOrBypassForApi } from "@/lib/auth"

export const maxDuration = 180

// Game generation does not exist on Nairi (FORBIDDEN). If user asks for a game, return this.
function getGameUnavailableMessage(): string {
  return "**Game generation is not available.**\n\nNairi does not offer game creation. You can use the platform for websites, presentations, documents, code, images, and more."
}

// Message type compatible with AI SDK v5 and v6 formats
type UIMessage = {
  role: 'user' | 'assistant' | 'system'
  content?: string
  parts?: Array<{ type: 'text'; text: string } | { type: string; [key: string]: unknown }>
  [key: string]: unknown
}

interface ChatRequest {
  messages: UIMessage[]
  conversationId?: string
  mode?: "default" | "debate" | "reasoning" | "tutor" | "creator" | "builder" | "learn"
}

// Extract content from UIMessage - handle both v5 and v6 formats
function getMessageContent(message: UIMessage): string {
  // First check for direct content property (most common in AI SDK)
  if (typeof (message as any).content === 'string') {
    return (message as any).content
  }
  
  // Then check for parts array (v6 pattern)
  if (message.parts) {
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('\n')
  }
  
  // Log if we can't extract content to help debug
  console.error('[getMessageContent] Unable to extract content from message:', JSON.stringify(message))
  return ''
}

// Refusal logic: Check if request should be refused
function shouldRefuse(content: string): { refuse: boolean; reason?: string } {
  const refusalPatterns = [
    { pattern: /hack|exploit|bypass security/i, reason: "Security-related harmful request" },
    { pattern: /illegal.*drug|how to make.*bomb/i, reason: "Illegal activity request" },
    { pattern: /write.*malware|create.*virus/i, reason: "Malicious software request" },
  ]
  
  for (const { pattern, reason } of refusalPatterns) {
    if (pattern.test(content)) {
      return { refuse: true, reason }
    }
  }
  
  return { refuse: false }
}

// Detect if user is requesting video generation
function detectVideoRequest(content: string): { isVideoRequest: boolean; prompt: string } {
  const videoPatterns = [
    /^(generate|create|make|produce)\s+(a\s+)?(short\s+)?(video|animation|clip)\s+(of|about|showing|depicting)\s+(.+)/i,
    /^(video|animation)\s+(of|about|showing)\s+(.+)/i,
    /^(can you|please|could you)\s+(generate|create|make)\s+(a\s+)?(video|animation)\s+(of|about|showing)\s+(.+)/i,
    /^(i\s+want|i\s+need|i'd\s+like)\s+(a\s+)?(video|animation)\s+(of|about|showing)\s+(.+)/i,
  ]
  
  for (const pattern of videoPatterns) {
    const match = content.match(pattern)
    if (match) {
      // Extract the actual prompt (last capture group)
      const prompt = match[match.length - 1] || content
      return { isVideoRequest: true, prompt: prompt.trim() }
    }
  }
  
  // Also check for explicit video keywords
  const lowerContent = content.toLowerCase()
  if ((lowerContent.includes('generate') || lowerContent.includes('create') || lowerContent.includes('make')) &&
      (lowerContent.includes('video') || lowerContent.includes('animation'))) {
    return { isVideoRequest: true, prompt: content }
  }
  
  return { isVideoRequest: false, prompt: content }
}

// Detect if user is requesting image generation
function detectImageRequest(content: string): { isImageRequest: boolean; prompt: string } {
  const imagePatterns = [
    /^(generate|create|make|draw|paint)\s+(an?\s+)?(image|picture|photo|illustration|artwork)\s+(of|about|showing|depicting)\s+(.+)/i,
    /^(image|picture|photo)\s+(of|about|showing)\s+(.+)/i,
    /^(can you|please|could you)\s+(generate|create|make|draw)\s+(an?\s+)?(image|picture)\s+(of|about|showing)\s+(.+)/i,
  ]
  
  for (const pattern of imagePatterns) {
    const match = content.match(pattern)
    if (match) {
      const prompt = match[match.length - 1] || content
      return { isImageRequest: true, prompt: prompt.trim() }
    }
  }
  
  const lowerContent = content.toLowerCase()
  if ((lowerContent.includes('generate') || lowerContent.includes('create') || lowerContent.includes('draw')) &&
      (lowerContent.includes('image') || lowerContent.includes('picture') || lowerContent.includes('photo'))) {
    return { isImageRequest: true, prompt: content }
  }
  
  return { isImageRequest: false, prompt: content }
}

// Detect if user is requesting sound effect/music generation (NOT TTS)
function detectSoundEffectRequest(content: string): { isSoundRequest: boolean; prompt: string } {
  const lowerContent = content.toLowerCase()
  
  // Sound effect keywords that indicate user wants actual audio content, not TTS
  const soundKeywords = [
    'sound effect', 'sound fx', 'sfx', 'ambient', 'ambience',
    'music', 'melody', 'beat', 'song', 'tune', 'soundtrack',
    'noise', 'nature sounds', 'rain', 'thunder', 'wind', 'ocean', 'waves',
    'birds', 'forest', 'fire', 'crackling', 'footsteps', 'explosion',
    'whoosh', 'swoosh', 'ding', 'bell', 'chime', 'alarm',
    'background audio', 'audio loop', 'audio clip'
  ]
  
  const hasSoundKeyword = soundKeywords.some(kw => lowerContent.includes(kw))
  const hasGenerateWord = /\b(generate|create|make|produce)\b/.test(lowerContent)
  const hasAudioWord = /\b(audio|sound)\b/.test(lowerContent)
  
  if (hasSoundKeyword && (hasGenerateWord || hasAudioWord)) {
    return { isSoundRequest: true, prompt: content }
  }
  
  return { isSoundRequest: false, prompt: content }
}

// Detect if user is requesting audio/speech generation (TTS - text to speech)
function detectAudioRequest(content: string): { isAudioRequest: boolean; prompt: string; text: string } {
  // First check if this is a sound effect request - those should NOT use TTS
  const soundCheck = detectSoundEffectRequest(content)
  if (soundCheck.isSoundRequest) {
    return { isAudioRequest: false, prompt: content, text: '' }
  }
  
  const audioPatterns = [
    /^(say|speak|read|narrate)\s+["']?(.+?)["']?$/i,
    /^(can you|please|could you)\s+(say|speak|read)\s+["']?(.+?)["']?$/i,
    /^(convert|turn)\s+(.+)\s+(to|into)\s+(audio|speech|voice)/i,
    /^(text.to.speech|tts)\s*:?\s*(.+)/i,
    /^read\s+(this|the following|aloud|out loud)\s*:?\s*(.+)/i,
  ]
  
  for (const pattern of audioPatterns) {
    const match = content.match(pattern)
    if (match) {
      const text = match[match.length - 1] || content
      return { isAudioRequest: true, prompt: content, text: text.trim() }
    }
  }
  
  const lowerContent = content.toLowerCase()
  // Only match TTS if explicitly asking to speak/say text
  if ((lowerContent.includes('say') || lowerContent.includes('speak') || lowerContent.includes('read aloud') ||
       lowerContent.includes('text to speech') || lowerContent.includes('tts')) &&
      !lowerContent.includes('sound') && !lowerContent.includes('music') && !lowerContent.includes('effect')) {
    const textMatch = content.match(/(?:saying|speaking|reading|of|:)\s*["']?(.+?)["']?\s*$/i)
    const text = textMatch ? textMatch[1] : content
    return { isAudioRequest: true, prompt: content, text: text.trim() }
  }
  
  return { isAudioRequest: false, prompt: content, text: '' }
}

// Detect if user is requesting simulation generation
function detectSimulationRequest(content: string): { isSimulationRequest: boolean; prompt: string; type: string } {
  const simulationPatterns = [
    /^(generate|create|make|build)\s+(a\s+)?(physics\s+)?(simulation|sim)\s+(of|about|showing|for)\s+(.+)/i,
    /^(simulate|visualize)\s+(.+)/i,
    /^(can you|please|could you)\s+(generate|create|make|simulate)\s+(a\s+)?(simulation|physics|chemistry|biology|math)\s*(simulation)?\s*(of|about|for)?\s*(.+)/i,
    /^(physics|chemistry|biology|math)\s+simulation\s+(of|about|for)\s+(.+)/i,
    /^(interactive\s+)?(pendulum|gravity|projectile|wave|particle|orbit|collision|spring|bouncing)/i,
  ]
  
  for (const pattern of simulationPatterns) {
    const match = content.match(pattern)
    if (match) {
      const prompt = match[match.length - 1] || content
      // Detect simulation type
      const lowerContent = content.toLowerCase()
      let simType = 'physics'
      if (lowerContent.includes('chemistry') || lowerContent.includes('molecule') || lowerContent.includes('reaction')) {
        simType = 'chemistry'
      } else if (lowerContent.includes('biology') || lowerContent.includes('cell') || lowerContent.includes('dna') || lowerContent.includes('ecosystem')) {
        simType = 'biology'
      } else if (lowerContent.includes('math') || lowerContent.includes('fractal') || lowerContent.includes('graph') || lowerContent.includes('geometry')) {
        simType = 'math'
      }
      return { isSimulationRequest: true, prompt: prompt.trim(), type: simType }
    }
  }
  
  const lowerContent = content.toLowerCase()
  if ((lowerContent.includes('simulate') || lowerContent.includes('simulation')) &&
      (lowerContent.includes('physics') || lowerContent.includes('pendulum') || lowerContent.includes('gravity') ||
       lowerContent.includes('chemistry') || lowerContent.includes('biology') || lowerContent.includes('math') ||
       lowerContent.includes('interactive') || lowerContent.includes('canvas'))) {
    let simType = 'physics'
    if (lowerContent.includes('chemistry')) simType = 'chemistry'
    else if (lowerContent.includes('biology')) simType = 'biology'
    else if (lowerContent.includes('math')) simType = 'math'
    return { isSimulationRequest: true, prompt: content, type: simType }
  }
  
  return { isSimulationRequest: false, prompt: content, type: 'physics' }
}

// Detect if user is requesting game generation (Nairi does not offer games — return unavailable message)
function detectGameRequest(content: string): boolean {
  const lower = content.toLowerCase().trim()
  const gameKeywords = /\b(game|pong|snake|tetris|breakout|flappy|arcade|platformer|shooter|puzzle)\b/
  const createKeywords = /^(generate|create|make|build|can you|please|could you)/
  return (createKeywords.test(lower) && gameKeywords.test(lower)) || /^(pong|snake|tetris|breakout)\s*(game)?$/i.test(lower)
}

// Detect if user is requesting document generation
function detectDocumentRequest(content: string): { isDocumentRequest: boolean; prompt: string; docType: string; tone: string } {
  const documentPatterns = [
    /^(generate|create|write|draft)\s+(a\s+)?(formal\s+|professional\s+|academic\s+)?(essay|report|article|letter|resume|contract|proposal|document)\s+(about|on|for|regarding)\s+(.+)/i,
    /^(write|draft|compose)\s+(me\s+)?(a\s+)?(essay|report|article|letter|resume|contract|proposal)\s+(about|on|for)\s+(.+)/i,
    /^(can you|please|could you)\s+(generate|create|write|draft)\s+(a\s+)?(essay|report|article|letter|resume|contract|proposal)\s+(about|on|for)?\s*(.+)/i,
  ]
  
  for (const pattern of documentPatterns) {
    const match = content.match(pattern)
    if (match) {
      const prompt = match[match.length - 1] || content
      const lowerContent = content.toLowerCase()
      let docType = 'article'
      let tone = 'professional'
      
      if (lowerContent.includes('essay')) docType = 'essay'
      else if (lowerContent.includes('report')) docType = 'report'
      else if (lowerContent.includes('letter')) docType = 'letter'
      else if (lowerContent.includes('resume') || lowerContent.includes('cv')) docType = 'resume'
      else if (lowerContent.includes('contract')) docType = 'contract'
      else if (lowerContent.includes('proposal')) docType = 'proposal'
      
      if (lowerContent.includes('formal')) tone = 'formal'
      else if (lowerContent.includes('casual')) tone = 'casual'
      else if (lowerContent.includes('academic')) tone = 'academic'
      
      return { isDocumentRequest: true, prompt: prompt.trim(), docType, tone }
    }
  }
  
  const lowerContent = content.toLowerCase()
  if ((lowerContent.includes('write') || lowerContent.includes('draft') || lowerContent.includes('generate')) &&
      (lowerContent.includes('essay') || lowerContent.includes('report') || lowerContent.includes('article') ||
       lowerContent.includes('letter') || lowerContent.includes('resume') || lowerContent.includes('contract') ||
       lowerContent.includes('proposal'))) {
    let docType = 'article'
    let tone = 'professional'
    if (lowerContent.includes('essay')) docType = 'essay'
    else if (lowerContent.includes('report')) docType = 'report'
    else if (lowerContent.includes('letter')) docType = 'letter'
    else if (lowerContent.includes('resume')) docType = 'resume'
    else if (lowerContent.includes('contract')) docType = 'contract'
    else if (lowerContent.includes('proposal')) docType = 'proposal'
    if (lowerContent.includes('formal')) tone = 'formal'
    else if (lowerContent.includes('academic')) tone = 'academic'
    return { isDocumentRequest: true, prompt: content, docType, tone }
  }
  
  return { isDocumentRequest: false, prompt: content, docType: 'article', tone: 'professional' }
}

// Detect if user is requesting agent execution
function detectAgentRequest(content: string): { isAgentRequest: boolean; agentType: string; task: string; context: string } {
  const lowerContent = content.toLowerCase()
  
  // Research agent patterns
  const researchPatterns = [
    /^(research|investigate|find out|look up|search for|gather information)\s+(about|on|regarding)\s+(.+)/i,
    /^(can you|please|could you)\s+(research|investigate|look up)\s+(.+)/i,
    /^(deep\s+)?research\s*:?\s*(.+)/i,
  ]
  
  for (const pattern of researchPatterns) {
    const match = content.match(pattern)
    if (match) {
      return { isAgentRequest: true, agentType: 'research', task: match[match.length - 1] || content, context: '' }
    }
  }
  
  // Task agent patterns - autonomous task execution
  const taskPatterns = [
    /^(execute|run|perform|do|complete)\s+(the\s+)?(task|job|work)\s*:?\s*(.+)/i,
    /^(autonomous(ly)?|auto)\s+(execute|run|do)\s*:?\s*(.+)/i,
    /^(agent|ai\s+agent)\s*:?\s*(.+)/i,
    /^(can you|please)\s+(autonomously|automatically)\s+(do|execute|complete)\s+(.+)/i,
  ]
  
  for (const pattern of taskPatterns) {
    const match = content.match(pattern)
    if (match) {
      return { isAgentRequest: true, agentType: 'task', task: match[match.length - 1] || content, context: '' }
    }
  }
  
  // Planning agent patterns
  const planPatterns = [
    /^(create|make|generate)\s+(a\s+)?(plan|roadmap|strategy)\s+(for|to)\s+(.+)/i,
    /^(plan|planning)\s*:?\s*(.+)/i,
    /^(help me plan|plan out)\s+(.+)/i,
  ]
  
  for (const pattern of planPatterns) {
    const match = content.match(pattern)
    if (match) {
      return { isAgentRequest: true, agentType: 'planning', task: match[match.length - 1] || content, context: '' }
    }
  }
  
  // Data analysis agent patterns
  const dataPatterns = [
    /^(analyze|analyse)\s+(this\s+)?(data|dataset|numbers|statistics)\s*:?\s*(.+)/i,
    /^(data\s+analysis|analyze\s+data)\s*:?\s*(.+)/i,
  ]
  
  for (const pattern of dataPatterns) {
    const match = content.match(pattern)
    if (match) {
      return { isAgentRequest: true, agentType: 'data', task: match[match.length - 1] || content, context: '' }
    }
  }
  
  // Code agent patterns (more specific than general code generation)
  const codeAgentPatterns = [
    /^(code\s+agent|coding\s+agent)\s*:?\s*(.+)/i,
    /^(debug|fix\s+bugs?\s+in|refactor|review)\s+(this\s+)?(code|function|class)\s*:?\s*(.+)/i,
    /^(write\s+tests?\s+for|generate\s+tests?\s+for)\s+(.+)/i,
  ]
  
  for (const pattern of codeAgentPatterns) {
    const match = content.match(pattern)
    if (match) {
      return { isAgentRequest: true, agentType: 'code', task: match[match.length - 1] || content, context: '' }
    }
  }
  
  // General agent keywords
  if ((lowerContent.includes('agent') || lowerContent.includes('autonomous')) &&
      (lowerContent.includes('execute') || lowerContent.includes('run') || lowerContent.includes('do') || lowerContent.includes('task'))) {
    return { isAgentRequest: true, agentType: 'task', task: content, context: '' }
  }
  
  if (lowerContent.startsWith('research ') || lowerContent.startsWith('investigate ')) {
    return { isAgentRequest: true, agentType: 'research', task: content, context: '' }
  }
  
  return { isAgentRequest: false, agentType: '', task: '', context: '' }
}

// Detect if user is requesting presentation generation
function detectPresentationRequest(content: string): { isPresentationRequest: boolean; prompt: string; style: string; slideCount: number } {
  const presentationPatterns = [
    /^(generate|create|make|build)\s+(a\s+)?(presentation|slideshow|slides|ppt|powerpoint)\s+(about|on|for|regarding)\s+(.+)/i,
    /^(can you|please|could you)\s+(generate|create|make)\s+(a\s+)?(presentation|slideshow|slides)\s+(about|on|for)?\s*(.+)/i,
    /^(presentation|slideshow|slides)\s+(about|on|for)\s+(.+)/i,
    /^(make|create)\s+(me\s+)?(a\s+)?(\d+)\s+slide(s)?\s+(presentation|slideshow)\s+(about|on|for)\s+(.+)/i,
  ]
  
  for (const pattern of presentationPatterns) {
    const match = content.match(pattern)
    if (match) {
      const prompt = match[match.length - 1] || content
      const lowerContent = content.toLowerCase()
      let style = 'professional'
      let slideCount = 5
      
      // Detect style
      if (lowerContent.includes('creative') || lowerContent.includes('colorful')) style = 'creative'
      else if (lowerContent.includes('minimal') || lowerContent.includes('simple')) style = 'minimal'
      else if (lowerContent.includes('corporate') || lowerContent.includes('business')) style = 'corporate'
      else if (lowerContent.includes('educational') || lowerContent.includes('academic')) style = 'educational'
      
      // Detect slide count
      const countMatch = content.match(/(\d+)\s*slide/i)
      if (countMatch) {
        slideCount = Math.min(Math.max(parseInt(countMatch[1]), 3), 20)
      }
      
      return { isPresentationRequest: true, prompt: prompt.trim(), style, slideCount }
    }
  }
  
  const lowerContent = content.toLowerCase()
  if ((lowerContent.includes('generate') || lowerContent.includes('create') || lowerContent.includes('make')) &&
      (lowerContent.includes('presentation') || lowerContent.includes('slideshow') || lowerContent.includes('slides') ||
       lowerContent.includes('powerpoint') || lowerContent.includes('ppt'))) {
    let style = 'professional'
    let slideCount = 5
    if (lowerContent.includes('creative')) style = 'creative'
    else if (lowerContent.includes('minimal')) style = 'minimal'
    else if (lowerContent.includes('corporate')) style = 'corporate'
    else if (lowerContent.includes('educational')) style = 'educational'
    const countMatch = content.match(/(\d+)\s*slide/i)
    if (countMatch) slideCount = Math.min(Math.max(parseInt(countMatch[1]), 3), 20)
    return { isPresentationRequest: true, prompt: content, style, slideCount }
  }
  
  return { isPresentationRequest: false, prompt: content, style: 'professional', slideCount: 5 }
}

// Detect if user is requesting website/landing page generation
function detectWebsiteRequest(content: string): { isWebsiteRequest: boolean; prompt: string; websiteType: string } {
  const websitePatterns = [
    /^(generate|create|make|build)\s+(a\s+)?(landing\s+page|website|web\s+page|site|homepage|web\s+app|web\s+application)\s+(for|about|showing)\s+(.+)/i,
    /^(can you|please|could you)\s+(generate|create|make|build)\s+(a\s+)?(landing\s+page|website|web\s+page|site)\s+(for|about)?\s*(.+)/i,
    /^(landing\s+page|website|web\s+page|site|homepage)\s+(for|about)\s+(.+)/i,
    /^(portfolio|business|company|personal|blog)\s+(site|website|page)/i,
  ]
  
  for (const pattern of websitePatterns) {
    const match = content.match(pattern)
    if (match) {
      const prompt = match[match.length - 1] || content
      const lowerContent = content.toLowerCase()
      let websiteType = 'landing'
      
      // Detect website type
      if (lowerContent.includes('portfolio')) websiteType = 'portfolio'
      else if (lowerContent.includes('business') || lowerContent.includes('company')) websiteType = 'business'
      else if (lowerContent.includes('blog')) websiteType = 'blog'
      else if (lowerContent.includes('personal')) websiteType = 'personal'
      else if (lowerContent.includes('e-commerce') || lowerContent.includes('shop') || lowerContent.includes('store')) websiteType = 'ecommerce'
      
      return { isWebsiteRequest: true, prompt: prompt.trim(), websiteType }
    }
  }
  
  const lowerContent = content.toLowerCase()
  if ((lowerContent.includes('generate') || lowerContent.includes('create') || lowerContent.includes('make') || lowerContent.includes('build')) &&
      (lowerContent.includes('landing page') || lowerContent.includes('website') || lowerContent.includes('web page') ||
       lowerContent.includes('homepage') || lowerContent.includes('web app') || lowerContent.includes('site'))) {
    let websiteType = 'landing'
    if (lowerContent.includes('portfolio')) websiteType = 'portfolio'
    else if (lowerContent.includes('business') || lowerContent.includes('company')) websiteType = 'business'
    else if (lowerContent.includes('blog')) websiteType = 'blog'
    else if (lowerContent.includes('personal')) websiteType = 'personal'
    else if (lowerContent.includes('shop') || lowerContent.includes('store')) websiteType = 'ecommerce'
    return { isWebsiteRequest: true, prompt: content, websiteType }
  }
  
  return { isWebsiteRequest: false, prompt: content, websiteType: 'landing' }
}

// Note: detectPromptInjection is imported from @/lib/ai/system-prompts
// Fixed: Removed duplicate function definition

export async function POST(req: NextRequest) {
  try {
    // Request validation - prevent DoS and malicious requests
    const sizeValidation = await validateRequestSize(req, MAX_REQUEST_SIZES.chat)
    if (!sizeValidation.valid) {
      return new Response(
        JSON.stringify({ error: sizeValidation.error }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const contentTypeValidation = validateContentType(req, ['application/json'])
    if (!contentTypeValidation.valid) {
      return new Response(
        JSON.stringify({ error: contentTypeValidation.error }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting (Redis when REDIS_URL set, else in-memory)
    const clientId = getClientIdentifier(req)
    const rateLimitResult = await checkRateLimitAsync(`chat:${clientId}`, RATE_LIMITS.chat)
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please slow down.",
          retryAfter: rateLimitResult.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.retryAfter)
          } 
        }
      )
    }

    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())

    const body = await req.json()
    const { messages, conversationId, mode = "default" } = body
    const useStreaming = body.stream !== false

    if (!messages || messages.length === 0) {
      return new Response("Messages required", { status: 400 })
    }

    const lastUserMessage = messages.filter((m: UIMessage) => m.role === "user").pop()

    // Check for refusal conditions and prompt injection
    if (lastUserMessage) {
      const userContent = getMessageContent(lastUserMessage)
      
      // Check for prompt injection attempts
      const injectionCheck = detectPromptInjection(userContent)
      if (injectionCheck.detected) {
        return new Response(
          JSON.stringify({ 
            error: "I detected an attempt to manipulate my instructions. I'm designed to be helpful, harmless, and honest. Please rephrase your request.",
            reason: "Prompt injection attempt detected"
          }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      // Check for harmful content
      const refusalCheck = shouldRefuse(userContent)
      if (refusalCheck.refuse) {
        return new Response(
          JSON.stringify({ error: "I cannot help with this request.", reason: refusalCheck.reason }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      // Safety/content filter (e.g. block API keys in input)
      const contentFilter = filterInput(userContent, "chat")
      if (!contentFilter.allowed) {
        return new Response(
          JSON.stringify({ error: "Content not allowed.", reason: contentFilter.reason }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      // Check for video generation request - route to video API
      const videoCheck = detectVideoRequest(userContent)
      if (videoCheck.isVideoRequest) {
        try {
          // Forward cookies for authentication
          const cookieHeader = req.headers.get('cookie') || ''
          const videoResponse = await fetch(`${req.url.split('/api/')[0]}/api/generate-video`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': cookieHeader
            },
            body: JSON.stringify({ 
              prompt: videoCheck.prompt,
              duration: 'short',
              resolution: '720p',
              aspectRatio: '16:9'
            })
          })
          
          const videoData = await videoResponse.json()
          
          if (videoData.success && videoData.videoUrl) {
            // Return video result in AI SDK streaming format
            const videoMessage = `🎬 **Video Generated Successfully!**\n\n` +
              `**Provider:** ${videoData.provider || 'AI Video Generator'}\n` +
              `**Duration:** ${videoData.durationSeconds || 'N/A'} seconds\n` +
              `**Resolution:** ${videoData.resolution || 'HD'}\n\n` +
              `[▶️ Watch Video](${videoData.videoUrl})\n\n` +
              `${videoData.message || ''}\n\n` +
              `*Original prompt: "${videoCheck.prompt}"*`
            
            // Return in AI SDK UI format: 0:"content"\n
            const escaped = JSON.stringify(videoMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          } else if (videoData.videoFrames) {
            // Image sequence fallback
            const framesMessage = `🎬 **Video Frames Generated**\n\n` +
              `⚠️ True video generation is currently unavailable. Generated ${videoData.frameCount} image frames instead.\n\n` +
              `**Frames:**\n` +
              videoData.videoFrames.map((url: string, i: number) => `- [Frame ${i+1}](${url})`).join('\n') +
              `\n\n${videoData.warning || ''}\n\n` +
              `*You can use these frames with video editing tools to create animations.*`
            
            const escaped = JSON.stringify(framesMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          } else {
            // Video generation failed - provide helpful message
            const failMessage = `🎬 **Video Generation**\n\n` +
              `I attempted to generate a video for: "${videoCheck.prompt}"\n\n` +
              `${videoData.message || videoData.error || 'Video generation is currently unavailable.'}\n\n` +
              `**Enhanced prompt for external tools:**\n> ${videoData.enhancedPrompt || videoCheck.prompt}\n\n` +
              `**Suggested tools:**\n` +
              `- [Runway](https://runwayml.com) - Professional AI video\n` +
              `- [Pika](https://pika.art) - Creative video generation\n` +
              `- [Luma AI](https://lumalabs.ai) - Dream Machine`
            
            const escaped = JSON.stringify(failMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          }
        } catch (videoError) {
          console.error('Video generation routing error:', videoError)
          // Fall through to normal chat if video API fails
        }
      }
      
      // Check for image generation request - route to image API
      const imageCheck = detectImageRequest(userContent)
      if (imageCheck.isImageRequest) {
        try {
          // Forward cookies for authentication (CRITICAL FIX)
          const cookieHeader = req.headers.get('cookie') || ''
          const imageResponse = await fetch(`${req.url.split('/api/')[0]}/api/generate-image`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': cookieHeader
            },
            body: JSON.stringify({ 
              prompt: imageCheck.prompt,
              width: 1024,
              height: 1024
            })
          })
          
          const imageData = await imageResponse.json()
          
          // Handle API error responses
          if (!imageResponse.ok || imageData.error) {
            const errorMsg = imageData.error || imageData.message || `API returned status ${imageResponse.status}`
            const failMessage = `🖼️ **Image Generation Failed**\n\n` +
              `I attempted to generate an image for: "${imageCheck.prompt}"\n\n` +
              `**Error:** ${errorMsg}\n\n` +
              `**Fallback Options:**\n` +
              `- Try again in a few moments\n` +
              `- Use [DALL-E](https://openai.com/dall-e-3) or [Midjourney](https://midjourney.com)\n` +
              `- Try [Stable Diffusion](https://stability.ai/) for free local generation`
            
            const escaped = JSON.stringify(failMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          }
          
          // Fix: Check for imageData.image.url (correct API response structure)
          const imageUrl = imageData.image?.url || imageData.imageUrl
          if (imageData.success && imageUrl) {
            const provider = imageData.image?.provider || imageData.provider || 'AI Image Generator'
            const size = imageData.image?.size || `${imageData.width || 1024}x${imageData.height || 1024}`
            
            const imageMessage = `🖼️ **Image Generated Successfully!**\n\n` +
              `![Generated Image](${imageUrl})\n\n` +
              `**Provider:** ${provider}\n` +
              `**Resolution:** ${size}\n\n` +
              `[📥 Download Image](${imageUrl})\n\n` +
              `*Prompt: "${imageCheck.prompt}"*`
            
            // Return in AI SDK UI format: 0:"content"\n
            const escaped = JSON.stringify(imageMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          } else {
            // Image generation returned but no valid URL - show error
            const failMessage = `🖼️ **Image Generation Failed**\n\n` +
              `I attempted to generate an image for: "${imageCheck.prompt}"\n\n` +
              `**Error:** Image generation completed but no image URL was returned.\n\n` +
              `**Fallback Options:**\n` +
              `- Try again in a few moments\n` +
              `- Use [DALL-E](https://openai.com/dall-e-3) or [Midjourney](https://midjourney.com)\n` +
              `- Try [Stable Diffusion](https://stability.ai/) for free local generation`
            
            const escaped = JSON.stringify(failMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          }
        } catch (imageError) {
          console.error('Image generation routing error:', imageError)
          // Return explicit error message instead of falling through to chat
          const failMessage = `🖼️ **Image Generation Failed**\n\n` +
            `I attempted to generate an image for: "${imageCheck.prompt}"\n\n` +
            `**Error:** ${imageError instanceof Error ? imageError.message : 'Image generation service unavailable'}\n\n` +
            `**Fallback Options:**\n` +
            `- Try again in a few moments\n` +
            `- Use [DALL-E](https://openai.com/dall-e-3) or [Midjourney](https://midjourney.com)\n` +
            `- Try [Stable Diffusion](https://stability.ai/) for free local generation`
          
          const escaped = JSON.stringify(failMessage)
          return new Response(`0:${escaped}\n`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          })
        }
      }
      
      // Check for document generation request FIRST (before sound effects)
      // This prevents "write article" from being misclassified as sound generation
      const docCheck = detectDocumentRequest(userContent)
      if (docCheck.isDocumentRequest) {
        try {
          const docResponse = await fetch(`${req.url.split('/api/')[0]}/api/generate-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: docCheck.prompt,
              documentType: docCheck.docType,
              tone: docCheck.tone,
              length: 'medium',
              format: 'markdown'
            })
          })
          
          const docData = await docResponse.json()
          
          if (docData.success && docData.content) {
            const docMessage = `📄 **Document Generated!**\n\n` +
              `**Type:** ${docData.documentType || docCheck.docType}\n` +
              `**Tone:** ${docData.tone || docCheck.tone}\n` +
              `**Word Count:** ~${docData.wordCount || 'N/A'}\n\n` +
              `---\n\n` +
              `${docData.content}\n\n` +
              `---\n\n` +
              `*Generated from prompt: "${docCheck.prompt}"*`
            
            const escaped = JSON.stringify(docMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          } else {
            const failMessage = `📄 **Document Generation**\n\n` +
              `I attempted to create a document for: "${docCheck.prompt}"\n\n` +
              `${docData.error || 'Document generation encountered an issue.'}\n\n` +
              `**Try:**\n` +
              `- Being more specific about the document type\n` +
              `- Using the text generation for general writing`
            
            const escaped = JSON.stringify(failMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          }
        } catch (docError) {
          console.error('Document generation routing error:', docError)
          // Fall through to normal chat if document API fails
        }
      }
      
      // Check for website/landing page generation request (before sound effects)
      const websiteCheck = detectWebsiteRequest(userContent)
      if (websiteCheck.isWebsiteRequest) {
        try {
          // Use AI to generate a complete website with HTML/CSS/JS
          const websitePrompt = `Generate a complete, modern, responsive ${websiteCheck.websiteType} website for: ${websiteCheck.prompt}

Requirements:
- Single HTML file with embedded CSS and JavaScript
- Modern, professional design with good UX
- Responsive layout (mobile-friendly)
- Clean, semantic HTML5
- Modern CSS (flexbox/grid)
- Interactive elements where appropriate
- No external dependencies (all inline)
- Include placeholder images using https://via.placeholder.com or similar
- Add appropriate meta tags
- Include comments explaining key sections

The website should be production-ready and visually appealing.`

          const { text: htmlCodeRaw } = await generateWithFallback({
            system: 'You are an expert web developer. Generate complete, production-ready HTML/CSS/JS code. Output only the HTML, optionally wrapped in a markdown code block.',
            prompt: websitePrompt,
            temperature: 0.7,
            maxOutputTokens: 4000,
          })

          if (htmlCodeRaw) {
            let htmlCode = htmlCodeRaw
            
            // Extract HTML from markdown code blocks if present
            const codeBlockMatch = htmlCode.match(/```html\n([\s\S]*?)\n```/)
            if (codeBlockMatch) {
              htmlCode = codeBlockMatch[1]
            }
            
            const websiteMessage = `🌐 **Website Generated!**\n\n` +
              `**Type:** ${websiteCheck.websiteType}\n` +
              `**For:** ${websiteCheck.prompt}\n\n` +
              `\`\`\`html\n${htmlCode}\n\`\`\`\n\n` +
              `**To use this website:**\n` +
              `1. Copy the HTML code above\n` +
              `2. Save it as \`index.html\`\n` +
              `3. Open in your browser\n` +
              `4. Customize as needed\n\n` +
              `*The website is fully responsive and ready to deploy!*`
            
            const escaped = JSON.stringify(websiteMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          } else {
            throw new Error('AI generation failed')
          }
        } catch (websiteError) {
          console.error('Website generation error:', websiteError)
          
          // Fallback: provide a basic template
          // Sanitize user input to prevent XSS in generated HTML
          const safePrompt = websiteCheck.prompt.replace(/[<>&"']/g, (c: string) => 
            ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] || c)
          )
          const basicTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safePrompt}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
        header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4rem 2rem; text-align: center; }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 3rem 0; }
        .feature { padding: 2rem; background: #f8f9fa; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .feature h3 { color: #667eea; margin-bottom: 1rem; }
        footer { background: #2d3748; color: white; text-align: center; padding: 2rem; margin-top: 4rem; }
        @media (max-width: 768px) { h1 { font-size: 2rem; } }
    </style>
</head>
<body>
    <header>
        <h1>${safePrompt}</h1>
        <p>Welcome to our website</p>
    </header>
    <div class="container">
        <div class="features">
            <div class="feature">
                <h3>Feature 1</h3>
                <p>Description of your first feature or service.</p>
            </div>
            <div class="feature">
                <h3>Feature 2</h3>
                <p>Description of your second feature or service.</p>
            </div>
            <div class="feature">
                <h3>Feature 3</h3>
                <p>Description of your third feature or service.</p>
            </div>
        </div>
    </div>
    <footer>
        <p>&copy; 2026 ${safePrompt}. All rights reserved.</p>
    </footer>
</body>
</html>`
          
          const fallbackMessage = `🌐 **Website Generated (Basic Template)**\n\n` +
            `**Type:** ${websiteCheck.websiteType}\n` +
            `**For:** ${websiteCheck.prompt}\n\n` +
            `\`\`\`html\n${basicTemplate}\n\`\`\`\n\n` +
            `**To use this website:**\n` +
            `1. Copy the HTML code above\n` +
            `2. Save it as \`index.html\`\n` +
            `3. Open in your browser\n` +
            `4. Customize the content, colors, and features\n\n` +
            `*This is a basic responsive template. You can enhance it with more features!*`
          
          const escaped = JSON.stringify(fallbackMessage)
          return new Response(`0:${escaped}\n`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          })
        }
      }
      
      // Check for sound effect/music generation request - provide honest guidance
      const soundCheck = detectSoundEffectRequest(userContent)
      if (soundCheck.isSoundRequest) {
        // Sound effect generation is not available - provide honest message with alternatives
        const soundMessage = `🎵 **Sound Effect / Music Generation**\n\n` +
          `I detected you're looking for: "${soundCheck.prompt}"\n\n` +
          `⚠️ **Current Limitation:** True AI sound effect and music generation requires specialized models that are not yet integrated.\n\n` +
          `**Free Alternatives:**\n` +
          `- [Freesound.org](https://freesound.org) - Free sound effects library\n` +
          `- [Pixabay Audio](https://pixabay.com/music/) - Free music and sound effects\n` +
          `- [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/) - Free for personal use\n` +
          `- [Suno AI](https://suno.ai) - AI music generation\n` +
          `- [Riffusion](https://www.riffusion.com) - AI music from text\n\n` +
          `**For Text-to-Speech:** If you want me to *read text aloud*, try: "Say 'Hello world'" or "Read this: your text here"`
        
        const escaped = JSON.stringify(soundMessage)
        return new Response(`0:${escaped}\n`, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      }
      
      // Check for audio/speech generation request - route to audio API
      const audioCheck = detectAudioRequest(userContent)
      if (audioCheck.isAudioRequest) {
        try {
          const audioResponse = await fetch(`${req.url.split('/api/')[0]}/api/generate-audio`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              text: audioCheck.text,
              voice: "en-US-AriaNeural"
            })
          })
          
          const audioData = await audioResponse.json()
          
          if (audioData.success && audioData.audio) {
            const audio = audioData.audio
            const provider = audio.provider || "Browser Speech API"
            const textContent = audio.text || audioCheck.text
            const msgContent = audio.message || "Audio will be generated using browser speech synthesis."
            
            let audioMessage = ""
            if (audio.useBrowserTTS) {
              audioMessage = "🔊 **Text-to-Speech Ready**\n\n" +
                "**Provider:** " + provider + "\n" +
                "**Text:** " + textContent + "\n\n" +
                msgContent + "\n\n" +
                "*Click the speaker icon to hear this message.*"
            } else if (audio.url) {
              audioMessage = "🔊 **Audio Generated Successfully!**\n\n" +
                "**Provider:** " + (audio.provider || "AI Speech Generator") + "\n" +
                "**Voice:** " + (audio.voice || "Default") + "\n" +
                "**Duration:** ~" + (audio.duration || "N/A") + " seconds\n\n" +
                "[Play Audio](" + audio.url + ")\n\n" +
                "*Text: " + audioCheck.text + "*"
            }
            
            const escaped = JSON.stringify(audioMessage)
            return new Response("0:" + escaped + "\n", {
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
          } else {
            const failMessage = "🔊 **Audio Generation**\n\n" +
              "I attempted to generate audio for: " + audioCheck.text + "\n\n" +
              (audioData.error || "Audio generation encountered an issue.") + "\n\n" +
              "**Fallback:** You can use browser text-to-speech or try:\n" +
              "- [Natural Reader](https://www.naturalreaders.com/online/)\n" +
              "- [TTSReader](https://ttsreader.com/)"
            
            const escaped = JSON.stringify(failMessage)
            return new Response("0:" + escaped + "\n", {
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
          }
        } catch (audioError) {
          console.error("Audio generation routing error:", audioError)
        }
      }
      
      // Simulation: call generate-simulation API and return result
      const simCheck = detectSimulationRequest(userContent)
      if (simCheck.isSimulationRequest) {
        try {
          const baseUrl = req.url.split('/api/')[0]
          const simResponse = await fetch(`${baseUrl}/api/generate-simulation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: simCheck.prompt, type: simCheck.type as 'physics' | 'chemistry' | 'biology' | 'math' | 'custom', complexity: 'medium' }),
          })
          const simData = await simResponse.json()
          if (simData.success && simData.simulationHtml) {
            const simMessage = `🎮 **Interactive Simulation Generated!**\n\n**Topic:** ${simCheck.prompt}\n**Type:** ${simCheck.type}\n\nYou can view and run it on the [Simulations page](/simulations) or in your [Workspace](/workspace). The simulation uses HTML5 Canvas with interactive controls.\n\n*Generated from prompt: "${simCheck.prompt}"*`
            const escaped = JSON.stringify(simMessage)
            return new Response(`0:${escaped}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
          }
          const failMessage = `**Simulation**\n\nI attempted to create a simulation for: "${simCheck.prompt}".\n\n${simData.error || 'Simulation generation encountered an issue.'}\n\nTry being more specific or visit [Simulations](/simulations) to create one from the form.`
          const escapedFail = JSON.stringify(failMessage)
          return new Response(`0:${escapedFail}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        } catch (simErr) {
          console.error('Simulation routing error:', simErr)
        }
      }
      
      // Game generation does not exist on Nairi — return clear message
      if (detectGameRequest(userContent)) {
        const msg = getGameUnavailableMessage()
        const escaped = JSON.stringify(msg)
        return new Response(`0:${escaped}\n`, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      }
      
      // REMOVED: Duplicate document check - already handled above before sound effects
      
      // Check for presentation generation request - route to presentation API
      const presCheck = detectPresentationRequest(userContent)
      if (presCheck.isPresentationRequest) {
        try {
          const presResponse = await fetch(`${req.url.split('/api/')[0]}/api/generate-presentation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: presCheck.prompt,
              style: presCheck.style || 'professional',
              slideCount: presCheck.slideCount || 8,
              theme: 'dark',
              format: 'html'
            })
          })
          
          const presData = await presResponse.json()
          
          // API returns slides and html directly, not wrapped in presentation object
          if (presData.success && presData.slides && presData.slides.length > 0) {
            const slides = presData.slides
            const metadata = presData.metadata || {}
            const presMessage = `📊 **Presentation Generated!**\n\n` +
              `**Topic:** ${presCheck.prompt}\n` +
              `**Style:** ${metadata.style || 'professional'}\n` +
              `**Slides:** ${slides.length}\n` +
              `**Theme:** ${metadata.theme || 'dark'}\n\n` +
              `---\n\n` +
              `**Slide Outline:**\n` +
              slides.map((s: any, i: number) => `${i+1}. ${s.title || 'Slide ' + (i+1)}`).join('\n') +
              `\n\n---\n\n` +
              `**Preview HTML (first 1500 chars):**\n\n` +
              `\`\`\`html\n${(presData.html || '').substring(0, 1500)}${(presData.html || '').length > 1500 ? '\n... (truncated)' : ''}\n\`\`\`\n\n` +
              `*Generated from prompt: "${presCheck.prompt}"*`
            
            const escaped = JSON.stringify(presMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          } else {
            const failMessage = `📊 **Presentation Generation**\n\n` +
              `I attempted to create a presentation for: "${presCheck.prompt}"\n\n` +
              `${presData.error || 'Presentation generation encountered an issue.'}\n\n` +
              `**Try:**\n` +
              `- Being more specific about the topic\n` +
              `- Specifying the number of slides (e.g., "5 slide presentation")\n` +
              `- Using [Google Slides](https://slides.google.com) or [Canva](https://canva.com)`
            
            const escaped = JSON.stringify(failMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          }
        } catch (presError) {
          console.error('Presentation generation routing error:', presError)
        }
      }
      
      // Check for agent execution request - route to agents API
      const agentCheck = detectAgentRequest(userContent)
      if (agentCheck.isAgentRequest) {
        try {
          const cookieHeader = req.headers.get('cookie') || ''
          
          // Map agent type to API action
          const actionMap: Record<string, string> = {
            'task': 'execute-task',
            'research': 'research',
            'planning': 'create-plan',
            'code': 'code-task',
            'data': 'analyze'
          }
          
          const action = actionMap[agentCheck.agentType] || 'execute-task'
          
          const agentResponse = await fetch(`${req.url.split('/api/')[0]}/api/agents`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': cookieHeader
            },
            body: JSON.stringify({ 
              action: action,
              task: agentCheck.task,
              goal: agentCheck.task,
              topic: agentCheck.task,
              context: agentCheck.context,
              depth: 'medium'
            })
          })
          
          const agentData = await agentResponse.json()
          
          if (agentData.success || agentData.result || agentData.plan || agentData.research) {
            const agentIcons: Record<string, string> = {
              'task': '🤖',
              'research': '🔍',
              'planning': '📋',
              'code': '💻',
              'data': '📊'
            }
            const icon = agentIcons[agentCheck.agentType] || '🤖'
            
            let resultContent = ''
            if (agentData.result) {
              resultContent = typeof agentData.result === 'string' ? agentData.result : JSON.stringify(agentData.result, null, 2)
            } else if (agentData.plan) {
              resultContent = `**Plan:**\n${agentData.plan.steps?.map((s: any, i: number) => `${i+1}. ${s.description || s}`).join('\n') || JSON.stringify(agentData.plan, null, 2)}`
            } else if (agentData.research) {
              resultContent = `**Research Findings:**\n${agentData.research.summary || agentData.research.findings || JSON.stringify(agentData.research, null, 2)}`
            } else if (agentData.analysis) {
              resultContent = `**Analysis:**\n${agentData.analysis.insights || JSON.stringify(agentData.analysis, null, 2)}`
            } else {
              resultContent = JSON.stringify(agentData, null, 2)
            }
            
            const agentMessage = `${icon} **${agentCheck.agentType.charAt(0).toUpperCase() + agentCheck.agentType.slice(1)} Agent Executed**\n\n` +
              `**Task:** ${agentCheck.task}\n\n` +
              `---\n\n` +
              `${resultContent}\n\n` +
              `---\n\n` +
              `*Agent: ${agentCheck.agentType} | Steps: ${agentData.steps || 'N/A'} | Status: ${agentData.status || 'completed'}*`
            
            const escaped = JSON.stringify(agentMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          } else {
            const failMessage = `🤖 **Agent Execution**\n\n` +
              `I attempted to run the ${agentCheck.agentType} agent for: "${agentCheck.task}"\n\n` +
              `${agentData.error || 'Agent execution encountered an issue.'}\n\n` +
              `**Available Agents:**\n` +
              `- **Task Agent:** "agent: [your task]"\n` +
              `- **Research Agent:** "research [topic]"\n` +
              `- **Planning Agent:** "create a plan for [goal]"\n` +
              `- **Code Agent:** "debug this code: [code]"\n` +
              `- **Data Agent:** "analyze this data: [data]"`
            
            const escaped = JSON.stringify(failMessage)
            return new Response(`0:${escaped}\n`, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          }
        } catch (_agentError) {
          // Fall through to normal chat if agent API fails
        }
      }
    }

    // Get system prompt based on mode
    const systemPrompt = getSystemPrompt(mode)

    if (userId && conversationId && lastUserMessage) {
      const userContent = getMessageContent(lastUserMessage)
      try {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "user",
          content: userContent,
        })
        await supabase.from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId)
      } catch (saveErr) {
        console.error("[chat] Failed to save user message or update conversation:", saveErr)
      }
    }

    // Convert messages to model format
    let modelMessages: Array<{role: "user" | "assistant" | "system", content: string}> = []
    for (const msg of messages) {
      const msgContent = getMessageContent(msg)
      if (msgContent && (msg.role === "user" || msg.role === "assistant")) {
        modelMessages.push({ role: msg.role, content: msgContent })
      }
    }
    // Context window optimization: keep recent turns within limit
    modelMessages = truncateMessages(modelMessages, 20, 80_000)

    const routerResult = routeForChat("latency")

    // Colab backend (POST /chat): use Colab client and return a single-message stream
    if (useColabBackend()) {
      try {
        const colabMessages = [
          { role: "system" as const, content: systemPrompt },
          ...modelMessages,
        ]
        const { text } = await colabChat(colabMessages, { max_tokens: 4096 })
        const displayText = (text && text.trim()) ? text : "The model returned an empty response. Please try again or rephrase your question."
        if (userId && conversationId) {
          const supabaseForSave = await createClient()
          await supabaseForSave.from("messages").insert({
            conversation_id: conversationId,
            user_id: userId,
            role: "assistant",
            content: displayText,
          })
        }
        const stream = createUIMessageStream({
          execute: ({ writer }) => {
            const id = `colab-${Date.now()}`
            writer.write({ type: "text-start", id })
            writer.write({ type: "text-delta", id, delta: displayText })
            writer.write({ type: "text-end", id })
          },
        })
        const response = createUIMessageStreamResponse({ stream })
        const wrappedBody = wrapStreamWithQualityGates(response.body, "chat")
        return new Response(wrappedBody ?? undefined, {
          status: response.status,
          headers: response.headers,
        })
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: "Colab backend error. Check that the server is running and COLAB_AI_BASE_URL is correct.",
            details: err instanceof Error ? err.message : String(err),
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    // Nairi Router or BitNet/Colab streaming (streamWithFallback uses Router when NAIRI_ROUTER_BASE_URL is set)
    try {
      const result = await streamWithFallback({
        system: systemPrompt,
        messages: modelMessages,
        temperature: 0.7,
        maxOutputTokens: 4096,
        fast: routerResult.preferFast,
        onFinish: async ({ text }) => {
          if (userId && conversationId && text) {
            const supabaseForSave = await createClient()
            await supabaseForSave.from("messages").insert({
              conversation_id: conversationId,
              user_id: userId,
              role: "assistant",
              content: text,
            })
          }
        },
      })

      const response = result.toUIMessageStreamResponse()
      const wrappedBody = wrapStreamWithQualityGates(response.body, "chat")
      return new Response(wrappedBody ?? undefined, {
        status: response.status,
        headers: response.headers,
      })
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: "AI backend unavailable. Set NAIRI_ROUTER_BASE_URL or COLAB_AI_BASE_URL/BITNET_BASE_URL in .env, then try again.",
          details: err instanceof Error ? err.message : String(err),
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "Chat API is running" }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
