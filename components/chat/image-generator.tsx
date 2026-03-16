"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ImageIcon, 
  Loader2, 
  Download, 
  RefreshCw,
  Sparkles,
  Settings2,
  X
} from "lucide-react"

interface ImageGeneratorProps {
  isOpen?: boolean
  onClose?: () => void
  onImageGenerated?: (imageUrl: string, prompt: string) => void
}

const styles = [
  { id: "realistic", label: "Realistic" },
  { id: "artistic", label: "Artistic" },
  { id: "anime", label: "Anime" },
  { id: "3d", label: "3D Render" },
  { id: "sketch", label: "Sketch" },
  { id: "watercolor", label: "Watercolor" },
  { id: "oil", label: "Oil Painting" },
  { id: "digital", label: "Digital Art" },
  { id: "minimalist", label: "Minimalist" },
  { id: "fantasy", label: "Fantasy" }
]

const sizes = [
  { id: "1024x1024", label: "Square (1:1)" },
  { id: "1024x1792", label: "Portrait (9:16)" },
  { id: "1792x1024", label: "Landscape (16:9)" }
]

export function ImageGenerator({ isOpen, onClose, onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("realistic")
  const [size, setSize] = useState("1024x1024")
  const [quality, setQuality] = useState("standard")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    try {
      // Use AbortController for timeout (60 seconds for image generation)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, size, quality }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to generate image")
      }

      if (!data.image?.url) {
        throw new Error("No image URL in response")
      }

      setGeneratedImage(data.image.url)
      
      // Don't auto-close - let user see the image first
      // They can click "Use Image" or close manually
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Image generation timed out. Please try again with a simpler prompt.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate image")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseImage = () => {
    if (generatedImage && onImageGenerated) {
      onImageGenerated(generatedImage, prompt)
    }
  }

  const handleDownload = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nairi-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed:", err)
    }
  }

  // Support both standalone and dialog modes
  const isStandalone = isOpen === undefined
  if (!isStandalone && !isOpen) return null

  return (
    <Card className="w-full max-w-2xl mx-auto border-purple-500/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-purple-500" />
          Image Generator
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Describe your image</Label>
          <div className="flex gap-2">
            <Input
              id="prompt"
              placeholder="A serene mountain landscape at sunset with a lake..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {styles.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quality</Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Generated Image */}
        {generatedImage && (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img 
                src={generatedImage || "/placeholder.svg"} 
                alt="Generated image"
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                className="flex-1 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              {onImageGenerated && (
                <Button 
                  size="sm" 
                  onClick={handleUseImage}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use Image
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground">Generating your image...</p>
            <p className="text-xs text-muted-foreground mt-2">This may take 10-30 seconds</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
