import { z } from 'zod'

/**
 * Chat message schema
 */
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty').max(10000, 'Message too long'),
  timestamp: z.date().optional(),
  id: z.string().optional(),
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>

/**
 * Chat request schema
 */
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'At least one message required'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
  stream: z.boolean().optional(),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>

/**
 * Chat response schema
 */
export const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
  model: z.string(),
})

export type ChatResponse = z.infer<typeof ChatResponseSchema>
