"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sparkles,
  Palette,
  Layout,
  Zap,
  Image,
  Type,
  MousePointer,
  Smartphone,
  RefreshCw,
  ChevronRight,
  Wand2,
  Shield,
  Database,
  Globe,
  Search,
  Share2,
  Bell,
  ShoppingCart,
  Users,
  BarChart3,
  Lock,
  Accessibility,
  Gauge,
  Code2,
  Layers,
  Moon,
  Sun,
  Video,
  Music,
  Map,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PromptSuggestionsProps {
  currentCode: string
  onSelectSuggestion: (suggestion: string) => void
  isGenerating?: boolean
}

interface Suggestion {
  id: string
  text: string
  category: SuggestionCategory
  icon: React.ReactNode
  priority: number
  tags?: string[]
}

type SuggestionCategory = 
  | 'enhance' 
  | 'add' 
  | 'style' 
  | 'animate' 
  | 'fix' 
  | 'seo' 
  | 'performance' 
  | 'accessibility'
  | 'integration'
  | 'ai'

// Enhanced code analysis
function analyzeCurrentWebsite(code: string): {
  // Structure
  hasHeader: boolean
  hasHero: boolean
  hasFeatures: boolean
  hasCTA: boolean
  hasFooter: boolean
  hasTestimonials: boolean
  hasPricing: boolean
  hasContact: boolean
  hasFAQ: boolean
  hasTeam: boolean
  hasBlog: boolean
  hasGallery: boolean
  // Styling
  hasAnimations: boolean
  hasGradients: boolean
  hasDarkMode: boolean
  hasImages: boolean
  hasGlassmorphism: boolean
  has3DEffects: boolean
  hasParallax: boolean
  // Functionality
  hasMobileNav: boolean
  hasSearch: boolean
  hasAuth: boolean
  hasCart: boolean
  hasNotifications: boolean
  hasSocialShare: boolean
  hasNewsletter: boolean
  hasChat: boolean
  hasMap: boolean
  hasVideo: boolean
  hasCalendar: boolean
  // Technical
  hasSEO: boolean
  hasAccessibility: boolean
  hasLazyLoading: boolean
  hasErrorBoundary: boolean
  hasLoadingStates: boolean
  // Metrics
  componentCount: number
  lineCount: number
  complexity: 'simple' | 'medium' | 'complex'
} {
  const codeLower = code.toLowerCase()
  const lineCount = code.split('\n').length
  const componentCount = (code.match(/function\s+[A-Z]/g) || []).length
  
  return {
    // Structure
    hasHeader: codeLower.includes('header') || codeLower.includes('navbar') || codeLower.includes('nav'),
    hasHero: codeLower.includes('hero') || (codeLower.includes('h1') && codeLower.includes('button')),
    hasFeatures: codeLower.includes('feature') || (codeLower.includes('grid') && codeLower.includes('card')),
    hasCTA: codeLower.includes('cta') || codeLower.includes('call to action') || codeLower.includes('get started'),
    hasFooter: codeLower.includes('footer'),
    hasTestimonials: codeLower.includes('testimonial') || codeLower.includes('review') || codeLower.includes('quote'),
    hasPricing: codeLower.includes('pricing') || codeLower.includes('price') || codeLower.includes('plan'),
    hasContact: codeLower.includes('contact') || codeLower.includes('form') || codeLower.includes('email'),
    hasFAQ: codeLower.includes('faq') || codeLower.includes('accordion') || codeLower.includes('frequently'),
    hasTeam: codeLower.includes('team') || codeLower.includes('member') || codeLower.includes('staff'),
    hasBlog: codeLower.includes('blog') || codeLower.includes('article') || codeLower.includes('post'),
    hasGallery: codeLower.includes('gallery') || codeLower.includes('portfolio') || codeLower.includes('showcase'),
    // Styling
    hasAnimations: codeLower.includes('animate-') || codeLower.includes('transition') || codeLower.includes('hover:scale'),
    hasGradients: codeLower.includes('gradient') || (codeLower.includes('from-') && codeLower.includes('to-')),
    hasDarkMode: codeLower.includes('dark:') || codeLower.includes('bg-gray-900') || codeLower.includes('bg-black'),
    hasImages: codeLower.includes('<img') || codeLower.includes('image') || codeLower.includes('picsum'),
    hasGlassmorphism: codeLower.includes('backdrop-blur') || codeLower.includes('bg-white/') || codeLower.includes('glass'),
    has3DEffects: codeLower.includes('perspective') || codeLower.includes('rotate') || codeLower.includes('transform-3d'),
    hasParallax: codeLower.includes('parallax') || (codeLower.includes('scroll') && codeLower.includes('transform')),
    // Functionality
    hasMobileNav: codeLower.includes('md:hidden') || codeLower.includes('mobile') || codeLower.includes('hamburger'),
    hasSearch: codeLower.includes('search') || codeLower.includes('filter'),
    hasAuth: codeLower.includes('login') || codeLower.includes('signup') || codeLower.includes('auth'),
    hasCart: codeLower.includes('cart') || codeLower.includes('checkout') || codeLower.includes('basket'),
    hasNotifications: codeLower.includes('notification') || codeLower.includes('toast') || codeLower.includes('alert'),
    hasSocialShare: codeLower.includes('share') || codeLower.includes('twitter') || codeLower.includes('facebook'),
    hasNewsletter: codeLower.includes('newsletter') || codeLower.includes('subscribe') || codeLower.includes('mailchimp'),
    hasChat: codeLower.includes('chat') || codeLower.includes('message') || codeLower.includes('support'),
    hasMap: codeLower.includes('map') || codeLower.includes('location') || codeLower.includes('google maps'),
    hasVideo: codeLower.includes('video') || codeLower.includes('youtube') || codeLower.includes('vimeo'),
    hasCalendar: codeLower.includes('calendar') || codeLower.includes('booking') || codeLower.includes('schedule'),
    // Technical
    hasSEO: codeLower.includes('metadata') || codeLower.includes('og:') || codeLower.includes('description'),
    hasAccessibility: codeLower.includes('aria-') || codeLower.includes('role=') || codeLower.includes('sr-only'),
    hasLazyLoading: codeLower.includes('lazy') || codeLower.includes('suspense') || codeLower.includes('loading='),
    hasErrorBoundary: codeLower.includes('errorboundary') || (codeLower.includes('error') && codeLower.includes('catch')),
    hasLoadingStates: codeLower.includes('loading') || codeLower.includes('skeleton') || codeLower.includes('spinner'),
    // Metrics
    componentCount,
    lineCount,
    complexity: lineCount < 100 ? 'simple' : lineCount < 500 ? 'medium' : 'complex'
  }
}

// Generate contextual suggestions based on current website state
function generateSuggestions(analysis: ReturnType<typeof analyzeCurrentWebsite>): Suggestion[] {
  const suggestions: Suggestion[] = []
  
  // ===== MAKE IT POP — add wow element when page exists but lacks gradient/animation/glass =====
  const lacksWow = !analysis.hasAnimations && !analysis.hasGradients && !analysis.hasGlassmorphism
  if (analysis.lineCount > 80 && lacksWow) {
    suggestions.push({
      id: 'make-it-pop',
      text: 'Make it pop: add gradient text, animation, hover:scale, or glassmorphism',
      category: 'style',
      icon: <Sparkles className="h-3 w-3" />,
      priority: 99,
      tags: ['wow', 'visual', 'quick']
    })
  }

  // ===== VIRAL / AD-STYLE QUICK STARTERS (when empty or minimal code) =====
  if (analysis.lineCount < 100) {
    suggestions.push({
      id: 'viral-landing',
      text: 'Create a viral-style landing that stops the scroll',
      category: 'style',
      icon: <TrendingUp className="h-3 w-3" />,
      priority: 98,
      tags: ['viral', 'landing', 'quick-start']
    })
    suggestions.push({
      id: 'mind-blown-hero',
      text: 'Mind-blown hero with gradient text and one CTA',
      category: 'style',
      icon: <Sparkles className="h-3 w-3" />,
      priority: 97,
      tags: ['viral', 'hero', 'quick-start']
    })
  }
  
  // ===== ESSENTIAL STRUCTURE =====
  if (!analysis.hasHeader) {
    suggestions.push({
      id: 'add-header',
      text: 'Add a sticky navigation header with logo and menu',
      category: 'add',
      icon: <Layout className="h-3 w-3" />,
      priority: 100,
      tags: ['essential', 'navigation']
    })
  }
  
  if (!analysis.hasHero) {
    suggestions.push({
      id: 'add-hero',
      text: 'Create a stunning hero section with headline and CTA',
      category: 'add',
      icon: <Sparkles className="h-3 w-3" />,
      priority: 95,
      tags: ['essential', 'conversion']
    })
  }
  
  if (!analysis.hasFooter) {
    suggestions.push({
      id: 'add-footer',
      text: 'Add a professional footer with links and social icons',
      category: 'add',
      icon: <Layout className="h-3 w-3" />,
      priority: 50,
      tags: ['essential']
    })
  }

  // ===== MOBILE & RESPONSIVE =====
  if (!analysis.hasMobileNav && analysis.hasHeader) {
    suggestions.push({
      id: 'add-mobile',
      text: 'Add mobile-responsive hamburger menu',
      category: 'fix',
      icon: <Smartphone className="h-3 w-3" />,
      priority: 85,
      tags: ['mobile', 'responsive']
    })
  }

  // ===== VISUAL ENHANCEMENTS =====
  if (!analysis.hasAnimations) {
    suggestions.push({
      id: 'add-animations',
      text: 'Add smooth animations and micro-interactions',
      category: 'animate',
      icon: <Zap className="h-3 w-3" />,
      priority: 80,
      tags: ['visual', 'ux']
    })
  }
  
  if (!analysis.hasGradients) {
    suggestions.push({
      id: 'add-gradients',
      text: 'Add beautiful gradient backgrounds and accents',
      category: 'style',
      icon: <Palette className="h-3 w-3" />,
      priority: 70,
      tags: ['visual', 'modern']
    })
  }

  if (!analysis.hasGlassmorphism && analysis.complexity !== 'simple') {
    suggestions.push({
      id: 'add-glass',
      text: 'Add glassmorphism effects for modern look',
      category: 'style',
      icon: <Layers className="h-3 w-3" />,
      priority: 65,
      tags: ['visual', 'trendy']
    })
  }

  if (!analysis.hasDarkMode) {
    suggestions.push({
      id: 'add-darkmode',
      text: 'Add dark mode toggle with smooth transition',
      category: 'style',
      icon: <Moon className="h-3 w-3" />,
      priority: 60,
      tags: ['accessibility', 'ux']
    })
  }

  if (!analysis.hasParallax && analysis.hasHero) {
    suggestions.push({
      id: 'add-parallax',
      text: 'Add parallax scrolling effects',
      category: 'animate',
      icon: <Layers className="h-3 w-3" />,
      priority: 55,
      tags: ['visual', 'scroll']
    })
  }
  
  if (!analysis.hasImages) {
    suggestions.push({
      id: 'add-images',
      text: 'Add high-quality images and visual elements',
      category: 'enhance',
      icon: <Image className="h-3 w-3" />,
      priority: 75,
      tags: ['visual', 'content']
    })
  }

  // ===== CONTENT SECTIONS =====
  if (!analysis.hasFeatures && analysis.hasHero) {
    suggestions.push({
      id: 'add-features',
      text: 'Add a features section with icons and descriptions',
      category: 'add',
      icon: <Layout className="h-3 w-3" />,
      priority: 70,
      tags: ['content', 'conversion']
    })
  }
  
  if (!analysis.hasTestimonials && analysis.componentCount > 2) {
    suggestions.push({
      id: 'add-testimonials',
      text: 'Add customer testimonials with avatars and ratings',
      category: 'add',
      icon: <Star className="h-3 w-3" />,
      priority: 65,
      tags: ['social-proof', 'conversion']
    })
  }
  
  if (!analysis.hasPricing && analysis.componentCount > 3) {
    suggestions.push({
      id: 'add-pricing',
      text: 'Add a pricing section with comparison cards',
      category: 'add',
      icon: <BarChart3 className="h-3 w-3" />,
      priority: 60,
      tags: ['conversion', 'monetization']
    })
  }

  if (!analysis.hasFAQ && analysis.complexity !== 'simple') {
    suggestions.push({
      id: 'add-faq',
      text: 'Add FAQ accordion section',
      category: 'add',
      icon: <MessageSquare className="h-3 w-3" />,
      priority: 50,
      tags: ['content', 'seo']
    })
  }

  if (!analysis.hasTeam && analysis.complexity === 'complex') {
    suggestions.push({
      id: 'add-team',
      text: 'Add team members section with social links',
      category: 'add',
      icon: <Users className="h-3 w-3" />,
      priority: 45,
      tags: ['content', 'trust']
    })
  }
  
  if (!analysis.hasContact) {
    suggestions.push({
      id: 'add-contact',
      text: 'Add a contact form with validation',
      category: 'add',
      icon: <MousePointer className="h-3 w-3" />,
      priority: 55,
      tags: ['conversion', 'essential']
    })
  }

  // ===== FUNCTIONALITY =====
  if (!analysis.hasSearch && analysis.complexity !== 'simple') {
    suggestions.push({
      id: 'add-search',
      text: 'Add search functionality with filters',
      category: 'integration',
      icon: <Search className="h-3 w-3" />,
      priority: 50,
      tags: ['ux', 'functionality']
    })
  }

  if (!analysis.hasNewsletter) {
    suggestions.push({
      id: 'add-newsletter',
      text: 'Add newsletter signup with email validation',
      category: 'integration',
      icon: <Bell className="h-3 w-3" />,
      priority: 55,
      tags: ['conversion', 'marketing']
    })
  }

  if (!analysis.hasSocialShare) {
    suggestions.push({
      id: 'add-social',
      text: 'Add social media share buttons',
      category: 'integration',
      icon: <Share2 className="h-3 w-3" />,
      priority: 40,
      tags: ['social', 'marketing']
    })
  }

  if (!analysis.hasChat) {
    suggestions.push({
      id: 'add-chat',
      text: 'Add live chat widget or chatbot',
      category: 'integration',
      icon: <MessageSquare className="h-3 w-3" />,
      priority: 45,
      tags: ['support', 'conversion']
    })
  }

  if (!analysis.hasVideo) {
    suggestions.push({
      id: 'add-video',
      text: 'Add video section or background video',
      category: 'enhance',
      icon: <Video className="h-3 w-3" />,
      priority: 50,
      tags: ['visual', 'engagement']
    })
  }

  // ===== SEO & PERFORMANCE =====
  if (!analysis.hasSEO) {
    suggestions.push({
      id: 'add-seo',
      text: 'Add SEO metadata and Open Graph tags',
      category: 'seo',
      icon: <Globe className="h-3 w-3" />,
      priority: 75,
      tags: ['seo', 'marketing']
    })
  }

  if (!analysis.hasLazyLoading && analysis.hasImages) {
    suggestions.push({
      id: 'add-lazy',
      text: 'Add lazy loading for images and components',
      category: 'performance',
      icon: <Gauge className="h-3 w-3" />,
      priority: 60,
      tags: ['performance', 'ux']
    })
  }

  if (!analysis.hasLoadingStates) {
    suggestions.push({
      id: 'add-loading',
      text: 'Add skeleton loading states',
      category: 'performance',
      icon: <Gauge className="h-3 w-3" />,
      priority: 55,
      tags: ['ux', 'performance']
    })
  }

  // ===== ACCESSIBILITY =====
  if (!analysis.hasAccessibility) {
    suggestions.push({
      id: 'add-a11y',
      text: 'Improve accessibility with ARIA labels',
      category: 'accessibility',
      icon: <Accessibility className="h-3 w-3" />,
      priority: 70,
      tags: ['accessibility', 'compliance']
    })
  }

  // ===== AI-POWERED SUGGESTIONS =====
  suggestions.push({
    id: 'ai-enhance',
    text: 'AI: Analyze and suggest improvements',
    category: 'ai',
    icon: <Wand2 className="h-3 w-3" />,
    priority: 30,
    tags: ['ai', 'analysis']
  })

  suggestions.push({
    id: 'ai-content',
    text: 'AI: Generate compelling copy for sections',
    category: 'ai',
    icon: <Type className="h-3 w-3" />,
    priority: 30,
    tags: ['ai', 'content']
  })

  // ===== ADVANCED ENHANCEMENTS =====
  suggestions.push({
    id: 'enhance-viral',
    text: 'Make it viral-worthy with trending effects',
    category: 'style',
    icon: <TrendingUp className="h-3 w-3" />,
    priority: 25,
    tags: ['trendy', 'viral']
  })

  suggestions.push({
    id: 'add-3d',
    text: 'Add 3D elements and hover effects',
    category: 'animate',
    icon: <Layers className="h-3 w-3" />,
    priority: 25,
    tags: ['3d', 'visual']
  })
  
  // Sort by priority and return top suggestions
  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 8)
}

const CATEGORY_COLORS: Record<SuggestionCategory, string> = {
  enhance: 'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20',
  add: 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20',
  style: 'bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20',
  animate: 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20',
  fix: 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20',
  seo: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20',
  performance: 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20',
  accessibility: 'bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20',
  integration: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20',
  ai: 'bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20'
}

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  enhance: 'Enhance',
  add: 'Add',
  style: 'Style',
  animate: 'Animate',
  fix: 'Fix',
  seo: 'SEO',
  performance: 'Performance',
  accessibility: 'A11y',
  integration: 'Integrate',
  ai: 'AI'
}

export function PromptSuggestions({ currentCode, onSelectSuggestion, isGenerating }: PromptSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<SuggestionCategory | 'all'>('all')
  
  // Analyze code and generate suggestions
  const refreshSuggestions = useCallback(() => {
    setIsRefreshing(true)
    const analysis = analyzeCurrentWebsite(currentCode)
    const newSuggestions = generateSuggestions(analysis)
    setSuggestions(newSuggestions)
    setTimeout(() => setIsRefreshing(false), 300)
  }, [currentCode])
  
  // Update suggestions when code changes
  useEffect(() => {
    refreshSuggestions()
  }, [currentCode, refreshSuggestions])

  const filteredSuggestions = activeFilter === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === activeFilter)

  // Get unique categories from current suggestions
  const availableCategories = Array.from(new Set(suggestions.map(s => s.category)))
  
  if (suggestions.length === 0) {
    return null
  }
  
  return (
    <div className="border-b bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-pink-500/5">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-violet-500 shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Smart Suggestions</span>
            <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 px-1 shrink-0">
              {suggestions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] sm:hidden"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {activeFilter === 'all' ? 'All' : CATEGORY_LABELS[activeFilter as SuggestionCategory]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white/10 backdrop-blur-xl border border-white/20">
                <DropdownMenuItem 
                  onClick={() => setActiveFilter('all')}
                  className={cn(activeFilter === 'all' && "bg-white/10")}
                >
                  All
                </DropdownMenuItem>
                {availableCategories.map(cat => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={cn(activeFilter === cat && "bg-white/10")}
                  >
                    {CATEGORY_LABELS[cat]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Desktop Buttons - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 px-2 text-[10px]",
                  activeFilter === 'all' && "bg-muted"
                )}
                onClick={() => setActiveFilter('all')}
              >
                All
              </Button>
              {availableCategories.slice(0, 4).map(cat => (
                <Button
                  key={cat}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-[10px]",
                    activeFilter === cat && "bg-muted"
                  )}
                  onClick={() => setActiveFilter(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </Button>
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={refreshSuggestions}
              disabled={isGenerating || isRefreshing}
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-1">
            {filteredSuggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="outline"
                size="sm"
                className={cn(
                  "h-auto py-1.5 px-3 text-xs font-normal border transition-all hover:scale-[1.02] shrink-0 max-w-full",
                  CATEGORY_COLORS[suggestion.category],
                  isGenerating && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isGenerating && onSelectSuggestion(suggestion.text)}
                disabled={isGenerating}
              >
                <span className="flex items-center gap-1.5 max-w-full min-w-0">
                  <span className="shrink-0">{suggestion.icon}</span>
                  <span className="truncate min-w-0 flex-1 text-left">
                    {suggestion.text}
                  </span>
                  <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />
                </span>
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
