"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Image as ImageIcon,
  Wand2,
  Loader2,
  Download,
  Copy,
  Sparkles,
  Palette,
  Camera,
  Layers,
  RefreshCw,
  Settings2,
  Zap,
  ImagePlus,
  Trash2,
  Check,
  X,
  Grid3X3,
  LayoutGrid,
  Maximize2,
  History
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  style: string
  timestamp: Date
  width: number
  height: number
}

interface AIImagePanelProps {
  onInsertImage: (imageUrl: string, alt: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const IMAGE_STYLES = [
  { id: "realistic", name: "Realistic", icon: Camera },
  { id: "artistic", name: "Artistic", icon: Palette },
  { id: "3d", name: "3D Render", icon: Layers },
  { id: "anime", name: "Anime", icon: Sparkles },
  { id: "minimalist", name: "Minimalist", icon: Grid3X3 },
  { id: "abstract", name: "Abstract", icon: LayoutGrid },
]

const ASPECT_RATIOS = [
  { id: "1:1", name: "Square", width: 1024, height: 1024 },
  { id: "16:9", name: "Landscape", width: 1024, height: 576 },
  { id: "9:16", name: "Portrait", width: 576, height: 1024 },
  { id: "4:3", name: "Standard", width: 1024, height: 768 },
  { id: "3:2", name: "Photo", width: 1024, height: 683 },
]

const QUICK_PROMPTS = [
  "Modern hero section background with gradient",
  "Abstract geometric pattern for website",
  "Professional team photo placeholder",
  "Product mockup on clean background",
  "Tech startup office environment",
  "Nature landscape for header image",
  "Minimalist icon set illustration",
  "Dashboard UI screenshot mockup",
]

export function AIImagePanel({ onInsertImage, isOpen, onOpenChange }: AIImagePanelProps) {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [style, setStyle] = useState("realistic")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [quality, setQuality] = useState([80])
  const [variations, setVariations] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [activeTab, setActiveTab] = useState("generate")

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setIsGenerating(true)
    setGeneratedImages([])

    try {
      const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio) || ASPECT_RATIOS[1]
      
      // Build enhanced prompt with style
      const stylePrompt = style !== "realistic" ? `, ${style} style` : ""
      const fullPrompt = `${prompt}${stylePrompt}, high quality, professional`

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          negative_prompt: negativePrompt || "blurry, low quality, distorted, ugly",
          width: ratio.width,
          height: ratio.height,
          num_variations: variations,
        }),
      })

      if (!response.ok) {
        throw new Error("Generation failed")
      }

      const data = await response.json()
      
      const newImages: GeneratedImage[] = (data.images || [data.url]).map((url: string, i: number) => ({
        id: `${Date.now()}-${i}`,
        url,
        prompt,
        style,
        timestamp: new Date(),
        width: ratio.width,
        height: ratio.height,
      }))

      setGeneratedImages(newImages)
      setHistory(prev => [...newImages, ...prev].slice(0, 20)) // Keep last 20
      toast.success(`Generated ${newImages.length} image${newImages.length > 1 ? 's' : ''}!`)
    } catch (error) {
      console.error("Image generation error:", error)
      toast.error("Failed to generate image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, negativePrompt, style, aspectRatio, variations])

  const handleInsert = useCallback((image: GeneratedImage) => {
    onInsertImage(image.url, image.prompt)
    toast.success("Image inserted into your project!")
    onOpenChange(false)
  }, [onInsertImage, onOpenChange])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("Image URL copied!")
  }, [])

  const handleDownload = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nairi-image-${image.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("Image downloaded!")
    } catch (error) {
      toast.error("Failed to download image")
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <ImageIcon className="h-4 w-4 text-white" />
            </div>
            AI Image Generator
          </DialogTitle>
          <DialogDescription>
            Generate custom images for your website using AI. Describe what you need and we'll create it.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 w-fit">
            <TabsTrigger value="generate" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {history.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              {/* Left Panel - Controls */}
              <div className="w-80 border-r flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {/* Prompt Input */}
                    <div className="space-y-2">
                      <Label>Describe your image</Label>
                      <Textarea
                        placeholder="A modern hero section background with soft gradients and geometric shapes..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>

                    {/* Quick Prompts */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Quick prompts</Label>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_PROMPTS.slice(0, 4).map((qp, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setPrompt(qp)}
                          >
                            {qp.slice(0, 25)}...
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Style Selection */}
                    <div className="space-y-2">
                      <Label>Style</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {IMAGE_STYLES.map((s) => (
                          <Button
                            key={s.id}
                            variant={style === s.id ? "default" : "outline"}
                            size="sm"
                            className="h-auto py-2 flex-col gap-1"
                            onClick={() => setStyle(s.id)}
                          >
                            <s.icon className="h-4 w-4" />
                            <span className="text-xs">{s.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-2">
                      <Label>Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIOS.map((ratio) => (
                            <SelectItem key={ratio.id} value={ratio.id}>
                              {ratio.name} ({ratio.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Variations */}
                    <div className="space-y-2">
                      <Label>Variations</Label>
                      <div className="flex gap-2">
                        {[1, 2, 4].map((v) => (
                          <Button
                            key={v}
                            variant={variations === v ? "default" : "outline"}
                            size="sm"
                            onClick={() => setVariations(v)}
                          >
                            {v}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        <span className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4" />
                          Advanced Options
                        </span>
                        <span>{showAdvanced ? "−" : "+"}</span>
                      </Button>

                      {showAdvanced && (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label className="text-xs">Negative Prompt</Label>
                            <Textarea
                              placeholder="Things to avoid in the image..."
                              value={negativePrompt}
                              onChange={(e) => setNegativePrompt(e.target.value)}
                              className="min-h-[60px] resize-none text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-xs">Quality</Label>
                              <span className="text-xs text-muted-foreground">{quality[0]}%</span>
                            </div>
                            <Slider
                              value={quality}
                              onValueChange={setQuality}
                              min={50}
                              max={100}
                              step={10}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                {/* Generate Button */}
                <div className="p-4 border-t">
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate {variations > 1 ? `${variations} Images` : "Image"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right Panel - Results */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {generatedImages.length === 0 && !isGenerating ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">No images yet</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                        Describe what you want to create and click Generate to see your AI-generated images here.
                      </p>
                    </div>
                  ) : isGenerating ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="mb-4 relative">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 animate-pulse" />
                        <Loader2 className="h-8 w-8 text-violet-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <h3 className="font-semibold">Creating your image{variations > 1 ? 's' : ''}...</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        This usually takes 10-30 seconds
                      </p>
                    </div>
                  ) : (
                    <div className={cn(
                      "grid gap-4",
                      generatedImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {generatedImages.map((image) => (
                        <div
                          key={image.id}
                          className={cn(
                            "group relative rounded-lg overflow-hidden border bg-muted cursor-pointer transition-all",
                            selectedImage?.id === image.id && "ring-2 ring-violet-500"
                          )}
                          onClick={() => setSelectedImage(image)}
                        >
                          <img
                            src={image.url}
                            alt={image.prompt}
                            className="w-full h-auto object-cover"
                          />
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-9 w-9"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInsert(image)
                                    }}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Insert into project</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-9 w-9"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopyUrl(image.url)
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy URL</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-9 w-9"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownload(image)
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          {/* Style Badge */}
                          <Badge
                            variant="secondary"
                            className="absolute top-2 left-2 text-xs"
                          >
                            {IMAGE_STYLES.find(s => s.id === image.style)?.name || image.style}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Selected Image Actions */}
                {selectedImage && (
                  <div className="p-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {selectedImage.prompt}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPrompt(selectedImage.prompt)
                          setStyle(selectedImage.style)
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-violet-500 to-purple-600"
                        onClick={() => handleInsert(selectedImage)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Insert Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <History className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">No history yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your generated images will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {history.map((image) => (
                    <div
                      key={image.id}
                      className="group relative rounded-lg overflow-hidden border bg-muted cursor-pointer"
                      onClick={() => {
                        setSelectedImage(image)
                        setActiveTab("generate")
                        setGeneratedImages([image])
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary">
                          Use This
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs text-white truncate">{image.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Export a trigger button component for easy integration
export function AIImageTrigger({ onClick }: { onClick: () => void }) {
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
            <ImageIcon className="h-4 w-4" />
            <Wand2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Generate AI Image</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
