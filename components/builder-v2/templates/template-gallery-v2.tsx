"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Search,
  LayoutTemplate,
  Sparkles,
  ShoppingCart,
  FileText,
  Briefcase,
  Camera,
  Utensils,
  Heart,
  GraduationCap,
  Music,
  Plane,
  Home,
  Dumbbell,
  Code,
  Palette,
  Star,
  Eye,
  Download,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Check,
  ArrowRight,
  Play
} from "lucide-react"

// Template Types
export interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  thumbnail: string
  previewUrl?: string
  tags: string[]
  isPro: boolean
  isNew: boolean
  isFeatured: boolean
  rating: number
  downloads: number
  features: string[]
  pages: string[]
  colorScheme: "light" | "dark" | "both"
  responsive: boolean
  animations: boolean
}

export type TemplateCategory = 
  | "all"
  | "landing"
  | "portfolio"
  | "ecommerce"
  | "blog"
  | "business"
  | "agency"
  | "saas"
  | "restaurant"
  | "fitness"
  | "education"
  | "travel"
  | "real-estate"
  | "photography"
  | "music"
  | "healthcare"

// Category definitions
const CATEGORIES: { id: TemplateCategory; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Templates", icon: <LayoutTemplate className="h-4 w-4" /> },
  { id: "landing", label: "Landing Pages", icon: <Sparkles className="h-4 w-4" /> },
  { id: "portfolio", label: "Portfolio", icon: <Briefcase className="h-4 w-4" /> },
  { id: "ecommerce", label: "E-commerce", icon: <ShoppingCart className="h-4 w-4" /> },
  { id: "blog", label: "Blog", icon: <FileText className="h-4 w-4" /> },
  { id: "business", label: "Business", icon: <Briefcase className="h-4 w-4" /> },
  { id: "agency", label: "Agency", icon: <Palette className="h-4 w-4" /> },
  { id: "saas", label: "SaaS", icon: <Code className="h-4 w-4" /> },
  { id: "restaurant", label: "Restaurant", icon: <Utensils className="h-4 w-4" /> },
  { id: "fitness", label: "Fitness", icon: <Dumbbell className="h-4 w-4" /> },
  { id: "education", label: "Education", icon: <GraduationCap className="h-4 w-4" /> },
  { id: "travel", label: "Travel", icon: <Plane className="h-4 w-4" /> },
  { id: "real-estate", label: "Real Estate", icon: <Home className="h-4 w-4" /> },
  { id: "photography", label: "Photography", icon: <Camera className="h-4 w-4" /> },
  { id: "music", label: "Music", icon: <Music className="h-4 w-4" /> },
  { id: "healthcare", label: "Healthcare", icon: <Heart className="h-4 w-4" /> },
]

// Sample templates
const TEMPLATES: Template[] = [
  {
    id: "1",
    name: "Starter Pro",
    description: "A stunning SaaS landing page with glassmorphism effects, smooth animations, and conversion-optimized sections.",
    category: "saas",
    thumbnail: "/templates/saas-starter.png",
    tags: ["saas", "startup", "modern", "glassmorphism"],
    isPro: false,
    isNew: true,
    isFeatured: true,
    rating: 4.9,
    downloads: 12500,
    features: ["Hero with gradient", "Feature grid", "Pricing table", "Testimonials", "FAQ", "CTA sections"],
    pages: ["Home", "Features", "Pricing", "About", "Contact"],
    colorScheme: "dark",
    responsive: true,
    animations: true
  },
  {
    id: "2",
    name: "Portfolio Minimal",
    description: "Clean and minimal portfolio template perfect for designers, developers, and creatives.",
    category: "portfolio",
    thumbnail: "/templates/portfolio-minimal.png",
    tags: ["portfolio", "minimal", "creative", "designer"],
    isPro: false,
    isNew: false,
    isFeatured: true,
    rating: 4.8,
    downloads: 8900,
    features: ["Project showcase", "About section", "Skills grid", "Contact form", "Blog integration"],
    pages: ["Home", "Projects", "About", "Contact"],
    colorScheme: "both",
    responsive: true,
    animations: true
  },
  {
    id: "3",
    name: "ShopFlow",
    description: "Complete e-commerce template with product pages, cart, checkout, and account management.",
    category: "ecommerce",
    thumbnail: "/templates/ecommerce-shop.png",
    tags: ["ecommerce", "shop", "store", "products"],
    isPro: true,
    isNew: false,
    isFeatured: true,
    rating: 4.9,
    downloads: 15600,
    features: ["Product grid", "Product details", "Shopping cart", "Checkout flow", "User accounts", "Order tracking"],
    pages: ["Home", "Shop", "Product", "Cart", "Checkout", "Account"],
    colorScheme: "light",
    responsive: true,
    animations: true
  },
  {
    id: "4",
    name: "Blog starter",
    description: "Modern blog template with beautiful typography, categories, and newsletter integration.",
    category: "blog",
    thumbnail: "/templates/blog-starter.png",
    tags: ["blog", "content", "articles", "newsletter"],
    isPro: false,
    isNew: true,
    isFeatured: false,
    rating: 4.7,
    downloads: 6200,
    features: ["Article grid", "Category pages", "Author profiles", "Newsletter signup", "Comments", "Search"],
    pages: ["Home", "Articles", "Categories", "About", "Contact"],
    colorScheme: "both",
    responsive: true,
    animations: false
  },
  {
    id: "5",
    name: "Agency Bold",
    description: "Bold and creative agency template with case studies, team section, and service pages.",
    category: "agency",
    thumbnail: "/templates/agency-bold.png",
    tags: ["agency", "creative", "bold", "services"],
    isPro: true,
    isNew: false,
    isFeatured: true,
    rating: 4.8,
    downloads: 9800,
    features: ["Case studies", "Team grid", "Service pages", "Client logos", "Testimonials", "Contact form"],
    pages: ["Home", "Work", "Services", "Team", "Contact"],
    colorScheme: "dark",
    responsive: true,
    animations: true
  },
  {
    id: "6",
    name: "Starter Landing",
    description: "Simple and effective landing page template for product launches and marketing campaigns.",
    category: "landing",
    thumbnail: "/templates/landing-starter.png",
    tags: ["landing", "marketing", "conversion", "simple"],
    isPro: false,
    isNew: false,
    isFeatured: false,
    rating: 4.6,
    downloads: 18200,
    features: ["Hero section", "Features", "Social proof", "CTA", "Footer"],
    pages: ["Single page"],
    colorScheme: "both",
    responsive: true,
    animations: true
  },
  {
    id: "7",
    name: "Restaurant Deluxe",
    description: "Elegant restaurant template with menu, reservations, and gallery sections.",
    category: "restaurant",
    thumbnail: "/templates/restaurant-deluxe.png",
    tags: ["restaurant", "food", "menu", "reservations"],
    isPro: true,
    isNew: true,
    isFeatured: false,
    rating: 4.9,
    downloads: 4500,
    features: ["Menu display", "Reservation form", "Photo gallery", "Location map", "Reviews", "Events"],
    pages: ["Home", "Menu", "Reservations", "Gallery", "Contact"],
    colorScheme: "dark",
    responsive: true,
    animations: true
  },
  {
    id: "8",
    name: "Fitness Pro",
    description: "Dynamic fitness and gym template with class schedules, trainers, and membership plans.",
    category: "fitness",
    thumbnail: "/templates/fitness-pro.png",
    tags: ["fitness", "gym", "health", "training"],
    isPro: true,
    isNew: false,
    isFeatured: false,
    rating: 4.7,
    downloads: 3800,
    features: ["Class schedule", "Trainer profiles", "Membership plans", "BMI calculator", "Gallery", "Blog"],
    pages: ["Home", "Classes", "Trainers", "Pricing", "Contact"],
    colorScheme: "dark",
    responsive: true,
    animations: true
  },
]

interface TemplateGalleryV2Props {
  onSelectTemplate: (template: Template) => void
}

export function TemplateGalleryV2({ onSelectTemplate }: TemplateGalleryV2Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("all")
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  // Filter templates
  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = activeCategory === "all" || template.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const featuredTemplates = TEMPLATES.filter((t) => t.isFeatured)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Template Gallery</h2>
          </div>
          <Badge variant="secondary">{TEMPLATES.length} templates</Badge>
        </div>
      </div>

      {/* Search */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="border-b px-4 py-2">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.slice(0, 8).map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setActiveCategory(category.id)}
            >
              {category.icon}
              {category.label}
            </Button>
          ))}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                More...
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>All Categories</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "secondary" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.icon}
                    {category.label}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
        {/* Featured Section */}
        {activeCategory === "all" && searchQuery === "" && (
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Star className="h-4 w-4 text-yellow-500" />
              Featured Templates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {featuredTemplates.slice(0, 2).map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => onSelectTemplate(template)}
                  onPreview={() => setPreviewTemplate(template)}
                  featured
                />
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div>
          <h3 className="mb-3 text-sm font-medium">
            {activeCategory === "all" ? "All Templates" : CATEGORIES.find((c) => c.id === activeCategory)?.label}
            <span className="ml-2 text-muted-foreground">({filteredTemplates.length})</span>
          </h3>
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LayoutTemplate className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">No templates found</p>
              <p className="text-sm text-muted-foreground/70">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => onSelectTemplate(template)}
                  onPreview={() => setPreviewTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {previewTemplate.name}
                  {previewTemplate.isPro && (
                    <Badge className="bg-gradient-to-r from-violet-500 to-purple-600">PRO</Badge>
                  )}
                  {previewTemplate.isNew && (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-500">NEW</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-6">
                {/* Preview Image */}
                <div className="col-span-2">
                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Monitor className="mx-auto h-16 w-16 text-muted-foreground/30" />
                      <p className="mt-2 text-sm text-muted-foreground">Template Preview</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1 gap-2" onClick={() => onSelectTemplate(previewTemplate)}>
                      <Zap className="h-4 w-4" />
                      Use This Template
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Live Preview
                    </Button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Features</h4>
                    <ul className="space-y-1">
                      {previewTemplate.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Pages Included</h4>
                    <div className="flex flex-wrap gap-1">
                      {previewTemplate.pages.map((page) => (
                        <Badge key={page} variant="outline" className="text-xs">
                          {page}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {previewTemplate.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {previewTemplate.downloads.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {previewTemplate.responsive && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Smartphone className="h-3 w-3" />
                        Responsive
                      </Badge>
                    )}
                    {previewTemplate.animations && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Play className="h-3 w-3" />
                        Animated
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Template Card Component
function TemplateCard({
  template,
  onSelect,
  onPreview,
  featured = false
}: {
  template: Template
  onSelect: () => void
  onPreview: () => void
  featured?: boolean
}) {
  return (
    <Card className={cn(
      "group overflow-hidden transition-all hover:border-violet-500/50",
      featured && "border-violet-500/30 bg-violet-500/5"
    )}>
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <LayoutTemplate className="h-12 w-12 text-muted-foreground/20" />
          </div>
          
          {/* Badges */}
          <div className="absolute left-2 top-2 flex gap-1">
            {template.isPro && (
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-[10px]">
                PRO
              </Badge>
            )}
            {template.isNew && (
              <Badge className="bg-green-500 text-[10px]">
                NEW
              </Badge>
            )}
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="sm" onClick={onSelect}>
              Use Template
            </Button>
            <Button size="sm" variant="outline" onClick={onPreview}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h4 className="font-medium">{template.name}</h4>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {template.rating}
              </span>
              <span>{template.downloads.toLocaleString()} uses</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {CATEGORIES.find((c) => c.id === template.category)?.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { TEMPLATES, CATEGORIES }
