"use client"

import { useState, useCallback, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"
import {
  Palette,
  Sun,
  Moon,
  Type,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Download,
  Upload,
  Sparkles,
  Eye,
  Code,
  Paintbrush,
  Circle,
  Square,
  RectangleHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ThemeColors {
  background: string
  foreground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  muted: string
  mutedForeground: string
  border: string
  ring: string
  destructive: string
}

interface ThemeConfig {
  name: string
  colors: {
    light: ThemeColors
    dark: ThemeColors
  }
  borderRadius: number
  fontFamily: string
  fontSize: {
    base: number
    scale: number
  }
}

interface ThemeCustomizerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onApplyTheme: (css: string) => void
}

const PRESET_THEMES: ThemeConfig[] = [
  {
    name: "Default",
    colors: {
      light: {
        background: "#ffffff",
        foreground: "#0a0a0a",
        primary: "#18181b",
        primaryForeground: "#fafafa",
        secondary: "#f4f4f5",
        secondaryForeground: "#18181b",
        accent: "#f4f4f5",
        accentForeground: "#18181b",
        muted: "#f4f4f5",
        mutedForeground: "#71717a",
        border: "#e4e4e7",
        ring: "#18181b",
        destructive: "#ef4444"
      },
      dark: {
        background: "#0a0a0a",
        foreground: "#fafafa",
        primary: "#fafafa",
        primaryForeground: "#18181b",
        secondary: "#27272a",
        secondaryForeground: "#fafafa",
        accent: "#27272a",
        accentForeground: "#fafafa",
        muted: "#27272a",
        mutedForeground: "#a1a1aa",
        border: "#27272a",
        ring: "#d4d4d8",
        destructive: "#ef4444"
      }
    },
    borderRadius: 0.5,
    fontFamily: "Inter",
    fontSize: { base: 16, scale: 1.25 }
  },
  {
    name: "Ocean",
    colors: {
      light: {
        background: "#f0f9ff",
        foreground: "#0c4a6e",
        primary: "#0284c7",
        primaryForeground: "#ffffff",
        secondary: "#e0f2fe",
        secondaryForeground: "#0369a1",
        accent: "#7dd3fc",
        accentForeground: "#0c4a6e",
        muted: "#e0f2fe",
        mutedForeground: "#0369a1",
        border: "#bae6fd",
        ring: "#0284c7",
        destructive: "#dc2626"
      },
      dark: {
        background: "#0c4a6e",
        foreground: "#f0f9ff",
        primary: "#38bdf8",
        primaryForeground: "#0c4a6e",
        secondary: "#075985",
        secondaryForeground: "#e0f2fe",
        accent: "#0ea5e9",
        accentForeground: "#f0f9ff",
        muted: "#075985",
        mutedForeground: "#7dd3fc",
        border: "#0369a1",
        ring: "#38bdf8",
        destructive: "#f87171"
      }
    },
    borderRadius: 0.75,
    fontFamily: "Inter",
    fontSize: { base: 16, scale: 1.25 }
  },
  {
    name: "Forest",
    colors: {
      light: {
        background: "#f0fdf4",
        foreground: "#14532d",
        primary: "#16a34a",
        primaryForeground: "#ffffff",
        secondary: "#dcfce7",
        secondaryForeground: "#166534",
        accent: "#86efac",
        accentForeground: "#14532d",
        muted: "#dcfce7",
        mutedForeground: "#166534",
        border: "#bbf7d0",
        ring: "#16a34a",
        destructive: "#dc2626"
      },
      dark: {
        background: "#14532d",
        foreground: "#f0fdf4",
        primary: "#4ade80",
        primaryForeground: "#14532d",
        secondary: "#166534",
        secondaryForeground: "#dcfce7",
        accent: "#22c55e",
        accentForeground: "#f0fdf4",
        muted: "#166534",
        mutedForeground: "#86efac",
        border: "#15803d",
        ring: "#4ade80",
        destructive: "#f87171"
      }
    },
    borderRadius: 0.5,
    fontFamily: "Inter",
    fontSize: { base: 16, scale: 1.25 }
  },
  {
    name: "Sunset",
    colors: {
      light: {
        background: "#fff7ed",
        foreground: "#7c2d12",
        primary: "#ea580c",
        primaryForeground: "#ffffff",
        secondary: "#ffedd5",
        secondaryForeground: "#9a3412",
        accent: "#fdba74",
        accentForeground: "#7c2d12",
        muted: "#ffedd5",
        mutedForeground: "#9a3412",
        border: "#fed7aa",
        ring: "#ea580c",
        destructive: "#dc2626"
      },
      dark: {
        background: "#7c2d12",
        foreground: "#fff7ed",
        primary: "#fb923c",
        primaryForeground: "#7c2d12",
        secondary: "#9a3412",
        secondaryForeground: "#ffedd5",
        accent: "#f97316",
        accentForeground: "#fff7ed",
        muted: "#9a3412",
        mutedForeground: "#fdba74",
        border: "#c2410c",
        ring: "#fb923c",
        destructive: "#f87171"
      }
    },
    borderRadius: 1,
    fontFamily: "Inter",
    fontSize: { base: 16, scale: 1.25 }
  },
  {
    name: "Violet",
    colors: {
      light: {
        background: "#faf5ff",
        foreground: "#581c87",
        primary: "#9333ea",
        primaryForeground: "#ffffff",
        secondary: "#f3e8ff",
        secondaryForeground: "#7e22ce",
        accent: "#c4b5fd",
        accentForeground: "#581c87",
        muted: "#f3e8ff",
        mutedForeground: "#7e22ce",
        border: "#e9d5ff",
        ring: "#9333ea",
        destructive: "#dc2626"
      },
      dark: {
        background: "#581c87",
        foreground: "#faf5ff",
        primary: "#a855f7",
        primaryForeground: "#581c87",
        secondary: "#7e22ce",
        secondaryForeground: "#f3e8ff",
        accent: "#9333ea",
        accentForeground: "#faf5ff",
        muted: "#7e22ce",
        mutedForeground: "#c4b5fd",
        border: "#6b21a8",
        ring: "#a855f7",
        destructive: "#f87171"
      }
    },
    borderRadius: 0.75,
    fontFamily: "Inter",
    fontSize: { base: 16, scale: 1.25 }
  },
  {
    name: "Rose",
    colors: {
      light: {
        background: "#fff1f2",
        foreground: "#881337",
        primary: "#e11d48",
        primaryForeground: "#ffffff",
        secondary: "#ffe4e6",
        secondaryForeground: "#be123c",
        accent: "#fda4af",
        accentForeground: "#881337",
        muted: "#ffe4e6",
        mutedForeground: "#be123c",
        border: "#fecdd3",
        ring: "#e11d48",
        destructive: "#dc2626"
      },
      dark: {
        background: "#881337",
        foreground: "#fff1f2",
        primary: "#fb7185",
        primaryForeground: "#881337",
        secondary: "#be123c",
        secondaryForeground: "#ffe4e6",
        accent: "#f43f5e",
        accentForeground: "#fff1f2",
        muted: "#be123c",
        mutedForeground: "#fda4af",
        border: "#9f1239",
        ring: "#fb7185",
        destructive: "#f87171"
      }
    },
    borderRadius: 1,
    fontFamily: "Inter",
    fontSize: { base: 16, scale: 1.25 }
  }
]

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "Source Sans Pro",
  "Nunito"
]

const RADIUS_OPTIONS = [
  { value: 0, label: "None", icon: Square },
  { value: 0.25, label: "Small", icon: Square },
  { value: 0.5, label: "Medium", icon: RectangleHorizontal },
  { value: 0.75, label: "Large", icon: RectangleHorizontal },
  { value: 1, label: "Full", icon: Circle },
]

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return "0 0% 0%"
  
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function ThemeCustomizer({ isOpen, onOpenChange, onApplyTheme }: ThemeCustomizerProps) {
  const [theme, setTheme] = useState<ThemeConfig>(PRESET_THEMES[0])
  const [mode, setMode] = useState<"light" | "dark">("light")
  const [activeTab, setActiveTab] = useState("presets")
  const [copied, setCopied] = useState(false)

  const currentColors = theme.colors[mode]

  const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [mode]: {
          ...prev.colors[mode],
          [key]: value
        }
      }
    }))
  }, [mode])

  const generateCSS = useCallback(() => {
    const lightColors = theme.colors.light
    const darkColors = theme.colors.dark
    
    return `@layer base {
  :root {
    --background: ${hexToHsl(lightColors.background)};
    --foreground: ${hexToHsl(lightColors.foreground)};
    --primary: ${hexToHsl(lightColors.primary)};
    --primary-foreground: ${hexToHsl(lightColors.primaryForeground)};
    --secondary: ${hexToHsl(lightColors.secondary)};
    --secondary-foreground: ${hexToHsl(lightColors.secondaryForeground)};
    --accent: ${hexToHsl(lightColors.accent)};
    --accent-foreground: ${hexToHsl(lightColors.accentForeground)};
    --muted: ${hexToHsl(lightColors.muted)};
    --muted-foreground: ${hexToHsl(lightColors.mutedForeground)};
    --border: ${hexToHsl(lightColors.border)};
    --ring: ${hexToHsl(lightColors.ring)};
    --destructive: ${hexToHsl(lightColors.destructive)};
    --radius: ${theme.borderRadius}rem;
  }

  .dark {
    --background: ${hexToHsl(darkColors.background)};
    --foreground: ${hexToHsl(darkColors.foreground)};
    --primary: ${hexToHsl(darkColors.primary)};
    --primary-foreground: ${hexToHsl(darkColors.primaryForeground)};
    --secondary: ${hexToHsl(darkColors.secondary)};
    --secondary-foreground: ${hexToHsl(darkColors.secondaryForeground)};
    --accent: ${hexToHsl(darkColors.accent)};
    --accent-foreground: ${hexToHsl(darkColors.accentForeground)};
    --muted: ${hexToHsl(darkColors.muted)};
    --muted-foreground: ${hexToHsl(darkColors.mutedForeground)};
    --border: ${hexToHsl(darkColors.border)};
    --ring: ${hexToHsl(darkColors.ring)};
    --destructive: ${hexToHsl(darkColors.destructive)};
  }
}

body {
  font-family: '${theme.fontFamily}', sans-serif;
  font-size: ${theme.fontSize.base}px;
}`
  }, [theme])

  const handleCopyCSS = useCallback(() => {
    navigator.clipboard.writeText(generateCSS())
    setCopied(true)
    toast.success("CSS copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }, [generateCSS])

  const handleApply = useCallback(() => {
    onApplyTheme(generateCSS())
    toast.success("Theme applied!")
    onOpenChange(false)
  }, [generateCSS, onApplyTheme, onOpenChange])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[450px] sm:max-w-[450px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Palette className="h-4 w-4 text-white" />
            </div>
            Theme Customizer
          </SheetTitle>
          <SheetDescription>
            Customize colors, typography, and styling for your website
          </SheetDescription>
        </SheetHeader>

        {/* Mode Toggle */}
        <div className="px-6 py-3 border-b flex items-center justify-between">
          <Label className="text-sm">Preview Mode</Label>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <Switch
              checked={mode === "dark"}
              onCheckedChange={(checked) => setMode(checked ? "dark" : "light")}
            />
            <Moon className="h-4 w-4" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="presets" className="p-6 space-y-4 m-0">
              <div className="grid grid-cols-2 gap-3">
                {PRESET_THEMES.map((preset) => (
                  <Card
                    key={preset.name}
                    className={cn(
                      "cursor-pointer transition-all hover:border-violet-500/50",
                      theme.name === preset.name && "border-violet-500 ring-1 ring-violet-500"
                    )}
                    onClick={() => setTheme(preset)}
                  >
                    <CardContent className="p-3">
                      <div className="flex gap-1 mb-2">
                        {[preset.colors.light.primary, preset.colors.light.secondary, preset.colors.light.accent].map((color, i) => (
                          <div
                            key={i}
                            className="h-6 flex-1 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-medium">{preset.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="colors" className="p-6 space-y-4 m-0">
              {/* Color Inputs */}
              {(Object.keys(currentColors) as (keyof ThemeColors)[]).map((colorKey) => (
                <div key={colorKey} className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded border shrink-0"
                    style={{ backgroundColor: currentColors[colorKey] }}
                  />
                  <div className="flex-1">
                    <Label className="text-xs capitalize">
                      {colorKey.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Input
                      type="text"
                      value={currentColors[colorKey]}
                      onChange={(e) => updateColor(colorKey, e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <Input
                    type="color"
                    value={currentColors[colorKey]}
                    onChange={(e) => updateColor(colorKey, e.target.value)}
                    className="h-8 w-12 p-1 cursor-pointer"
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="typography" className="p-6 space-y-6 m-0">
              {/* Font Family */}
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={theme.fontFamily}
                  onValueChange={(value) => setTheme(prev => ({ ...prev, fontFamily: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Base Font Size */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Base Font Size</Label>
                  <span className="text-sm text-muted-foreground">{theme.fontSize.base}px</span>
                </div>
                <Slider
                  value={[theme.fontSize.base]}
                  onValueChange={([value]) => setTheme(prev => ({
                    ...prev,
                    fontSize: { ...prev.fontSize, base: value }
                  }))}
                  min={12}
                  max={20}
                  step={1}
                />
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <div className="flex gap-2">
                  {RADIUS_OPTIONS.map((option) => (
                    <TooltipProvider key={option.value}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={theme.borderRadius === option.value ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setTheme(prev => ({ ...prev, borderRadius: option.value }))}
                          >
                            <option.icon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{option.label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: currentColors.background,
                    color: currentColors.foreground,
                    fontFamily: theme.fontFamily,
                    fontSize: theme.fontSize.base,
                    borderRadius: `${theme.borderRadius}rem`
                  }}
                >
                  <h3 className="font-bold text-lg" style={{ color: currentColors.foreground }}>
                    Heading Text
                  </h3>
                  <p className="mt-1" style={{ color: currentColors.mutedForeground }}>
                    This is how your body text will look.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      className="px-3 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: currentColors.primary,
                        color: currentColors.primaryForeground,
                        borderRadius: `${theme.borderRadius * 0.5}rem`
                      }}
                    >
                      Primary
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm font-medium"
                      style={{
                        backgroundColor: currentColors.secondary,
                        color: currentColors.secondaryForeground,
                        borderRadius: `${theme.borderRadius * 0.5}rem`
                      }}
                    >
                      Secondary
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="p-6 space-y-4 m-0">
              <div className="flex items-center justify-between">
                <Label>Generated CSS</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCSS}
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                <code>{generateCSS()}</code>
              </pre>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Apply Button */}
        <div className="p-4 border-t">
          <Button
            className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
            onClick={handleApply}
          >
            <Paintbrush className="h-4 w-4" />
            Apply Theme
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Trigger button
export function ThemeCustomizerTrigger({ onClick }: { onClick: () => void }) {
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
            <Palette className="h-4 w-4" />
            Theme
          </Button>
        </TooltipTrigger>
        <TooltipContent>Customize Theme</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
