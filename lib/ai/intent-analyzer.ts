/**
 * Intent Analyzer - Understands user requests better
 * Classifies intent, extracts requirements, asks clarifying questions
 */

export type IntentType = 
  | 'create'      // Create new component/page
  | 'modify'      // Change existing code
  | 'fix'         // Fix an error
  | 'explain'     // Explain code
  | 'optimize'    // Improve performance/accessibility
  | 'style'       // Change visual appearance
  | 'animate'     // Add animations
  | 'integrate'   // Add API/database/auth
  | 'clone'       // Recreate from reference
  | 'unclear';    // Need clarification

export type ComponentType = 
  | 'landing-page' | 'dashboard' | 'form' | 'table' | 'card' 
  | 'navbar' | 'footer' | 'sidebar' | 'modal' | 'hero'
  | 'pricing' | 'features' | 'testimonials' | 'cta' | 'faq'
  | 'auth' | 'profile' | 'settings' | 'checkout' | 'blog'
  | 'gallery' | 'carousel' | 'tabs' | 'accordion' | 'unknown';

export type DesignStyle = 
  | 'minimalist' | 'modern' | 'playful' | 'corporate' | 'futuristic'
  | 'elegant' | 'bold' | 'clean' | 'dark' | 'light' | 'glassmorphism'
  | 'neumorphism' | 'brutalist' | 'retro' | 'gradient';

export type BrandReference = 
  | 'apple' | 'stripe' | 'linear' | 'notion' | 'vercel' 
  | 'airbnb' | 'spotify' | 'twitter' | 'github' | 'figma'
  | 'slack' | 'discord' | 'shopify' | 'custom';

export interface AnalyzedIntent {
  type: IntentType;
  confidence: number;
  componentTypes: ComponentType[];
  designStyle?: DesignStyle;
  brandReference?: BrandReference;
  requirements: {
    responsive: boolean;
    animated: boolean;
    accessible: boolean;
    darkMode: boolean;
    interactive: boolean;
  };
  extractedFeatures: string[];
  suggestedClarifications: ClarificationQuestion[];
  enhancedPrompt: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
  type: 'choice' | 'text' | 'boolean';
  importance: 'required' | 'recommended' | 'optional';
}

// Keywords for intent classification
const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  create: ['create', 'build', 'make', 'generate', 'new', 'add', 'design', 'develop'],
  modify: ['change', 'update', 'modify', 'edit', 'adjust', 'alter', 'tweak'],
  fix: ['fix', 'repair', 'solve', 'debug', 'error', 'bug', 'broken', 'not working'],
  explain: ['explain', 'how', 'why', 'what', 'understand', 'describe'],
  optimize: ['optimize', 'improve', 'faster', 'better', 'performance', 'seo', 'accessibility'],
  style: ['style', 'color', 'font', 'theme', 'look', 'appearance', 'visual', 'css'],
  animate: ['animate', 'animation', 'motion', 'transition', 'hover', 'scroll'],
  integrate: ['api', 'database', 'auth', 'connect', 'integrate', 'backend', 'fetch'],
  clone: ['like', 'similar', 'copy', 'clone', 'recreate', 'inspired'],
  unclear: []
};

// Component detection patterns
const COMPONENT_PATTERNS: Record<ComponentType, string[]> = {
  'landing-page': ['landing', 'homepage', 'home page', 'main page'],
  'dashboard': ['dashboard', 'admin', 'analytics', 'overview'],
  'form': ['form', 'input', 'submit', 'contact', 'signup', 'login'],
  'table': ['table', 'data grid', 'list', 'spreadsheet'],
  'card': ['card', 'tile', 'box'],
  'navbar': ['navbar', 'navigation', 'header', 'menu', 'nav'],
  'footer': ['footer', 'bottom'],
  'sidebar': ['sidebar', 'side menu', 'drawer'],
  'modal': ['modal', 'popup', 'dialog', 'overlay'],
  'hero': ['hero', 'banner', 'header section', 'above fold'],
  'pricing': ['pricing', 'plans', 'subscription', 'tiers'],
  'features': ['features', 'benefits', 'capabilities'],
  'testimonials': ['testimonials', 'reviews', 'quotes', 'feedback'],
  'cta': ['cta', 'call to action', 'signup', 'get started'],
  'faq': ['faq', 'questions', 'help', 'support'],
  'auth': ['auth', 'login', 'signup', 'register', 'password'],
  'profile': ['profile', 'account', 'user page'],
  'settings': ['settings', 'preferences', 'configuration'],
  'checkout': ['checkout', 'cart', 'payment', 'order'],
  'blog': ['blog', 'article', 'post', 'news'],
  'gallery': ['gallery', 'images', 'photos', 'portfolio'],
  'carousel': ['carousel', 'slider', 'slideshow'],
  'tabs': ['tabs', 'tabbed'],
  'accordion': ['accordion', 'collapsible', 'expandable'],
  'unknown': []
};

// Style detection
const STYLE_KEYWORDS: Record<DesignStyle, string[]> = {
  minimalist: ['minimalist', 'minimal', 'simple', 'clean', 'basic'],
  modern: ['modern', 'contemporary', 'current', 'trendy'],
  playful: ['playful', 'fun', 'colorful', 'vibrant', 'cheerful'],
  corporate: ['corporate', 'professional', 'business', 'enterprise'],
  futuristic: ['futuristic', 'sci-fi', 'tech', 'cyber', 'neon'],
  elegant: ['elegant', 'luxury', 'premium', 'sophisticated'],
  bold: ['bold', 'strong', 'impactful', 'striking'],
  clean: ['clean', 'crisp', 'neat', 'organized'],
  dark: ['dark', 'dark mode', 'night', 'black'],
  light: ['light', 'light mode', 'bright', 'white'],
  glassmorphism: ['glass', 'glassmorphism', 'frosted', 'blur'],
  neumorphism: ['neumorphism', 'soft ui', 'neumorphic'],
  brutalist: ['brutalist', 'raw', 'harsh'],
  retro: ['retro', 'vintage', 'nostalgic', '80s', '90s'],
  gradient: ['gradient', 'colorful', 'rainbow']
};

// Brand references
const BRAND_KEYWORDS: Record<BrandReference, string[]> = {
  apple: ['apple', 'ios', 'macos'],
  stripe: ['stripe'],
  linear: ['linear'],
  notion: ['notion'],
  vercel: ['vercel', 'next.js'],
  airbnb: ['airbnb'],
  spotify: ['spotify'],
  twitter: ['twitter', 'x.com'],
  github: ['github'],
  figma: ['figma'],
  slack: ['slack'],
  discord: ['discord'],
  shopify: ['shopify'],
  custom: []
};

/**
 * Analyze user prompt and extract intent, requirements, and suggestions
 */
export function analyzeIntent(prompt: string): AnalyzedIntent {
  const lowerPrompt = prompt.toLowerCase();
  
  // Classify intent
  const intentScores = Object.entries(INTENT_KEYWORDS).map(([intent, keywords]) => {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (lowerPrompt.includes(keyword) ? 1 : 0);
    }, 0);
    return { intent: intent as IntentType, score };
  });
  
  const topIntent = intentScores.sort((a, b) => b.score - a.score)[0];
  const intentType = topIntent.score > 0 ? topIntent.intent : 'create'; // Default to create
  
  // Detect component types
  const componentTypes: ComponentType[] = [];
  Object.entries(COMPONENT_PATTERNS).forEach(([component, patterns]) => {
    if (patterns.some(pattern => lowerPrompt.includes(pattern))) {
      componentTypes.push(component as ComponentType);
    }
  });
  if (componentTypes.length === 0) componentTypes.push('unknown');
  
  // Detect design style
  let designStyle: DesignStyle | undefined;
  for (const [style, keywords] of Object.entries(STYLE_KEYWORDS)) {
    if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
      designStyle = style as DesignStyle;
      break;
    }
  }
  
  // Detect brand reference
  let brandReference: BrandReference | undefined;
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
      brandReference = brand as BrandReference;
      break;
    }
  }
  
  // Extract requirements
  const requirements = {
    responsive: lowerPrompt.includes('responsive') || lowerPrompt.includes('mobile') || !lowerPrompt.includes('desktop only'),
    animated: lowerPrompt.includes('animat') || lowerPrompt.includes('motion') || lowerPrompt.includes('transition'),
    accessible: lowerPrompt.includes('accessible') || lowerPrompt.includes('a11y') || lowerPrompt.includes('wcag'),
    darkMode: lowerPrompt.includes('dark') || lowerPrompt.includes('theme'),
    interactive: lowerPrompt.includes('interactive') || lowerPrompt.includes('click') || lowerPrompt.includes('hover')
  };
  
  // Extract specific features mentioned
  const featurePatterns = [
    /with\s+(.+?)(?:\s+and|\s*,|\s*$)/gi,
    /including\s+(.+?)(?:\s+and|\s*,|\s*$)/gi,
    /that\s+has\s+(.+?)(?:\s+and|\s*,|\s*$)/gi,
    /featuring\s+(.+?)(?:\s+and|\s*,|\s*$)/gi
  ];
  
  const extractedFeatures: string[] = [];
  featurePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      extractedFeatures.push(match[1].trim());
    }
  });
  
  // Generate clarification questions
  const clarifications = generateClarifications(intentType, componentTypes, designStyle, requirements);
  
  // Generate enhanced prompt
  const enhancedPrompt = generateEnhancedPrompt(prompt, intentType, componentTypes, designStyle, brandReference, requirements);
  
  return {
    type: intentType,
    confidence: Math.min(topIntent.score / 3, 1), // Normalize to 0-1
    componentTypes,
    designStyle,
    brandReference,
    requirements,
    extractedFeatures,
    suggestedClarifications: clarifications,
    enhancedPrompt
  };
}

/**
 * Generate clarification questions based on analysis
 */
function generateClarifications(
  intent: IntentType,
  components: ComponentType[],
  style?: DesignStyle,
  requirements?: AnalyzedIntent['requirements']
): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];
  
  // Style clarification
  if (!style) {
    questions.push({
      id: 'style',
      question: 'What visual style would you prefer?',
      options: ['Minimalist', 'Modern', 'Playful', 'Corporate', 'Dark Mode', 'Glassmorphism'],
      type: 'choice',
      importance: 'recommended'
    });
  }
  
  // Color scheme
  questions.push({
    id: 'colors',
    question: 'Do you have a preferred color scheme?',
    options: ['Blue/Professional', 'Purple/Creative', 'Green/Nature', 'Orange/Energy', 'Custom'],
    type: 'choice',
    importance: 'optional'
  });
  
  // Component-specific questions
  if (components.includes('landing-page')) {
    questions.push({
      id: 'sections',
      question: 'Which sections should the landing page include?',
      options: ['Hero', 'Features', 'Pricing', 'Testimonials', 'FAQ', 'CTA'],
      type: 'choice',
      importance: 'recommended'
    });
  }
  
  if (components.includes('form')) {
    questions.push({
      id: 'validation',
      question: 'Should the form include validation?',
      type: 'boolean',
      importance: 'recommended'
    });
  }
  
  if (components.includes('dashboard')) {
    questions.push({
      id: 'charts',
      question: 'What type of data visualizations do you need?',
      options: ['Charts', 'Tables', 'Stats Cards', 'All of the above'],
      type: 'choice',
      importance: 'recommended'
    });
  }
  
  // Animation clarification
  if (requirements?.animated) {
    questions.push({
      id: 'animation-level',
      question: 'How much animation do you want?',
      options: ['Subtle (hover effects)', 'Moderate (transitions)', 'Rich (scroll animations)', 'Maximum (everything animated)'],
      type: 'choice',
      importance: 'optional'
    });
  }
  
  return questions;
}

/**
 * Generate an enhanced prompt with more specific instructions
 */
function generateEnhancedPrompt(
  originalPrompt: string,
  intent: IntentType,
  components: ComponentType[],
  style?: DesignStyle,
  brand?: BrandReference,
  requirements?: AnalyzedIntent['requirements']
): string {
  const enhancements: string[] = [];
  
  // Add design system instructions
  enhancements.push('Use a consistent design system with:');
  enhancements.push('- 8px spacing grid (p-2, p-4, p-6, p-8)');
  enhancements.push('- Proper typography hierarchy (text-sm, text-base, text-lg, text-xl, text-2xl)');
  enhancements.push('- Consistent border radius (rounded-md or rounded-lg)');
  
  // Add style-specific instructions
  if (style) {
    const styleInstructions: Record<DesignStyle, string> = {
      minimalist: 'Use lots of whitespace, limited colors, simple shapes',
      modern: 'Use subtle shadows, rounded corners, clean typography',
      playful: 'Use vibrant colors, rounded shapes, fun micro-interactions',
      corporate: 'Use professional colors (blue, gray), structured layouts, formal typography',
      futuristic: 'Use neon accents, dark backgrounds, glowing effects',
      elegant: 'Use serif fonts, muted colors, generous spacing',
      bold: 'Use large typography, strong contrasts, impactful colors',
      clean: 'Use minimal decoration, clear hierarchy, ample whitespace',
      dark: 'Use dark backgrounds (slate-900, zinc-900), light text, subtle borders',
      light: 'Use white/light backgrounds, dark text, subtle shadows',
      glassmorphism: 'Use backdrop-blur, semi-transparent backgrounds, subtle borders',
      neumorphism: 'Use soft shadows, same-color backgrounds, subtle depth',
      brutalist: 'Use raw borders, monospace fonts, high contrast',
      retro: 'Use vintage colors, pixel fonts, nostalgic elements',
      gradient: 'Use gradient backgrounds, colorful accents, smooth transitions'
    };
    enhancements.push(`Style: ${styleInstructions[style]}`);
  }
  
  // Add brand-specific instructions
  if (brand && brand !== 'custom') {
    const brandStyles: Record<Exclude<BrandReference, 'custom'>, string> = {
      apple: 'Clean, minimal, lots of whitespace, SF Pro font style, subtle animations',
      stripe: 'Gradient accents, clean typography, professional yet modern, purple/blue tones',
      linear: 'Dark mode, purple accents, smooth animations, minimal UI',
      notion: 'Clean, black and white, simple icons, readable typography',
      vercel: 'Black and white, geometric shapes, modern sans-serif',
      airbnb: 'Rounded shapes, coral accents, friendly typography, card-based layouts',
      spotify: 'Dark theme, green accents, bold typography, music-inspired',
      twitter: 'Blue accents, rounded corners, clean feed layout',
      github: 'Clean, functional, monospace for code, blue links',
      figma: 'Colorful, playful, rounded corners, collaborative feel',
      slack: 'Colorful sidebar, clean messages, friendly icons',
      discord: 'Dark theme, purple accents, gaming-inspired',
      shopify: 'Green accents, e-commerce focused, trust-building elements'
    };
    enhancements.push(`Brand inspiration: ${brandStyles[brand]}`);
  }
  
  // Add requirement-specific instructions
  if (requirements?.responsive) {
    enhancements.push('Make fully responsive: mobile-first, use sm:, md:, lg: breakpoints');
  }
  if (requirements?.animated) {
    enhancements.push('Add smooth animations: hover states, transitions, entrance animations');
  }
  if (requirements?.accessible) {
    enhancements.push('Ensure accessibility: proper ARIA labels, keyboard navigation, color contrast');
  }
  if (requirements?.darkMode) {
    enhancements.push('Support dark mode: use dark: variants for all colors');
  }
  
  // Add component-specific best practices
  components.forEach(component => {
    const componentTips: Partial<Record<ComponentType, string>> = {
      'landing-page': 'Include: compelling hero, clear value proposition, social proof, strong CTA',
      'dashboard': 'Include: stats overview, data visualizations, recent activity, quick actions',
      'form': 'Include: clear labels, validation feedback, loading states, success message',
      'pricing': 'Include: feature comparison, recommended plan highlight, annual/monthly toggle',
      'hero': 'Include: headline, subheadline, CTA button, optional image/illustration'
    };
    if (componentTips[component]) {
      enhancements.push(componentTips[component]!);
    }
  });
  
  return `${originalPrompt}\n\n--- Enhanced Instructions ---\n${enhancements.join('\n')}`;
}

/**
 * Generate multiple design variants based on the same prompt
 */
export function generateVariantPrompts(basePrompt: string, count: number = 3): string[] {
  const variants: string[] = [];
  const styles: DesignStyle[] = ['minimalist', 'modern', 'bold'];
  
  for (let i = 0; i < count; i++) {
    const style = styles[i % styles.length];
    variants.push(`${basePrompt}\n\nDesign variant ${i + 1}: Use a ${style} style approach.`);
  }
  
  return variants;
}

/**
 * Detect if the prompt needs clarification
 */
export function needsClarification(analysis: AnalyzedIntent): boolean {
  return (
    analysis.confidence < 0.3 ||
    analysis.type === 'unclear' ||
    (analysis.componentTypes.length === 1 && analysis.componentTypes[0] === 'unknown')
  );
}

export default {
  analyzeIntent,
  generateVariantPrompts,
  needsClarification
};
