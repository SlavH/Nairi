"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Video, 
  Loader2, 
  Download, 
  Copy, 
  RefreshCw,
  Wand2,
  Play,
  Clock,
  Monitor,
  Smartphone,
  Square
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string, prompt: string) => void
}

type VideoStyle = "realistic" | "cinematic" | "anime" | "3d" | "artistic" | "timelapse"
type VideoDuration = "short" | "medium" | "long"
type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3"

const VIDEO_STYLES: { value: VideoStyle; label: string; description: string }[] = [
  { value: "realistic", label: "Realistic", description: "Photorealistic video" },
  { value: "cinematic", label: "Cinematic", description: "Movie-like quality" },
  { value: "anime", label: "Anime", description: "Japanese animation style" },
  { value: "3d", label: "3D Animation", description: "3D CGI style" },
  { value: "artistic", label: "Artistic", description: "Creative artistic style" },
  { value: "timelapse", label: "Time-lapse", description: "Accelerated motion" }
]

const VIDEO_DURATIONS: { value: VideoDuration; label: string; frames: number }[] = [
  { value: "short", label: "Short (1-3s)", frames: 24 },
  { value: "medium", label: "Medium (3-5s)", frames: 48 },
  { value: "long", label: "Long (5-8s)", frames: 72 }
]

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: typeof Square }[] = [
  { value: "16:9", label: "Landscape", icon: Monitor },
  { value: "9:16", label: "Portrait", icon: Smartphone },
  { value: "1:1", label: "Square", icon: Square },
  { value: "4:3", label: "Classic", icon: Monitor }
]

const EXAMPLE_PROMPTS = [
  "A butterfly emerging from a cocoon in slow motion",
  "Ocean waves crashing on a rocky shore at sunset",
  "A rocket launching into space with flames",
  "Cherry blossoms falling in a Japanese garden",
  "A city street timelapse from day to night",
  "Abstract colorful particles flowing in space"
]

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState<VideoStyle>("cinematic")
  const [duration, setDuration] = useState<VideoDuration>("short")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)
  const [videoFrames, setVideoFrames] = useState<string[] | null>(null)
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a video description")
      return
    }

    setIsGenerating(true)
    setGeneratedVideo(null)
    setVideoFrames(null)
    setWarning(null)

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style,
          duration,
          aspectRatio
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresUpgrade) {
          toast.error("Video generation requires a paid plan")
        } else {
          throw new Error(data.error || "Video generation failed")
        }
        return
      }

      setEnhancedPrompt(data.enhancedPrompt)
      setProvider(data.provider)

      if (data.videoUrl) {
        setGeneratedVideo(data.videoUrl)
        if (onVideoGenerated) {
          onVideoGenerated(data.videoUrl, prompt)
        }
        toast.success(data.message || "Video generated!")
      } else if (data.videoFrames) {
        setVideoFrames(data.videoFrames)
        setWarning(data.warning)
        toast.warning("Generated image sequence (video unavailable)")
      } else {
        setWarning(data.message)
        toast.error("Video generation failed")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyPrompt = () => {
    if (enhancedPrompt) {
      navigator.clipboard.writeText(enhancedPrompt)
      toast.success("Enhanced prompt copied!")
    }
  }

  const downloadVideo = () => {
    if (generatedVideo) {
      const a = document.createElement('a')
      a.href = generatedVideo
      a.download = `nairi-video-${Date.now()}.mp4`
      a.click()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Video className="h-5 w-5 text-[#22d3ee]" />
            AI Video Generator
          </CardTitle>
          <CardDescription>
            Create AI-generated videos from text descriptions. Powered by free/open-source models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Prompt */}
          <div className="space-y-2">
            <Label>Describe your video</Label>
            <Textarea
              placeholder="Describe the video you want to create... (e.g., A majestic eagle soaring over mountains at sunrise)"
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
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_STYLES.map((s) => (
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

          {/* Duration Selection */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex gap-2">
              {VIDEO_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={cn(
                    "flex-1 p-2 rounded-lg border flex flex-col items-center gap-1 transition-all",
                    duration === d.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-background"
                  )}
                >
                  <Clock className={cn(
                    "h-4 w-4",
                    duration === d.value ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs",
                    duration === d.value ? "text-foreground" : "text-muted-foreground"
                  )}>{d.label}</span>
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

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Video
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Video generation may take 30-60 seconds depending on the provider.
          </p>
        </CardContent>
      </Card>

      {/* Generated Result */}
      {(generatedVideo || videoFrames || enhancedPrompt) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Generated Result</CardTitle>
              <div className="flex gap-2">
                {enhancedPrompt && (
                  <Button variant="outline" size="sm" onClick={copyPrompt} className="bg-transparent">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Prompt
                  </Button>
                )}
                {generatedVideo && (
                  <Button variant="outline" size="sm" onClick={downloadVideo} className="bg-transparent">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleGenerate} className="bg-transparent">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video Player */}
            {generatedVideo && (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={generatedVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Image Frames Fallback */}
            {videoFrames && (
              <div className="space-y-2">
                <p className="text-sm text-yellow-500">{warning}</p>
                <div className="grid grid-cols-4 gap-2">
                  {videoFrames.map((frame, index) => (
                    <img
                      key={index}
                      src={frame}
                      alt={`Frame ${index + 1}`}
                      className="w-full aspect-video object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Prompt */}
            {enhancedPrompt && (
              <div className="p-4 bg-background rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Enhanced Prompt:</p>
                <p className="text-sm text-foreground">{enhancedPrompt}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-muted/50">Style: {style}</Badge>
              <Badge variant="secondary" className="bg-muted/50">Duration: {duration}</Badge>
              <Badge variant="secondary" className="bg-muted/50">Ratio: {aspectRatio}</Badge>
              {provider && <Badge variant="secondary" className="bg-green-500/20 text-green-400">Provider: {provider}</Badge>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
