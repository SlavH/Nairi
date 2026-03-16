"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Volume2, 
  Loader2, 
  Download, 
  Copy, 
  RefreshCw,
  Wand2,
  Play,
  Pause,
  Mic,
  Speaker
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AudioGeneratorProps {
  onAudioGenerated?: (audioUrl: string, text: string) => void
}

type VoiceType = "en-US-AriaNeural" | "en-US-GuyNeural" | "en-GB-SoniaNeural" | "en-AU-NatashaNeural"

const VOICES: { value: VoiceType; label: string; description: string }[] = [
  { value: "en-US-AriaNeural", label: "Aria (US)", description: "Female, American" },
  { value: "en-US-GuyNeural", label: "Guy (US)", description: "Male, American" },
  { value: "en-GB-SoniaNeural", label: "Sonia (UK)", description: "Female, British" },
  { value: "en-AU-NatashaNeural", label: "Natasha (AU)", description: "Female, Australian" }
]

const EXAMPLE_TEXTS = [
  "Welcome to Nairi, your AI-powered assistant for creativity and productivity.",
  "The quick brown fox jumps over the lazy dog.",
  "In a world of endless possibilities, imagination is your greatest tool.",
  "Hello! I'm here to help you with any questions you might have.",
  "Technology is best when it brings people together."
]

export function AudioGenerator({ onAudioGenerated }: AudioGeneratorProps) {
  const [text, setText] = useState("")
  const [voice, setVoice] = useState<VoiceType>("en-US-AriaNeural")
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [useBrowserTTS, setUseBrowserTTS] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter text to convert to speech")
      return
    }

    setIsGenerating(true)
    setAudioUrl(null)
    setUseBrowserTTS(false)

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Audio generation failed")
      }

      if (data.audio?.useBrowserTTS) {
        setUseBrowserTTS(true)
        setProvider("browser-speech-api")
        toast.success("Using browser text-to-speech")
        // Trigger browser TTS
        speakWithBrowser(text)
      } else if (data.audio?.url) {
        setAudioUrl(data.audio.url)
        setProvider(data.audio.provider)
        if (onAudioGenerated) {
          onAudioGenerated(data.audio.url, text)
        }
        toast.success("Audio generated!")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  const speakWithBrowser = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = 1
      utterance.pitch = 1
      utterance.volume = 1
      
      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => v.lang.startsWith('en'))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error("Browser does not support text-to-speech")
    }
  }

  const togglePlayPause = () => {
    if (useBrowserTTS) {
      if (isPlaying) {
        window.speechSynthesis.cancel()
        setIsPlaying(false)
      } else {
        speakWithBrowser(text)
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const copyText = () => {
    navigator.clipboard.writeText(text)
    toast.success("Text copied!")
  }

  const downloadAudio = () => {
    if (audioUrl && !audioUrl.startsWith('data:')) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `nairi-audio-${Date.now()}.mp3`
      a.click()
    } else if (audioUrl) {
      // For base64 data URLs
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `nairi-audio-${Date.now()}.mp3`
      a.click()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Volume2 className="h-5 w-5 text-[#a78bfa]" />
            AI Text-to-Speech
          </CardTitle>
          <CardDescription>
            Convert text to natural-sounding speech using AI voices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text Input */}
          <div className="space-y-2">
            <Label>Text to speak</Label>
            <Textarea
              placeholder="Enter the text you want to convert to speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] bg-background resize-none"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {text.length}/5000 characters
            </p>
          </div>

          {/* Example Texts */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Try an example:</Label>
            <div className="flex flex-wrap gap-1">
              {EXAMPLE_TEXTS.map((example) => (
                <button
                  key={example}
                  onClick={() => setText(example)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {example.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label>Voice</Label>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVoice(v.value)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    voice === v.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-background"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Speaker className={cn(
                      "h-4 w-4",
                      voice === v.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        voice === v.value ? "text-foreground" : "text-muted-foreground"
                      )}>{v.label}</p>
                      <p className="text-xs text-muted-foreground">{v.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!text.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-[#a78bfa] to-[#e879f9] text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Audio...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Speech
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Result */}
      {(audioUrl || useBrowserTTS) && (
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Generated Audio</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyText} className="bg-transparent">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Text
                </Button>
                {audioUrl && !useBrowserTTS && (
                  <Button variant="outline" size="sm" onClick={downloadAudio} className="bg-transparent">
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
            {/* Audio Player */}
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
              <Button
                variant="outline"
                size="icon"
                onClick={togglePlayPause}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </Button>
              
              <div className="flex-1">
                {audioUrl && !useBrowserTTS && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                )}
                {useBrowserTTS && (
                  <div className="text-sm text-muted-foreground">
                    Using browser text-to-speech. Click play to hear the audio.
                  </div>
                )}
              </div>
            </div>

            {/* Text Preview */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Text:</p>
              <p className="text-sm text-foreground">{text}</p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-muted/50">Voice: {VOICES.find(v => v.value === voice)?.label}</Badge>
              {provider && <Badge variant="secondary" className="bg-green-500/20 text-green-400">Provider: {provider}</Badge>}
              <Badge variant="secondary" className="bg-muted/50">Length: {text.length} chars</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
