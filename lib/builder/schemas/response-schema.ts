/**
 * Output schema enforcement for builder (and presentations) JSON responses.
 * Validate parsed response against Zod; log and optionally retry on failure.
 */

import { z } from "zod"

export const BuilderFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
})

export const BuilderResponseSchema = z.object({
  plan: z.array(z.string()).optional(),
  files: z.array(BuilderFileSchema).min(1),
  message: z.string().optional(),
})

export type BuilderResponse = z.infer<typeof BuilderResponseSchema>

export interface ValidationResult {
  valid: boolean
  errors?: string[]
  data?: BuilderResponse
}

/**
 * Validate parsed builder response. Returns valid: true with data, or valid: false with errors.
 */
export function validateBuilderResponse(parsed: unknown): ValidationResult {
  const result = BuilderResponseSchema.safeParse(parsed)
  if (result.success) {
    return { valid: true, data: result.data }
  }
  const errors = result.error.flatten().formErrors ?? []
  const fieldErrors = result.error.flatten().fieldErrors
  if (fieldErrors.files) {
    errors.push(`files: ${Array.isArray(fieldErrors.files) ? fieldErrors.files.join(", ") : String(fieldErrors.files)}`)
  }
  return { valid: false, errors }
}
