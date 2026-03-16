"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Volume2, VolumeX, Pause, Play, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TextToSpeechProps {
  text: string
  className?: string
}

const VOICES = [
  { lang: "en-US", name: "English (US)" },
  { lang: "en-GB", name: "English (UK)" },
  { lang: "ru-RU", name: "Russian" },
  { lang: "hy-AM", name: "Armenian" },
  { lang: "es-ES", name: "Spanish" },
  { lang: "fr-FR", name: "French" },
  { lang: "de-DE", name: "German" },
  { lang: "zh-CN", name: "Chinese" },
  { lang: "ja-JP", name: "Japanese" },
]

export function TextToSpeech({ text, className }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState("en-US")
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      // Only update state if component is mounted and voices have changed
      if (isMounted && voices.length > 0) {
        setAvailableVoices(prevVoices => {
          // Prevent unnecessary re-renders by checking if voices actually changed
          if (prevVoices.length === voices.length) return prevVoices
          return voices
        })
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      isMounted = false
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback(() => {
    if (!text) return

    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch

    // Find matching voice
    const voice = availableVoices.find(v => v.lang.startsWith(selectedVoice.split('-')[0]))
    if (voice) {
      utterance.voice = voice
    }

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event)
      setIsPlaying(false)
      setIsPaused(false)
      if (event.error !== "canceled") {
        toast.error("Failed to play audio")
      }
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [text, rate, pitch, selectedVoice, availableVoices, isPaused])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
  }, [])

  const togglePlayPause = useCallback(() => {
    if (isPlaying && !isPaused) {
      pause()
    } else {
      speak()
    }
  }, [isPlaying, isPaused, pause, speak])

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="min-h-[44px] min-w-[44px] sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 touch-manipulation"
        onClick={togglePlayPause}
        title={isPlaying ? (isPaused ? "Resume" : "Pause") : "Read aloud"}
        aria-label={isPlaying ? (isPaused ? "Resume" : "Pause") : "Read aloud"}
      >
        {isPlaying ? (
          isPaused ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
      </Button>

      {isPlaying && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 touch-manipulation"
          onClick={stop}
          title="Stop"
          aria-label="Stop playback"
        >
          <VolumeX className="h-3.5 w-3.5" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 touch-manipulation" aria-label="Voice settings">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel>Voice Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="px-2 py-2">
            <label className="text-xs text-muted-foreground">Language</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full mt-1 px-2 py-1 text-sm bg-background border border-border rounded"
            >
              {VOICES.map((v) => (
                <option key={v.lang} value={v.lang}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="px-2 py-2">
            <label className="text-xs text-muted-foreground">Speed: {rate.toFixed(1)}x</label>
            <Slider
              value={[rate]}
              onValueChange={([v]) => setRate(v)}
              min={0.5}
              max={2}
              step={0.1}
              className="mt-2"
            />
          </div>

          <div className="px-2 py-2">
            <label className="text-xs text-muted-foreground">Pitch: {pitch.toFixed(1)}</label>
            <Slider
              value={[pitch]}
              onValueChange={([v]) => setPitch(v)}
              min={0.5}
              max={2}
              step={0.1}
              className="mt-2"
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
