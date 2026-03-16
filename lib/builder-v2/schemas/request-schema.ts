/**
 * Zod schema for builder generate API request body.
 * Used to validate prompt, currentFiles, and conversationHistory.
 */

import { z } from "zod"

const BuilderFileSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  path: z.string(),
  content: z.string(),
  language: z.enum(["typescript", "javascript", "css", "json", "markdown"]).optional(),
  isModified: z.boolean().optional(),
})

const ConversationMessageSchema = z.object({
  role: z.string(),
  content: z.string(),
}).passthrough()

export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  currentFiles: z.array(BuilderFileSchema).optional().default([]),
  conversationHistory: z.array(ConversationMessageSchema).optional().default([]),
})

export type GenerateRequestBody = z.infer<typeof GenerateRequestSchema>

/**
 * Parse and validate the generate request body. Returns parsed data or throws with a clear message.
 */
export function parseGenerateRequest(body: unknown): GenerateRequestBody {
  return GenerateRequestSchema.parse(body)
}

/**
 * Safe parse for the generate request body. Returns { success: true, data } or { success: false, error }.
 */
export function safeParseGenerateRequest(body: unknown): z.SafeParseReturnType<unknown, GenerateRequestBody> {
  return GenerateRequestSchema.safeParse(body)
}
