"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageSquare, Scale, Brain, GraduationCap, Sparkles, ChevronDown, Search, Code, FileText } from "lucide-react"

export type ChatMode = "default" | "debate" | "reasoning" | "tutor" | "creator" | "research" | "builder" | "learn"

export const CHAT_MODES = [
  {
    id: "default" as ChatMode,
    label: "Chat",
    icon: MessageSquare,
    description: "General conversation",
  },
  {
    id: "builder" as ChatMode,
    label: "Builder",
    icon: Code,
    description: "Generate code & apps",
  },
  {
    id: "learn" as ChatMode,
    label: "Learn",
    icon: GraduationCap,
    description: "Interactive learning",
  },
  {
    id: "debate" as ChatMode,
    label: "Debate",
    icon: Scale,
    description: "Multiple perspectives",
  },
  {
    id: "reasoning" as ChatMode,
    label: "Reasoning",
    icon: Brain,
    description: "Step-by-step analysis",
  },
  {
    id: "tutor" as ChatMode,
    label: "Tutor",
    icon: GraduationCap,
    description: "Learn with guidance",
  },
  {
    id: "creator" as ChatMode,
    label: "Creator",
    icon: Sparkles,
    description: "Creative assistance",
  },
  {
    id: "research" as ChatMode,
    label: "Research",
    icon: Search,
    description: "In-depth research",
  },
] as const

interface ChatModeSelectorProps {
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
}

export function ChatModeSelector({ mode, onModeChange }: ChatModeSelectorProps) {
  const currentMode = CHAT_MODES.find((m) => m.id === mode) || CHAT_MODES[0]
  const Icon = currentMode.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0" aria-label={`Mode: ${currentMode.label}`}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{currentMode.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {CHAT_MODES.map((m) => {
          const ModeIcon = m.icon
          return (
            <DropdownMenuItem key={m.id} onClick={() => onModeChange(m.id)} className="flex items-center gap-3 py-2">
              <ModeIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
