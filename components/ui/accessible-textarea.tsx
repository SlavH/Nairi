import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface AccessibleTextareaProps extends Omit<React.ComponentProps<'textarea'>, 'aria-invalid' | 'aria-describedby' | 'aria-required'> {
  /**
   * Label text for the textarea. If provided, a label element will be rendered.
   */
  label?: string
  
  /**
   * Error message to display. When provided, sets aria-invalid="true" and associates the error with the textarea.
   */
  error?: string
  
  /**
   * Helper text to display below the textarea. Associated with the textarea via aria-describedby.
   */  
  description?: string
  
  /**
   * Whether the textarea is required. Automatically sets aria-required="true".
   */
  required?: boolean
  
  /**
   * Custom class name for the wrapper div.
   */
  wrapperClassName?: string
  
  /**
   * Custom class name for the label.
   */
  labelClassName?: string
  
  /**
   * Custom class name for the error message.
   */
  errorClassName?: string
  
  /**
   * Custom class name for the description text.
   */
  descriptionClassName?: string
  
  /**
   * Show character count. If a number, shows "X / maxLength". If true, shows "X characters".
   */
  showCharacterCount?: boolean | number
}

/**
 * Accessible Textarea Component
 * 
 * An enhanced textarea component with built-in accessibility features:
 * - Automatic ARIA attributes (aria-required, aria-invalid, aria-describedby)
 * - Proper label association
 * - Error message handling
 * - Helper text support
 * - Character count display
 * - Screen reader friendly
 * 
 * @example
 * ```tsx
 * <AccessibleTextarea
 *   label="Message"
 *   required
 *   maxLength={500}
 *   showCharacterCount
 *   error={errors.message}
 *   description="Tell us about your project"
 * />
 * ```
 */
const AccessibleTextarea = React.forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ 
    label,
    error,
    description,
    required,
    className,
    wrapperClassName,
    labelClassName,
    errorClassName,
    descriptionClassName,
    id,
    showCharacterCount,
    maxLength,
    value,
    ...props 
  }, ref) => {
    // Generate unique IDs for accessibility
    const textareaId = id || React.useId()
    const errorId = error ? `${textareaId}-error` : undefined
    const descriptionId = description ? `${textareaId}-description` : undefined
    const countId = showCharacterCount ? `${textareaId}-count` : undefined
    
    // Build aria-describedby from error, description, and count
    const ariaDescribedBy = [errorId, descriptionId, countId].filter(Boolean).join(' ') || undefined
    
    // Calculate character count
    const currentLength = typeof value === 'string' ? value.length : 0
    
    return (
      <div className={cn('grid gap-2', wrapperClassName)}>
        <div className="flex items-center justify-between">
          {label && (
            <Label 
              htmlFor={textareaId}
              className={labelClassName}
            >
              {label}
              {required && (
                <span className="text-destructive ml-1" aria-hidden="true">*</span>
              )}
            </Label>
          )}
          
          {showCharacterCount && (
            <span 
              id={countId}
              className="text-xs text-muted-foreground"
              aria-live="polite"
            >
              {typeof showCharacterCount === 'number' || maxLength
                ? `${currentLength} / ${maxLength || showCharacterCount}`
                : `${currentLength} characters`
              }
            </span>
          )}
        </div>
        
        <textarea
          ref={ref}
          id={textareaId}
          data-slot="textarea"
          className={cn(
            'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            error 
              ? 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border-destructive ring-destructive/20 dark:ring-destructive/40 ring-[3px]'
              : 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            className,
          )}
          aria-required={required ? 'true' : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={ariaDescribedBy}
          required={required}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        
        {description && !error && (
          <p 
            id={descriptionId}
            className={cn('text-sm text-muted-foreground', descriptionClassName)}
          >
            {description}
          </p>
        )}
        
        {error && (
          <p 
            id={errorId}
            className={cn('text-sm text-destructive', errorClassName)}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

AccessibleTextarea.displayName = 'AccessibleTextarea'

export { AccessibleTextarea }
