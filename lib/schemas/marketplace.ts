import { z } from 'zod'

/**
 * Marketplace item schema
 */
export const MarketplaceItemSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price cannot be negative'),
  category: z.enum(['template', 'plugin', 'theme', 'component', 'tool']),
  rating: z.number().min(0).max(5).optional(),
  downloads: z.number().min(0).optional(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().url().optional(),
  }),
  preview: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type MarketplaceItem = z.infer<typeof MarketplaceItemSchema>

/**
 * Purchase request schema
 */
export const PurchaseRequestSchema = z.object({
  itemId: z.string(),
  paymentMethod: z.enum(['stripe', 'paypal', 'credits']),
  quantity: z.number().min(1).max(100).optional().default(1),
})

export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>

/**
 * Search request schema
 */
export const SearchRequestSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.enum(['popular', 'recent', 'price-low', 'price-high', 'rating']).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
})

export type SearchRequest = z.infer<typeof SearchRequestSchema>
