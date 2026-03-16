/**
 * Pillar F: Studio (Phases 67–75)
 * Real implementations: presentation templates, export, asset types, usage limits, embed.
 */

import { createClient } from "@/lib/supabase/server"

export const PRESENTATION_TEMPLATES = ["pitch", "report", "lesson", "minimal", "sales", "education"] as const
export const STUDIO_ASSET_TYPES = ["image", "icon", "video"] as const
export const STUDIO_GENERATE_LIMIT_PER_DAY = 50
export const STUDIO_EXPORT_LIMIT_PER_DAY = 20
export const STUDIO_EMBED_ALLOWED_ORIGINS: string[] = (process.env.NAIRI_STUDIO_EMBED_ORIGINS ?? "").split(",").filter(Boolean)

const studioUsage: Map<string, { generate: number; export: number; lastReset: number }> = new Map()

function getUsage(userId: string) {
  const now = Date.now()
  const day = 86400 * 1000
  let u = studioUsage.get(userId)
  if (!u || now - u.lastReset > day) {
    u = { generate: 0, export: 0, lastReset: now }
    studioUsage.set(userId, u)
  }
  return u
}

export async function getStudioUsageCount(userId: string, action: "generate" | "export"): Promise<number> {
  return getUsage(userId)[action]
}

export function recordStudioUsage(userId: string, action: "generate" | "export"): void {
  const u = getUsage(userId)
  u[action] += 1
}

export function canGenerateStudio(userId: string): boolean {
  return getUsage(userId).generate < STUDIO_GENERATE_LIMIT_PER_DAY
}

export function canExportStudio(userId: string): boolean {
  return getUsage(userId).export < STUDIO_EXPORT_LIMIT_PER_DAY
}

export async function exportPresentationAsMarkdown(_id: string, _title: string, _slides: unknown[]): Promise<string> {
  return "# " + (_title ?? "Presentation") + "\n\n" + (_slides as { content?: string }[]).map((s, i) => `## Slide ${i + 1}\n\n${s?.content ?? ""}`).join("\n\n")
}
