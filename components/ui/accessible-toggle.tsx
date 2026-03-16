import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface AccessibleToggleProps extends Omit<React.ComponentProps<'input'>, 'type' | 'role' | 'aria-checked'> {
  /**
   * Label text for the toggle. Required for accessibility.
   */
  label: string
  
  /**
   * Description text to display below the label.
   */
  description?: string
  
  /**
   * Whether the toggle is checked.
   */
  checked?: boolean
  
  /**
   * Callback when the toggle state changes.
   */
  onCheckedChange?: (checked: boolean) => void
  
  /**
   * Custom class name for the wrapper div.
   */
  wrapperClassName?: string
  
  /**
   * Custom class name for the label.
   */
  labelClassName?: string
  
  /**
   * Custom class name for the description text.
   */
  descriptionClassName?: string
  
  /**
   * Custom class name for the toggle switch.
   */
  switchClassName?: string
}

/**
 * Accessible Toggle Component
 * 
 * An accessible toggle switch component with proper ARIA attributes:
 * - Uses role="switch" for screen readers
 * - Proper aria-checked state
 * - Keyboard accessible (Space/Enter to toggle)
 * - Visual focus indicators
 * - Label association
 * - Description support
 * 
 * @example
 * ```tsx
 * <AccessibleToggle
 *   label="Dark Mode"
 *   description="Toggle dark/light theme"
 *   checked={darkMode}
 *   onCheckedChange={setDarkMode}
 * />
 * ```
 */
const AccessibleToggle = React.forwardRef<HTMLInputElement, AccessibleToggleProps>(
  ({ 
    label,
    description,
    checked = false,
    onCheckedChange,
    className,
    wrapperClassName,
    labelClassName,
    descriptionClassName,
    switchClassName,
    id,
    disabled,
    ...props 
  }, ref) => {
    // Generate unique IDs for accessibility
    const toggleId = id || React.useId()
    const descriptionId = description ? `${toggleId}-description` : undefined
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
    }
    
    return (
      <div className={cn('flex items-center justify-between', wrapperClassName)}>
        <div className="flex-1">
          <Label 
            htmlFor={toggleId}
            className={cn('cursor-pointer', disabled && 'cursor-not-allowed opacity-50', labelClassName)}
          >
            {label}
          </Label>
          {description && (
            <p 
              id={descriptionId}
              className={cn('text-sm text-muted-foreground mt-1', descriptionClassName)}
            >
              {description}
            </p>
          )}
        </div>
        
        <label 
          className={cn(
            'relative inline-flex items-center cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={toggleId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            aria-checked={checked}
            aria-describedby={descriptionId}
            className="sr-only peer"
            {...props}
          />
          <div 
            className={cn(
              'w-11 h-6 rounded-full transition-colors',
              'peer-focus-visible:ring-4 peer-focus-visible:ring-ring/50',
              'peer-checked:bg-primary peer-checked:after:translate-x-full',
              'bg-input peer-disabled:opacity-50',
              'after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px]',
              'after:bg-background after:rounded-full after:h-5 after:w-5',
              'after:transition-transform after:shadow-sm',
              switchClassName
            )}
          />
        </label>
      </div>
    )
  }
)

AccessibleToggle.displayName = 'AccessibleToggle'

export { AccessibleToggle }
