/**
 * Colab AI integration layer.
 * Single backend: POST /chat, response { response }. Config via COLAB_AI_BASE_URL (or BITNET_BASE_URL).
 */

export { isColabConfigured, getColabChatUrl, getColabHealthUrl } from "./config"
export type { ColabMessage, ColabChatRequest, ColabChatResponse } from "./types"
export { isColabChatResponse } from "./types"
export { fetchWithRetry } from "./request"
export { checkColabHealth, isColabAvailable } from "./health"
export { withMutex, isRequestInFlight } from "./mutex"
export { colabChat } from "./client"
export type { ColabChatOptions, ColabChatResult } from "./client"
