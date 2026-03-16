import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { ChevronDown } from 'lucide-react'

export interface AccessibleSelectProps extends Omit<React.ComponentProps<'select'>, 'aria-invalid' | 'aria-describedby' | 'aria-required'> {
  /**
   * Label text for the select. If provided, a label element will be rendered.
   */
  label?: string
  
  /**
   * Error message to display. When provided, sets aria-invalid="true" and associates the error with the select.
   */
  error?: string
  
  /**
   * Helper text to display below the select. Associated with the select via aria-describedby.
   */  
  description?: string
  
  /**
   * Whether the select is required. Automatically sets aria-required="true".
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
   * Placeholder text for the select (renders as first disabled option)
   */
  placeholder?: string
}

/**
 * Accessible Select Component
 * 
 * An enhanced select component with built-in accessibility features:
 * - Automatic ARIA attributes (aria-required, aria-invalid, aria-describedby)
 * - Proper label association
 * - Error message handling
 * - Helper text support
 * - Screen reader friendly
 * - Custom styling with chevron icon
 * 
 * @example
 * ```tsx
 * <AccessibleSelect
 *   label="Country"
 *   required
 *   error={errors.country}
 *   description="Select your country of residence"
 *   placeholder="Choose a country"
 * >
 *   <option value="us">United States</option>
 *   <option value="uk">United Kingdom</option>
 * </AccessibleSelect>
 * ```
 */
const AccessibleSelect = React.forwardRef<HTMLSelectElement, AccessibleSelectProps>(
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
    placeholder,
    children,
    ...props 
  }, ref) => {
    // Generate unique IDs for accessibility
    const selectId = id || React.useId()
    const errorId = error ? `${selectId}-error` : undefined
    const descriptionId = description ? `${selectId}-description` : undefined
    
    // Build aria-describedby from error and description
    const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined
    
    return (
      <div className={cn('grid gap-2', wrapperClassName)}>
        {label && (
          <Label 
            htmlFor={selectId}
            className={labelClassName}
          >
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
            )}
          </Label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            data-slot="select"
            className={cn(
              'appearance-none w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              'dark:bg-input/30 text-foreground',
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
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          
          {/* Chevron icon */}
          <ChevronDown 
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
            aria-hidden="true"
          />
        </div>
        
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

AccessibleSelect.displayName = 'AccessibleSelect'

export { AccessibleSelect }
