"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  BrowserInference,
  BrowserSpeechToText,
  BrowserTextToSpeech,
  isWebLLMSupported,
  isSpeechSupported,
  BROWSER_MODELS,
  getBrowserInference,
  getBrowserSTT,
  getBrowserTTS
} from '@/lib/browser-inference'

interface BrowserAIContextType {
  // Status
  isWebLLMSupported: boolean
  isSpeechSupported: boolean
  isModelLoaded: boolean
  isModelLoading: boolean
  loadProgress: number
  currentModel: string | null
  
  // Actions
  loadModel: (modelKey?: keyof typeof BROWSER_MODELS) => Promise<boolean>
  unloadModel: () => Promise<void>
  generate: (prompt: string) => Promise<string>
  generateStream: (prompt: string, onChunk: (chunk: string) => void) => Promise<void>
  
  // Speech
  startListening: () => Promise<string>
  stopListening: () => void
  speak: (text: string, lang?: string) => Promise<void>
  stopSpeaking: () => void
  isListening: boolean
  isSpeaking: boolean
  
  // Offline mode
  isOfflineMode: boolean
  setOfflineMode: (enabled: boolean) => void
}

const BrowserAIContext = createContext<BrowserAIContextType | null>(null)

export function useBrowserAI() {
  const context = useContext(BrowserAIContext)
  if (!context) {
    throw new Error('useBrowserAI must be used within a BrowserAIProvider')
  }
  return context
}

interface BrowserAIProviderProps {
  children: React.ReactNode
  autoLoadModel?: boolean
  defaultModel?: keyof typeof BROWSER_MODELS
}

export function BrowserAIProvider({
  children,
  autoLoadModel = false,
  defaultModel = 'phi-3-mini'
}: BrowserAIProviderProps) {
  const [inference, setInference] = useState<BrowserInference | null>(null)
  const [stt, setSTT] = useState<BrowserSpeechToText | null>(null)
  const [tts, setTTS] = useState<BrowserTextToSpeech | null>(null)
  
  const [webLLMSupported, setWebLLMSupported] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [currentModel, setCurrentModel] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  // Initialize on mount
  useEffect(() => {
    setWebLLMSupported(isWebLLMSupported())
    setSpeechSupported(isSpeechSupported())
    setInference(getBrowserInference())
    setSTT(getBrowserSTT())
    setTTS(getBrowserTTS())
    
    // Check if we should auto-load model
    if (autoLoadModel && isWebLLMSupported()) {
      // Delay to not block initial render
      setTimeout(() => {
        loadModel(defaultModel)
      }, 1000)
    }
  }, [])

  const loadModel = useCallback(async (modelKey: keyof typeof BROWSER_MODELS = 'phi-3-mini'): Promise<boolean> => {
    if (!inference || isModelLoading) return false
    
    setIsModelLoading(true)
    setLoadProgress(0)
    
    const success = await inference.loadModel(modelKey, (progress, status) => {
      setLoadProgress(progress)
    })
    
    setIsModelLoading(false)
    setIsModelLoaded(success)
    setCurrentModel(success ? modelKey : null)
    
    return success
  }, [inference, isModelLoading])

  const unloadModel = useCallback(async (): Promise<void> => {
    if (inference) {
      await inference.unloadModel()
      setIsModelLoaded(false)
      setCurrentModel(null)
      setLoadProgress(0)
    }
  }, [inference])

  const generate = useCallback(async (prompt: string): Promise<string> => {
    if (!inference) return 'Browser AI not initialized'
    
    const result = await inference.generate(prompt)
    return result.text
  }, [inference])

  const generateStream = useCallback(async (
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    if (!inference) {
      onChunk('Browser AI not initialized')
      return
    }
    
    for await (const chunk of inference.generateStream(prompt)) {
      onChunk(chunk)
    }
  }, [inference])

  const startListening = useCallback(async (): Promise<string> => {
    if (!stt || !stt.isSupported()) {
      throw new Error('Speech recognition not supported')
    }
    
    setIsListening(true)
    try {
      const result = await stt.listen()
      return result
    } finally {
      setIsListening(false)
    }
  }, [stt])

  const stopListening = useCallback((): void => {
    if (stt) {
      stt.stop()
      setIsListening(false)
    }
  }, [stt])

  const speak = useCallback(async (text: string, lang?: string): Promise<void> => {
    if (!tts || !tts.isSupported()) {
      throw new Error('Speech synthesis not supported')
    }
    
    setIsSpeaking(true)
    try {
      await tts.speak(text, { lang })
    } finally {
      setIsSpeaking(false)
    }
  }, [tts])

  const stopSpeaking = useCallback((): void => {
    if (tts) {
      tts.stop()
      setIsSpeaking(false)
    }
  }, [tts])

  const value: BrowserAIContextType = {
    isWebLLMSupported: webLLMSupported,
    isSpeechSupported: speechSupported,
    isModelLoaded,
    isModelLoading,
    loadProgress,
    currentModel,
    loadModel,
    unloadModel,
    generate,
    generateStream,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isListening,
    isSpeaking,
    isOfflineMode,
    setOfflineMode: setIsOfflineMode
  }

  return (
    <BrowserAIContext.Provider value={value}>
      {children}
    </BrowserAIContext.Provider>
  )
}

// Offline mode indicator component
export function OfflineModeIndicator() {
  const { isOfflineMode, isModelLoaded, currentModel, loadProgress, isModelLoading } = useBrowserAI()
  
  if (!isOfflineMode) return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500/90 text-black px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
        <span className="font-medium">Offline Mode</span>
        {isModelLoading && (
          <span className="text-sm">Loading {Math.round(loadProgress)}%</span>
        )}
        {isModelLoaded && currentModel && (
          <span className="text-sm">({currentModel})</span>
        )}
      </div>
    </div>
  )
}

export { BROWSER_MODELS }
