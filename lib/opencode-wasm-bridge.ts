"use client"

import { getOpenCodeClient, type Session, type Message } from "@/lib/opencode-client"
import { webContainerProvider } from "@/lib/webcontainer-provider"

export interface OpenCodeConfig {
  apiKey: string
  model: string
  permissions: Record<string, "allow" | "deny" | "ask">
}

export interface OpenCodeTask {
  id: string
  type: "generate-code" | "analyze-code" | "edit-code" | "web-search" | "web-fetch" | "default"
  prompt: string
  context?: Record<string, unknown>
  options?: Record<string, unknown>
}

export interface OpenCodeResult {
  success: boolean
  type: string
  data?: unknown
  error?: string
  files?: string[]
  explanation?: string
}

export interface OpenCodeStatus {
  initialized: boolean
  apiKeySet: boolean
  model: string
  permissions: Record<string, string>
}

type OpenCodeCallbacks = {
  onProgress?: (message: string, step: number) => void
  onComplete?: (result: OpenCodeResult) => void
  onError?: (error: Error) => void
  onReady?: () => void
}

class OpenCodeBridge {
  private static instance: OpenCodeBridge
  private initialized = false
  private callbacks: OpenCodeCallbacks = {}
  private config: OpenCodeConfig = {
    apiKey: "",
    model: "opencode/big-pickle",
    permissions: {
      bash: "allow",
      read: "allow",
      edit: "allow",
      write: "allow",
      glob: "allow",
      grep: "allow",
      webfetch: "allow",
      websearch: "allow",
    },
  }
  private activeSession: Session | null = null

  private constructor() {}

  static getInstance(): OpenCodeBridge {
    if (!OpenCodeBridge.instance) {
      OpenCodeBridge.instance = new OpenCodeBridge()
    }
    return OpenCodeBridge.instance
  }

  setCallbacks(callbacks: OpenCodeCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  async initialize(config?: Partial<OpenCodeConfig>): Promise<void> {
    const storedConfig = await this.getStoredConfig()
    this.config = { ...this.config, ...storedConfig, ...config }

    const provider = webContainerProvider
    const currentStatus = provider.getStatus()

    if (currentStatus.state === "ready") {
      this.initialized = true
      this.callbacks.onReady?.()
      return
    }

    // Subscribe to boot completion
    const unsubscribe = provider.subscribe((status) => {
      if (status.state === "ready") {
        this.initialized = true
        this.callbacks.onReady?.()
        unsubscribe()
      } else if (status.state === "error") {
        console.error("WebContainer boot failed:", status.error)
        // Still mark as initialized (will use API directly)
        this.initialized = true
        this.callbacks.onReady?.()
        unsubscribe()
      }
    })

    // Start booting
    provider.boot().catch((err) => {
      console.error("WebContainer boot error:", err)
      this.initialized = true
      this.callbacks.onReady?.()
    })
  }

  async executeTask(task: OpenCodeTask): Promise<OpenCodeResult> {
    if (!this.initialized) {
      await this.initialize()
    }

    const taskWithId = {
      ...task,
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    this.callbacks.onProgress?.("Starting task...", 0)

    try {
      const provider = webContainerProvider
      const status = provider.getStatus()

      if (status.state === "ready") {
        // Use WebContainer's OpenCode
        if (!this.activeSession) {
          this.activeSession = await provider.createSession({ model: this.config.model })
        }

        try {
          const message = await provider.sendMessage(this.activeSession.id, task.prompt)
          const text = message.parts?.filter((p) => p.type === "text").map((p) => p.text).join("\n") || ""

          const result: OpenCodeResult = {
            success: true,
            type: task.type,
            explanation: text,
          }

          this.callbacks.onProgress?.("Task completed", 100)
          this.callbacks.onComplete?.(result)
          return result
        } catch (webError) {
          // WebContainer send failed — fall back to the Zen direct API
          console.warn("WebContainer send failed, falling back to Zen API:", webError)
          const zenResult = await this.callZenAPI(task.prompt)
          this.callbacks.onProgress?.("Task completed", 100)
          this.callbacks.onComplete?.(zenResult)
          return zenResult
        }
      }

      // Fallback: direct API call for free Zen models
      const result = await this.callZenAPI(task.prompt)
      this.callbacks.onProgress?.("Task completed", 100)
      this.callbacks.onComplete?.(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.callbacks.onError?.(err)
      return {
        success: false,
        type: task.type,
        error: err.message,
      }
    }
  }

  private async callZenAPI(prompt: string): Promise<OpenCodeResult> {
    const response = await fetch("https://opencode.ai/zen/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer public",
      },
      body: JSON.stringify({
        model: this.config.model.replace("opencode/", ""),
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      throw new Error(`Zen API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""

    return {
      success: true,
      type: "default",
      explanation: content,
    }
  }

  getStatus(): OpenCodeStatus {
    return {
      initialized: this.initialized,
      apiKeySet: !!this.config.apiKey,
      model: this.config.model,
      permissions: this.config.permissions,
    }
  }

  getConfig(): OpenCodeConfig {
    return { ...this.config }
  }

  async updateConfig(config: Partial<OpenCodeConfig>): Promise<void> {
    // If the model changed, drop the cached session so the next task
    // recreates it with the newly selected model.
    if (config.model && config.model !== this.config.model) {
      this.activeSession = null
    }
    this.config = { ...this.config, ...config }
    await this.saveConfig()
  }

  private async getStoredConfig(): Promise<Partial<OpenCodeConfig>> {
    try {
      const stored = localStorage.getItem("opencode-config")
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore
    }
    return {}
  }

  private async saveConfig(): Promise<void> {
    try {
      localStorage.setItem("opencode-config", JSON.stringify(this.config))
    } catch {
      // ignore
    }
  }

  async setApiKey(apiKey: string): Promise<void> {
    this.config.apiKey = apiKey
    await this.saveConfig()
  }

  isReady(): boolean {
    return this.initialized
  }

  getSession(): Session | null {
    return this.activeSession
  }
}

export const opencodeBridge = OpenCodeBridge.getInstance()

export function getOpenCodeBridge(): OpenCodeBridge {
  return opencodeBridge
}

export function useOpenCode() {
  const bridge = getOpenCodeBridge()

  return {
    initialize: (config?: Partial<OpenCodeConfig>) => bridge.initialize(config),
    executeTask: (task: OpenCodeTask) => bridge.executeTask(task),
    getStatus: () => bridge.getStatus(),
    getConfig: () => bridge.getConfig(),
    updateConfig: (config: Partial<OpenCodeConfig>) => bridge.updateConfig(config),
    setApiKey: (apiKey: string) => bridge.setApiKey(apiKey),
    isReady: () => bridge.isReady(),
    setCallbacks: (callbacks: OpenCodeCallbacks) => bridge.setCallbacks(callbacks),
  }
}
