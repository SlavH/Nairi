"use client"

import { useState } from "react"
import { 
  Mail, Lightbulb, FileText, Globe, Brain, BarChart3, 
  Code, Image, Video, Mic, Sparkles, BookOpen,
  PenTool, Calculator, Search, MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickAction {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  prompt: string
  color: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "email",
    icon: <Mail className="h-4 w-4" />,
    label: "Write Email",
    description: "Professional emails",
    prompt: "Write a professional email about ",
    color: "hover:border-pink-500/50"
  },
  {
    id: "explain",
    icon: <Lightbulb className="h-4 w-4" />,
    label: "Explain",
    description: "Simplify concepts",
    prompt: "Explain this concept in simple terms: ",
    color: "hover:border-yellow-500/50"
  },
  {
    id: "summarize",
    icon: <FileText className="h-4 w-4" />,
    label: "Summarize",
    description: "Condense content",
    prompt: "Summarize this text: ",
    color: "hover:border-purple-500/50"
  },
  {
    id: "translate",
    icon: <Globe className="h-4 w-4" />,
    label: "Translate",
    description: "Any language",
    prompt: "Translate this to English: ",
    color: "hover:border-blue-500/50"
  },
  {
    id: "brainstorm",
    icon: <Brain className="h-4 w-4" />,
    label: "Brainstorm",
    description: "Generate ideas",
    prompt: "Help me brainstorm ideas for ",
    color: "hover:border-orange-500/50"
  },
  {
    id: "analyze",
    icon: <BarChart3 className="h-4 w-4" />,
    label: "Analyze",
    description: "Data insights",
    prompt: "Analyze this data and provide insights: ",
    color: "hover:border-green-500/50"
  },
  {
    id: "code",
    icon: <Code className="h-4 w-4" />,
    label: "Write Code",
    description: "Any language",
    prompt: "Write code to ",
    color: "hover:border-cyan-500/50"
  },
  {
    id: "image",
    icon: <Image className="h-4 w-4" />,
    label: "Create Image",
    description: "AI generation",
    prompt: "Create an image of ",
    color: "hover:border-rose-500/50"
  },
]

const CATEGORY_CHIPS = [
  { id: "all", label: "All", icon: <Sparkles className="h-3 w-3" /> },
  { id: "write", label: "Write", icon: <PenTool className="h-3 w-3" /> },
  { id: "learn", label: "Learn", icon: <BookOpen className="h-3 w-3" /> },
  { id: "create", label: "Create", icon: <Image className="h-3 w-3" /> },
  { id: "analyze", label: "Analyze", icon: <BarChart3 className="h-3 w-3" /> },
]

interface QuickActionsProps {
  onSelectAction: (prompt: string) => void
  className?: string
}

export function QuickActions({ onSelectAction, className }: QuickActionsProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  return (
    <div className={cn("space-y-4", className)}>
      {/* Category Chips - 44px touch target on mobile */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {CATEGORY_CHIPS.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-full text-xs font-medium transition-all touch-manipulation",
              activeCategory === category.id
                ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white backdrop-blur-sm border border-white/20 shadow-lg"
                : "bg-white/10 border border-white/20 backdrop-blur-md text-muted-foreground hover:bg-white/20 hover:text-foreground shadow-lg"
            )}
            aria-pressed={activeCategory === category.id}
            aria-label={`Filter: ${category.label}`}
          >
            {category.icon}
            {category.label}
          </button>
        ))}
      </div>

      {/* Quick Action Grid - Icon only with hover tooltip */}
      <div className="flex items-center justify-center gap-3 flex-wrap max-w-2xl mx-auto">
        {QUICK_ACTIONS.map((action) => (
          <div key={action.id} className="relative group">
            <button
              type="button"
              onClick={() => onSelectAction(action.prompt)}
              className={cn(
                "h-10 w-10 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md transition-all touch-manipulation shadow-lg flex items-center justify-center",
                action.color,
                "hover:bg-white/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              )}
              aria-label={`${action.label}: ${action.description}`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-foreground [&>svg]:shrink-0">
                {action.icon}
              </span>
            </button>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-[100] hidden sm:block">
              <div className="bg-black/90 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap backdrop-blur-sm border border-white/20 shadow-lg">
                <p className="font-medium">{action.label}</p>
                <p className="text-white/70 text-[10px]">{action.description}</p>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-muted-foreground">
        Type <span className="font-mono bg-white/10 border border-white/20 backdrop-blur-md px-1.5 py-0.5 rounded shadow-lg">/</span> for more commands or just start typing
      </p>
    </div>
  )
}

export default QuickActions
