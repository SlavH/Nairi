// ============================================================================
// 🎨 DESIGN INTELLIGENCE - UI/UX Best Practices
// ============================================================================
// Extracted from app/api/builder-v2/generate/route.ts for better maintainability

export const DESIGN_INTELLIGENCE = {
  colorTheory: {
    dark: {
      background: 'bg-gray-900 or bg-slate-900 or bg-zinc-900',
      text: 'text-white or text-gray-100',
      accent: 'Use vibrant colors for CTAs: blue-500, purple-500, emerald-500',
      borders: 'border-gray-700 or border-gray-800'
    },
    light: {
      background: 'bg-white or bg-gray-50',
      text: 'text-gray-900 or text-slate-800',
      accent: 'Use saturated colors: blue-600, indigo-600, violet-600',
      borders: 'border-gray-200 or border-gray-300'
    }
  },
  
  layoutPatterns: {
    'e-commerce': 'Header with search/cart, sidebar filters, product grid (3-4 cols), product cards with price/CTA, sticky footer. Include add-to-cart, categories, and clear CTAs.',
    'dashboard': 'Sidebar navigation, top header with user menu, main content with cards/charts/tables. Include KPIs, data viz placeholders, and clear section hierarchy.',
    'portfolio': 'Hero section, project grid with images/links, about section, contact form. Emphasize visual showcase and case studies.',
    'landing': 'Hero with CTA, features grid, testimonials, pricing (if applicable), footer. Single-page conversion focus.',
    'social': 'Header, 3-column layout (nav, feed, suggestions), infinite scroll. Feed items, avatars, likes/shares placeholders.',
    'blog': 'Header, featured post, post grid, sidebar with categories/tags. Article cards with excerpt, date, author.',
    'saas': 'Hero with value prop and CTA, features/benefits, pricing tiers, testimonials, FAQ, footer. Product-focused and conversion-oriented.',
    'docs': 'Sidebar with nav tree, main content area for articles, breadcrumbs, search placeholder. Clear hierarchy and scannable headings.',
    'marketing': 'Hero, social proof, features, testimonials, CTA sections, footer. Strong headlines and conversion elements.',
    'education': 'Course/list layout, progress or modules, clear CTAs. Can include syllabus, instructor, or lesson cards.',
    'real-estate': 'Hero with search/filters, property grid with images/price/location, filters sidebar, listing cards, contact CTA.',
    'restaurant': 'Hero, menu sections, gallery, location/hours, reservation CTA, footer. Food imagery and clear menu structure.',
    'event': 'Hero with event details, schedule, speakers/lineup, venue info, tickets CTA, footer.',
    'help-center': 'Search, categories, article list or accordion FAQ, contact option. Scannable and search-oriented.',
    'other': 'Hero or header, main content sections appropriate to the request, clear navigation and footer. Adapt layout to user intent.'
  },
  
  responsiveBreakpoints: {
    mobile: 'sm: (min-width: 640px)',
    tablet: 'md: (min-width: 768px)',
    desktop: 'lg: (min-width: 1024px)',
    wide: 'xl: (min-width: 1280px)'
  },
  
  accessibilityRules: [
    'Use semantic HTML elements (nav, main, article, section)',
    'Ensure color contrast ratio of at least 4.5:1',
    'Add aria-labels to interactive elements',
    'Make all interactive elements keyboard accessible',
    'Use focus-visible for focus states'
  ],
  
  animationGuidelines: [
    'Use transition-all duration-200 for hover effects',
    'Use transform scale for button hovers: hover:scale-105',
    'Add subtle shadows on hover: hover:shadow-lg',
    'Use opacity transitions for fade effects'
  ],
  fascinationMandate: [
    'Every page must feel VEEERY FASCINATING—memorable, bold, never generic.',
    'Pick one strong aesthetic per project: editorial, dark luxury, warm organic, tech neon, brutalist, soft pastel, etc.',
    'Use distinctive typography (display + body contrast; avoid default Inter/Roboto unless it fits).',
    'Bold palette with sharp accents—e.g. deep teal + gold, clay + sage, noir + electric blue.',
    'At least one "wow" moment: animated gradient text, floating blobs, 3D tilt, scroll-triggered reveal, or striking hero.'
  ]
} as const

/**
 * Get design guidance for a specific website type and color scheme
 * @param websiteType - Type of website (e-commerce, dashboard, portfolio, etc.)
 * @param colorScheme - Color scheme preference (dark, light, or null for default)
 * @returns Formatted design guidance string
 */
export function getDesignGuidance(websiteType: string, colorScheme: string | null): string {
  const layout = DESIGN_INTELLIGENCE.layoutPatterns[websiteType as keyof typeof DESIGN_INTELLIGENCE.layoutPatterns] 
    || DESIGN_INTELLIGENCE.layoutPatterns['landing']
  const colors = colorScheme === 'dark' 
    ? DESIGN_INTELLIGENCE.colorTheory.dark 
    : DESIGN_INTELLIGENCE.colorTheory.light
  
  return `
## DESIGN GUIDANCE FOR THIS PROJECT (VEEERY FASCINATING)

Make this site unforgettable. Distinctive typography, bold palette, unexpected layout, at least one wow moment. Never generic.

### Fascination Mandate:
${DESIGN_INTELLIGENCE.fascinationMandate.map(m => `- ${m}`).join('\n')}

### Layout Pattern:
${layout}

### Color Scheme:
- Background: ${colors.background}
- Text: ${colors.text}
- Accent/CTA: ${colors.accent}
- Borders: ${colors.borders}

### Responsive Design:
- Mobile-first approach
- Use grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 for grids
- Stack elements vertically on mobile, horizontally on desktop

### Accessibility:
${DESIGN_INTELLIGENCE.accessibilityRules.map(r => `- ${r}`).join('\n')}

### Animations:
${DESIGN_INTELLIGENCE.animationGuidelines.map(r => `- ${r}`).join('\n')}
`
}
