import { z } from 'zod'

/**
 * Builder generation request schema
 */
export const BuilderGenerationRequestSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(2000, 'Prompt too long'),
  type: z.enum(['component', 'page', 'layout', 'api', 'form']),
  framework: z.enum(['react', 'vue', 'svelte', 'html']).optional(),
  styling: z.enum(['tailwind', 'css', 'styled-components', 'none']).optional(),
  typescript: z.boolean().optional(),
})

export type BuilderGenerationRequest = z.infer<typeof BuilderGenerationRequestSchema>

/**
 * Builder generation response schema
 */
export const BuilderGenerationResponseSchema = z.object({
  code: z.string(),
  language: z.string(),
  preview: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  instructions: z.string().optional(),
})

export type BuilderGenerationResponse = z.infer<typeof BuilderGenerationResponseSchema>

/**
 * Template schema
 */
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  preview: z.string().url().optional(),
  code: z.string(),
  tags: z.array(z.string()).optional(),
})

export type Template = z.infer<typeof TemplateSchema>

/**
 * Builder project file (stored in DB)
 */
const BuilderProjectFileSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  path: z.string(),
  content: z.string(),
  language: z.enum(['typescript', 'javascript', 'css', 'json', 'markdown']).optional(),
})

/**
 * Create builder project request
 */
export const BuilderProjectCreateSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  files: z.array(BuilderProjectFileSchema),
})

export type BuilderProjectCreate = z.infer<typeof BuilderProjectCreateSchema>

/**
 * Update builder project request (PATCH)
 */
export const BuilderProjectUpdateSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  files: z.array(BuilderProjectFileSchema).optional(),
})

export type BuilderProjectUpdate = z.infer<typeof BuilderProjectUpdateSchema>
