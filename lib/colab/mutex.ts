/**
 * In-memory mutex to prevent multiple parallel requests to Colab.
 * Colab cannot handle heavy parallel traffic; one request at a time per process.
 */

let inFlight: Promise<unknown> | null = null

export async function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  const waitFor = inFlight
  const promise = (async () => {
    if (waitFor) await waitFor
    return fn()
  })()
  inFlight = promise
  try {
    return await promise
  } finally {
    if (inFlight === promise) inFlight = null
  }
}

export function isRequestInFlight(): boolean {
  return inFlight !== null
}
