"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  LayoutTemplate,
  ShoppingCart,
  BarChart3,
  FileText,
  User,
  Briefcase,
  Sparkles,
  Check,
  Zap,
  Megaphone
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface Template {
  id: string
  name: string
  description: string
  category: "saas" | "ecommerce" | "dashboard" | "blog" | "portfolio" | "landing" | "viral"
  prompt: string
  icon: React.ReactNode
  features: string[]
  preview?: string
}

const TEMPLATES: Template[] = [
  {
    id: "saas-landing",
    name: "SaaS Landing Page",
    description: "Modern landing page with hero, features, pricing, and testimonials",
    category: "saas",
    prompt: "Create a modern SaaS landing page with a hero section featuring a gradient background, headline, subheadline, and CTA buttons. Include a features grid with icons, a pricing section with 3 tiers (Free, Pro, Enterprise), customer testimonials with avatars, and a footer with links.",
    icon: <Sparkles className="h-5 w-5" />,
    features: ["Hero Section", "Features Grid", "Pricing Table", "Testimonials", "Footer"]
  },
  {
    id: "ecommerce-store",
    name: "E-commerce Store",
    description: "Product listing page with filters, cart, and product cards",
    category: "ecommerce",
    prompt: "Create an e-commerce product listing page with a header containing logo, search bar, and cart icon. Include a sidebar with category filters and price range slider. Show a product grid with cards containing product image, name, price, rating stars, and add to cart button. Add pagination at the bottom.",
    icon: <ShoppingCart className="h-5 w-5" />,
    features: ["Product Grid", "Filters Sidebar", "Search Bar", "Cart Icon", "Pagination"]
  },
  {
    id: "admin-dashboard",
    name: "Admin Dashboard",
    description: "Analytics dashboard with charts, stats, and data tables",
    category: "dashboard",
    prompt: "Create an admin dashboard with a dark sidebar navigation containing menu items with icons. Include a top header with search and user avatar. The main content should have stat cards showing key metrics (users, revenue, orders, growth), a line chart for analytics, a bar chart for sales, and a data table with recent orders.",
    icon: <BarChart3 className="h-5 w-5" />,
    features: ["Sidebar Nav", "Stat Cards", "Line Chart", "Bar Chart", "Data Table"]
  },
  {
    id: "blog-platform",
    name: "Blog Platform",
    description: "Blog homepage with featured posts, categories, and sidebar",
    category: "blog",
    prompt: "Create a blog homepage with a header containing logo and navigation. Include a featured post section with large image and excerpt. Show a grid of blog post cards with thumbnail, title, author, date, and read time. Add a sidebar with categories, popular posts, and newsletter signup form.",
    icon: <FileText className="h-5 w-5" />,
    features: ["Featured Post", "Post Grid", "Categories", "Newsletter", "Author Info"]
  },
  {
    id: "portfolio",
    name: "Developer Portfolio",
    description: "Personal portfolio with projects, skills, and contact form",
    category: "portfolio",
    prompt: "Create a developer portfolio with a hero section showing name, title, and social links. Include an about section with bio and photo. Show a skills section with technology icons. Display a projects grid with project cards containing image, title, description, and GitHub/live links. Add a contact form at the bottom.",
    icon: <User className="h-5 w-5" />,
    features: ["Hero Section", "About Me", "Skills Grid", "Projects", "Contact Form"]
  },
  {
    id: "agency-landing",
    name: "Agency Landing",
    description: "Creative agency website with services and case studies",
    category: "landing",
    prompt: "Create a creative agency landing page with a bold hero section featuring animated text and a video background placeholder. Include a services section with icon cards. Show a case studies grid with hover effects. Add a team section with member photos and roles. Include a contact section with a form and office locations.",
    icon: <Briefcase className="h-5 w-5" />,
    features: ["Bold Hero", "Services", "Case Studies", "Team Section", "Contact"]
  },
  {
    id: "viral-landing",
    name: "Viral Landing",
    description: "Scroll-stopping, full-bleed hero, one headline, one CTA, optional social proof",
    category: "viral",
    prompt: "Create a viral-style landing page that stops the scroll: full-bleed hero, one bold headline, one subheadline, single primary CTA button, optional social proof bar (Trusted by X or logo strip) or short testimonial line. Use gradient or glassmorphism, at least one wow moment (gradient text or floating blob). No clutter, no long forms above the fold. Punchy benefit-driven copy, no Lorem ipsum.",
    icon: <Zap className="h-5 w-5" />,
    features: ["Full-bleed Hero", "One Headline + CTA", "Social Proof", "Gradient/Glass", "Wow Moment"]
  },
  {
    id: "ad-style-hero",
    name: "Ad-style Hero",
    description: "Single-section hero with bold typography, gradient text or blob, one CTA",
    category: "viral",
    prompt: "Create an ad-style hero section like in viral ads: single full-bleed section with bold display typography (e.g. Syne or Playfair), gradient text or floating gradient blob, one clear headline, one subheadline, and one primary CTA button. Add hover:scale on the button and at least one wow moment. Punchy copy, no placeholders.",
    icon: <Megaphone className="h-5 w-5" />,
    features: ["Single Hero", "Gradient Text/Blob", "Bold Typography", "One CTA", "Hover Effects"]
  }
]

const CATEGORY_COLORS: Record<string, string> = {
  saas: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  ecommerce: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  dashboard: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  blog: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  portfolio: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  landing: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  viral: "bg-amber-500/10 text-amber-500 border-amber-500/20"
}

interface TemplateGalleryProps {
  onSelectTemplate: (prompt: string) => void
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const filteredTemplates = selectedCategory
    ? TEMPLATES.filter(t => t.category === selectedCategory)
    : TEMPLATES

  const handleSelect = (template: Template) => {
    onSelectTemplate(template.prompt)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 shrink-0 min-h-[44px] min-w-[44px] sm:min-w-0">
          <LayoutTemplate className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-violet-500" />
            Template Gallery
          </DialogTitle>
          <DialogDescription>
            Choose a template to get started quickly. Each template is fully customizable.
          </DialogDescription>
        </DialogHeader>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 py-2">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {["saas", "ecommerce", "dashboard", "blog", "portfolio", "landing", "viral"].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize"
            >
              {cat === "ecommerce" ? "E-commerce" : cat === "viral" ? "Viral" : cat}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        <ScrollArea className="h-[50vh] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group border rounded-lg p-4 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer"
                onClick={() => handleSelect(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      CATEGORY_COLORS[template.category]
                    )}>
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="outline" className={cn("text-xs mt-1", CATEGORY_COLORS[template.category])}>
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-violet-600 hover:bg-violet-700"
                  >
                    Use
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs bg-muted px-2 py-0.5 rounded flex items-center gap-1"
                    >
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
