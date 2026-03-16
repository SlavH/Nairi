/**
 * Enhanced Code Validator for Builder V2
 * Provides comprehensive validation for generated TypeScript/React code
 */

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: string[]
}

export interface ValidationError {
  type: 'syntax' | 'typescript' | 'react' | 'import' | 'duplicate'
  message: string
  line?: number
  severity: 'error' | 'critical'
}

export interface ValidationWarning {
  type: 'performance' | 'accessibility' | 'best-practice'
  message: string
  line?: number
}

/**
 * Validates TypeScript/React code for common errors and issues
 */
export function validateCode(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: string[] = []

  // Check for basic syntax issues
  validateSyntax(code, errors)
  
  // Check for TypeScript issues
  validateTypeScript(code, errors)
  
  // Check for React-specific issues
  validateReact(code, errors, warnings)
  
  // Check for import issues
  validateImports(code, errors)
  
  // Check for duplicate declarations
  validateDuplicates(code, errors)
  
  // Check for performance issues
  validatePerformance(code, warnings)
  
  // Check for accessibility
  validateAccessibility(code, warnings)
  
  // Generate suggestions
  generateSuggestions(code, errors, warnings, suggestions)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

function validateSyntax(code: string, errors: ValidationError[]): void {
  // Check for unmatched braces
  const openBraces = (code.match(/\{/g) || []).length
  const closeBraces = (code.match(/\}/g) || []).length
  if (Math.abs(openBraces - closeBraces) > 2) {
    errors.push({
      type: 'syntax',
      message: `Unmatched braces: ${openBraces} opening, ${closeBraces} closing`,
      severity: 'critical'
    })
  }

  // Check for unmatched parentheses
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  if (Math.abs(openParens - closeParens) > 2) {
    errors.push({
      type: 'syntax',
      message: `Unmatched parentheses: ${openParens} opening, ${closeParens} closing`,
      severity: 'critical'
    })
  }

  // Check for malformed className
  if (code.includes('className="{`')) {
    errors.push({
      type: 'syntax',
      message: 'Malformed className template literal - should be className={`...`}',
      severity: 'error'
    })
  }

  // Check for Unicode arrows
  if (/[←-⇿➔-➿⤀-⥿]/.test(code)) {
    errors.push({
      type: 'syntax',
      message: 'Unicode arrow characters detected - should use ASCII =>',
      severity: 'error'
    })
  }
}

function validateTypeScript(code: string, errors: ValidationError[]): void {
  // Check for missing type annotations in function parameters
  const functionRegex = /function\s+\w+\s*\(([^)]*)\)/g
  let match
  while ((match = functionRegex.exec(code)) !== null) {
    const params = match[1]
    if (params && !params.includes(':') && params.trim() !== '') {
      // Allow empty params or params with types
      if (!params.includes('...')) { // Spread params are ok
        errors.push({
          type: 'typescript',
          message: `Function parameters missing type annotations: ${params}`,
          severity: 'error'
        })
      }
    }
  }

  // Check for 'any' type usage
  if (code.includes(': any')) {
    errors.push({
      type: 'typescript',
      message: 'Avoid using "any" type - use specific types instead',
      severity: 'error'
    })
  }
}

function validateReact(code: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  // Check for missing default export
  if (!code.includes('export default')) {
    errors.push({
      type: 'react',
      message: 'Missing default export - component must be exported',
      severity: 'critical'
    })
  }

  // Check for missing return statement
  if (!code.includes('return (') && !code.includes('return(')) {
    errors.push({
      type: 'react',
      message: 'Component missing return statement',
      severity: 'critical'
    })
  }

  // Check for incorrect hook usage
  const hookRegex = /\]\s+(useState|useEffect|useCallback|useMemo|useRef)\(/g
  if (hookRegex.test(code)) {
    errors.push({
      type: 'react',
      message: 'Missing = in React hook declaration',
      severity: 'error'
    })
  }

  // Check for missing key prop in map
  if (code.includes('.map(') && !code.includes('key=')) {
    warnings.push({
      type: 'best-practice',
      message: 'Missing "key" prop in mapped elements'
    })
  }

  // Check for inline function definitions in JSX
  if (code.match(/onClick=\{\(\)\s*=>\s*\{[^}]{50,}\}/)) {
    warnings.push({
      type: 'performance',
      message: 'Large inline functions in JSX - consider extracting to useCallback'
    })
  }
}

function validateImports(code: string, errors: ValidationError[]): void {
  // Extract all imports
  const importRegex = /import\s*\{([^}]+)\}\s*from/g
  const imports = new Set<string>()
  let match

  while ((match = importRegex.exec(code)) !== null) {
    const importList = match[1].split(',').map(i => {
      const parts = i.trim().split(' as ')
      return parts[parts.length - 1].trim()
    })
    
    for (const imp of importList) {
      if (imports.has(imp)) {
        errors.push({
          type: 'import',
          message: `Duplicate import: "${imp}"`,
          severity: 'error'
        })
      }
      imports.add(imp)
    }
  }

  // Check for imports that conflict with declarations
  const declarationRegex = /(?:function|const|let|var|class|interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=(:({<]/g
  while ((match = declarationRegex.exec(code)) !== null) {
    const name = match[1]
    if (imports.has(name)) {
      errors.push({
        type: 'duplicate',
        message: `"${name}" is both imported and declared`,
        severity: 'error'
      })
    }
  }
}

function validateDuplicates(code: string, errors: ValidationError[]): void {
  const declarations = new Map<string, number>()
  const declarationRegex = /(?:function|const|let|var|class|interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=(:({<]/g
  let match

  while ((match = declarationRegex.exec(code)) !== null) {
    const name = match[1]
    declarations.set(name, (declarations.get(name) || 0) + 1)
  }

  for (const [name, count] of declarations.entries()) {
    if (count > 1) {
      errors.push({
        type: 'duplicate',
        message: `Duplicate declaration: "${name}" is declared ${count} times`,
        severity: 'error'
      })
    }
  }
}

function validatePerformance(code: string, warnings: ValidationWarning[]): void {
  // Check for missing React.memo on components
  if (code.includes('export default function') && !code.includes('React.memo')) {
    // Only warn if component receives props
    if (code.match(/function\s+\w+\s*\([^)]+\)/)) {
      warnings.push({
        type: 'performance',
        message: 'Consider wrapping component in React.memo for better performance'
      })
    }
  }

  // Check for large inline objects/arrays
  if (code.match(/=\s*\{[^}]{200,}\}/)) {
    warnings.push({
      type: 'performance',
      message: 'Large inline objects detected - consider extracting to constants'
    })
  }
}

function validateAccessibility(code: string, warnings: ValidationWarning[]): void {
  // Check for images without alt text
  if (code.includes('<img') && !code.includes('alt=')) {
    warnings.push({
      type: 'accessibility',
      message: 'Images should have alt text for accessibility'
    })
  }

  // Check for buttons without accessible labels
  if (code.match(/<button[^>]*>\s*<[^>]+>\s*<\/button>/)) {
    warnings.push({
      type: 'accessibility',
      message: 'Icon-only buttons should have aria-label for accessibility'
    })
  }

  // Check for missing form labels
  if (code.includes('<input') && !code.includes('aria-label') && !code.includes('<label')) {
    warnings.push({
      type: 'accessibility',
      message: 'Form inputs should have labels or aria-label'
    })
  }
}

function generateSuggestions(
  code: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  suggestions: string[]
): void {
  if (errors.some(e => e.type === 'syntax')) {
    suggestions.push('Check for unmatched braces, parentheses, or brackets')
  }

  if (errors.some(e => e.type === 'react')) {
    suggestions.push('Ensure component has proper structure: export default function Component() { return (...) }')
  }

  if (errors.some(e => e.type === 'duplicate')) {
    suggestions.push('Remove duplicate declarations or rename conflicting variables')
  }

  if (warnings.some(w => w.type === 'accessibility')) {
    suggestions.push('Add ARIA labels and alt text for better accessibility')
  }

  if (warnings.some(w => w.type === 'performance')) {
    suggestions.push('Extract large inline functions and objects to improve performance')
  }
}

/**
 * Auto-fix common errors in generated code
 */
export function autoFixCode(code: string, errors: ValidationError[]): string {
  let fixed = code

  for (const error of errors) {
    switch (error.type) {
      case 'syntax':
        if (error.message.includes('className template literal')) {
          fixed = fixed.replace(/className="\{`([^"]+)"\s+([^`]+)`\}/g, 'className={`$1 $2`}')
          fixed = fixed.replace(/className="\{`([^`]*)`\}"/g, 'className={`$1`}')
        }
        if (error.message.includes('Unicode arrow')) {
          fixed = fixed.replace(/[⇒→⟹➔➜➝➞➡⟶⤇⇨⇾⮕]/g, '=>')
        }
        break

      case 'react':
        if (error.message.includes('Missing = in React hook')) {
          fixed = fixed.replace(/\]\s+useState\(/g, '] = useState(')
          fixed = fixed.replace(/\]\s+useEffect\(/g, '] = useEffect(')
          fixed = fixed.replace(/\]\s+useCallback\(/g, '] = useCallback(')
          fixed = fixed.replace(/\]\s+useMemo\(/g, '] = useMemo(')
          fixed = fixed.replace(/\]\s+useRef\(/g, '] = useRef(')
        }
        if (error.message.includes('Missing default export')) {
          fixed = fixed.replace(/^function\s+(\w+)/m, 'export default function $1')
        }
        break

      case 'import':
      case 'duplicate':
        // These require more complex fixes - handled separately
        break
    }
  }

  return fixed
}
