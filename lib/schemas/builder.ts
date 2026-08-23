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
export const MAX_BUILDER_FILES = 50
export const MAX_FILE_CONTENT_CHARS = 100_000 // 100KB per file
export const MAX_PROJECT_BYTES = 500 * 1024 // 500KB total per project (F17)

const BuilderProjectFileSchema = z.object({
  id: z.string().max(128).optional(),
  name: z.string().min(1).max(256),
  path: z.string().min(1).max(512),
  content: z.string().max(MAX_FILE_CONTENT_CHARS),
  language: z.enum(['typescript', 'javascript', 'css', 'json', 'markdown']).optional(),
})

/**
 * Total UTF-8 payload size of a project's files, used to enforce
 * MAX_PROJECT_BYTES regardless of how many files are involved.
 */
export function getProjectFilesSize(files: Array<{ content?: string }>): number {
  let total = 0
  for (const f of files) {
    total += Buffer.byteLength(f.content ?? "", "utf8")
  }
  return total
}

/**
 * Create builder project request
 */
export const BuilderProjectCreateSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  files: z.array(BuilderProjectFileSchema).max(MAX_BUILDER_FILES),
})

export type BuilderProjectCreate = z.infer<typeof BuilderProjectCreateSchema>

/**
 * Update builder project request (PATCH)
 */
export const BuilderProjectUpdateSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  files: z.array(BuilderProjectFileSchema).max(MAX_BUILDER_FILES).optional(),
})

export type BuilderProjectUpdate = z.infer<typeof BuilderProjectUpdateSchema>
