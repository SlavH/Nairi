// Universal JSON Envelope for all AI generations
// Per master prompt requirements

export interface AIGenerationEnvelope {
  status: "success" | "partial" | "failed"
  generation_type: string
  model_used: string
  fallback_used: boolean
  output: any
  warnings: string[]
  errors: string[]
  cost_estimate: string
  latency_ms: number
}

export function wrapAIResponse(
  generationType: string,
  output: any,
  options: {
    status?: "success" | "partial" | "failed"
    modelUsed?: string
    fallbackUsed?: boolean
    warnings?: string[]
    errors?: string[]
    costEstimate?: string
    startTime?: number
  } = {}
): AIGenerationEnvelope {
  const latency = options.startTime ? Date.now() - options.startTime : 0
  
  return {
    status: options.status || (options.errors && options.errors.length > 0 ? "failed" : "success"),
    generation_type: generationType,
    model_used: options.modelUsed || "unknown",
    fallback_used: options.fallbackUsed || false,
    output: output,
    warnings: options.warnings || [],
    errors: options.errors || [],
    cost_estimate: options.costEstimate || "$0.00 (free tier)",
    latency_ms: latency
  }
}

// Specific output formats per generation type

export interface TextOutput {
  text: string
  language?: string
  confidence_level?: "high" | "medium" | "low"
  self_verification_passed?: boolean
}

export interface CodeOutput {
  language: string
  files: Array<{ filename: string; content: string }>
  build_instructions?: string
  runtime_requirements?: string
}

export interface ImageOutput {
  images: Array<{
    format: "png" | "jpg" | "webp"
    resolution: string
    base64_or_path: string
    nsfw_checked: boolean
  }>
}

export interface VideoOutput {
  video_format: "mp4" | "webm"
  duration_seconds: number
  resolution: string
  file_path_or_stream: string
}

export interface AudioOutput {
  audio_format: "wav" | "mp3" | "ogg"
  duration_seconds?: number
  file_path_or_base64: string
  language?: string
}

export interface DocumentOutput {
  document_type: "pdf" | "docx" | "pptx" | "markdown"
  summary: string
  extracted_sections?: string[]
  tables_extracted?: boolean
  content?: string
}

export interface DataTableOutput {
  rows_processed: number
  columns: string[]
  summary_statistics: any
  generated_files?: string[]
}

export interface SimulationOutput {
  engine: string
  playable: boolean
  controls: string
  known_issues: string[]
  code?: string
}

export interface AgentOutput {
  goal: string
  steps_executed: Array<{ step: number; action: string; result: string }>
  tools_used: string[]
  final_result: string
  stopped_reason: "completed" | "killed" | "error"
}

export interface MultimodalOutput {
  text?: string
  images?: any[]
  audio?: any[]
  video?: any[]
  cross_modal_consistency: boolean
}
