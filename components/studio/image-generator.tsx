"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { 
  ImageIcon, 
  Sparkles, 
  Loader2, 
  Download, 
  Copy, 
  RefreshCw,
  Wand2,
  Palette,
  Camera,
  Brush,
  Square,
  RectangleHorizontal,
  RectangleVertical
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string, prompt: string) => void
}

type ImageStyle = "photorealistic" | "digital-art" | "illustration" | "anime" | "3d-render" | "oil-painting" | "watercolor" | "sketch" | "pop-art" | "minimalist"
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4"

const IMAGE_STYLES: { value: ImageStyle; label: string; description: string }[] = [
  { value: "photorealistic", label: "Photorealistic", description: "High-quality photography style" },
  { value: "digital-art", label: "Digital Art", description: "Modern digital illustration" },
  { value: "illustration", label: "Illustration", description: "Hand-drawn style artwork" },
  { value: "anime", label: "Anime/Manga", description: "Japanese animation style" },
  { value: "3d-render", label: "3D Render", description: "3D modeled and rendered" },
  { value: "oil-painting", label: "Oil Painting", description: "Classical painting style" },
  { value: "watercolor", label: "Watercolor", description: "Soft watercolor painting" },
  { value: "sketch", label: "Sketch", description: "Pencil sketch style" },
  { value: "pop-art", label: "Pop Art", description: "Bold, colorful pop art" },
  { value: "minimalist", label: "Minimalist", description: "Simple, clean aesthetic" }
]

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: typeof Square }[] = [
  { value: "1:1", label: "Square", icon: Square },
  { value: "16:9", label: "Landscape", icon: RectangleHorizontal },
  { value: "9:16", label: "Portrait", icon: RectangleVertical },
  { value: "4:3", label: "Standard", icon: RectangleHorizontal },
  { value: "3:4", label: "Tall", icon: RectangleVertical }
]

const EXAMPLE_PROMPTS = [
  "A serene Japanese garden with cherry blossoms",
  "Futuristic cityscape at sunset with flying cars",
  "Cozy coffee shop interior with warm lighting",
  "Majestic mountain landscape with northern lights",
  "Abstract geometric patterns in vibrant colors",
  "Portrait of a wise owl in a library"
]

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [style, setStyle] = useState<ImageStyle>("photorealistic")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1")
  const [quality, setQuality] = useState([80])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description")
      return
    }

    setIsGenerating(true)

    try {
      // Build the enhanced prompt based on style
      const styleDescriptions: Record<ImageStyle, string> = {
        "photorealistic": "ultra realistic, 8K UHD, DSLR quality, natural lighting",
        "digital-art": "digital art, vibrant colors, detailed, trending on artstation",
        "illustration": "illustration, hand-drawn style, artistic, detailed linework",
        "anime": "anime style, manga aesthetic, vibrant, detailed",
        "3d-render": "3D render, octane render, ultra detailed, realistic lighting",
        "oil-painting": "oil painting, classical art style, brushstrokes visible, museum quality",
        "watercolor": "watercolor painting, soft edges, artistic, dreamy",
        "sketch": "pencil sketch, detailed drawing, artistic, grayscale",
        "pop-art": "pop art style, bold colors, comic book aesthetic, graphic",
        "minimalist": "minimalist design, clean, simple, modern aesthetic"
      }

      const enhancedPrompt = `${prompt}, ${styleDescriptions[style]}`
      
      const response = await fetch("/api/studio/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          negativePrompt,
          aspectRatio,
          quality: quality[0],
          style
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Image generation failed")
      }

      const data = await response.json()
      
      // For now, we'll generate a detailed prompt that can be used with external tools
      // In production, this would return actual generated images
      setGeneratedImage(data.imageUrl || null)
      setGeneratedPrompt(data.enhancedPrompt || enhancedPrompt)
      
      if (onImageGenerated && data.imageUrl) {
        onImageGenerated(data.imageUrl, enhancedPrompt)
      }
      
      toast.success("Image prompt generated!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyPrompt = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt)
      toast.success("Prompt copied to clipboard!")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ImageIcon className="h-5 w-5 text-[#e879f9]" />
            AI Image Generator
          </CardTitle>
          <CardDescription>
            Create stunning images with AI. Describe what you want to see.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Prompt */}
          <div className="space-y-2">
            <Label>What do you want to create?</Label>
            <Textarea
              placeholder="Describe your image in detail... (e.g., A majestic lion standing on a cliff at sunset)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] bg-background resize-none"
            />
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Try an example:</Label>
            <div className="flex flex-wrap gap-1">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {example.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>Style</Label>
            <div className="grid grid-cols-5 gap-2">
              {IMAGE_STYLES.slice(0, 5).map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all",
                    style === s.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 bg-background text-muted-foreground"
                  )}
                >
                  <span className="text-xs font-medium">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {IMAGE_STYLES.slice(5).map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all",
                    style === s.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary/50 bg-background text-muted-foreground"
                  )}
                >
                  <span className="text-xs font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.value}
                  onClick={() => setAspectRatio(ar.value)}
                  className={cn(
                    "flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all",
                    aspectRatio === ar.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-background"
                  )}
                >
                  <ar.icon className={cn(
                    "h-4 w-4",
                    aspectRatio === ar.value ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs",
                    aspectRatio === ar.value ? "text-foreground" : "text-muted-foreground"
                  )}>{ar.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Quality</Label>
              <span className="text-xs text-muted-foreground">{quality[0]}%</span>
            </div>
            <Slider
              value={quality}
              onValueChange={setQuality}
              min={50}
              max={100}
              step={10}
              className="w-full"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Negative Prompt (optional)</Label>
            <Textarea
              placeholder="What to avoid... (e.g., blurry, low quality, text)"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="min-h-[60px] bg-background resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Image */}
      {generatedImage && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Generated Image</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const link = document.createElement('a')
                  link.href = generatedImage
                  link.download = 'nairi-generated-image.png'
                  link.click()
                }} className="bg-transparent">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate} className="bg-transparent">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border">
              <img 
                src={generatedImage} 
                alt="AI Generated Image" 
                className="w-full h-auto"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-muted/50">Style: {style}</Badge>
              <Badge variant="secondary" className="bg-muted/50">Ratio: {aspectRatio}</Badge>
              <Badge variant="secondary" className="bg-muted/50">Quality: {quality[0]}%</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Prompt (fallback when no image) */}
      {generatedPrompt && !generatedImage && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Generated Prompt</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyPrompt} className="bg-transparent">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate} className="bg-transparent">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-sm text-foreground">{generatedPrompt}</p>
            </div>
            {negativePrompt && (
              <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Negative Prompt:</p>
                <p className="text-sm text-foreground">{negativePrompt}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-muted/50">Style: {style}</Badge>
              <Badge variant="secondary" className="bg-muted/50">Ratio: {aspectRatio}</Badge>
              <Badge variant="secondary" className="bg-muted/50">Quality: {quality[0]}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Use this prompt with your preferred AI image generation tool (Midjourney, DALL-E, Stable Diffusion, etc.)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
