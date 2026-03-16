import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface AccessibleInputProps extends Omit<React.ComponentProps<'input'>, 'aria-invalid' | 'aria-describedby' | 'aria-required'> {
  /**
   * Label text for the input. If provided, a label element will be rendered.
   */
  label?: string
  
  /**
   * Error message to display. When provided, sets aria-invalid="true" and associates the error with the input.
   */
  error?: string
  
  /**
   * Helper text to display below the input. Associated with the input via aria-describedby.
   */  
  description?: string
  
  /**
   * Whether the input is required. Automatically sets aria-required="true".
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
}

/**
 * Accessible Input Component
 * 
 * An enhanced input component with built-in accessibility features:
 * - Automatic ARIA attributes (aria-required, aria-invalid, aria-describedby)
 * - Proper label association
 * - Error message handling
 * - Helper text support
 * - Autocomplete support
 * - Screen reader friendly
 * 
 * @example
 * ```tsx
 * <AccessibleInput
 *   label="Email"
 *   type="email"
 *   required
 *   autoComplete="email"
 *   error={errors.email}
 *   description="We'll never share your email"
 * />
 * ```
 */
const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
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
    ...props 
  }, ref) => {
    // Generate unique IDs for accessibility
    const inputId = id || React.useId()
    const errorId = error ? `${inputId}-error` : undefined
    const descriptionId = description ? `${inputId}-description` : undefined
    
    // Build aria-describedby from error and description
    const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined
    
    return (
      <div className={cn('grid gap-2', wrapperClassName)}>
        {label && (
          <Label 
            htmlFor={inputId}
            className={labelClassName}
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
            )}
          </Label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          data-slot="input"
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            error 
              ? 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border-destructive ring-destructive/20 dark:ring-destructive/40 ring-[3px]'
              : 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            className,
          )}
          aria-required={required ? 'true' : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={ariaDescribedBy}
          required={required}
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

AccessibleInput.displayName = 'AccessibleInput'

export { AccessibleInput }
