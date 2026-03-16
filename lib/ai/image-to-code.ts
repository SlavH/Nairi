/**
 * Image-to-Code System
 * Analyzes screenshots/designs and generates matching code
 */

export interface ImageAnalysis {
  layout: LayoutAnalysis;
  colors: ColorAnalysis;
  typography: TypographyAnalysis;
  components: ComponentAnalysis[];
  style: StyleAnalysis;
  generatedPrompt: string;
}

export interface LayoutAnalysis {
  type: 'single-column' | 'two-column' | 'three-column' | 'grid' | 'masonry' | 'hero-split' | 'centered';
  sections: string[];
  hasNavbar: boolean;
  hasFooter: boolean;
  hasSidebar: boolean;
  contentAlignment: 'left' | 'center' | 'right';
}

export interface ColorAnalysis {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  palette: string[];
  isDark: boolean;
}

export interface TypographyAnalysis {
  headingStyle: 'serif' | 'sans-serif' | 'display' | 'mono';
  bodyStyle: 'serif' | 'sans-serif' | 'mono';
  headingSizes: string[];
  hasCustomFonts: boolean;
}

export interface ComponentAnalysis {
  type: string;
  position: { x: number; y: number; width: number; height: number };
  properties: Record<string, any>;
  children?: ComponentAnalysis[];
}

export interface StyleAnalysis {
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  shadows: 'none' | 'subtle' | 'medium' | 'strong';
  spacing: 'compact' | 'normal' | 'spacious';
  style: 'minimal' | 'modern' | 'playful' | 'corporate' | 'glassmorphism' | 'neumorphism';
}

/**
 * Analyze an image using AI vision and generate code prompt
 */
export async function analyzeImage(imageBase64: string): Promise<ImageAnalysis> {
  // This would call an AI vision API (GPT-4V, Claude Vision, etc.)
  // For now, return a structured analysis prompt
  
  const analysisPrompt = `
Analyze this UI design image and extract:

1. LAYOUT:
   - Overall layout type (single column, two column, grid, etc.)
   - List of sections from top to bottom
   - Presence of navbar, footer, sidebar
   - Content alignment

2. COLORS:
   - Primary color (hex)
   - Secondary color (hex)
   - Accent color (hex)
   - Background color (hex)
   - Text color (hex)
   - Is it dark mode?

3. TYPOGRAPHY:
   - Heading font style (serif, sans-serif, display)
   - Body font style
   - Approximate heading sizes

4. COMPONENTS:
   - List each UI component visible
   - For each: type, approximate position, key properties

5. STYLE:
   - Border radius style (none, small, medium, large, full)
   - Shadow intensity (none, subtle, medium, strong)
   - Spacing density (compact, normal, spacious)
   - Overall design style (minimal, modern, playful, corporate, glassmorphism)

Return as structured JSON.
`;

  // Placeholder response - in production this would call vision API
  return {
    layout: {
      type: 'single-column',
      sections: ['hero', 'features', 'testimonials', 'cta', 'footer'],
      hasNavbar: true,
      hasFooter: true,
      hasSidebar: false,
      contentAlignment: 'center'
    },
    colors: {
      primary: '#6366f1',
      secondary: '#f1f5f9',
      accent: '#ec4899',
      background: '#ffffff',
      text: '#1e293b',
      palette: ['#6366f1', '#ec4899', '#f1f5f9', '#1e293b'],
      isDark: false
    },
    typography: {
      headingStyle: 'sans-serif',
      bodyStyle: 'sans-serif',
      headingSizes: ['48px', '36px', '24px', '18px'],
      hasCustomFonts: false
    },
    components: [],
    style: {
      borderRadius: 'medium',
      shadows: 'subtle',
      spacing: 'spacious',
      style: 'modern'
    },
    generatedPrompt: ''
  };
}

/**
 * Generate a detailed code prompt from image analysis
 */
export function generateCodePrompt(analysis: ImageAnalysis): string {
  const { layout, colors, typography, style } = analysis;
  
  // Convert hex to Tailwind color approximations
  const colorMapping = mapColorsToTailwind(colors);
  
  let prompt = `Create a React component with the following specifications:

## Layout
- Layout type: ${layout.type}
- Sections: ${layout.sections.join(' → ')}
- Has navbar: ${layout.hasNavbar}
- Has footer: ${layout.hasFooter}
- Content alignment: ${layout.contentAlignment}

## Colors (use these Tailwind classes)
- Primary: ${colorMapping.primary}
- Secondary: ${colorMapping.secondary}
- Accent: ${colorMapping.accent}
- Background: ${colorMapping.background}
- Text: ${colorMapping.text}
${colors.isDark ? '- Use dark mode styling' : ''}

## Typography
- Headings: font-${typography.headingStyle === 'sans-serif' ? 'sans' : typography.headingStyle}
- Body: font-${typography.bodyStyle === 'sans-serif' ? 'sans' : typography.bodyStyle}
- Use proper heading hierarchy (text-5xl for h1, text-4xl for h2, etc.)

## Style
- Border radius: ${getBorderRadiusClass(style.borderRadius)}
- Shadows: ${getShadowClass(style.shadows)}
- Spacing: ${getSpacingDescription(style.spacing)}
- Overall style: ${style.style}

## Requirements
- Make it fully responsive (mobile-first)
- Add smooth hover transitions
- Use semantic HTML
- Include proper accessibility attributes
`;

  // Add section-specific instructions
  layout.sections.forEach(section => {
    prompt += `\n### ${section.charAt(0).toUpperCase() + section.slice(1)} Section\n`;
    prompt += getSectionInstructions(section);
  });

  return prompt;
}

/**
 * Map hex colors to closest Tailwind colors
 */
function mapColorsToTailwind(colors: ColorAnalysis): Record<string, string> {
  // Simplified mapping - in production would use color distance algorithms
  const hexToTailwind: Record<string, string> = {
    '#6366f1': 'indigo-500',
    '#8b5cf6': 'violet-500',
    '#ec4899': 'pink-500',
    '#f43f5e': 'rose-500',
    '#ef4444': 'red-500',
    '#f97316': 'orange-500',
    '#eab308': 'yellow-500',
    '#22c55e': 'green-500',
    '#14b8a6': 'teal-500',
    '#06b6d4': 'cyan-500',
    '#3b82f6': 'blue-500',
    '#1e293b': 'slate-800',
    '#f1f5f9': 'slate-100',
    '#ffffff': 'white',
    '#000000': 'black'
  };

  const findClosest = (hex: string): string => {
    return hexToTailwind[hex.toLowerCase()] || 'slate-500';
  };

  return {
    primary: `bg-${findClosest(colors.primary)} text-white`,
    secondary: `bg-${findClosest(colors.secondary)}`,
    accent: `bg-${findClosest(colors.accent)}`,
    background: `bg-${findClosest(colors.background)}`,
    text: `text-${findClosest(colors.text)}`
  };
}

function getBorderRadiusClass(radius: StyleAnalysis['borderRadius']): string {
  const mapping = {
    none: 'rounded-none',
    small: 'rounded-sm',
    medium: 'rounded-lg',
    large: 'rounded-xl',
    full: 'rounded-full'
  };
  return mapping[radius];
}

function getShadowClass(shadow: StyleAnalysis['shadows']): string {
  const mapping = {
    none: 'shadow-none',
    subtle: 'shadow-sm',
    medium: 'shadow-md',
    strong: 'shadow-xl'
  };
  return mapping[shadow];
}

function getSpacingDescription(spacing: StyleAnalysis['spacing']): string {
  const mapping = {
    compact: 'Use tight spacing (p-2, p-4, gap-2)',
    normal: 'Use normal spacing (p-4, p-6, gap-4)',
    spacious: 'Use generous spacing (p-6, p-8, gap-6, lots of whitespace)'
  };
  return mapping[spacing];
}

function getSectionInstructions(section: string): string {
  const instructions: Record<string, string> = {
    hero: `- Full viewport height or min-h-[80vh]
- Centered content with max-w-4xl
- Large headline (text-5xl md:text-6xl)
- Subheadline with muted color
- Primary CTA button + secondary button
- Optional background image or gradient`,
    
    features: `- Grid layout (1 col mobile, 2-3 cols desktop)
- Feature cards with icon, title, description
- Consistent card styling
- Section title centered above`,
    
    testimonials: `- Grid or carousel layout
- Quote text with quotation marks
- Avatar image (rounded-full)
- Name and role/company
- Star rating if applicable`,
    
    pricing: `- 3 pricing tiers side by side
- Highlight recommended plan (scale, border, badge)
- Feature list with checkmarks
- CTA button for each plan
- Monthly/yearly toggle`,
    
    cta: `- Contrasting background color
- Centered text
- Compelling headline
- Single prominent CTA button`,
    
    footer: `- Multi-column layout for links
- Logo and company info
- Social media icons
- Copyright text
- Newsletter signup optional`,
    
    navbar: `- Sticky top with backdrop blur
- Logo on left
- Navigation links center or right
- CTA button on right
- Mobile hamburger menu`,
    
    faq: `- Accordion style
- Question as trigger
- Answer expands on click
- Plus/minus or chevron icon`
  };
  
  return instructions[section] || '- Follow standard patterns for this section type';
}

/**
 * Analyze a URL and extract design patterns
 */
export async function analyzeUrl(url: string): Promise<ImageAnalysis> {
  // This would:
  // 1. Take a screenshot of the URL
  // 2. Analyze the screenshot
  // 3. Also analyze the HTML/CSS if accessible
  
  // For now, return placeholder
  return analyzeImage('');
}

/**
 * Generate multiple design variants from a single analysis
 */
export function generateVariants(analysis: ImageAnalysis, count: number = 3): string[] {
  const basePrompt = generateCodePrompt(analysis);
  const variants: string[] = [];
  
  const styleVariations = [
    { name: 'Original', modifier: '' },
    { name: 'Darker', modifier: '\n\nVariation: Use a dark color scheme with dark backgrounds and light text.' },
    { name: 'Minimal', modifier: '\n\nVariation: Make it more minimal - remove shadows, use less color, more whitespace.' },
    { name: 'Playful', modifier: '\n\nVariation: Make it more playful - add gradients, rounded corners, colorful accents.' }
  ];
  
  for (let i = 0; i < Math.min(count, styleVariations.length); i++) {
    variants.push(basePrompt + styleVariations[i].modifier);
  }
  
  return variants;
}

export default {
  analyzeImage,
  analyzeUrl,
  generateCodePrompt,
  generateVariants
};
