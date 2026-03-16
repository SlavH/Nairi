/**
 * Design Brief Generation System
 * Inspired by Vercel v0's workflow
 * Generates comprehensive design plans before code generation
 */

import { generateWithFallback } from "@/lib/ai/groq-direct"

export interface DesignBrief {
  // Visual Design
  colorPalette: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    description: string
  }
  typography: {
    headingFont: string
    bodyFont: string
    fontPairing: string
  }
  
  // Layout & Structure
  sections: Array<{
    name: string
    purpose: string
    components: string[]
  }>
  
  // Content Strategy
  tone: string
  targetAudience: string
  keyMessages: string[]
  
  // Technical Decisions
  componentArchitecture: 'single-file' | 'multi-component'
  stateManagement: string[]
  animations: boolean
  responsive: boolean
  
  // Type-specific
  typeSpecific?: {
    // For websites
    navigation?: string[]
    ctaButtons?: string[]
    heroStyle?: string
    
    // For presentations
    slideCount?: number
    slideTypes?: string[]
    transitionStyle?: string
  }
}

export async function generateDesignBrief(
  type: 'website' | 'presentation',
  prompt: string,
  options?: any
): Promise<DesignBrief> {
  console.log('🎨 Generating design brief using BitNet...')
  try {
    const systemPrompt = getDesignBriefSystemPrompt(type)
    const userPrompt = buildDesignBriefPrompt(type, prompt, options)
    const { text } = await generateWithFallback({
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2000,
      temperature: 0.7,
    })
    console.log('✅ Design brief generated successfully')
    return parseDesignBrief(text, type)
  } catch (error) {
    console.error('⚠️ BitNet design brief generation failed, using fallback:', error)
    return getFallbackDesignBrief(type, prompt)
  }
}

function getDesignBriefSystemPrompt(type: string): string {
  const basePrompt = `You are an expert design strategist. Your job is to create a comprehensive design brief BEFORE any code is written.

You must analyze the user's request and output a detailed design plan in JSON format.

Your design brief must include:
1. Color palette (with hex codes and reasoning)
2. Typography (font pairing with specific font names)
3. Layout sections (what sections to include and why)
4. Content strategy (tone, audience, key messages)
5. Technical decisions (component structure, state management)

Be specific and professional. Think like a senior product designer.`

  const typeSpecific = {
    website: `

For WEBSITES, also include:
- Navigation structure
- CTA button strategy
- Hero section style
- Section order and purpose
- Form validation requirements
- Responsive breakpoints

Examples of good color palettes:
- Coffee shop: Warm browns (#8B4513, #D2691E), cream (#F5F5DC), dark text (#2C1810)
- Tech startup: Blue (#0066CC), white (#FFFFFF), gray (#F8F9FA), dark (#1A1A1A)
- Restaurant: Red (#DC143C), gold (#FFD700), white (#FFFFFF), charcoal (#36454F)
- Fitness: Energetic orange (#FF6B35), black (#000000), white (#FFFFFF)

Font pairings:
- Elegant: Playfair Display (headings) + Inter (body)
- Modern: Montserrat (headings) + Open Sans (body)
- Professional: Roboto Slab (headings) + Roboto (body)
- Creative: Poppins (headings) + Lato (body)`,
    
    presentation: `

For PRESENTATIONS, also include:
- Slide count and types (title, content, image, comparison, etc.)
- Transition style (fade, slide, none)
- Visual hierarchy rules
- Data visualization approach
- Speaker notes strategy

Slide types to consider:
- Title slide
- Agenda/Overview
- Content slides (text, bullets)
- Image slides (full-screen visuals)
- Comparison slides (side-by-side)
- Data slides (charts, graphs)
- Quote slides
- Call-to-action slide
- Thank you/Contact slide`,
    
  }

  return basePrompt + (typeSpecific[type as keyof typeof typeSpecific] || '')
}

function buildDesignBriefPrompt(type: string, prompt: string, options?: any): string {
  let fullPrompt = `Create a design brief for this ${type}:\n\n"${prompt}"\n\n`
  
  if (options?.style) fullPrompt += `Style preference: ${options.style}\n`
  if (options?.complexity) fullPrompt += `Complexity: ${options.complexity}\n`
  if (options?.audience) fullPrompt += `Target audience: ${options.audience}\n`
  
  fullPrompt += `\nOutput your design brief as a JSON object with this structure:
{
  "colorPalette": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX",
    "background": "#HEX",
    "text": "#HEX",
    "description": "Why these colors work for this ${type}"
  },
  "typography": {
    "headingFont": "Font Name",
    "bodyFont": "Font Name",
    "fontPairing": "Why this pairing works"
  },
  "sections": [
    {
      "name": "Section name",
      "purpose": "Why this section is needed",
      "components": ["Component1", "Component2"]
    }
  ],
  "tone": "Professional/Casual/Energetic/etc",
  "targetAudience": "Who this is for",
  "keyMessages": ["Message 1", "Message 2"],
  "componentArchitecture": "multi-component",
  "stateManagement": ["useState for X", "useEffect for Y"],
  "animations": true,
  "responsive": true,
  "typeSpecific": { /* type-specific fields */ }
}

Be specific with hex codes, font names, and component details.`

  return fullPrompt
}

function parseDesignBrief(briefText: string, type: string): DesignBrief {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = briefText.match(/```(?:json)?\s*([\s\S]*?)```/)
    const jsonText = jsonMatch ? jsonMatch[1] : briefText
    
    const parsed = JSON.parse(jsonText.trim())
    return parsed as DesignBrief
    
  } catch (error) {
    console.error('Failed to parse design brief:', error)
    return getFallbackDesignBrief(type, briefText)
  }
}

function getFallbackDesignBrief(type: string, prompt: string): DesignBrief {
  // Intelligent fallback based on keywords in prompt
  const lowerPrompt = prompt.toLowerCase()
  
  // Detect industry/theme from prompt
  let colorPalette = {
    primary: '#0066CC',
    secondary: '#FFFFFF',
    accent: '#FF6B35',
    background: '#F8F9FA',
    text: '#1A1A1A',
    description: 'Modern, professional color scheme'
  }
  
  let headingFont = 'Montserrat'
  let bodyFont = 'Open Sans'
  
  // Coffee/cafe theme
  if (lowerPrompt.includes('coffee') || lowerPrompt.includes('cafe') || lowerPrompt.includes('espresso')) {
    colorPalette = {
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#F5DEB3',
      background: '#FFF8DC',
      text: '#2C1810',
      description: 'Warm, inviting coffee shop colors'
    }
    headingFont = 'Playfair Display'
    bodyFont = 'Inter'
  }
  
  // Restaurant/food theme
  else if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('food') || lowerPrompt.includes('dining')) {
    colorPalette = {
      primary: '#DC143C',
      secondary: '#FFD700',
      accent: '#FFFFFF',
      background: '#F5F5F5',
      text: '#36454F',
      description: 'Appetizing restaurant colors'
    }
    headingFont = 'Playfair Display'
    bodyFont = 'Lato'
  }
  
  // Tech/startup theme
  else if (lowerPrompt.includes('tech') || lowerPrompt.includes('startup') || lowerPrompt.includes('software') || lowerPrompt.includes('app')) {
    colorPalette = {
      primary: '#0066CC',
      secondary: '#00D4FF',
      accent: '#FF6B35',
      background: '#FFFFFF',
      text: '#1A1A1A',
      description: 'Clean, modern tech colors'
    }
    headingFont = 'Poppins'
    bodyFont = 'Inter'
  }
  
  // Fitness/health theme
  else if (lowerPrompt.includes('fitness') || lowerPrompt.includes('gym') || lowerPrompt.includes('health') || lowerPrompt.includes('workout')) {
    colorPalette = {
      primary: '#FF6B35',
      secondary: '#000000',
      accent: '#00D4FF',
      background: '#FFFFFF',
      text: '#1A1A1A',
      description: 'Energetic fitness colors'
    }
    headingFont = 'Montserrat'
    bodyFont = 'Roboto'
  }
  
  const baseBrief: DesignBrief = {
    colorPalette,
    typography: {
      headingFont,
      bodyFont,
      fontPairing: `${headingFont} for headings paired with ${bodyFont} for readability`
    },
    sections: [],
    tone: 'Professional',
    targetAudience: 'General audience',
    keyMessages: ['Quality', 'Trust', 'Innovation'],
    componentArchitecture: 'multi-component',
    stateManagement: ['useState for interactive elements'],
    animations: true,
    responsive: true
  }
  
  // Type-specific sections
  if (type === 'website') {
    baseBrief.sections = [
      { name: 'Header', purpose: 'Navigation and branding', components: ['Logo', 'Nav', 'CTA'] },
      { name: 'Hero', purpose: 'Capture attention', components: ['Headline', 'Subtitle', 'CTA Buttons'] },
      { name: 'Features', purpose: 'Showcase value', components: ['Feature Cards'] },
      { name: 'About', purpose: 'Build trust', components: ['Story', 'Values'] },
      { name: 'Contact', purpose: 'Enable action', components: ['Form', 'Info Cards'] },
      { name: 'Footer', purpose: 'Additional info', components: ['Links', 'Social', 'Copyright'] }
    ]
    baseBrief.typeSpecific = {
      navigation: ['Home', 'About', 'Services', 'Contact'],
      ctaButtons: ['Get Started', 'Learn More'],
      heroStyle: 'Full-screen with background image'
    }
  }
  
  else if (type === 'presentation') {
    baseBrief.sections = [
      { name: 'Title Slide', purpose: 'Introduction', components: ['Title', 'Subtitle', 'Author'] },
      { name: 'Agenda', purpose: 'Overview', components: ['Bullet Points'] },
      { name: 'Content Slides', purpose: 'Main content', components: ['Headings', 'Text', 'Images'] },
      { name: 'Conclusion', purpose: 'Summary', components: ['Key Takeaways'] },
      { name: 'Thank You', purpose: 'Closing', components: ['Contact Info'] }
    ]
    baseBrief.typeSpecific = {
      slideCount: 8,
      slideTypes: ['title', 'agenda', 'content', 'content', 'content', 'comparison', 'conclusion', 'thankyou'],
      transitionStyle: 'fade'
    }
  }
  
  return baseBrief
}

export function designBriefToPromptEnhancement(brief: DesignBrief, type: string): string {
  let enhancement = `\n\n=== DESIGN BRIEF ===\n\n`
  
  enhancement += `COLOR PALETTE:\n`
  enhancement += `- Primary: ${brief.colorPalette.primary}\n`
  enhancement += `- Secondary: ${brief.colorPalette.secondary}\n`
  enhancement += `- Accent: ${brief.colorPalette.accent}\n`
  enhancement += `- Background: ${brief.colorPalette.background}\n`
  enhancement += `- Text: ${brief.colorPalette.text}\n`
  enhancement += `Reasoning: ${brief.colorPalette.description}\n\n`
  
  enhancement += `TYPOGRAPHY:\n`
  enhancement += `- Headings: ${brief.typography.headingFont}\n`
  enhancement += `- Body: ${brief.typography.bodyFont}\n`
  enhancement += `Pairing: ${brief.typography.fontPairing}\n\n`
  
  enhancement += `SECTIONS TO INCLUDE:\n`
  brief.sections.forEach((section, i) => {
    enhancement += `${i + 1}. ${section.name} - ${section.purpose}\n`
    enhancement += `   Components: ${section.components.join(', ')}\n`
  })
  enhancement += `\n`
  
  enhancement += `TONE: ${brief.tone}\n`
  enhancement += `TARGET AUDIENCE: ${brief.targetAudience}\n`
  enhancement += `KEY MESSAGES: ${brief.keyMessages.join(', ')}\n\n`
  
  enhancement += `TECHNICAL REQUIREMENTS:\n`
  enhancement += `- Architecture: ${brief.componentArchitecture}\n`
  enhancement += `- State: ${brief.stateManagement.join(', ')}\n`
  enhancement += `- Animations: ${brief.animations ? 'Yes' : 'No'}\n`
  enhancement += `- Responsive: ${brief.responsive ? 'Yes' : 'No'}\n`
  
  if (brief.typeSpecific) {
    enhancement += `\nTYPE-SPECIFIC DETAILS:\n`
    enhancement += JSON.stringify(brief.typeSpecific, null, 2)
  }
  
  enhancement += `\n\n=== END DESIGN BRIEF ===\n\n`
  enhancement += `Now generate the ${type} following this design brief EXACTLY. Use the specified colors, fonts, sections, and components.`
  
  return enhancement
}
