import { z } from 'zod'

/**
 * User profile schema
 */
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  credits: z.number().min(0).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

/**
 * Update profile request schema
 */
export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
})

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>

/**
 * User settings schema
 */
export const UserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    marketing: z.boolean(),
  }).optional(),
  privacy: z.object({
    profileVisible: z.boolean(),
    showActivity: z.boolean(),
  }).optional(),
})

export type UserSettings = z.infer<typeof UserSettingsSchema>
