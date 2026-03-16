/**
 * Streaming quality gates: first-token latency and chunk consistency.
 * Wrap response body streams to log metrics and flag regressions.
 */

const FIRST_TOKEN_WARN_MS = 3000
const FIRST_TOKEN_ERROR_MS = 8000

export interface StreamQualityMetrics {
  firstTokenMs: number | null
  chunkCount: number
  streamLabel: string
}

/**
 * Wraps a ReadableStream to record first-token latency and chunk count.
 * Logs metrics when stream ends; logs at error level if first token exceeds threshold.
 */
export function wrapStreamWithQualityGates(
  stream: ReadableStream<Uint8Array> | null,
  streamLabel: string
): ReadableStream<Uint8Array> | null {
  if (!stream) return null

  const start = Date.now()
  let firstChunkTime: number | null = null
  let chunkCount = 0

  const reader = stream.getReader()
  let closed = false
  function logMetrics() {
    if (closed) return
    closed = true
    const firstTokenMs = firstChunkTime !== null ? firstChunkTime - start : null
    const metrics: StreamQualityMetrics = { firstTokenMs, chunkCount, streamLabel }
    if (firstTokenMs !== null) {
      if (firstTokenMs >= FIRST_TOKEN_ERROR_MS) {
        console.error("[stream-quality] First token latency regression:", metrics)
      } else if (firstTokenMs >= FIRST_TOKEN_WARN_MS) {
        console.warn("[stream-quality] First token latency high:", metrics)
      } else {
        console.log("[stream-quality] First token ms:", firstTokenMs, streamLabel)
      }
    }
  }
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        logMetrics()
        controller.close()
        return
      }
      if (value && value.length > 0) {
        if (firstChunkTime === null) firstChunkTime = Date.now()
        chunkCount++
      }
      controller.enqueue(value)
    },
    cancel(reason) {
      logMetrics()
      return reader.cancel(reason)
    },
  })
}
