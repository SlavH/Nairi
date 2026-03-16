/**
 * Input Validation Utilities for Nairi v31
 * 
 * Comprehensive validation functions for API inputs, user data, and content.
 * Provides type-safe validation with detailed error messages.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValidationResult {
  valid: boolean
  error?: string
  sanitized?: any
}

export interface PromptValidationOptions {
  minLength?: number
  maxLength?: number
  allowEmpty?: boolean
  sanitize?: boolean
}

export interface NumericValidationOptions {
  min?: number
  max?: number
  integer?: boolean
  positive?: boolean
}

// ============================================================================
// String Validation
// ============================================================================

/**
 * Validates and sanitizes text prompts
 */
export function validatePrompt(
  prompt: unknown,
  options: PromptValidationOptions = {}
): ValidationResult {
  const {
    minLength = 1,
    maxLength = 2000,
    allowEmpty = false,
    sanitize = true
  } = options

  // Type check
  if (typeof prompt !== 'string') {
    return {
      valid: false,
      error: 'Prompt must be a string'
    }
  }

  // Trim whitespace
  const trimmed = prompt.trim()

  // Check empty
  if (!allowEmpty && trimmed.length === 0) {
    return {
      valid: false,
      error: 'Prompt cannot be empty'
    }
  }

  // Check minimum length
  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `Prompt must be at least ${minLength} characters`
    }
  }

  // Check maximum length
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Prompt must not exceed ${maxLength} characters`
    }
  }

  // Sanitize if requested
  const sanitized = sanitize ? sanitizeText(trimmed) : trimmed

  return {
    valid: true,
    sanitized
  }
}

/**
 * Sanitizes text by removing potentially dangerous characters
 */
export function sanitizeText(text: string): string {
  return text
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Validates email format
 */
export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email must be a string'
    }
  }

  const trimmed = email.trim().toLowerCase()
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Invalid email format'
    }
  }

  if (trimmed.length > 254) {
    return {
      valid: false,
      error: 'Email address too long'
    }
  }

  return {
    valid: true,
    sanitized: trimmed
  }
}

/**
 * Validates URL format
 */
export function validateURL(url: unknown, options: { allowedProtocols?: string[] } = {}): ValidationResult {
  const { allowedProtocols = ['http', 'https'] } = options

  if (typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL must be a string'
    }
  }

  const trimmed = url.trim()

  try {
    const parsed = new URL(trimmed)
    
    if (!allowedProtocols.includes(parsed.protocol.replace(':', ''))) {
      return {
        valid: false,
        error: `URL protocol must be one of: ${allowedProtocols.join(', ')}`
      }
    }

    return {
      valid: true,
      sanitized: trimmed
    }
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format'
    }
  }
}

// ============================================================================
// Numeric Validation
// ============================================================================

/**
 * Validates numeric values with constraints
 */
export function validateNumber(
  value: unknown,
  options: NumericValidationOptions = {}
): ValidationResult {
  const {
    min,
    max,
    integer = false,
    positive = false
  } = options

  // Type check
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return {
      valid: false,
      error: 'Value must be a valid number'
    }
  }

  // Integer check
  if (integer && !Number.isInteger(value)) {
    return {
      valid: false,
      error: 'Value must be an integer'
    }
  }

  // Positive check
  if (positive && value <= 0) {
    return {
      valid: false,
      error: 'Value must be positive'
    }
  }

  // Min check
  if (min !== undefined && value < min) {
    return {
      valid: false,
      error: `Value must be at least ${min}`
    }
  }

  // Max check
  if (max !== undefined && value > max) {
    return {
      valid: false,
      error: `Value must not exceed ${max}`
    }
  }

  return {
    valid: true,
    sanitized: value
  }
}

// ============================================================================
// Enum Validation
// ============================================================================

/**
 * Validates that a value is one of allowed options
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  defaultValue?: T
): ValidationResult {
  if (typeof value !== 'string') {
    if (defaultValue !== undefined) {
      return {
        valid: true,
        sanitized: defaultValue
      }
    }
    return {
      valid: false,
      error: 'Value must be a string'
    }
  }

  if (!allowedValues.includes(value as T)) {
    if (defaultValue !== undefined) {
      return {
        valid: true,
        sanitized: defaultValue
      }
    }
    return {
      valid: false,
      error: `Value must be one of: ${allowedValues.join(', ')}`
    }
  }

  return {
    valid: true,
    sanitized: value as T
  }
}

// ============================================================================
// Array Validation
// ============================================================================

/**
 * Validates array length and optionally validates each element
 */
export function validateArray<T>(
  value: unknown,
  options: {
    minLength?: number
    maxLength?: number
    elementValidator?: (element: unknown) => ValidationResult
  } = {}
): ValidationResult {
  const { minLength = 0, maxLength = Infinity, elementValidator } = options

  if (!Array.isArray(value)) {
    return {
      valid: false,
      error: 'Value must be an array'
    }
  }

  if (value.length < minLength) {
    return {
      valid: false,
      error: `Array must have at least ${minLength} elements`
    }
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `Array must not exceed ${maxLength} elements`
    }
  }

  // Validate each element if validator provided
  if (elementValidator) {
    for (let i = 0; i < value.length; i++) {
      const result = elementValidator(value[i])
      if (!result.valid) {
        return {
          valid: false,
          error: `Element at index ${i}: ${result.error}`
        }
      }
    }
  }

  return {
    valid: true,
    sanitized: value
  }
}

// ============================================================================
// Object Validation
// ============================================================================

/**
 * Validates object structure with required and optional fields
 */
export function validateObject<T extends Record<string, any>>(
  value: unknown,
  schema: {
    [K in keyof T]: {
      required?: boolean
      validator: (value: unknown) => ValidationResult
    }
  }
): ValidationResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {
      valid: false,
      error: 'Value must be an object'
    }
  }

  const obj = value as Record<string, any>
  const sanitized: Record<string, any> = {}

  for (const [key, config] of Object.entries(schema)) {
    const fieldValue = obj[key]
    const { required = false, validator } = config

    // Check required fields
    if (required && fieldValue === undefined) {
      return {
        valid: false,
        error: `Field '${key}' is required`
      }
    }

    // Skip validation for undefined optional fields
    if (!required && fieldValue === undefined) {
      continue
    }

    // Validate field
    const result = validator(fieldValue)
    if (!result.valid) {
      return {
        valid: false,
        error: `Field '${key}': ${result.error}`
      }
    }

    sanitized[key] = result.sanitized ?? fieldValue
  }

  return {
    valid: true,
    sanitized: sanitized as T
  }
}

// ============================================================================
// File Validation
// ============================================================================

/**
 * Validates file size
 */
export function validateFileSize(
  size: number,
  maxSize: number
): ValidationResult {
  if (typeof size !== 'number' || size < 0) {
    return {
      valid: false,
      error: 'Invalid file size'
    }
  }

  if (size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `File size must not exceed ${maxMB}MB`
    }
  }

  return {
    valid: true,
    sanitized: size
  }
}

/**
 * Validates file MIME type
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[]
): ValidationResult {
  if (typeof mimeType !== 'string') {
    return {
      valid: false,
      error: 'Invalid MIME type'
    }
  }

  const normalized = mimeType.toLowerCase().trim()

  // Check exact match
  if (allowedTypes.includes(normalized)) {
    return {
      valid: true,
      sanitized: normalized
    }
  }

  // Check wildcard match (e.g., "image/*")
  const [type] = normalized.split('/')
  if (allowedTypes.includes(`${type}/*`)) {
    return {
      valid: true,
      sanitized: normalized
    }
  }

  return {
    valid: false,
    error: `File type must be one of: ${allowedTypes.join(', ')}`
  }
}

// ============================================================================
// Content Security Validation
// ============================================================================

/**
 * Detects potential XSS patterns in user input
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Detects potential SQL injection patterns
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\#|\/\*|\*\/)/g, // SQL comments
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
    /(\bUNION\b.*\bSELECT\b)/gi
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Validates input for security threats
 */
export function validateSecurity(input: string): ValidationResult {
  if (detectXSS(input)) {
    return {
      valid: false,
      error: 'Input contains potentially malicious content (XSS)'
    }
  }

  if (detectSQLInjection(input)) {
    return {
      valid: false,
      error: 'Input contains potentially malicious content (SQL injection)'
    }
  }

  return {
    valid: true,
    sanitized: input
  }
}

// ============================================================================
// AI-Specific Validation
// ============================================================================

/**
 * Validates image generation parameters
 */
export function validateImageParams(params: {
  prompt?: unknown
  size?: unknown
  quality?: unknown
  style?: unknown
  negativePrompt?: unknown
  seed?: unknown
  variations?: unknown
}) {
  const errors: string[] = []

  // Validate prompt
  const promptResult = validatePrompt(params.prompt, { maxLength: 2000 })
  if (!promptResult.valid) {
    errors.push(`prompt: ${promptResult.error}`)
  }

  // Validate size
  const validSizes = ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'] as const
  const sizeResult = validateEnum(params.size, validSizes, '1024x1024')
  
  // Validate quality
  const validQualities = ['standard', 'hd'] as const
  const qualityResult = validateEnum(params.quality, validQualities, 'standard')

  // Validate style
  const validStyles = ['realistic', 'artistic', 'anime', '3d', 'sketch', 'watercolor'] as const
  const styleResult = validateEnum(params.style, validStyles, 'realistic')

  // Validate negative prompt
  if (params.negativePrompt !== undefined) {
    const negPromptResult = validatePrompt(params.negativePrompt, { 
      maxLength: 1000, 
      allowEmpty: true 
    })
    if (!negPromptResult.valid) {
      errors.push(`negativePrompt: ${negPromptResult.error}`)
    }
  }

  // Validate seed
  if (params.seed !== undefined && params.seed !== null) {
    const seedResult = validateNumber(params.seed, { 
      integer: true, 
      positive: true,
      min: 1,
      max: 2147483647 // Max 32-bit integer
    })
    if (!seedResult.valid) {
      errors.push(`seed: ${seedResult.error}`)
    }
  }

  // Validate variations
  if (params.variations !== undefined) {
    const variationsResult = validateNumber(params.variations, {
      integer: true,
      min: 1,
      max: 4
    })
    if (!variationsResult.valid) {
      errors.push(`variations: ${variationsResult.error}`)
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; ')
    }
  }

  return {
    valid: true,
    sanitized: {
      prompt: promptResult.sanitized,
      size: sizeResult.sanitized,
      quality: qualityResult.sanitized,
      style: styleResult.sanitized
    }
  }
}

/**
 * Validates video generation parameters
 */
export function validateVideoParams(params: {
  prompt?: unknown
  model?: unknown
  style?: unknown
  duration?: unknown
  resolution?: unknown
  aspectRatio?: unknown
}) {
  const errors: string[] = []

  // Validate prompt
  const promptResult = validatePrompt(params.prompt, { maxLength: 2000 })
  if (!promptResult.valid) {
    errors.push(`prompt: ${promptResult.error}`)
  }

  // Validate model
  const validModels = ['default', 'runway', 'pika', 'stable-video'] as const
  const modelResult = validateEnum(params.model, validModels, 'default')

  // Validate style
  const validStyles = ['realistic', 'animated', 'cinematic', 'artistic'] as const
  const styleResult = validateEnum(params.style, validStyles, 'realistic')

  // Validate duration
  const validDurations = ['short', 'medium', 'long'] as const
  const durationResult = validateEnum(params.duration, validDurations, 'short')

  // Validate resolution
  const validResolutions = ['480p', '720p', '1080p', '4k'] as const
  const resolutionResult = validateEnum(params.resolution, validResolutions, '720p')

  // Validate aspect ratio
  const validAspectRatios = ['16:9', '9:16', '1:1', '4:3'] as const
  const aspectRatioResult = validateEnum(params.aspectRatio, validAspectRatios, '16:9')

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; ')
    }
  }

  return {
    valid: true,
    sanitized: {
      prompt: promptResult.sanitized,
      model: modelResult.sanitized,
      style: styleResult.sanitized,
      duration: durationResult.sanitized,
      resolution: resolutionResult.sanitized,
      aspectRatio: aspectRatioResult.sanitized
    }
  }
}

/**
 * Validates audio generation parameters
 */
export function validateAudioParams(params: {
  prompt?: unknown
  duration?: unknown
  voice?: unknown
  speed?: unknown
}) {
  const errors: string[] = []

  // Validate prompt
  const promptResult = validatePrompt(params.prompt, { maxLength: 5000 })
  if (!promptResult.valid) {
    errors.push(`prompt: ${promptResult.error}`)
  }

  // Validate duration
  if (params.duration !== undefined) {
    const durationResult = validateNumber(params.duration, {
      min: 1,
      max: 300, // 5 minutes max
      integer: true,
      positive: true
    })
    if (!durationResult.valid) {
      errors.push(`duration: ${durationResult.error}`)
    }
  }

  // Validate voice
  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
  const voiceResult = validateEnum(params.voice, validVoices, 'alloy')

  // Validate speed
  if (params.speed !== undefined) {
    const speedResult = validateNumber(params.speed, {
      min: 0.25,
      max: 4.0
    })
    if (!speedResult.valid) {
      errors.push(`speed: ${speedResult.error}`)
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; ')
    }
  }

  return {
    valid: true,
    sanitized: {
      prompt: promptResult.sanitized,
      voice: voiceResult.sanitized
    }
  }
}
