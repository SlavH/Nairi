/**
 * Structured logging and error reporting for API and server.
 * - Use logApiRequest / logApiError for API routes (request id, route, no PII).
 * - Use reportError for error boundaries; when Sentry is compatible with Next 16, wire it here.
 */

const REQUEST_ID_HEADER = "x-request-id"

function getRequestId(headers?: Headers): string | undefined {
  if (!headers) return undefined
  return headers.get(REQUEST_ID_HEADER) ?? undefined
}

export interface ApiLogContext {
  route?: string
  method?: string
  userId?: string | null
  statusCode?: number
  durationMs?: number
  errorCode?: string
}

/**
 * Log an API request (success or failure). Avoid logging PII; use route and userId only.
 */
export function logApiRequest(context: ApiLogContext & { message?: string }): void {
  const { message, route, method, userId, statusCode, durationMs, errorCode } = context
  const parts: string[] = []
  if (message) parts.push(message)
  if (route) parts.push(`route=${route}`)
  if (method) parts.push(`method=${method}`)
  if (userId) parts.push("userId=***")
  if (statusCode != null) parts.push(`status=${statusCode}`)
  if (durationMs != null) parts.push(`durationMs=${durationMs}`)
  if (errorCode) parts.push(`errorCode=${errorCode}`)
  const line = parts.length ? `[API] ${parts.join(" ")}` : "[API]"
  if (errorCode || (statusCode != null && statusCode >= 400)) {
    console.error(line)
  } else {
    console.log(line)
  }
}

/**
 * Log an API error with optional request context. No PII.
 */
export function logApiError(error: unknown, context?: ApiLogContext): void {
  const err = error instanceof Error ? error : new Error(String(error))
  console.error("[API Error]", err.message, context ?? "")
  logApiRequest({ ...context, message: err.message, errorCode: err.name })
}

/**
 * Report a client or server error (e.g. from error boundary).
 * When Sentry is compatible with Next 16, add: Sentry.captureException(error, { extra: context }).
 * Do not pass PII in context.
 */
export function reportError(error: Error, context?: Record<string, unknown>): void {
  console.error("[Error boundary]", error.message, context ?? "")
  // When Sentry is compatible with Next 16:
  // if (typeof Sentry !== 'undefined') Sentry.captureException(error, { extra: context })
}

/**
 * Generate a simple request id for use in headers or logs.
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
