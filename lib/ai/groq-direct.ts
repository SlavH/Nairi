// AI requests: Nairi Router (NAIRI_ROUTER_BASE_URL) or Colab/BitNet (COLAB_AI_BASE_URL / BITNET_BASE_URL).

import { streamText, generateText, createUIMessageStream, createUIMessageStreamResponse } from "ai"
import { bitnetProvider } from "./client"
import { isCircuitOpen, recordFailure, recordSuccess } from "./circuit-breaker"
import { isRouterConfigured, generate as routerGenerate, pollForResult } from "@/lib/nairi-api/router"

const BITNET_MODEL = process.env.BITNET_MODEL || "default"

function hasAnyAiBackend(): boolean {
  const url = (process.env.COLAB_AI_BASE_URL || process.env.BITNET_BASE_URL)?.trim()
  return !!url || isRouterConfigured()
}

function requireBitNetConfig(): void {
  if (!hasAnyAiBackend()) {
    throw new Error(
      "No AI backend configured. Set NAIRI_ROUTER_BASE_URL, or COLAB_AI_BASE_URL / BITNET_BASE_URL in .env."
    )
  }
}

function buildPromptForRouter(opts: { system: string; messages?: AIMessage[]; prompt?: string }): string {
  const systemBlock = opts.system?.trim() ? `System: ${opts.system}\n\n` : ""
  if (opts.messages?.length) {
    return systemBlock + opts.messages.map((m) => `${m.role}: ${m.content}`).join("\n")
  }
  return systemBlock + (opts.prompt ?? "").trim()
}

function normalizeRouterResult(raw: unknown): string {
  if (typeof raw === "string") return raw
  if (raw && typeof raw === "object" && "text" in raw && typeof (raw as { text: unknown }).text === "string") {
    return (raw as { text: string }).text
  }
  return raw != null ? String(raw) : ""
}

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface StreamResult {
  stream: ReadableStream<Uint8Array>
  provider: string
  model: string
}

export async function streamWithFallback(opts: {
  system: string
  messages?: AIMessage[]
  prompt?: string
  temperature?: number
  maxOutputTokens?: number
  signal?: AbortSignal
  onFinish?: (result: { text: string }) => void | Promise<void>
  fast?: boolean
}): Promise<ReturnType<typeof streamText>> {
  if (isRouterConfigured()) {
    const prompt = buildPromptForRouter(opts)
    const { job_id } = await routerGenerate("text", prompt, {})
    const raw = await pollForResult(job_id, 2_500, 60)
    const fullText = normalizeRouterResult(raw)
    await opts.onFinish?.({ text: fullText })
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const id = `router-${Date.now()}`
        writer.write({ type: "text-start", id })
        writer.write({ type: "text-delta", id, delta: fullText })
        writer.write({ type: "text-end", id })
      },
    })
    const response = createUIMessageStreamResponse({ stream })
    return {
      textStream: (async function* () {
        yield fullText
      })(),
      toUIMessageStreamResponse: () => response,
      toDataStream: () => new ReadableStream<Uint8Array>(),
    } as ReturnType<typeof streamText>
  }
  requireBitNetConfig()
  if (isCircuitOpen(BITNET_MODEL)) {
    throw new Error(`BitNet model ${BITNET_MODEL}: circuit open (temporarily unavailable)`)
  }
  try {
    const result = streamText({
      model: bitnetProvider(BITNET_MODEL),
      system: opts.system,
      ...(opts.messages
        ? { messages: opts.messages }
        : { prompt: opts.prompt ?? "" }),
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
      abortSignal: opts.signal,
      onFinish: opts.onFinish,
    })
    recordSuccess(BITNET_MODEL)
    return result
  } catch (error) {
    recordFailure(BITNET_MODEL)
    throw error
  }
}

export async function generateWithFallback(opts: {
  system: string
  messages?: AIMessage[]
  prompt?: string
  temperature?: number
  maxOutputTokens?: number
  fast?: boolean
}): Promise<{ text: string; model: string }> {
  if (isRouterConfigured()) {
    const prompt = buildPromptForRouter(opts)
    const { job_id } = await routerGenerate("text", prompt, {})
    const raw = await pollForResult(job_id, 2_500, 60)
    const text = normalizeRouterResult(raw)
    return { text, model: "nairi-router" }
  }
  requireBitNetConfig()
  if (isCircuitOpen(BITNET_MODEL)) {
    throw new Error(`BitNet model ${BITNET_MODEL}: circuit open (temporarily unavailable)`)
  }
  try {
    const result = await generateText({
      model: bitnetProvider(BITNET_MODEL),
      system: opts.system,
      ...(opts.messages
        ? { messages: opts.messages }
        : { prompt: opts.prompt ?? "" }),
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
    })
    recordSuccess(BITNET_MODEL)
    return { text: result.text, model: BITNET_MODEL }
  } catch (error) {
    recordFailure(BITNET_MODEL)
    throw error
  }
}

export async function streamChatWithFallback(
  messages: AIMessage[],
  options: {
    model?: string
    systemPrompt?: string
    signal?: AbortSignal
    maxTokens?: number
  } = {},
): Promise<StreamResult> {
  const result = await streamWithFallback({
    system: options.systemPrompt ?? "You are a helpful AI assistant.",
    messages,
    maxOutputTokens: options.maxTokens,
    signal: options.signal,
  })

  return {
    stream: (result as unknown as { toDataStream: () => ReadableStream<Uint8Array> }).toDataStream(),
    provider: "bitnet",
    model: BITNET_MODEL,
  }
}

export async function generateTextWithFallback(
  messages: AIMessage[],
  options: {
    systemPrompt?: string
    maxTokens?: number
  } = {},
): Promise<{ text: string; provider: string; model: string }> {
  const { text, model } = await generateWithFallback({
    system: options.systemPrompt ?? "You are a helpful AI assistant.",
    messages,
    maxOutputTokens: options.maxTokens,
  })
  return { text, provider: "bitnet", model }
}

export async function streamGroqChat(
  messages: AIMessage[],
  options: {
    model?: string
    systemPrompt?: string
    signal?: AbortSignal
  } = {},
): Promise<ReadableStream<Uint8Array>> {
  const result = await streamChatWithFallback(messages, options)
  return result.stream
}

export type GroqMessage = AIMessage
export type GroqStreamChunk = {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: { role?: string; content?: string }
    finish_reason: string | null
  }[]
}

export function convertToGroqMessages(
  messages: unknown[],
): GroqMessage[] {
  return (
    messages as Array<{
      role: string
      content: unknown
      parts?: Array<{ type: string; text: string }>
    }>
  )
    .map((msg) => {
      let content = ""
      if (typeof msg.content === "string") {
        content = msg.content
      } else if (msg.parts && Array.isArray(msg.parts)) {
        content = msg.parts
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("\n")
      } else if (msg.content && Array.isArray(msg.content)) {
        content = (
          msg.content as Array<{ type: string; text: string }>
        )
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("\n")
      }
      return {
        role: msg.role as "user" | "assistant" | "system",
        content,
      }
    })
    .filter((msg) => msg.content.length > 0)
}
