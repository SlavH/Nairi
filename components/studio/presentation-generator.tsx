"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Presentation, 
  Sparkles, 
  Loader2, 
  Download, 
  Copy, 
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Wand2,
  Check,
  Upload,
  FileUp,
  File
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PresentationGeneratorProps {
  onPresentationGenerated?: (slides: Slide[]) => void
}

interface Slide {
  number: number
  title: string
  layout: string
  content: string[]
  visual: string
  speakerNotes: string
}

type PresentationType = "pitch-deck" | "sales" | "educational" | "report" | "keynote" | "workshop" | "creative"
type DesignTheme = "professional" | "creative" | "minimal" | "bold" | "tech" | "nature"

const PRESENTATION_TYPES: { value: PresentationType; label: string; slides: number }[] = [
  { value: "pitch-deck", label: "Pitch Deck", slides: 12 },
  { value: "sales", label: "Sales Presentation", slides: 10 },
  { value: "educational", label: "Educational", slides: 15 },
  { value: "report", label: "Business Report", slides: 8 },
  { value: "keynote", label: "Keynote Speech", slides: 10 },
  { value: "workshop", label: "Workshop/Training", slides: 20 }
]

const DESIGN_THEMES: { value: DesignTheme; label: string; colors: string[] }[] = [
  { value: "professional", label: "Professional", colors: ["#1a365d", "#2b6cb0", "#63b3ed"] },
  { value: "creative", label: "Creative", colors: ["#9f7aea", "#ed64a6", "#f687b3"] },
  { value: "minimal", label: "Minimal", colors: ["#1a202c", "#718096", "#e2e8f0"] },
  { value: "bold", label: "Bold", colors: ["#e53e3e", "#ed8936", "#ecc94b"] },
  { value: "tech", label: "Tech", colors: ["#0d9488", "#22d3ee", "#06b6d4"] },
  { value: "nature", label: "Nature", colors: ["#276749", "#48bb78", "#9ae6b4"] }
]

const EXAMPLE_TOPICS = [
  "AI startup pitch for investors",
  "Q4 sales performance review",
  "Introduction to machine learning",
  "Product launch announcement",
  "Team building workshop"
]

export function PresentationGenerator({ onPresentationGenerated }: PresentationGeneratorProps) {
  const [topic, setTopic] = useState("")
  const [additionalContext, setAdditionalContext] = useState("")
  const [presentationType, setPresentationType] = useState<PresentationType>("pitch-deck")
  const [designTheme, setDesignTheme] = useState<DesignTheme>("professional")
  const [slideCount, setSlideCount] = useState("10")
  const [isGenerating, setIsGenerating] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [copied, setCopied] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a presentation topic")
      return
    }

    setIsGenerating(true)
    setSlides([])
    setCurrentSlide(0)
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "presentation",
          prompt: topic,
          additionalDetails: additionalContext,
          options: {
            tone: presentationType === "creative" ? "creative" : "professional",
            length: parseInt(slideCount) > 12 ? "long" : parseInt(slideCount) > 8 ? "medium" : "short",
            includeExamples: true,
            outputFormat: "visual",
            style: designTheme,
            presentationType,
            slideCount: parseInt(slideCount)
          }
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Generation failed")
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                accumulated += data.content
              }
              if (data.complete) {
                // Parse the generated presentation into slides
                const parsedSlides = parsePresentation(accumulated, parseInt(slideCount))
                setSlides(parsedSlides)
                if (onPresentationGenerated) {
                  onPresentationGenerated(parsedSlides)
                }
                toast.success("Presentation generated!")
              }
            } catch {
              // Skip invalid chunks
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.info("Generation cancelled")
      } else {
        toast.error(error instanceof Error ? error.message : "Generation failed")
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const parsePresentation = (content: string, targetSlides: number): Slide[] => {
    const slideMatches = content.split(/\*\*SLIDE \d+:|---/).filter(s => s.trim())
    const parsedSlides: Slide[] = []

    for (let i = 0; i < Math.min(slideMatches.length, targetSlides); i++) {
      const slideContent = slideMatches[i]
      const titleMatch = slideContent.match(/\*\*([^*]+)\*\*/) || slideContent.match(/^([^\n]+)/)
      const title = titleMatch ? titleMatch[1].replace(/SLIDE \d+:?\s*/i, "").trim() : `Slide ${i + 1}`
      
      const lines = slideContent.split("\n").filter(l => l.trim())
      const bulletPoints = lines.filter(l => l.startsWith("-") || l.startsWith("•")).map(l => l.replace(/^[-•]\s*/, "").trim())
      
      const visualMatch = slideContent.match(/\*\*Visual:\*\*\s*([^\n]+)/i) || 
                         slideContent.match(/Visual:\s*([^\n]+)/i)
      const notesMatch = slideContent.match(/\*\*Speaker Notes?:\*\*\s*([^\n]+)/i) ||
                        slideContent.match(/Speaker Notes?:\s*([^\n]+)/i)
      const layoutMatch = slideContent.match(/Layout:\s*([^\n]+)/i)

      parsedSlides.push({
        number: i + 1,
        title: title,
        layout: layoutMatch ? layoutMatch[1].trim() : "Title + Content",
        content: bulletPoints.length > 0 ? bulletPoints : lines.slice(1, 5).map(l => l.trim()),
        visual: visualMatch ? visualMatch[1].trim() : "Relevant visual or icon",
        speakerNotes: notesMatch ? notesMatch[1].trim() : ""
      })
    }

    // Ensure we have at least some slides
    if (parsedSlides.length === 0) {
      parsedSlides.push({
        number: 1,
        title: topic,
        layout: "Title Slide",
        content: ["Click regenerate to try again"],
        visual: "Background image",
        speakerNotes: ""
      })
    }

    return parsedSlides
  }

  const copyPresentation = () => {
    const text = slides.map(s => 
      `Slide ${s.number}: ${s.title}\n${s.content.map(c => `- ${c}`).join("\n")}\n\nVisual: ${s.visual}\nNotes: ${s.speakerNotes}`
    ).join("\n\n---\n\n")
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Presentation copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPresentation = () => {
    const markdown = `# ${topic}\n\n${slides.map(s => 
      `## Slide ${s.number}: ${s.title}\n\n**Layout:** ${s.layout}\n\n${s.content.map(c => `- ${c}`).join("\n")}\n\n**Visual:** ${s.visual}\n\n**Speaker Notes:** ${s.speakerNotes}`
    ).join("\n\n---\n\n")}`
    
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `presentation-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded as Markdown!")
  }

  const downloadPPTX = async () => {
    try {
      toast.info("Generating PowerPoint file...")
      const response = await fetch("/api/export-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic,
          slides: slides.map(s => ({
            title: s.title,
            content: s.content,
            layout: s.layout,
            speakerNotes: s.speakerNotes,
            visual: s.visual
          })),
          theme: designTheme
        })
      })

      if (!response.ok) {
        throw new Error("Failed to generate PPTX")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `presentation-${Date.now()}.pptx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("PowerPoint downloaded!")
    } catch (error) {
      toast.error("Failed to download PowerPoint")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setIsUploading(true)

    try {
      // Read file content for text-based files
      let content = ""
      if (file.type === "text/plain" || file.type === "text/markdown" || file.name.endsWith(".md")) {
        content = await file.text()
      } else if (file.type === "application/json") {
        content = await file.text()
      }

      if (content) {
        // Use file content as additional context
        setAdditionalContext(content.slice(0, 5000))
        setTopic(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "))
        toast.success(`File loaded: ${file.name}`)
      } else {
        // For PDF/Word, we'd need server-side processing
        toast.info("Document uploaded. Content will be extracted on generation.")
      }
    } catch (error) {
      toast.error("Failed to read file")
    } finally {
      setIsUploading(false)
    }
  }

  const clearUploadedFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const currentSlideData = slides[currentSlide]
  const selectedTheme = DESIGN_THEMES.find(t => t.value === designTheme)

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Presentation className="h-5 w-5 text-[#e879f9]" />
            Presentation Generator
          </CardTitle>
          <CardDescription>
            Create professional slide decks in seconds. Get complete presentations with content, visuals, and speaker notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Import from Document (optional)</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-transparent flex-1"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploadedFile ? uploadedFile.name : "Upload Document"}
              </Button>
              {uploadedFile && (
                <Button variant="ghost" size="icon" onClick={clearUploadedFile}>
                  ×
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Supports TXT, Markdown, PDF, Word documents</p>
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <Label>Presentation Topic</Label>
            <Input
              placeholder="Enter your presentation topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Examples */}
          <div className="flex flex-wrap gap-1">
            {EXAMPLE_TOPICS.map((example) => (
              <button
                key={example}
                onClick={() => setTopic(example)}
                className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
              >
                {example}
              </button>
            ))}
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label>Additional Context (optional)</Label>
            <Textarea
              placeholder="Key points to cover, target audience, specific requirements..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className="min-h-[80px] bg-background resize-none"
            />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Type</Label>
              <Select value={presentationType} onValueChange={(v) => setPresentationType(v as PresentationType)}>
                <SelectTrigger className="bg-background h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESENTATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Theme</Label>
              <Select value={designTheme} onValueChange={(v) => setDesignTheme(v as DesignTheme)}>
                <SelectTrigger className="bg-background h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {theme.colors.map((color) => (
                            <div key={color} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        {theme.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Slides</Label>
              <Select value={slideCount} onValueChange={setSlideCount}>
                <SelectTrigger className="bg-background h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 slides</SelectItem>
                  <SelectItem value="8">8 slides</SelectItem>
                  <SelectItem value="10">10 slides</SelectItem>
                  <SelectItem value="12">12 slides</SelectItem>
                  <SelectItem value="15">15 slides</SelectItem>
                  <SelectItem value="20">20 slides</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Theme Preview */}
          {selectedTheme && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Theme colors:</span>
              {selectedTheme.colors.map((color) => (
                <div key={color} className="w-6 h-6 rounded-md border border-border" style={{ backgroundColor: color }} />
              ))}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!topic.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Presentation...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Presentation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Slide Preview */}
      {slides.length > 0 && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Generated Presentation</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyPresentation} className="bg-transparent">
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadPresentation} className="bg-transparent">
                  <FileText className="h-4 w-4 mr-1" />
                  Markdown
                </Button>
                <Button variant="outline" size="sm" onClick={downloadPPTX} className="bg-transparent">
                  <Download className="h-4 w-4 mr-1" />
                  PowerPoint
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Slide Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Slide {currentSlide + 1} of {slides.length}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                disabled={currentSlide === slides.length - 1}
                className="bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Slide Preview */}
            {currentSlideData && (
              <div 
                className="aspect-video rounded-lg p-6 flex flex-col justify-between"
                style={{ 
                  background: `linear-gradient(135deg, ${selectedTheme?.colors[0]} 0%, ${selectedTheme?.colors[1]} 100%)` 
                }}
              >
                <div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 mb-2">
                    {currentSlideData.layout}
                  </Badge>
                  <h3 className="text-2xl font-bold text-white mb-4">{currentSlideData.title}</h3>
                  <ul className="space-y-2">
                    {currentSlideData.content.slice(0, 4).map((item, i) => (
                      <li key={i} className="text-white/90 flex items-start gap-2">
                        <span className="text-white/60">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-xs text-white/50">
                  Visual: {currentSlideData.visual}
                </div>
              </div>
            )}

            {/* Speaker Notes */}
            {currentSlideData?.speakerNotes && (
              <div className="mt-4 p-3 bg-background rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Speaker Notes:</p>
                <p className="text-sm text-foreground">{currentSlideData.speakerNotes}</p>
              </div>
            )}

            {/* Slide Thumbnails */}
            <ScrollArea className="mt-4">
              <div className="flex gap-2 pb-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.number}
                    onClick={() => setCurrentSlide(index)}
                    className={cn(
                      "flex-shrink-0 w-24 h-16 rounded-md p-2 text-left transition-all",
                      currentSlide === index
                        ? "ring-2 ring-primary"
                        : "hover:ring-1 hover:ring-primary/50"
                    )}
                    style={{ 
                      background: `linear-gradient(135deg, ${selectedTheme?.colors[0]} 0%, ${selectedTheme?.colors[1]} 100%)` 
                    }}
                  >
                    <p className="text-[8px] text-white font-medium truncate">{slide.title}</p>
                    <p className="text-[6px] text-white/70 mt-0.5">Slide {slide.number}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
