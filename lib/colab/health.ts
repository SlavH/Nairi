/**
 * Colab backend health check (GET /health).
 * Optional: backend may not expose /health; we treat 404 as "no health endpoint".
 */

import { getColabHealthUrl, isColabConfigured } from "./config"
import { COLAB_REQUEST_TIMEOUT_MS } from "./config"

export async function checkColabHealth(): Promise<boolean> {
  if (!isColabConfigured()) return false
  const url = getColabHealthUrl()
  if (!url) return false
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), Math.min(5000, COLAB_REQUEST_TIMEOUT_MS))
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal })
    clearTimeout(id)
    return res.ok
  } catch {
    clearTimeout(id)
    return false
  }
}

/**
 * Safe health check: returns false if backend is down or has no /health.
 * Use to show "backend available" in UI or skip chat when false.
 */
export async function isColabAvailable(): Promise<boolean> {
  try {
    return await checkColabHealth()
  } catch {
    return false
  }
}
