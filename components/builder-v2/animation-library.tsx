"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Play,
  Pause,
  Copy,
  Check,
  Sparkles,
  Zap,
  MousePointer,
  Eye,
  ArrowRight,
  ArrowDown,
  RotateCw,
  Maximize2,
  Minimize2,
  Move,
  Loader2,
  Search,
  Filter,
  Code,
  Wand2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Animation {
  id: string
  name: string
  category: "entrance" | "exit" | "attention" | "scroll" | "hover" | "loading"
  css: string
  keyframes: string
  preview: string // Tailwind classes for preview
  description: string
  duration: number
  easing: string
}

interface AnimationLibraryProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onInsertAnimation: (css: string, keyframes: string) => void
}

/** Align with design tokens: --duration-normal 250ms (docs/DESIGN_SYSTEM.md) */
const DURATION_NORMAL_S = 0.25

const ANIMATIONS: Animation[] = [
  // Entrance Animations (aligned with shared motion primitives and tokens)
  {
    id: "fade-in",
    name: "Fade In",
    category: "entrance",
    css: `animation: fadeIn ${DURATION_NORMAL_S}s ease-out forwards;`,
    keyframes: `@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}`,
    preview: `animate-[fadeIn_${DURATION_NORMAL_S}s_ease-out_forwards]`,
    description: "Simple fade in effect",
    duration: DURATION_NORMAL_S,
    easing: "ease-out"
  },
  {
    id: "fade-in-up",
    name: "Fade In Up",
    category: "entrance",
    css: `animation: fadeInUp ${DURATION_NORMAL_S}s ease-out forwards;`,
    keyframes: `@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
    preview: `animate-[fadeInUp_${DURATION_NORMAL_S}s_ease-out_forwards]`,
    description: "Fade in while moving up",
    duration: DURATION_NORMAL_S,
    easing: "ease-out"
  },
  {
    id: "fade-in-down",
    name: "Fade In Down",
    category: "entrance",
    css: "animation: fadeInDown 0.6s ease-out forwards;",
    keyframes: `@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
    preview: "animate-[fadeInDown_0.6s_ease-out_forwards]",
    description: "Fade in while moving down",
    duration: 0.6,
    easing: "ease-out"
  },
  {
    id: "slide-in-left",
    name: "Slide In Left",
    category: "entrance",
    css: "animation: slideInLeft 0.5s ease-out forwards;",
    keyframes: `@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
    preview: "animate-[slideInLeft_0.5s_ease-out_forwards]",
    description: "Slide in from the left",
    duration: 0.5,
    easing: "ease-out"
  },
  {
    id: "slide-in-right",
    name: "Slide In Right",
    category: "entrance",
    css: "animation: slideInRight 0.5s ease-out forwards;",
    keyframes: `@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
    preview: "animate-[slideInRight_0.5s_ease-out_forwards]",
    description: "Slide in from the right",
    duration: 0.5,
    easing: "ease-out"
  },
  {
    id: "scale-in",
    name: "Scale In",
    category: "entrance",
    css: "animation: scaleIn 0.4s ease-out forwards;",
    keyframes: `@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}`,
    preview: "animate-[scaleIn_0.4s_ease-out_forwards]",
    description: "Scale up while fading in",
    duration: 0.4,
    easing: "ease-out"
  },
  {
    id: "bounce-in",
    name: "Bounce In",
    category: "entrance",
    css: "animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;",
    keyframes: `@keyframes bounceIn {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}`,
    preview: "animate-[bounceIn_0.6s_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards]",
    description: "Bouncy entrance effect",
    duration: 0.6,
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
  },
  {
    id: "flip-in",
    name: "Flip In",
    category: "entrance",
    css: "animation: flipIn 0.6s ease-out forwards;",
    keyframes: `@keyframes flipIn {
  from {
    opacity: 0;
    transform: perspective(400px) rotateX(90deg);
  }
  to {
    opacity: 1;
    transform: perspective(400px) rotateX(0);
  }
}`,
    preview: "animate-[flipIn_0.6s_ease-out_forwards]",
    description: "3D flip entrance",
    duration: 0.6,
    easing: "ease-out"
  },

  // Attention Animations
  {
    id: "pulse",
    name: "Pulse",
    category: "attention",
    css: "animation: pulse 2s ease-in-out infinite;",
    keyframes: `@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}`,
    preview: "animate-pulse",
    description: "Gentle pulsing effect",
    duration: 2,
    easing: "ease-in-out"
  },
  {
    id: "shake",
    name: "Shake",
    category: "attention",
    css: "animation: shake 0.5s ease-in-out;",
    keyframes: `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}`,
    preview: "animate-[shake_0.5s_ease-in-out]",
    description: "Horizontal shake",
    duration: 0.5,
    easing: "ease-in-out"
  },
  {
    id: "wiggle",
    name: "Wiggle",
    category: "attention",
    css: "animation: wiggle 1s ease-in-out infinite;",
    keyframes: `@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}`,
    preview: "animate-[wiggle_1s_ease-in-out_infinite]",
    description: "Playful wiggle",
    duration: 1,
    easing: "ease-in-out"
  },
  {
    id: "glow",
    name: "Glow",
    category: "attention",
    css: "animation: glow 2s ease-in-out infinite;",
    keyframes: `@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 30px rgba(139, 92, 246, 0.6);
  }
}`,
    preview: "animate-[glow_2s_ease-in-out_infinite]",
    description: "Glowing shadow effect",
    duration: 2,
    easing: "ease-in-out"
  },
  {
    id: "heartbeat",
    name: "Heartbeat",
    category: "attention",
    css: "animation: heartbeat 1.5s ease-in-out infinite;",
    keyframes: `@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.1); }
  28% { transform: scale(1); }
  42% { transform: scale(1.1); }
  70% { transform: scale(1); }
}`,
    preview: "animate-[heartbeat_1.5s_ease-in-out_infinite]",
    description: "Heartbeat pulsing",
    duration: 1.5,
    easing: "ease-in-out"
  },

  // Hover Animations
  {
    id: "hover-lift",
    name: "Hover Lift",
    category: "hover",
    css: `transition: transform 0.3s ease, box-shadow 0.3s ease;
&:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}`,
    keyframes: "",
    preview: "hover:-translate-y-1 hover:shadow-lg transition-all duration-300",
    description: "Lift up on hover",
    duration: 0.3,
    easing: "ease"
  },
  {
    id: "hover-scale",
    name: "Hover Scale",
    category: "hover",
    css: `transition: transform 0.3s ease;
&:hover {
  transform: scale(1.05);
}`,
    keyframes: "",
    preview: "hover:scale-105 transition-transform duration-300",
    description: "Scale up on hover",
    duration: 0.3,
    easing: "ease"
  },
  {
    id: "hover-glow",
    name: "Hover Glow",
    category: "hover",
    css: `transition: box-shadow 0.3s ease;
&:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}`,
    keyframes: "",
    preview: "hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-shadow duration-300",
    description: "Glow effect on hover",
    duration: 0.3,
    easing: "ease"
  },
  {
    id: "hover-rotate",
    name: "Hover Rotate",
    category: "hover",
    css: `transition: transform 0.3s ease;
&:hover {
  transform: rotate(5deg);
}`,
    keyframes: "",
    preview: "hover:rotate-3 transition-transform duration-300",
    description: "Slight rotation on hover",
    duration: 0.3,
    easing: "ease"
  },

  // Scroll Animations
  {
    id: "scroll-reveal",
    name: "Scroll Reveal",
    category: "scroll",
    css: `opacity: 0;
transform: translateY(50px);
transition: opacity 0.6s ease, transform 0.6s ease;
&.visible {
  opacity: 1;
  transform: translateY(0);
}`,
    keyframes: "",
    preview: "opacity-0 translate-y-12",
    description: "Reveal on scroll into view",
    duration: 0.6,
    easing: "ease"
  },
  {
    id: "scroll-fade",
    name: "Scroll Fade",
    category: "scroll",
    css: `opacity: 0;
transition: opacity 0.8s ease;
&.visible {
  opacity: 1;
}`,
    keyframes: "",
    preview: "opacity-0",
    description: "Fade in on scroll",
    duration: 0.8,
    easing: "ease"
  },
  {
    id: "scroll-scale",
    name: "Scroll Scale",
    category: "scroll",
    css: `opacity: 0;
transform: scale(0.8);
transition: opacity 0.6s ease, transform 0.6s ease;
&.visible {
  opacity: 1;
  transform: scale(1);
}`,
    keyframes: "",
    preview: "opacity-0 scale-90",
    description: "Scale up on scroll",
    duration: 0.6,
    easing: "ease"
  },

  // Loading Animations
  {
    id: "spinner",
    name: "Spinner",
    category: "loading",
    css: "animation: spin 1s linear infinite;",
    keyframes: `@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
    preview: "animate-spin",
    description: "Rotating spinner",
    duration: 1,
    easing: "linear"
  },
  {
    id: "dots",
    name: "Loading Dots",
    category: "loading",
    css: "animation: dots 1.4s ease-in-out infinite;",
    keyframes: `@keyframes dots {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}`,
    preview: "animate-[dots_1.4s_ease-in-out_infinite]",
    description: "Bouncing dots loader",
    duration: 1.4,
    easing: "ease-in-out"
  },
  {
    id: "skeleton",
    name: "Skeleton Pulse",
    category: "loading",
    css: "animation: skeleton 2s ease-in-out infinite;",
    keyframes: `@keyframes skeleton {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}`,
    preview: "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]",
    description: "Skeleton loading effect",
    duration: 2,
    easing: "ease-in-out"
  },

  // Exit Animations
  {
    id: "fade-out",
    name: "Fade Out",
    category: "exit",
    css: "animation: fadeOut 0.5s ease-out forwards;",
    keyframes: `@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}`,
    preview: "animate-[fadeOut_0.5s_ease-out_forwards]",
    description: "Simple fade out",
    duration: 0.5,
    easing: "ease-out"
  },
  {
    id: "fade-out-down",
    name: "Fade Out Down",
    category: "exit",
    css: "animation: fadeOutDown 0.5s ease-out forwards;",
    keyframes: `@keyframes fadeOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}`,
    preview: "animate-[fadeOutDown_0.5s_ease-out_forwards]",
    description: "Fade out while moving down",
    duration: 0.5,
    easing: "ease-out"
  },
  {
    id: "scale-out",
    name: "Scale Out",
    category: "exit",
    css: "animation: scaleOut 0.4s ease-out forwards;",
    keyframes: `@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}`,
    preview: "animate-[scaleOut_0.4s_ease-out_forwards]",
    description: "Scale down while fading out",
    duration: 0.4,
    easing: "ease-out"
  },
]

const CATEGORIES = [
  { id: "all", name: "All", icon: Sparkles },
  { id: "entrance", name: "Entrance", icon: ArrowRight },
  { id: "exit", name: "Exit", icon: ArrowDown },
  { id: "attention", name: "Attention", icon: Eye },
  { id: "hover", name: "Hover", icon: MousePointer },
  { id: "scroll", name: "Scroll", icon: Move },
  { id: "loading", name: "Loading", icon: Loader2 },
]

export function AnimationLibrary({ isOpen, onOpenChange, onInsertAnimation }: AnimationLibraryProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [customDuration, setCustomDuration] = useState([0.5])
  const [copied, setCopied] = useState<string | null>(null)

  const filteredAnimations = ANIMATIONS.filter(anim => {
    const matchesSearch = anim.name.toLowerCase().includes(search.toLowerCase()) ||
                         anim.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === "all" || anim.category === category
    return matchesSearch && matchesCategory
  })

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const handleInsert = useCallback((animation: Animation) => {
    const modifiedCss = animation.css.replace(
      /(\d+\.?\d*)s/,
      `${customDuration[0]}s`
    )
    onInsertAnimation(modifiedCss, animation.keyframes)
    toast.success(`${animation.name} animation added!`)
    onOpenChange(false)
  }, [customDuration, onInsertAnimation, onOpenChange])

  const playAnimation = useCallback((id: string) => {
    setIsPlaying(id)
    setTimeout(() => setIsPlaying(null), 2000)
  }, [])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Animation Library
          </SheetTitle>
          <SheetDescription>
            Choose from pre-built animations to add life to your website
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Filter */}
          <div className="px-4 py-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search animations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-1">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => setCategory(cat.id)}
                  >
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Animation Grid */}
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredAnimations.map((animation) => (
                <Card
                  key={animation.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-violet-500/50",
                    selectedAnimation?.id === animation.id && "border-violet-500 ring-1 ring-violet-500"
                  )}
                  onClick={() => setSelectedAnimation(animation)}
                >
                  <CardContent className="p-3">
                    {/* Preview Box */}
                    <div className="h-20 bg-muted rounded-md flex items-center justify-center mb-2 overflow-hidden">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600",
                          isPlaying === animation.id && animation.preview
                        )}
                        style={{
                          animation: isPlaying === animation.id ? undefined : "none"
                        }}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-sm">{animation.name}</h4>
                        <p className="text-xs text-muted-foreground">{animation.description}</p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                playAnimation(animation.id)
                              }}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex gap-1 mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {animation.duration}s
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {animation.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAnimations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No animations found</p>
              </div>
            )}
          </ScrollArea>

          {/* Selected Animation Details */}
          {selectedAnimation && (
            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{selectedAnimation.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedAnimation.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => playAnimation(selectedAnimation.id)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>

              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Duration</Label>
                  <span className="text-xs text-muted-foreground">{customDuration[0]}s</span>
                </div>
                <Slider
                  value={customDuration}
                  onValueChange={setCustomDuration}
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>

              {/* Code Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">CSS Code</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => handleCopy(
                      `${selectedAnimation.keyframes}\n\n${selectedAnimation.css}`,
                      selectedAnimation.id
                    )}
                  >
                    {copied === selectedAnimation.id ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    Copy
                  </Button>
                </div>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-24">
                  <code>{selectedAnimation.keyframes ? `${selectedAnimation.keyframes}\n\n` : ''}{selectedAnimation.css}</code>
                </pre>
              </div>

              {/* Insert Button */}
              <Button
                className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
                onClick={() => handleInsert(selectedAnimation)}
              >
                <Wand2 className="h-4 w-4" />
                Add Animation
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Trigger button for toolbar
export function AnimationLibraryTrigger({ onClick }: { onClick: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onClick}
          >
            <Zap className="h-4 w-4" />
            Animations
          </Button>
        </TooltipTrigger>
        <TooltipContent>Animation Library</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
