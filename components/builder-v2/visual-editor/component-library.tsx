"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Search,
  Layers,
  Type,
  Image as ImageIcon,
  Square,
  Columns,
  LayoutGrid,
  Video,
  FileText,
  ShoppingCart,
  Mail,
  MapPin,
  Star,
  MessageSquare,
  Calendar,
  Users,
  BarChart3,
  Sparkles,
  Navigation,
  CreditCard,
  Phone,
  Globe,
  Zap,
  Heart,
  Award,
  Clock,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Play,
  Pause,
  Volume2,
  Share2,
  Download,
  Upload,
  Settings,
  User,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  Plus,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  ExternalLink,
  Link,
  Unlink,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify
} from "lucide-react"
import type { ElementType, BuilderElement } from "./drag-drop-canvas"

interface ComponentLibraryProps {
  onAddElement: (element: Omit<BuilderElement, "id">) => void
}

interface ComponentCategory {
  id: string
  label: string
  icon: React.ReactNode
  components: ComponentDefinition[]
}

interface ComponentDefinition {
  type: ElementType
  label: string
  icon: React.ReactNode
  description: string
  defaultProps: Record<string, any>
  defaultStyles: Record<string, any>
  isPro?: boolean
  isNew?: boolean
}

// Component categories and definitions
const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    id: "layout",
    label: "Layout",
    icon: <LayoutGrid className="h-4 w-4" />,
    components: [
      {
        type: "section",
        label: "Section",
        icon: <Layers className="h-5 w-5" />,
        description: "A full-width section container",
        defaultProps: {},
        defaultStyles: { padding: "60px 0" }
      },
      {
        type: "container",
        label: "Container",
        icon: <Square className="h-5 w-5" />,
        description: "A centered content container",
        defaultProps: {},
        defaultStyles: { maxWidth: "1200px", margin: "0 auto" }
      },
      {
        type: "columns",
        label: "Columns",
        icon: <Columns className="h-5 w-5" />,
        description: "Multi-column layout grid",
        defaultProps: { columns: 2 },
        defaultStyles: { gap: "24px" }
      }
    ]
  },
  {
    id: "basic",
    label: "Basic",
    icon: <Type className="h-4 w-4" />,
    components: [
      {
        type: "heading",
        label: "Heading",
        icon: <Type className="h-5 w-5" />,
        description: "Text heading (H1-H6)",
        defaultProps: { text: "Heading", level: "h2" },
        defaultStyles: { fontSize: "2rem", fontWeight: "bold" }
      },
      {
        type: "paragraph",
        label: "Paragraph",
        icon: <FileText className="h-5 w-5" />,
        description: "Body text paragraph",
        defaultProps: { text: "Your paragraph text here..." },
        defaultStyles: { fontSize: "1rem", lineHeight: "1.6" }
      },
      {
        type: "image",
        label: "Image",
        icon: <ImageIcon className="h-5 w-5" />,
        description: "Image with alt text",
        defaultProps: { src: "", alt: "Image description" },
        defaultStyles: { width: "100%", borderRadius: "8px" }
      },
      {
        type: "button",
        label: "Button",
        icon: <Square className="h-5 w-5" />,
        description: "Clickable button",
        defaultProps: { text: "Click me", variant: "primary" },
        defaultStyles: { padding: "12px 24px", borderRadius: "8px" }
      },
      {
        type: "video",
        label: "Video",
        icon: <Video className="h-5 w-5" />,
        description: "Embedded video player",
        defaultProps: { src: "", autoplay: false },
        defaultStyles: { width: "100%", aspectRatio: "16/9" }
      },
      {
        type: "divider",
        label: "Divider",
        icon: <Minus className="h-5 w-5" />,
        description: "Horizontal line divider",
        defaultProps: {},
        defaultStyles: { borderTop: "1px solid", margin: "24px 0" }
      },
      {
        type: "spacer",
        label: "Spacer",
        icon: <Square className="h-5 w-5" />,
        description: "Empty space element",
        defaultProps: { height: 40 },
        defaultStyles: {}
      }
    ]
  },
  {
    id: "sections",
    label: "Sections",
    icon: <Sparkles className="h-4 w-4" />,
    components: [
      {
        type: "hero",
        label: "Hero",
        icon: <Sparkles className="h-5 w-5" />,
        description: "Hero section with headline",
        defaultProps: { headline: "Welcome", subheadline: "Your tagline here" },
        defaultStyles: { padding: "100px 0", textAlign: "center" },
        isNew: true
      },
      {
        type: "features",
        label: "Features",
        icon: <LayoutGrid className="h-5 w-5" />,
        description: "Feature grid section",
        defaultProps: { features: [] },
        defaultStyles: { padding: "80px 0" }
      },
      {
        type: "testimonials",
        label: "Testimonials",
        icon: <MessageSquare className="h-5 w-5" />,
        description: "Customer testimonials",
        defaultProps: { testimonials: [] },
        defaultStyles: { padding: "80px 0" }
      },
      {
        type: "pricing",
        label: "Pricing",
        icon: <BarChart3 className="h-5 w-5" />,
        description: "Pricing table section",
        defaultProps: { plans: [] },
        defaultStyles: { padding: "80px 0" }
      },
      {
        type: "cta",
        label: "Call to Action",
        icon: <Zap className="h-5 w-5" />,
        description: "CTA section with button",
        defaultProps: { headline: "Ready to start?", buttonText: "Get Started" },
        defaultStyles: { padding: "60px 0", textAlign: "center" }
      },
      {
        type: "gallery",
        label: "Gallery",
        icon: <Grid className="h-5 w-5" />,
        description: "Image gallery grid",
        defaultProps: { images: [] },
        defaultStyles: { padding: "60px 0" }
      }
    ]
  },
  {
    id: "navigation",
    label: "Navigation",
    icon: <Navigation className="h-4 w-4" />,
    components: [
      {
        type: "navbar",
        label: "Navbar",
        icon: <Menu className="h-5 w-5" />,
        description: "Navigation header bar",
        defaultProps: { logo: "Logo", links: [] },
        defaultStyles: { padding: "16px 0" }
      },
      {
        type: "footer",
        label: "Footer",
        icon: <Layers className="h-5 w-5" />,
        description: "Page footer section",
        defaultProps: { copyright: "© 2024" },
        defaultStyles: { padding: "40px 0" }
      }
    ]
  },
  {
    id: "forms",
    label: "Forms",
    icon: <Mail className="h-4 w-4" />,
    components: [
      {
        type: "form",
        label: "Contact Form",
        icon: <Mail className="h-5 w-5" />,
        description: "Contact form with fields",
        defaultProps: { fields: ["name", "email", "message"] },
        defaultStyles: { padding: "24px" }
      },
      {
        type: "contact",
        label: "Contact Info",
        icon: <Phone className="h-5 w-5" />,
        description: "Contact information block",
        defaultProps: { email: "", phone: "", address: "" },
        defaultStyles: {}
      },
      {
        type: "map",
        label: "Map",
        icon: <MapPin className="h-5 w-5" />,
        description: "Embedded map location",
        defaultProps: { location: "" },
        defaultStyles: { height: "400px" }
      }
    ]
  },
  {
    id: "ecommerce",
    label: "Ecommerce",
    icon: <ShoppingCart className="h-4 w-4" />,
    components: [
      {
        type: "product",
        label: "Product Card",
        icon: <ShoppingCart className="h-5 w-5" />,
        description: "Product display card",
        defaultProps: { name: "Product", price: 0 },
        defaultStyles: {},
        isPro: true
      },
      {
        type: "cart",
        label: "Shopping Cart",
        icon: <ShoppingCart className="h-5 w-5" />,
        description: "Cart summary widget",
        defaultProps: {},
        defaultStyles: {},
        isPro: true
      }
    ]
  },
  {
    id: "social",
    label: "Social",
    icon: <Share2 className="h-4 w-4" />,
    components: [
      {
        type: "social",
        label: "Social Links",
        icon: <Share2 className="h-5 w-5" />,
        description: "Social media icons",
        defaultProps: { links: [] },
        defaultStyles: {}
      },
      {
        type: "blog",
        label: "Blog Posts",
        icon: <FileText className="h-5 w-5" />,
        description: "Blog post grid",
        defaultProps: { posts: [] },
        defaultStyles: { padding: "60px 0" }
      }
    ]
  }
]

export function ComponentLibrary({ onAddElement }: ComponentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("layout")

  // Filter components based on search
  const filteredCategories = COMPONENT_CATEGORIES.map((category) => ({
    ...category,
    components: category.components.filter(
      (comp) =>
        comp.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter((category) => category.components.length > 0)

  const handleAddComponent = (component: ComponentDefinition) => {
    onAddElement({
      type: component.type,
      label: component.label,
      props: component.defaultProps,
      styles: component.defaultStyles,
      isVisible: true,
      isLocked: false
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="flex h-full flex-col"
        >
          {/* Category Pills */}
          <div className="border-b px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {COMPONENT_CATEGORIES.map((category) => (
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
            </div>
          </div>

          {/* Components Grid */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
            {searchQuery ? (
              // Search Results
              <div className="space-y-4">
                {filteredCategories.map((category) => (
                  <div key={category.id}>
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                      {category.label}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {category.components.map((component) => (
                        <ComponentCard
                          key={component.type}
                          component={component}
                          onAdd={() => handleAddComponent(component)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No components found
                  </div>
                )}
              </div>
            ) : (
              // Category View
              COMPONENT_CATEGORIES.map((category) => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="mt-0 data-[state=active]:block"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {category.components.map((component) => (
                      <ComponentCard
                        key={component.type}
                        component={component}
                        onAdd={() => handleAddComponent(component)}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}

// Component Card
function ComponentCard({
  component,
  onAdd
}: {
  component: ComponentDefinition
  onAdd: () => void
}) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all",
        "hover:border-violet-500/50 hover:bg-violet-500/5",
        "active:scale-95"
      )}
    >
      {/* Badges */}
      {(component.isPro || component.isNew) && (
        <div className="absolute right-1 top-1">
          {component.isPro && (
            <Badge variant="secondary" className="h-4 px-1 text-[9px]">
              PRO
            </Badge>
          )}
          {component.isNew && (
            <Badge className="h-4 bg-green-500 px-1 text-[9px]">
              NEW
            </Badge>
          )}
        </div>
      )}

      {/* Icon */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-violet-500/20 group-hover:text-violet-500">
        {component.icon}
      </div>

      {/* Label */}
      <span className="text-xs font-medium">{component.label}</span>
    </button>
  )
}
