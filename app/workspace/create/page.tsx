"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Presentation, 
  Globe, 
  FileText, 
  Palette, 
  Code, 
  BarChart3,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  ArrowRight,
  Activity,
  Image,
  Video,
  Mic
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type CreationType = "presentation" | "website" | "document" | "visual" | "code" | "analysis" | "simulation" | "image" | "video" | "audio"

// Game generation does not exist. Simulation is implemented via /api/generate-simulation.
const COMING_SOON_TYPES: CreationType[] = []

interface CreationOption {
  type: CreationType
  label: string
  description: string
  icon: typeof Presentation
  color: string
  examples: string[]
  comingSoon?: boolean  // COMING SOON: Features marked with this are planned but not yet implemented
}

const CREATION_OPTIONS: CreationOption[] = [
  {
    type: "presentation",
    label: "Presentation",
    description: "Create slide decks for pitches, reports, and meetings",
    icon: Presentation,
    color: "from-orange-500 to-red-500",
    examples: [
      "Startup pitch deck for a fintech app",
      "Quarterly business review presentation",
      "Educational workshop on climate change"
    ]
  },
  {
    type: "website",
    label: "Website",
    description: "Design landing pages, portfolios, and web interfaces",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    examples: [
      "SaaS landing page with pricing section",
      "Personal portfolio for a designer",
      "Restaurant website with menu and reservations"
    ]
  },
  {
    type: "document",
    label: "Document",
    description: "Write reports, proposals, and structured content",
    icon: FileText,
    color: "from-green-500 to-emerald-500",
    examples: [
      "Technical specification document",
      "Business proposal for new project",
      "Research paper on AI trends"
    ]
  },
  {
    type: "visual",
    label: "Visual Concept",
    description: "Create detailed visual specifications and art direction",
    icon: Palette,
    color: "from-pink-500 to-rose-500",
    examples: [
      "Brand identity for a tech startup",
      "Social media campaign visuals",
      "Product packaging design concept"
    ]
  },
  {
    type: "code",
    label: "Code",
    description: "Generate clean, documented code for any purpose",
    icon: Code,
    color: "from-slate-500 to-zinc-600",
    examples: [
      "React component with TypeScript",
      "Python data processing script",
      "API endpoint with validation"
    ]
  },
  {
    type: "analysis",
    label: "Data Analysis",
    description: "Analyze data and generate insights with visualizations",
    icon: BarChart3,
    color: "from-indigo-500 to-violet-500",
    examples: [
      "Market analysis for product launch",
      "Customer feedback sentiment analysis",
      "Performance metrics dashboard design"
    ]
  },
  {
    type: "simulation",
    label: "Simulation",
    description: "Create interactive simulations and physics-based demos",
    icon: Activity,
    color: "from-teal-500 to-cyan-500",
    examples: [
      "Particle physics simulation",
      "Ecosystem population dynamics",
      "Traffic flow simulation"
    ]
  },
  {
    type: "image",
    label: "Image",
    description: "Generate images from text descriptions",
    icon: Image,
    color: "from-purple-500 to-fuchsia-500",
    examples: [
      "A serene mountain landscape at sunset",
      "Futuristic city with flying cars",
      "Portrait of a cyberpunk character"
    ]
  },
  {
    type: "video",
    label: "Video",
    description: "Create videos from text or images",
    icon: Video,
    color: "from-red-500 to-pink-500",
    examples: [
      "Time-lapse of a blooming flower",
      "Product showcase animation",
      "Abstract motion graphics"
    ]
  },
  {
    type: "audio",
    label: "Audio",
    description: "Generate speech, music, and sound effects",
    icon: Mic,
    color: "from-cyan-500 to-blue-500",
    examples: [
      "Professional voiceover for video",
      "Background music for podcast",
      "Sound effects for video"
    ]
  }
]

// Presentation templates with visual styles
const PRESENTATION_TEMPLATES = [
  {
    id: "modern-dark",
    name: "Modern Dark",
    description: "Sleek dark theme with gradient accents",
    theme: "dark",
    style: "professional",
    preview: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    accent: "#a855f7",
    font: "Inter"
  },
  {
    id: "corporate-light",
    name: "Corporate Light",
    description: "Clean professional look for business",
    theme: "light",
    style: "corporate",
    preview: "bg-gradient-to-br from-white via-blue-50 to-white",
    accent: "#3b82f6",
    font: "Roboto"
  },
  {
    id: "creative-gradient",
    name: "Creative Gradient",
    description: "Bold colorful gradients for impact",
    theme: "gradient",
    style: "creative",
    preview: "bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500",
    accent: "#fbbf24",
    font: "Poppins"
  },
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    description: "Simple and focused design",
    theme: "light",
    style: "minimal",
    preview: "bg-gradient-to-br from-gray-50 via-white to-gray-50",
    accent: "#10b981",
    font: "Source Sans Pro"
  },
  {
    id: "startup-bold",
    name: "Startup Bold",
    description: "Eye-catching for pitch decks",
    theme: "dark",
    style: "creative",
    preview: "bg-gradient-to-br from-indigo-900 via-blue-900 to-cyan-900",
    accent: "#22d3ee",
    font: "Montserrat"
  },
  {
    id: "education-friendly",
    name: "Education Friendly",
    description: "Clear and instructional",
    theme: "light",
    style: "educational",
    preview: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50",
    accent: "#f59e0b",
    font: "Open Sans"
  }
]

export default function CreatePage() {
  const [selectedType, setSelectedType] = useState<CreationType | null>(null)
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("")
  const [length, setLength] = useState<"short" | "medium" | "long">("medium")
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [htmlResult, setHtmlResult] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(PRESENTATION_TEMPLATES[0])
  const [showTemplates, setShowTemplates] = useState(false)
  const [simulationType, setSimulationType] = useState<'physics' | 'chemistry' | 'biology' | 'math' | 'custom'>('physics')
  const [simulationComplexity, setSimulationComplexity] = useState<'simple' | 'medium' | 'complex'>('medium')

  const selectedOption = CREATION_OPTIONS.find(o => o.type === selectedType)

  const handleCreate = async () => {
    if (!selectedType || !prompt.trim()) {
      toast.error("Please select a type and enter a prompt")
      return
    }
    if (COMING_SOON_TYPES.includes(selectedType)) {
      toast.info("SOON — this feature is under active development.")
      return
    }

    setIsCreating(true)
    setResult(null)
    setHtmlResult(null)
    setImageUrl(null)
    setVideoUrl(null)
    setAudioUrl(null)

    try {
      // Handle image generation
      if (selectedType === "image") {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            style: style || "realistic",
            size: "1024x1024",
            quality: "standard"
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Image generation failed")
        }

        // API returns nested object: data.image.url
        const imageUrl = data.image?.url || data.imageUrl
        setImageUrl(imageUrl)
        setResult(`Image generated successfully!\n\nPrompt: ${prompt}\nStyle: ${style || "realistic"}\nProvider: ${data.image?.provider || data.provider || "unknown"}\nRevised Prompt: ${data.image?.revised_prompt || "N/A"}`)
        toast.success("Image created!")
      }
      // Handle video generation
      else if (selectedType === "video") {
        const response = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            style: style || "cinematic",
            duration: length === "short" ? 3 : length === "long" ? 10 : 5
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Video generation failed")
        }

        // API returns nested object: data.video.url
        const videoUrl = data.video?.url || data.videoUrl
        setVideoUrl(videoUrl)
        setResult(`Video generated successfully!\n\nPrompt: ${prompt}\nStyle: ${style || "cinematic"}\nProvider: ${data.video?.provider || data.provider || "unknown"}`)
        toast.success("Video created!")
      }
      // Handle audio generation
      else if (selectedType === "audio") {
        const response = await fetch("/api/generate-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            type: style || "speech",
            duration: length === "short" ? 10 : length === "long" ? 60 : 30
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Audio generation failed")
        }

        // API returns nested object: data.audio.url
        const audioUrl = data.audio?.url || data.audioUrl
        setAudioUrl(audioUrl)
        setResult(`Audio generated successfully!\n\nPrompt: ${prompt}\nType: ${style || "speech"}\nProvider: ${data.audio?.provider || data.provider || "unknown"}`)
        toast.success("Audio created!")
      }
      // Use dedicated presentation API for presentations
      else if (selectedType === "presentation") {
        const slideCount = length === "short" ? 5 : length === "long" ? 12 : 8
        const response = await fetch("/api/generate-presentation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            slideCount,
            style: selectedTemplate.style,
            theme: selectedTemplate.theme,
            format: "html",
            templateId: selectedTemplate.id,
            accent: selectedTemplate.accent,
            font: selectedTemplate.font
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Presentation generation failed")
        }

        setHtmlResult(data.html)
        setResult(data.markdown || JSON.stringify(data.slides, null, 2))
        toast.success(`Presentation created with ${data.slideCount} slides!`)
      } else if (selectedType === "simulation") {
        const response = await fetch("/api/generate-simulation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompt.trim(),
            type: simulationType,
            complexity: simulationComplexity,
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Simulation generation failed")
        setHtmlResult(data.simulationHtml)
        setResult(`Simulation: ${data.prompt}\nType: ${data.type}\nComplexity: ${data.complexity}`)
        toast.success("Simulation created!")
      } else {
        // Use generic create API for other types
        const response = await fetch("/api/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: selectedType,
            prompt: prompt.trim(),
            options: { style, length }
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Creation failed")
        }

        setResult(data.content)
        toast.success("Creation complete!")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Creation failed")
    } finally {
      setIsCreating(false)
    }
  }

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      setCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadResult = () => {
    if (imageUrl) {
      const a = document.createElement("a")
      a.href = imageUrl
      a.download = `nairi-image-${Date.now()}.png`
      a.target = "_blank"
      a.click()
      toast.success("Image download started!")
    } else if (videoUrl) {
      const a = document.createElement("a")
      a.href = videoUrl
      a.download = `nairi-video-${Date.now()}.mp4`
      a.target = "_blank"
      a.click()
      toast.success("Video download started!")
    } else if (audioUrl) {
      const a = document.createElement("a")
      a.href = audioUrl
      a.download = `nairi-audio-${Date.now()}.mp3`
      a.target = "_blank"
      a.click()
      toast.success("Audio download started!")
    } else if ((selectedType === "presentation" || selectedType === "simulation") && htmlResult) {
      const blob = new Blob([htmlResult], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nairi-${selectedType}-${Date.now()}.html`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(selectedType === "simulation" ? "Simulation downloaded as HTML!" : "Presentation downloaded as HTML!")
    } else if (result && selectedType) {
      const blob = new Blob([result], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nairi-${selectedType}-${Date.now()}.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Downloaded!")
    }
  }

  const useExample = (example: string) => {
    setPrompt(example)
  }

  const handleExampleClick = (example: string) => {
    useExample(example)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-semibold text-foreground">Create</h1>
          </div>
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/workspace">View All Creations</Link>
          </Button>
        </div>
      </header>

      <main className="page-container py-10 md:py-12">
        <div className="mb-10">
          <div className="section-badge mb-4">
            <Sparkles className="h-4 w-4 text-[#e879f9]" />
            <span>AI-Powered Creation</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="gradient-text">Create Something Amazing</span>
          </h2>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            Transform your ideas into presentations, websites, documents, and more.
          </p>
        </div>

        <Tabs defaultValue="select" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="select">1. Select Type</TabsTrigger>
            <TabsTrigger value="create" disabled={!selectedType}>2. Create</TabsTrigger>
          </TabsList>

          {/* Step 1: Select Type */}
          <TabsContent value="select" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CREATION_OPTIONS.map((option) => (
                <Card 
                  key={option.type}
                  className={`section-card transition-all ${
                    option.comingSoon 
                      ? "opacity-60 cursor-not-allowed" 
                      : "cursor-pointer hover:scale-[1.02]"
                  } ${
                    selectedType === option.type 
                      ? "ring-2 ring-[#e879f9] bg-card" 
                      : "hover:bg-card"
                  }`}
                  onClick={() => !option.comingSoon && setSelectedType(option.type)}
                >
                  <CardContent className="p-6 relative">
                    {/* SOON: No execution, no API — under active development */}
                    {option.comingSoon && (
                      <Badge className="absolute top-2 right-2 bg-amber-500/20 text-amber-400 border-amber-500/30">
                        SOON — under active development
                      </Badge>
                    )}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${option.color} flex items-center justify-center mb-4 ${option.comingSoon ? "grayscale" : ""}`}>
                      <option.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground">{option.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    {selectedType === option.type && !option.comingSoon && (
                      <Badge className="mt-3 bg-[#e879f9]/20 text-[#e879f9] border-0">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedType && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => document.querySelector<HTMLButtonElement>('[value="create"]')?.click()}
                  className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Step 2: Create */}
          <TabsContent value="create" className="space-y-6">
            {selectedOption && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Input Section */}
                <Card className="section-card border-border">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${selectedOption.color} flex items-center justify-center`}>
                        <selectedOption.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-foreground">{selectedOption.label}</CardTitle>
                        <CardDescription>{selectedOption.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prompt">What do you want to create?</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Describe your creation in detail..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[150px] bg-background"
                      />
                    </div>

                    {/* Simulation type and complexity */}
                    {selectedType === "simulation" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Simulation type</Label>
                          <Select value={simulationType} onValueChange={(v) => setSimulationType(v as typeof simulationType)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="physics">Physics</SelectItem>
                              <SelectItem value="chemistry">Chemistry</SelectItem>
                              <SelectItem value="biology">Biology</SelectItem>
                              <SelectItem value="math">Mathematics</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Complexity</Label>
                          <Select value={simulationComplexity} onValueChange={(v) => setSimulationComplexity(v as typeof simulationComplexity)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simple">Simple</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="complex">Complex</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Template Selection for Presentations */}
                    {selectedType === "presentation" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Choose Template</Label>
                          <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="text-xs text-[#e879f9] hover:underline"
                          >
                            {showTemplates ? "Hide templates" : "View all templates"}
                          </button>
                        </div>
                        
                        {/* Selected Template Preview */}
                        <div 
                          className={`relative p-4 rounded-xl border-2 border-[#e879f9] cursor-pointer ${selectedTemplate.preview}`}
                          onClick={() => setShowTemplates(!showTemplates)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-semibold ${selectedTemplate.theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                {selectedTemplate.name}
                              </h4>
                              <p className={`text-xs ${selectedTemplate.theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                                {selectedTemplate.description}
                              </p>
                            </div>
                            <div 
                              className="w-8 h-8 rounded-full" 
                              style={{ backgroundColor: selectedTemplate.accent }}
                            />
                          </div>
                        </div>

                        {/* Template Grid */}
                        {showTemplates && (
                          <div className="grid grid-cols-2 gap-2 p-3 bg-background rounded-lg border border-border">
                            {PRESENTATION_TEMPLATES.map((template) => (
                              <div
                                key={template.id}
                                onClick={() => {
                                  setSelectedTemplate(template)
                                  setShowTemplates(false)
                                }}
                                className={`relative p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                                  selectedTemplate.id === template.id 
                                    ? "ring-2 ring-[#e879f9]" 
                                    : "ring-1 ring-border hover:ring-[#e879f9]/50"
                                } ${template.preview}`}
                              >
                                <h5 className={`text-sm font-medium ${template.theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                  {template.name}
                                </h5>
                                <p className={`text-xs mt-0.5 ${template.theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                                  {template.font}
                                </p>
                                <div 
                                  className="absolute top-2 right-2 w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: template.accent }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      {selectedType !== "presentation" && (
                        <div className="space-y-2">
                          <Label htmlFor="style">Style (optional)</Label>
                          <Select value={style} onValueChange={setStyle}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="creative">Creative</SelectItem>
                              <SelectItem value="technical">Technical</SelectItem>
                              <SelectItem value="minimalist">Minimalist</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="length">{selectedType === "presentation" ? "Slides" : "Length"}</Label>
                        <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">{selectedType === "presentation" ? "5 slides" : "Short"}</SelectItem>
                            <SelectItem value="medium">{selectedType === "presentation" ? "8 slides" : "Medium"}</SelectItem>
                            <SelectItem value="long">{selectedType === "presentation" ? "12 slides" : "Comprehensive"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">Try an example:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedOption.examples.map((example) => (
                          <button
                            key={example}
                            onClick={() => handleExampleClick(example)}
                            className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleCreate}
                      disabled={!prompt.trim() || isCreating}
                      className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create {selectedOption.label}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Output Section */}
                <Card className="section-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground">Result</CardTitle>
                      {(result || htmlResult || imageUrl || videoUrl || audioUrl) && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={copyResult} className="bg-transparent">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={downloadResult} className="bg-transparent">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isCreating ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-muted animate-spin border-t-[#e879f9]" />
                          <Sparkles className="h-6 w-6 text-[#e879f9] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-muted-foreground">Creating your {selectedOption.label.toLowerCase()}...</p>
                      </div>
                    ) : imageUrl ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
                          <img 
                            src={imageUrl} 
                            alt="Generated image" 
                            className="w-full h-auto"
                          />
                        </div>
                        {result && (
                          <div className="text-xs text-muted-foreground bg-background rounded-lg p-3">
                            <pre className="whitespace-pre-wrap">{result}</pre>
                          </div>
                        )}
                      </div>
                    ) : videoUrl ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
                          <video 
                            src={videoUrl} 
                            controls 
                            className="w-full h-auto"
                          />
                        </div>
                        {result && (
                          <div className="text-xs text-muted-foreground bg-background rounded-lg p-3">
                            <pre className="whitespace-pre-wrap">{result}</pre>
                          </div>
                        )}
                      </div>
                    ) : audioUrl ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-border p-6 bg-muted/20">
                          <audio 
                            src={audioUrl} 
                            controls 
                            className="w-full"
                          />
                        </div>
                        {result && (
                          <div className="text-xs text-muted-foreground bg-background rounded-lg p-3">
                            <pre className="whitespace-pre-wrap">{result}</pre>
                          </div>
                        )}
                      </div>
                    ) : htmlResult && (selectedType === "presentation" || selectedType === "simulation") ? (
                      <div className="max-h-[600px] overflow-y-auto rounded-lg border border-border">
                        <iframe
                          srcDoc={htmlResult}
                          className="w-full h-[600px] rounded-lg"
                          title={selectedType === "simulation" ? "Simulation Preview" : "Presentation Preview"}
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    ) : result ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none max-h-[500px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-foreground bg-background rounded-lg p-4">
                          {result}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <selectedOption.icon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground">Your creation will appear here</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter a prompt and click Create to begin
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
