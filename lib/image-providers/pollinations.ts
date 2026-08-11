export interface PollinationsModel {
  id: string
  name?: string
}

export interface GenerateImageOptions {
  model?: string
  width?: number
  height?: number
  seed?: number
  key?: string | null
}

export interface GenerateImageResult {
  blob: Blob
  url: string
  seed: number
}

const BASE_URL = "https://gen.pollinations.ai"

export async function fetchModels(): Promise<PollinationsModel[]> {
  const res = await fetch(`${BASE_URL}/image/models`, {
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`)
  return res.json()
}

export function generateImageUrl(
  prompt: string,
  options?: GenerateImageOptions
): string {
  const { model = "flux", width = 1024, height = 1024, seed = -1, key } = options ?? {}
  const params = new URLSearchParams({
    model,
    width: String(width),
    height: String(height),
    seed: String(seed),
  })
  if (key) params.set("key", key)
  return `${BASE_URL}/image/${encodeURIComponent(prompt)}?${params.toString()}`
}

export async function generateImage(
  prompt: string,
  options?: GenerateImageOptions
): Promise<GenerateImageResult> {
  const { model = "flux", width = 1024, height = 1024, seed = -1, key } = options ?? {}
  const url = generateImageUrl(prompt, options)

  const maxRetries = 3
  const lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    })

    if (res.ok) {
      const blob = await res.blob()
      const effectiveSeed = res.headers.get("X-Seed")
        ? Number(res.headers.get("X-Seed"))
        : seed
      return { blob, url, seed: effectiveSeed }
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After")
      const delayMs = retryAfter ? Number(retryAfter) * 1000 : Math.min(2000 * 2 ** attempt, 10000)

      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }

      let message = "Image generation rate limited. "
      if (!key) message += "Add a Pollinations publishable key (pk_...) in Settings to increase your rate limit."
      else message += `Retry after ${retryAfter || "a few"} seconds.`
      throw new Error(message)
    }

    throw new Error(`Image generation failed: ${res.status} ${res.statusText}`)
  }

  throw lastError ?? new Error("Image generation failed after retries")
}
