/**
 * Nairi API types (HF Space backend).
 * Backend has its own SYSTEM_PROMPT; client must NOT send system messages.
 */

export type NairiMessageRole = "user" | "assistant"

export interface NairiMessage {
  role: NairiMessageRole
  content: string
}

export interface NairiHealthResponse {
  status: string
  name?: string
  model?: string
}

export interface NairiChatRequest {
  messages: NairiMessage[]
  max_tokens: number
}

export interface NairiChatResponse {
  response: string
  latency_sec?: number
}

export function isNairiHealthResponse(v: unknown): v is NairiHealthResponse {
  return typeof v === "object" && v !== null && "status" in v && typeof (v as NairiHealthResponse).status === "string"
}

export function isNairiChatResponse(v: unknown): v is NairiChatResponse {
  return (
    typeof v === "object" &&
    v !== null &&
    "response" in v &&
    typeof (v as NairiChatResponse).response === "string"
  )
}

// --- Nairi HF Router (async job-based generation) ---

export type NairiRouterGenerationType =
  | "text"
  | "armenian"
  | "website"
  | "image"
  | "video"
  | "voice"
  | "music"
  | "code"
  | "presentation"
  | "document"
  | "vision"

export interface NairiRouterGenerateRequest {
  type: NairiRouterGenerationType
  prompt: string
  options?: Record<string, unknown>
}

export interface NairiRouterGenerateResponse {
  job_id: string
  status: string
}

export type NairiRouterJobStatus = "processing" | "completed" | "failed"

export interface NairiRouterStatusResponse {
  job_id: string
  status: NairiRouterJobStatus
  created_at?: string
  type?: string
}

export interface NairiRouterResultResponse {
  job_id: string
  status: string
  result: unknown
  type?: string
}

export function isNairiRouterGenerateResponse(v: unknown): v is NairiRouterGenerateResponse {
  return (
    typeof v === "object" &&
    v !== null &&
    "job_id" in v &&
    typeof (v as NairiRouterGenerateResponse).job_id === "string" &&
    "status" in v &&
    typeof (v as NairiRouterGenerateResponse).status === "string"
  )
}

export function isNairiRouterStatusResponse(v: unknown): v is NairiRouterStatusResponse {
  return (
    typeof v === "object" &&
    v !== null &&
    "job_id" in v &&
    typeof (v as NairiRouterStatusResponse).job_id === "string" &&
    "status" in v &&
    ["processing", "completed", "failed"].includes((v as NairiRouterStatusResponse).status)
  )
}

export function isNairiRouterResultResponse(v: unknown): v is NairiRouterResultResponse {
  return (
    typeof v === "object" &&
    v !== null &&
    "job_id" in v &&
    "status" in v &&
    "result" in v
  )
}
