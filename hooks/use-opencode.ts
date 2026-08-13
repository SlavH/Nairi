"use client"

import { useState, useCallback, useEffect } from "react"

import { useToast } from "@/hooks/use-toast"
import { opencodeBridge, getOpenCodeBridge } from "@/lib/opencode-wasm-bridge"

export const FREE_MODELS = [
  { id: "opencode/big-pickle", name: "Big Pickle", provider: "opencode", context: "200k", reasoning: true, description: "Default free model with reasoning" },
  { id: "opencode/deepseek-v4-flash-free", name: "DeepSeek V4 Flash", provider: "opencode", context: "200k", reasoning: false, description: "Fast free model" },
  { id: "opencode/mimo-v2.5-free", name: "MIMO V2.5", provider: "opencode", context: "128k", reasoning: false, description: "Free coding model" },
  { id: "opencode/nemotron-3-ultra-free", name: "Nemotron 3 Ultra", provider: "opencode", context: "128k", reasoning: false, description: "Free general model" },
  { id: "opencode/north-mini-code-free", name: "North Mini Code", provider: "opencode", context: "32k", reasoning: false, description: "Free lightweight coding model" },
]

export const DEFAULT_MODEL = "opencode/big-pickle"

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

export function useOpenCode() {
  const { toast } = useToast()
  const [status, setStatus] = useState<OpenCodeStatus>({
    initialized: false,
    apiKeySet: false,
    model: DEFAULT_MODEL,
    permissions: {},
  })
  const [config, setConfig] = useState<OpenCodeConfig>({
    apiKey: "",
    model: DEFAULT_MODEL,
    permissions: {
      bash: "ask",
      read: "ask",
      edit: "ask",
      write: "ask",
      glob: "ask",
      grep: "ask",
      webfetch: "ask",
      websearch: "ask",
    },
  })
  const [initialized, setInitialized] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const bridge = getOpenCodeBridge()

  const initialize = useCallback(async (userConfig?: Partial<OpenCodeConfig>) => {
    if (initialized || initializing) return

    setInitializing(true)
    try {
      if (userConfig) {
        setConfig((prev) => ({ ...prev, ...userConfig }))
      }

      // Set callbacks
      bridge.setCallbacks({
        onReady: () => {
          setInitialized(true)
          setInitializing(false)
          updateStatus()
          toast({ title: "OpenCode ready", description: "AI coding agent is running in your browser via WebContainer" })
        },
        onError: (error) => {
          console.error("OpenCode error:", error)
        },
      })

      await bridge.initialize(userConfig)
    } catch (error) {
      console.error("OpenCode init failed:", error)
      toast({
        title: "OpenCode initialization failed",
        description: String(error),
        variant: "destructive",
      })
      setInitializing(false)
    }
  }, [initialized, initializing, bridge, toast])

  const executeTask = useCallback(
    async (task: OpenCodeTask): Promise<OpenCodeResult> => {
      if (!initialized) {
        await initialize()
      }

      try {
        const result = await bridge.executeTask(task)
        updateStatus()
        return result
      } catch (error) {
        console.error("Task execution failed:", error)
        return {
          success: false,
          type: task.type,
          error: String(error),
        }
      }
    },
    [initialized, initialize, bridge]
  )

  const updateStatus = useCallback(() => {
    setStatus(bridge.getStatus())
    setConfig((prev) => {
      const { permissions: _permissions, ...bridgeConfig } = bridge.getConfig()
      return { ...prev, ...bridgeConfig, permissions: prev.permissions }
    })
  }, [bridge])

  const updateConfig = useCallback(
    async (newConfig: Partial<OpenCodeConfig>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }))
      await bridge.updateConfig(newConfig)
      updateStatus()
    },
    [bridge]
  )

  useEffect(() => {
    updateStatus()
    if (bridge.isReady()) {
      setInitialized(true)
      updateStatus()
    }
  }, [])

  return {
    status,
    config,
    initialized,
    initializing,
    initialize,
    executeTask,
    updateConfig,
    updateStatus,
  }
}
