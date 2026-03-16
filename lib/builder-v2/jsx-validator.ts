/**
 * Enhanced JSX Validator for Builder V2
 * Provides comprehensive validation and auto-fixing for generated JSX/TSX code
 */

export interface ValidationError {
  type: 'error' | 'warning'
  message: string
  line?: number
  suggestion?: string
  autoFixable: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  fixedCode?: string
}

/**
 * Comprehensive JSX/TSX code validator with auto-fixing
 */
export function validateAndFixJSX(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixedCode = code

  // Run all validation checks
  const checks = [
    checkUnclosedTags,
    checkDuplicateDeclarations,
    checkImportConflicts,
    checkMalformedClassNames,
    checkReactHooksSyntax,
    checkUnicodeCharacters,
    checkMissingExports,
    checkInvalidPropSyntax,
    checkMissingImports,
    checkComponentNaming,
    checkJSXFragments,
    checkEventHandlers,
    checkMissingKeys,
    checkSelfClosingTags
  ]

  for (const check of checks) {
    const result = check(fixedCode)
    errors.push(...result.errors)
    warnings.push(...result.warnings)
    if (result.fixedCode) {
      fixedCode = result.fixedCode
    }
  }

  // Apply final cleanup
  fixedCode = finalCleanup(fixedCode)

  return {
    isValid: errors.filter(e => e.type === 'error').length === 0,
    errors: errors.filter(e => e.type === 'error'),
    warnings: warnings.concat(errors.filter(e => e.type === 'warning')),
    fixedCode: fixedCode !== code ? fixedCode : undefined
  }
}

/**
 * Check for unclosed JSX tags
 */
function checkUnclosedTags(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixed = code

  // Find all JSX opening and closing tags
  const openingTags: { tag: string; pos: number; line: number }[] = []
  const closingTags: { tag: string; pos: number; line: number }[] = []

  // Match opening tags: <TagName or <TagName>
  const openingRegex = /<([A-Z][a-zA-Z0-9]*)[^>]*>/g
  let match
  while ((match = openingRegex.exec(code)) !== null) {
    const tag = match[1]
    const pos = match.index
    const line = code.substring(0, pos).split('\n').length
    
    // Skip self-closing tags
    if (!match[0].endsWith('/>')) {
      openingTags.push({ tag, pos, line })
    }
  }

  // Match closing tags: </TagName>
  const closingRegex = /<\/([A-Z][a-zA-Z0-9]*)>/g
  while ((match = closingRegex.exec(code)) !== null) {
    const tag = match[1]
    const pos = match.index
    const line = code.substring(0, pos).split('\n').length
    closingTags.push({ tag, pos, line })
  }

  // Check for mismatches
  const openStack: typeof openingTags = []
  let i = 0, j = 0

  while (i < openingTags.length || j < closingTags.length) {
    if (i < openingTags.length && (j >= closingTags.length || openingTags[i].pos < closingTags[j].pos)) {
      openStack.push(openingTags[i])
      i++
    } else if (j < closingTags.length) {
      const closing = closingTags[j]
      const opening = openStack.pop()
      
      if (!opening) {
        warnings.push({
          type: 'warning',
          message: `Closing tag </${closing.tag}> without matching opening tag`,
          line: closing.line,
          autoFixable: false
        })
      } else if (opening.tag !== closing.tag) {
        errors.push({
          type: 'error',
          message: `Mismatched tags: <${opening.tag}> closed with </${closing.tag}>`,
          line: closing.line,
          suggestion: `Change </${closing.tag}> to </${opening.tag}>`,
          autoFixable: false
        })
      }
      j++
    }
  }

  // Check for unclosed tags
  for (const unclosed of openStack) {
    warnings.push({
      type: 'warning',
      message: `Unclosed tag: <${unclosed.tag}>`,
      line: unclosed.line,
      suggestion: `Add </${unclosed.tag}> before the end of the component`,
      autoFixable: false
    })
  }

  return { isValid: errors.length === 0, errors, warnings, fixedCode: fixed }
}

/**
 * Check for duplicate declarations
 */
function checkDuplicateDeclarations(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixed = code

  const declarations = new Map<string, number[]>()
  const declarationRegex = /(?:function|const|let|var|class|interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=(:({<]/g
  let match

  while ((match = declarationRegex.exec(code)) !== null) {
    const name = match[1]
    const line = code.substring(0, match.index).split('\n').length
    
    if (!declarations.has(name)) {
      declarations.set(name, [])
    }
    declarations.get(name)!.push(line)
  }

  for (const [name, lines] of declarations.entries()) {
    if (lines.length > 1) {
      errors.push({
        type: 'error',
        message: `Duplicate declaration: "${name}" is declared ${lines.length} times (lines: ${lines.join(', ')})`,
        line: lines[1],
        suggestion: `Rename one of the declarations or remove the duplicate`,
        autoFixable: false
      })
    }
  }

  return { isValid: errors.length === 0, errors, warnings, fixedCode: fixed }
}

/**
 * Check for import conflicts with declarations
 */
function checkImportConflicts(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixed = code

  // Get all declarations
  const declarations = new Set<string>()
  const declarationRegex = /(?:export\s+default\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g
  let match

  while ((match = declarationRegex.exec(code)) !== null) {
    declarations.add(match[1])
  }

  // Check lucide-react imports for conflicts
  const lucideImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g
  while ((match = lucideImportRegex.exec(code)) !== null) {
    const fullImport = match[0]
    const importedIcons = match[1]
    const icons = importedIcons.split(',').map(i => i.trim().split(' as ')[0].trim())

    const conflicting: string[] = []
    for (const icon of icons) {
      if (declarations.has(icon)) {
        conflicting.push(icon)
      }
    }

    if (conflicting.length > 0) {
      // Auto-fix by aliasing
      const aliasedIcons = icons.map(icon => 
        conflicting.includes(icon) ? `${icon} as ${icon}Icon` : icon
      )
      const newImport = `import { ${aliasedIcons.join(', ')} } from 'lucide-react'`
      fixed = fixed.replace(fullImport, newImport)

      // Replace usages
      for (const icon of conflicting) {
        fixed = fixed.replace(new RegExp(`<${icon}([\\s/>])`, 'g'), `<${icon}Icon$1`)
        fixed = fixed.replace(new RegExp(`\\{<${icon}([\\s/>])`, 'g'), `{<${icon}Icon$1`)
      }

      warnings.push({
        type: 'warning',
        message: `Auto-fixed: Aliased conflicting lucide icons: ${conflicting.join(', ')}`,
        autoFixable: true
      })
    }
  }

  return { isValid: true, errors, warnings, fixedCode: fixed !== code ? fixed : undefined }
}

/**
 * Check for malformed className attributes
 */
function checkMalformedClassNames(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixed = code

  // Fix: className="{`...`}"  →  className={`...`}
  const malformed1 = /className="\{`([^`]*)`\}"/g
  if (malformed1.test(code)) {
    fixed = fixed.replace(malformed1, 'className={`$1`}')
    warnings.push({
      type: 'warning',
      message: 'Auto-fixed: Malformed className template literal',
      autoFixable: true
    })
  }

  // Fix: className="{`..." "...`}"  →  className={`... ...`}
  const malformed2 = /className="\{`([^"]+)"\s+([^`]+)`\}/g
  if (malformed2.test(code)) {
    fixed = fixed.replace(malformed2, (match, part1, part2) => {
      return `className={\`${part1} ${part2}\`}`
    })
    warnings.push({
      type: 'warning',
      message: 'Auto-fixed: Malformed className with split template',
      autoFixable: true
    })
  }

  return { isValid: true, errors, warnings, fixedCode: fixed !== code ? fixed : undefined }
}

/**
 * Check React hooks syntax
 */
function checkReactHooksSyntax(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixed = code

  // Fix: ] useState(  →  ] = useState(
  const hookPattern = /\]\s+(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer)\(/g
  if (hookPattern.test(code)) {
    fixed = fixed.replace(hookPattern, '] = $1(')
    warnings.push({
      type: 'warning',
      message: 'Auto-fixed: Missing = in React hook declaration',
      autoFixable: true
    })
  }

  return { isValid: true, errors, warnings, fixedCode: fixed !== code ? fixed : undefined }
}

/**
 * Check for Unicode characters that should be ASCII
 */
function checkUnicodeCharacters(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixed = code

  // Fix Unicode arrows
  if (/[⇒→⟹➔➜➝➞➡⟶⤇⇨⇾⮕]/.test(code)) {
    fixed = fixed.replace(/[⇒→⟹➔➜➝➞➡⟶⤇⇨⇾⮕]/g, '=>')
    warnings.push({
      type: 'warning',
      message: 'Auto-fixed: Converted Unicode arrow characters to ASCII =>',
      autoFixable: true
    })
  }

  // Fix Unicode quotes
  if (/[""''‚„‹›«»]/.test(code)) {
    fixed = fixed.replace(/[""]/g, '"')
    fixed = fixed.replace(/['']/g, "'")
    fixed = fixed.replace(/[‚„]/g, ',')
    warnings.push({
      type: 'warning',
      message: 'Auto-fixed: Converted Unicode quotes to ASCII quotes',
      autoFixable: true
    })
  }

  return { isValid: true, errors, warnings, fixedCode: fixed !== code ? fixed : undefined }
}

/**
 * Check for missing exports
 */
function checkMissingExports(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixed = code

  if (!code.includes('export default')) {
    // Find the main component function
    const mainFunctionMatch = code.match(/^function\s+([A-Z][a-zA-Z0-9]*)/m)
    if (mainFunctionMatch) {
      fixed = fixed.replace(/^function\s+([A-Z][a-zA-Z0-9]*)/, 'export default function $1')
      warnings.push({
        type: 'warning',
        message: 'Auto-fixed: Added missing default export',
        autoFixable: true
      })
    } else {
      errors.push({
        type: 'error',
        message: 'Missing default export',
        suggestion: 'Add "export default" before the main component function',
        autoFixable: false
      })
    }
  }

  return { isValid: errors.length === 0, errors, warnings, fixedCode: fixed !== code ? fixed : undefined }
}

/**
 * Check for invalid prop syntax
 */
function checkInvalidPropSyntax(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Check for props without = sign: <Component prop"value">
  const invalidPropRegex = /<[A-Z][a-zA-Z0-9]*[^>]*\s+([a-z][a-zA-Z0-9]*)"([^"]*)"[^>]*>/g
  let match
  while ((match = invalidPropRegex.exec(code)) !== null) {
    const line = code.substring(0, match.index).split('\n').length
    errors.push({
      type: 'error',
      message: `Invalid prop syntax: ${match[1]}"${match[2]}" (missing =)`,
      line,
      suggestion: `Change to ${match[1]}="${match[2]}"`,
      autoFixable: false
    })
  }

  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Check for missing imports
 */
function checkMissingImports(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Common React hooks that need to be imported
  const reactHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer']
  const usedHooks = reactHooks.filter(hook => code.includes(hook))

  if (usedHooks.length > 0 && !code.includes('import') && !code.includes('from "react"')) {
    warnings.push({
      type: 'warning',
      message: `React hooks used but no React import found: ${usedHooks.join(', ')}`,
      suggestion: `Add: import { ${usedHooks.join(', ')} } from 'react'`,
      autoFixable: false
    })
  }

  return { isValid: true, errors, warnings }
}

/**
 * Check component naming conventions
 */
function checkComponentNaming(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Component functions should start with uppercase
  const functionRegex = /function\s+([a-z][a-zA-Z0-9]*)\s*\([^)]*\)\s*\{[^}]*return\s*\(/g
  let match
  while ((match = functionRegex.exec(code)) !== null) {
    const line = code.substring(0, match.index).split('\n').length
    warnings.push({
      type: 'warning',
      message: `Component function "${match[1]}" should start with uppercase`,
      line,
      suggestion: `Rename to "${match[1].charAt(0).toUpperCase() + match[1].slice(1)}"`,
      autoFixable: false
    })
  }

  return { isValid: true, errors, warnings }
}

/**
 * Check JSX fragments
 */
function checkJSXFragments(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Count opening and closing fragments
  const openFragments = (code.match(/<>/g) || []).length
  const closeFragments = (code.match(/<\/>/g) || []).length

  if (openFragments !== closeFragments) {
    errors.push({
      type: 'error',
      message: `Mismatched JSX fragments: ${openFragments} opening, ${closeFragments} closing`,
      suggestion: 'Ensure all <> have matching </>',
      autoFixable: false
    })
  }

  return { isValid: errors.length === 0, errors, warnings }
}

/**
 * Check event handler casing
 */
function checkEventHandlers(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Common event handlers with wrong casing
  const wrongCasing = [
    { wrong: 'onclick', correct: 'onClick' },
    { wrong: 'onchange', correct: 'onChange' },
    { wrong: 'onsubmit', correct: 'onSubmit' },
    { wrong: 'onkeydown', correct: 'onKeyDown' },
    { wrong: 'onkeyup', correct: 'onKeyUp' },
    { wrong: 'onmouseenter', correct: 'onMouseEnter' },
    { wrong: 'onmouseleave', correct: 'onMouseLeave' }
  ]

  for (const { wrong, correct } of wrongCasing) {
    if (code.includes(wrong + '=')) {
      const line = code.indexOf(wrong + '=')
      warnings.push({
        type: 'warning',
        message: `Event handler should use camelCase: ${wrong} → ${correct}`,
        line: code.substring(0, line).split('\n').length,
        suggestion: `Change ${wrong} to ${correct}`,
        autoFixable: false
      })
    }
  }

  return { isValid: true, errors, warnings }
}

/**
 * Check for missing key props in lists
 */
function checkMissingKeys(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Find .map() calls that return JSX without key prop
  const mapRegex = /\.map\([^)]*=>\s*<([A-Z][a-zA-Z0-9]*|[a-z]+)[^>]*>/g
  let match
  while ((match = mapRegex.exec(code)) !== null) {
    const jsxTag = match[0]
    if (!jsxTag.includes('key=')) {
      const line = code.substring(0, match.index).split('\n').length
      warnings.push({
        type: 'warning',
        message: 'Missing key prop in list item',
        line,
        suggestion: 'Add key={...} prop to the element inside .map()',
        autoFixable: false
      })
    }
  }

  return { isValid: true, errors, warnings }
}

/**
 * Check self-closing tags
 */
function checkSelfClosingTags(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let fixed = code

  // Fix: <img ...></img>  →  <img ... />
  const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link']
  for (const tag of selfClosingTags) {
    const pattern = new RegExp(`<${tag}([^>]*)></${tag}>`, 'g')
    if (pattern.test(code)) {
      fixed = fixed.replace(pattern, `<${tag}$1 />`)
      warnings.push({
        type: 'warning',
        message: `Auto-fixed: Converted <${tag}></${tag}> to self-closing tag`,
        autoFixable: true
      })
    }
  }

  return { isValid: true, errors, warnings, fixedCode: fixed !== code ? fixed : undefined }
}

/**
 * Final cleanup pass
 */
function finalCleanup(code: string): string {
  let cleaned = code

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n')

  // Ensure consistent spacing around JSX
  cleaned = cleaned.replace(/>\s*\n\s*\n\s*</g, '>\n<')

  // Remove trailing whitespace
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n')

  return cleaned
}
