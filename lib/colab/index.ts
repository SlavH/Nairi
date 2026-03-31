/**
 * Colab AI integration layer.
 * Single backend: POST /chat, response { response }. Config via COLAB_AI_BASE_URL (or BITNET_BASE_URL).
 * Also supports Ollama-compatible (OpenAI-compatible) API via OLLAMA_BASE_URL.
 */

export { isColabConfigured, isOllamaConfigured, getColabChatUrl, getColabHealthUrl, getOllamaChatUrl, OLLAMA_MODEL, OLLAMA_STREAM, OLLAMA_CHAT_PATH } from "./config"
export type { ColabMessage, ColabChatRequest, ColabChatResponse } from "./types"
export type { OllamaMessage, OllamaChatRequest, OllamaChatResponse, OllamaStreamChunk } from "./types"
export { isColabChatResponse, isOllamaChatResponse } from "./types"
export { fetchWithRetry } from "./request"
export { checkColabHealth, isColabAvailable } from "./health"
export { withMutex, isRequestInFlight } from "./mutex"
export { colabChat, ollamaChat, checkOllamaHealth } from "./client"
export type { ColabChatOptions, ColabChatResult } from "./client"
export type { OllamaChatOptions } from "./client"
