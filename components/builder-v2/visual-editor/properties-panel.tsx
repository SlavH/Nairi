"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Settings,
  Palette,
  Layout,
  Type,
  Box,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Link,
  Image as ImageIcon,
  RotateCcw,
  Copy,
  Trash2,
  ChevronDown,
  Plus,
  Minus
} from "lucide-react"
import type { BuilderElement } from "./drag-drop-canvas"

interface PropertiesPanelProps {
  element: BuilderElement | null
  onUpdateElement: (id: string, updates: Partial<BuilderElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
}

// Color presets
const COLOR_PRESETS = [
  "#000000", "#ffffff", "#f43f5e", "#ec4899", "#d946ef",
  "#a855f7", "#8b5cf6", "#6366f1", "#3b82f6", "#0ea5e9",
  "#06b6d4", "#14b8a6", "#10b981", "#22c55e", "#84cc16",
  "#eab308", "#f59e0b", "#f97316", "#ef4444", "#78716c"
]

// Font families
const FONT_FAMILIES = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "poppins", label: "Poppins" },
  { value: "montserrat", label: "Montserrat" },
  { value: "opensans", label: "Open Sans" },
  { value: "lato", label: "Lato" },
  { value: "playfair", label: "Playfair Display" },
  { value: "merriweather", label: "Merriweather" },
  { value: "mono", label: "Monospace" }
]

// Font weights
const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extrabold" }
]

export function PropertiesPanel({
  element,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState("content")

  if (!element) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Settings className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <h3 className="font-medium">No Element Selected</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Select an element on the canvas to edit its properties
        </p>
      </div>
    )
  }

  const updateProps = (key: string, value: any) => {
    onUpdateElement(element.id, {
      props: { ...element.props, [key]: value }
    })
  }

  const updateStyles = (key: string, value: any) => {
    onUpdateElement(element.id, {
      styles: { ...element.styles, [key]: value }
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-medium">{element.label}</h3>
          <p className="text-xs text-muted-foreground">{element.type}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDuplicateElement(element.id)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDeleteElement(element.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="content" className="gap-1 text-xs">
            <Type className="h-3.5 w-3.5" />
            Content
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-1 text-xs">
            <Palette className="h-3.5 w-3.5" />
            Style
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-1 text-xs">
            <Layout className="h-3.5 w-3.5" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-4">
            {/* Text Content */}
            {(element.type === "heading" || element.type === "paragraph" || element.type === "button") && (
              <div className="space-y-2">
                <Label>Text Content</Label>
                {element.type === "paragraph" ? (
                  <Textarea
                    value={element.props.text || ""}
                    onChange={(e) => updateProps("text", e.target.value)}
                    placeholder="Enter text..."
                    rows={4}
                  />
                ) : (
                  <Input
                    value={element.props.text || ""}
                    onChange={(e) => updateProps("text", e.target.value)}
                    placeholder="Enter text..."
                  />
                )}
              </div>
            )}

            {/* Heading Level */}
            {element.type === "heading" && (
              <div className="space-y-2">
                <Label>Heading Level</Label>
                <Select
                  value={element.props.level || "h2"}
                  onValueChange={(value) => updateProps("level", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h1">H1 - Main Title</SelectItem>
                    <SelectItem value="h2">H2 - Section Title</SelectItem>
                    <SelectItem value="h3">H3 - Subsection</SelectItem>
                    <SelectItem value="h4">H4 - Small Heading</SelectItem>
                    <SelectItem value="h5">H5 - Minor Heading</SelectItem>
                    <SelectItem value="h6">H6 - Smallest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Image Source */}
            {element.type === "image" && (
              <>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={element.props.src || ""}
                    onChange={(e) => updateProps("src", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alt Text (SEO)</Label>
                  <Input
                    value={element.props.alt || ""}
                    onChange={(e) => updateProps("alt", e.target.value)}
                    placeholder="Describe the image..."
                  />
                </div>
              </>
            )}

            {/* Video Source */}
            {element.type === "video" && (
              <>
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    value={element.props.src || ""}
                    onChange={(e) => updateProps("src", e.target.value)}
                    placeholder="YouTube or Vimeo URL..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Autoplay</Label>
                  <Switch
                    checked={element.props.autoplay || false}
                    onCheckedChange={(checked) => updateProps("autoplay", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Loop</Label>
                  <Switch
                    checked={element.props.loop || false}
                    onCheckedChange={(checked) => updateProps("loop", checked)}
                  />
                </div>
              </>
            )}

            {/* Button Variant */}
            {element.type === "button" && (
              <>
                <div className="space-y-2">
                  <Label>Button Style</Label>
                  <Select
                    value={element.props.variant || "primary"}
                    onValueChange={(value) => updateProps("variant", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link URL</Label>
                  <Input
                    value={element.props.href || ""}
                    onChange={(e) => updateProps("href", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {/* Hero Section */}
            {element.type === "hero" && (
              <>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={element.props.headline || ""}
                    onChange={(e) => updateProps("headline", e.target.value)}
                    placeholder="Your headline..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subheadline</Label>
                  <Textarea
                    value={element.props.subheadline || ""}
                    onChange={(e) => updateProps("subheadline", e.target.value)}
                    placeholder="Supporting text..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Button Text</Label>
                  <Input
                    value={element.props.ctaText || ""}
                    onChange={(e) => updateProps("ctaText", e.target.value)}
                    placeholder="Get Started"
                  />
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Typography */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Typography</h4>
              
              <div className="space-y-2">
                <Label className="text-xs">Font Family</Label>
                <Select
                  value={element.styles.fontFamily || "inter"}
                  onValueChange={(value) => updateStyles("fontFamily", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Font Size</Label>
                  <Input
                    type="number"
                    value={parseInt(element.styles.fontSize) || 16}
                    onChange={(e) => updateStyles("fontSize", `${e.target.value}px`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Font Weight</Label>
                  <Select
                    value={element.styles.fontWeight || "400"}
                    onValueChange={(value) => updateStyles("fontWeight", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_WEIGHTS.map((weight) => (
                        <SelectItem key={weight.value} value={weight.value}>
                          {weight.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-xs">Text Align</Label>
                <div className="flex gap-1">
                  {[
                    { value: "left", icon: <AlignLeft className="h-4 w-4" /> },
                    { value: "center", icon: <AlignCenter className="h-4 w-4" /> },
                    { value: "right", icon: <AlignRight className="h-4 w-4" /> },
                    { value: "justify", icon: <AlignJustify className="h-4 w-4" /> }
                  ].map((align) => (
                    <Button
                      key={align.value}
                      variant={element.styles.textAlign === align.value ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateStyles("textAlign", align.value)}
                    >
                      {align.icon}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Colors</h4>
              
              <div className="space-y-2">
                <Label className="text-xs">Text Color</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        style={{ backgroundColor: element.styles.color || "#ffffff" }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <div className="grid grid-cols-5 gap-1">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: color }}
                            onClick={() => updateStyles("color", color)}
                          />
                        ))}
                      </div>
                      <Input
                        className="mt-2"
                        value={element.styles.color || ""}
                        onChange={(e) => updateStyles("color", e.target.value)}
                        placeholder="#000000"
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={element.styles.color || ""}
                    onChange={(e) => updateStyles("color", e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Background Color</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        style={{ backgroundColor: element.styles.backgroundColor || "transparent" }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <div className="grid grid-cols-5 gap-1">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: color }}
                            onClick={() => updateStyles("backgroundColor", color)}
                          />
                        ))}
                      </div>
                      <Input
                        className="mt-2"
                        value={element.styles.backgroundColor || ""}
                        onChange={(e) => updateStyles("backgroundColor", e.target.value)}
                        placeholder="transparent"
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={element.styles.backgroundColor || ""}
                    onChange={(e) => updateStyles("backgroundColor", e.target.value)}
                    placeholder="transparent"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Border */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Border</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Border Width</Label>
                  <Input
                    type="number"
                    value={parseInt(element.styles.borderWidth) || 0}
                    onChange={(e) => updateStyles("borderWidth", `${e.target.value}px`)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Border Radius</Label>
                  <Input
                    type="number"
                    value={parseInt(element.styles.borderRadius) || 0}
                    onChange={(e) => updateStyles("borderRadius", `${e.target.value}px`)}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Spacing */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Spacing</h4>
              
              {/* Margin */}
              <div className="space-y-2">
                <Label className="text-xs">Margin</Label>
                <div className="grid grid-cols-4 gap-2">
                  {["Top", "Right", "Bottom", "Left"].map((side) => (
                    <div key={side} className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">{side}</span>
                      <Input
                        type="number"
                        className="h-8"
                        value={parseInt(element.styles[`margin${side}`]) || 0}
                        onChange={(e) => updateStyles(`margin${side}`, `${e.target.value}px`)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Padding */}
              <div className="space-y-2">
                <Label className="text-xs">Padding</Label>
                <div className="grid grid-cols-4 gap-2">
                  {["Top", "Right", "Bottom", "Left"].map((side) => (
                    <div key={side} className="space-y-1">
                      <span className="text-[10px] text-muted-foreground">{side}</span>
                      <Input
                        type="number"
                        className="h-8"
                        value={parseInt(element.styles[`padding${side}`]) || 0}
                        onChange={(e) => updateStyles(`padding${side}`, `${e.target.value}px`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Size</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Width</Label>
                  <Input
                    value={element.styles.width || "auto"}
                    onChange={(e) => updateStyles("width", e.target.value)}
                    placeholder="auto"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Height</Label>
                  <Input
                    value={element.styles.height || "auto"}
                    onChange={(e) => updateStyles("height", e.target.value)}
                    placeholder="auto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Min Width</Label>
                  <Input
                    value={element.styles.minWidth || ""}
                    onChange={(e) => updateStyles("minWidth", e.target.value)}
                    placeholder="none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Width</Label>
                  <Input
                    value={element.styles.maxWidth || ""}
                    onChange={(e) => updateStyles("maxWidth", e.target.value)}
                    placeholder="none"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* CSS Classes */}
            <div className="space-y-2">
              <Label>Custom CSS Classes</Label>
              <Input
                value={element.props.className || ""}
                onChange={(e) => updateProps("className", e.target.value)}
                placeholder="my-class another-class"
              />
              <p className="text-xs text-muted-foreground">
                Add custom Tailwind or CSS classes
              </p>
            </div>

            {/* Custom ID */}
            <div className="space-y-2">
              <Label>Element ID</Label>
              <Input
                value={element.props.id || ""}
                onChange={(e) => updateProps("id", e.target.value)}
                placeholder="my-element"
              />
              <p className="text-xs text-muted-foreground">
                Used for anchor links and JavaScript
              </p>
            </div>

            {/* Animation */}
            <div className="space-y-2">
              <Label>Animation</Label>
              <Select
                value={element.props.animation || "none"}
                onValueChange={(value) => updateProps("animation", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="fadeIn">Fade In</SelectItem>
                  <SelectItem value="fadeInUp">Fade In Up</SelectItem>
                  <SelectItem value="fadeInDown">Fade In Down</SelectItem>
                  <SelectItem value="slideInLeft">Slide In Left</SelectItem>
                  <SelectItem value="slideInRight">Slide In Right</SelectItem>
                  <SelectItem value="zoomIn">Zoom In</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Responsive Visibility</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Hide on Mobile</Label>
                  <Switch
                    checked={element.props.hideOnMobile || false}
                    onCheckedChange={(checked) => updateProps("hideOnMobile", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Hide on Tablet</Label>
                  <Switch
                    checked={element.props.hideOnTablet || false}
                    onCheckedChange={(checked) => updateProps("hideOnTablet", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Hide on Desktop</Label>
                  <Switch
                    checked={element.props.hideOnDesktop || false}
                    onCheckedChange={(checked) => updateProps("hideOnDesktop", checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
