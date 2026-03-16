"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Palette,
  Type,
  Maximize2,
  Box,
  Sparkles,
  Sun,
  Moon,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  Download,
  Upload
} from "lucide-react"

// Design System Types
export interface DesignSystem {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
    success: string
    warning: string
    error: string
    custom: { name: string; value: string }[]
  }
  typography: {
    fontFamily: {
      heading: string
      body: string
      mono: string
    }
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      "2xl": string
      "3xl": string
      "4xl": string
      "5xl": string
    }
    fontWeight: {
      light: number
      normal: number
      medium: number
      semibold: number
      bold: number
    }
    lineHeight: {
      tight: number
      normal: number
      relaxed: number
    }
  }
  spacing: {
    unit: number
    scale: number[]
  }
  borderRadius: {
    none: string
    sm: string
    md: string
    lg: string
    xl: string
    full: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  breakpoints: {
    sm: string
    md: string
    lg: string
    xl: string
    "2xl": string
  }
}

// Default design system
const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
  colors: {
    primary: "#8b5cf6",
    secondary: "#06b6d4",
    accent: "#f59e0b",
    background: "#0a0a0a",
    foreground: "#fafafa",
    muted: "#27272a",
    border: "#3f3f46",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
    custom: []
  },
  typography: {
    fontFamily: {
      heading: "Inter",
      body: "Inter",
      mono: "JetBrains Mono"
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem"
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  spacing: {
    unit: 4,
    scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64]
  },
  borderRadius: {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px"
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px"
  }
}

// Font options
const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Raleway", label: "Raleway" },
  { value: "Nunito", label: "Nunito" },
  { value: "Work Sans", label: "Work Sans" }
]

interface GlobalStylesProps {
  designSystem: DesignSystem
  onUpdateDesignSystem: (updates: Partial<DesignSystem>) => void
}

export function GlobalStyles({ designSystem, onUpdateDesignSystem }: GlobalStylesProps) {
  const [activeTab, setActiveTab] = useState("colors")
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const updateColor = (key: keyof DesignSystem["colors"], value: string) => {
    onUpdateDesignSystem({
      colors: { ...designSystem.colors, [key]: value }
    })
  }

  const updateTypography = (category: keyof DesignSystem["typography"], key: string, value: any) => {
    onUpdateDesignSystem({
      typography: {
        ...designSystem.typography,
        [category]: {
          ...designSystem.typography[category],
          [key]: value
        }
      }
    })
  }

  const addCustomColor = () => {
    const newColor = { name: `Color ${designSystem.colors.custom.length + 1}`, value: "#888888" }
    onUpdateDesignSystem({
      colors: {
        ...designSystem.colors,
        custom: [...designSystem.colors.custom, newColor]
      }
    })
  }

  const removeCustomColor = (index: number) => {
    onUpdateDesignSystem({
      colors: {
        ...designSystem.colors,
        custom: designSystem.colors.custom.filter((_, i) => i !== index)
      }
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Design System</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="colors" className="gap-1 text-xs">
            <Palette className="h-3.5 w-3.5" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-1 text-xs">
            <Type className="h-3.5 w-3.5" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="spacing" className="gap-1 text-xs">
            <Maximize2 className="h-3.5 w-3.5" />
            Spacing
          </TabsTrigger>
          <TabsTrigger value="effects" className="gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Effects
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Brand Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Brand Colors</h3>
              <div className="grid grid-cols-2 gap-3">
                {(["primary", "secondary", "accent"] as const).map((colorKey) => (
                  <ColorPicker
                    key={colorKey}
                    label={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                    value={designSystem.colors[colorKey]}
                    onChange={(value) => updateColor(colorKey, value)}
                    onCopy={() => handleCopyColor(designSystem.colors[colorKey])}
                    isCopied={copiedColor === designSystem.colors[colorKey]}
                  />
                ))}
              </div>
            </div>

            {/* UI Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">UI Colors</h3>
              <div className="grid grid-cols-2 gap-3">
                {(["background", "foreground", "muted", "border"] as const).map((colorKey) => (
                  <ColorPicker
                    key={colorKey}
                    label={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                    value={designSystem.colors[colorKey]}
                    onChange={(value) => updateColor(colorKey, value)}
                    onCopy={() => handleCopyColor(designSystem.colors[colorKey])}
                    isCopied={copiedColor === designSystem.colors[colorKey]}
                  />
                ))}
              </div>
            </div>

            {/* Semantic Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Semantic Colors</h3>
              <div className="grid grid-cols-3 gap-3">
                {(["success", "warning", "error"] as const).map((colorKey) => (
                  <ColorPicker
                    key={colorKey}
                    label={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                    value={designSystem.colors[colorKey]}
                    onChange={(value) => updateColor(colorKey, value)}
                    onCopy={() => handleCopyColor(designSystem.colors[colorKey])}
                    isCopied={copiedColor === designSystem.colors[colorKey]}
                    compact
                  />
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Custom Colors</h3>
                <Button variant="outline" size="sm" onClick={addCustomColor}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              {designSystem.colors.custom.length > 0 ? (
                <div className="space-y-2">
                  {designSystem.colors.custom.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={color.name}
                        onChange={(e) => {
                          const newCustom = [...designSystem.colors.custom]
                          newCustom[index] = { ...newCustom[index], name: e.target.value }
                          onUpdateDesignSystem({ colors: { ...designSystem.colors, custom: newCustom } })
                        }}
                        className="flex-1"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-9 w-9 p-0"
                            style={{ backgroundColor: color.value }}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3">
                          <Input
                            type="color"
                            value={color.value}
                            onChange={(e) => {
                              const newCustom = [...designSystem.colors.custom]
                              newCustom[index] = { ...newCustom[index], value: e.target.value }
                              onUpdateDesignSystem({ colors: { ...designSystem.colors, custom: newCustom } })
                            }}
                            className="h-32 w-32 cursor-pointer"
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => removeCustomColor(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No custom colors added yet.</p>
              )}
            </div>

            {/* Color Palette Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Palette Preview</h3>
              <div className="flex gap-1 rounded-lg overflow-hidden">
                {Object.entries(designSystem.colors)
                  .filter(([key]) => key !== "custom")
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="h-12 flex-1 cursor-pointer transition-transform hover:scale-105"
                      style={{ backgroundColor: value as string }}
                      title={`${key}: ${value}`}
                      onClick={() => handleCopyColor(value as string)}
                    />
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Font Families */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Font Families</h3>
              <div className="space-y-3">
                {(["heading", "body", "mono"] as const).map((fontType) => (
                  <div key={fontType} className="space-y-2">
                    <Label className="text-xs capitalize">{fontType} Font</Label>
                    <Select
                      value={designSystem.typography.fontFamily[fontType]}
                      onValueChange={(value) => updateTypography("fontFamily", fontType, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Font Size Scale */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Font Size Scale</h3>
              <div className="space-y-2">
                {Object.entries(designSystem.typography.fontSize).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-muted-foreground">{key}</span>
                    <div className="flex-1">
                      <div
                        className="truncate"
                        style={{
                          fontSize: value,
                          fontFamily: designSystem.typography.fontFamily.body
                        }}
                      >
                        The quick brown fox
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Font Weights */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Font Weights</h3>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(designSystem.typography.fontWeight).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div
                      className="text-lg"
                      style={{ fontWeight: value }}
                    >
                      Aa
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Line Heights */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Line Heights</h3>
              <div className="space-y-3">
                {Object.entries(designSystem.typography.lineHeight).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs capitalize">{key}</span>
                      <span className="text-xs text-muted-foreground">{value}</span>
                    </div>
                    <div
                      className="rounded bg-muted p-2 text-sm"
                      style={{ lineHeight: value }}
                    >
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Spacing Tab */}
        <TabsContent value="spacing" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Base Unit */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Base Unit</h3>
              <div className="flex items-center gap-4">
                <Slider
                  value={[designSystem.spacing.unit]}
                  onValueChange={([value]) => onUpdateDesignSystem({
                    spacing: { ...designSystem.spacing, unit: value }
                  })}
                  min={2}
                  max={8}
                  step={1}
                  className="flex-1"
                />
                <span className="w-16 text-sm">{designSystem.spacing.unit}px</span>
              </div>
            </div>

            {/* Spacing Scale */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Spacing Scale</h3>
              <div className="space-y-2">
                {designSystem.spacing.scale.map((multiplier, index) => {
                  const value = multiplier * designSystem.spacing.unit
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-8 text-xs text-muted-foreground">{multiplier}</span>
                      <div
                        className="h-4 rounded bg-primary"
                        style={{ width: `${Math.min(value, 200)}px` }}
                      />
                      <span className="text-xs text-muted-foreground">{value}px</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Border Radius</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(designSystem.borderRadius).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div
                      className="mx-auto h-12 w-12 bg-primary"
                      style={{ borderRadius: value }}
                    />
                    <span className="mt-1 block text-xs text-muted-foreground">{key}</span>
                    <span className="text-xs text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Shadows */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Shadows</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(designSystem.shadows).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div
                      className="h-20 rounded-lg bg-card"
                      style={{ boxShadow: value }}
                    />
                    <span className="text-xs text-muted-foreground capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakpoints */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Breakpoints</h3>
              <div className="space-y-2">
                {Object.entries(designSystem.breakpoints).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{key}</Badge>
                      <span className="text-sm">≥ {value}</span>
                    </div>
                    <Input
                      value={value}
                      onChange={(e) => onUpdateDesignSystem({
                        breakpoints: { ...designSystem.breakpoints, [key]: e.target.value }
                      })}
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Color Picker Component
function ColorPicker({
  label,
  value,
  onChange,
  onCopy,
  isCopied,
  compact = false
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onCopy: () => void
  isCopied: boolean
  compact?: boolean
}) {
  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={onCopy}
        >
          {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("p-0", compact ? "h-8 w-8" : "h-9 w-9")}
              style={{ backgroundColor: value }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <Input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-32 w-32 cursor-pointer"
            />
          </PopoverContent>
        </Popover>
        {!compact && (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 font-mono text-xs"
          />
        )}
      </div>
    </div>
  )
}

export { DEFAULT_DESIGN_SYSTEM }
