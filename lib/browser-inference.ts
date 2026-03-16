/**
 * Browser-Side AI Inference Module
 * Provides offline-capable AI inference using WebLLM and browser APIs
 * 
 * Features:
 * - Text generation using WebLLM (Llama, Phi-3)
 * - Speech-to-text using Web Speech API
 * - Text-to-speech using Web Speech API
 * - Offline fallback for when cloud APIs are unavailable
 */

// Types for WebLLM integration
interface WebLLMConfig {
  model: string
  temperature?: number
  maxTokens?: number
}

interface InferenceResult {
  text: string
  source: 'webllm' | 'cached' | 'template'
  latency: number
  offline: boolean
}

// Supported models for browser-side inference
export const BROWSER_MODELS = {
  'phi-3-mini': {
    id: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
    name: 'Phi-3 Mini (4B)',
    size: '2.3GB',
    description: 'Fast, efficient model for general tasks'
  },
  'llama-3.2-1b': {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 (1B)',
    size: '0.7GB',
    description: 'Lightweight model for quick responses'
  },
  'gemma-2b': {
    id: 'gemma-2b-it-q4f16_1-MLC',
    name: 'Gemma 2B',
    size: '1.4GB',
    description: 'Google\'s efficient instruction-tuned model'
  }
} as const

// Check if WebLLM is available
export function isWebLLMSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for WebGPU support (required for WebLLM)
  const hasWebGPU = 'gpu' in navigator
  
  // Check for sufficient memory (rough estimate)
  const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const hasEnoughMemory = dm == null ? true : dm >= 4
  
  return hasWebGPU && hasEnoughMemory
}

// Check if Web Speech API is available
export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  const hasSpeechSynthesis = 'speechSynthesis' in window
  
  return hasSpeechRecognition && hasSpeechSynthesis
}

// Browser-side text generation class
export class BrowserInference {
  private engine: any = null
  private isLoading: boolean = false
  private currentModel: string | null = null
  private loadProgress: number = 0
  
  // Cached responses for common queries (offline fallback)
  private responseCache: Map<string, string> = new Map([
    ['hello', 'Hello! How can I help you today?'],
    ['hi', 'Hi there! What would you like to know?'],
    ['help', 'I\'m here to help! You can ask me questions, request explanations, or have a conversation.'],
    ['what can you do', 'I can help with text generation, answering questions, writing assistance, code explanations, and general conversation. What would you like to explore?'],
  ])
  
  // Template responses for when model isn't loaded
  private templateResponses: Record<string, string> = {
    greeting: 'Hello! I\'m running in offline mode with limited capabilities. For full features, please ensure you have an internet connection.',
    error: 'I apologize, but I\'m currently unable to process that request in offline mode. Please try again when connected to the internet.',
    math: 'For mathematical calculations in offline mode, I can help with basic arithmetic. What would you like to calculate?',
    code: 'I can provide basic code assistance in offline mode. What programming question do you have?',
  }

  constructor() {
    // Initialize cache from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nairi_response_cache')
        if (cached) {
          const parsed = JSON.parse(cached)
          Object.entries(parsed).forEach(([k, v]) => {
            this.responseCache.set(k, v as string)
          })
        }
      } catch (e) {
        console.warn('Failed to load response cache:', e)
      }
    }
  }

  // Get loading progress
  getLoadProgress(): number {
    return this.loadProgress
  }

  // Check if model is loaded
  isModelLoaded(): boolean {
    return this.engine !== null && !this.isLoading
  }

  // Get current model
  getCurrentModel(): string | null {
    return this.currentModel
  }

  // Load a model for browser-side inference
  async loadModel(
    modelKey: keyof typeof BROWSER_MODELS = 'phi-3-mini',
    onProgress?: (progress: number, status: string) => void
  ): Promise<boolean> {
    if (!isWebLLMSupported()) {
      console.warn('WebLLM not supported in this browser')
      return false
    }

    if (this.isLoading) {
      console.warn('Model is already loading')
      return false
    }

    this.isLoading = true
    this.loadProgress = 0

    try {
      // Dynamic import of WebLLM to avoid SSR issues (optional dependency; types in mlc-ai-web-llm.d.ts)
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
      const modelId = BROWSER_MODELS[modelKey].id
      this.engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress: any) => {
          this.loadProgress = progress.progress * 100
          onProgress?.(this.loadProgress, progress.text || 'Loading...')
        }
      })
      
      this.currentModel = modelKey
      this.isLoading = false
      this.loadProgress = 100
      
      return true
    } catch (error) {
      console.error('Failed to load WebLLM model:', error)
      this.isLoading = false
      this.loadProgress = 0
      return false
    }
  }

  // Unload the current model to free memory
  async unloadModel(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.unload()
      } catch (e) {
        console.warn('Error unloading model:', e)
      }
      this.engine = null
      this.currentModel = null
      this.loadProgress = 0
    }
  }

  // Generate text using browser-side inference
  async generate(
    prompt: string,
    options: Partial<WebLLMConfig> = {}
  ): Promise<InferenceResult> {
    const startTime = Date.now()
    
    // Check cache first
    const cacheKey = prompt.toLowerCase().trim()
    if (this.responseCache.has(cacheKey)) {
      return {
        text: this.responseCache.get(cacheKey)!,
        source: 'cached',
        latency: Date.now() - startTime,
        offline: true
      }
    }

    // If model is loaded, use it
    if (this.engine && !this.isLoading) {
      try {
        const response = await this.engine.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 512,
        })
        
        const text = response.choices[0]?.message?.content || ''
        
        // Cache the response for future use
        this.cacheResponse(cacheKey, text)
        
        return {
          text,
          source: 'webllm',
          latency: Date.now() - startTime,
          offline: true
        }
      } catch (error) {
        console.error('WebLLM generation error:', error)
      }
    }

    // Fallback to template responses
    const templateKey = this.matchTemplate(prompt)
    return {
      text: this.templateResponses[templateKey] || this.templateResponses.error,
      source: 'template',
      latency: Date.now() - startTime,
      offline: true
    }
  }

  // Stream text generation
  async *generateStream(
    prompt: string,
    options: Partial<WebLLMConfig> = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.engine || this.isLoading) {
      yield this.templateResponses.error
      return
    }

    try {
      const stream = await this.engine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 512,
        stream: true,
      })

      let fullText = ''
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || ''
        fullText += delta
        yield delta
      }

      // Cache the complete response
      this.cacheResponse(prompt.toLowerCase().trim(), fullText)
    } catch (error) {
      console.error('WebLLM streaming error:', error)
      yield this.templateResponses.error
    }
  }

  // Match prompt to template category
  private matchTemplate(prompt: string): string {
    const lower = prompt.toLowerCase()
    
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return 'greeting'
    }
    if (lower.includes('calculate') || lower.includes('math') || /\d+\s*[\+\-\*\/]\s*\d+/.test(lower)) {
      return 'math'
    }
    if (lower.includes('code') || lower.includes('function') || lower.includes('program')) {
      return 'code'
    }
    
    return 'error'
  }

  // Cache a response
  private cacheResponse(key: string, value: string): void {
    this.responseCache.set(key, value)
    
    // Persist to localStorage (limit to 100 entries)
    if (typeof window !== 'undefined') {
      try {
        const entries = Array.from(this.responseCache.entries()).slice(-100)
        localStorage.setItem('nairi_response_cache', JSON.stringify(Object.fromEntries(entries)))
      } catch (e) {
        console.warn('Failed to persist response cache:', e)
      }
    }
  }

  // Clear the response cache
  clearCache(): void {
    this.responseCache.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nairi_response_cache')
    }
  }
}

// Browser Speech-to-Text
export class BrowserSpeechToText {
  private recognition: any = null
  private isListening: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null
  }

  setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang
    }
  }

  async listen(): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported')
    }

    return new Promise((resolve, reject) => {
      let finalTranscript = ''

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
      }

      this.recognition.onend = () => {
        this.isListening = false
        resolve(finalTranscript)
      }

      this.recognition.onerror = (event: any) => {
        this.isListening = false
        reject(new Error(event.error))
      }

      this.isListening = true
      this.recognition.start()
    })
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  getIsListening(): boolean {
    return this.isListening
  }
}

// Browser Text-to-Speech
export class BrowserTextToSpeech {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.loadVoices()
    }
  }

  private loadVoices(): void {
    if (!this.synth) return

    const loadVoicesHandler = () => {
      this.voices = this.synth!.getVoices()
    }

    loadVoicesHandler()
    this.synth.onvoiceschanged = loadVoicesHandler
  }

  isSupported(): boolean {
    return this.synth !== null
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  speak(text: string, options: {
    voice?: string
    rate?: number
    pitch?: number
    volume?: number
    lang?: string
  } = {}): Promise<void> {
    if (!this.synth) {
      return Promise.reject(new Error('Speech synthesis not supported'))
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      if (options.voice) {
        const voice = this.voices.find(v => v.name === options.voice || v.voiceURI === options.voice)
        if (voice) utterance.voice = voice
      }
      
      if (options.lang) {
        const langVoice = this.voices.find(v => v.lang.startsWith(options.lang!))
        if (langVoice) utterance.voice = langVoice
      }

      utterance.rate = options.rate ?? 1
      utterance.pitch = options.pitch ?? 1
      utterance.volume = options.volume ?? 1

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(event.error))

      this.synth!.speak(utterance)
    })
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  pause(): void {
    if (this.synth) {
      this.synth.pause()
    }
  }

  resume(): void {
    if (this.synth) {
      this.synth.resume()
    }
  }

  isSpeaking(): boolean {
    return this.synth?.speaking ?? false
  }
}

// Singleton instances for easy access
let browserInferenceInstance: BrowserInference | null = null
let browserSTTInstance: BrowserSpeechToText | null = null
let browserTTSInstance: BrowserTextToSpeech | null = null

export function getBrowserInference(): BrowserInference {
  if (!browserInferenceInstance) {
    browserInferenceInstance = new BrowserInference()
  }
  return browserInferenceInstance
}

export function getBrowserSTT(): BrowserSpeechToText {
  if (!browserSTTInstance) {
    browserSTTInstance = new BrowserSpeechToText()
  }
  return browserSTTInstance
}

export function getBrowserTTS(): BrowserTextToSpeech {
  if (!browserTTSInstance) {
    browserTTSInstance = new BrowserTextToSpeech()
  }
  return browserTTSInstance
}

// Export default instance
export default {
  isWebLLMSupported,
  isSpeechSupported,
  getBrowserInference,
  getBrowserSTT,
  getBrowserTTS,
  BROWSER_MODELS
}
