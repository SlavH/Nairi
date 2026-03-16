/**
 * Code cleaning and validation utilities for Builder V2
 */

/**
 * Clean generated code by removing markdown, fixing escapes, and normalizing arrows
 */
export function cleanGeneratedCode(code: string): string {
  let cleaned = code

  // Remove leading "json" marker if present
  if (cleaned.trim().startsWith('json')) {
    cleaned = cleaned.trim().replace(/^json\s*/, '')
  }

  // If the code looks like JSON, try to extract actual code from it
  if (cleaned.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(cleaned.trim())
      if (parsed.content) {
        cleaned = parsed.content
      } else if (parsed.code) {
        cleaned = parsed.code
      } else if (parsed.files && parsed.files[0]?.content) {
        cleaned = parsed.files[0].content
      } else if (parsed.plan) {
        console.warn('Received plan JSON instead of code')
        return ''
      }
    } catch (e) {
      // Not valid JSON, continue with original
    }
  }

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```(?:jsx|tsx|javascript|typescript|react)?\n?/g, "")
  cleaned = cleaned.replace(/```\n?/g, "")

  // Fix escaped quotes from JSON
  cleaned = cleaned.replace(/\\"/g, '"')
  cleaned = cleaned.replace(/\\n/g, '\n')
  cleaned = cleaned.replace(/\\t/g, '\t')
  cleaned = cleaned.replace(/\\\\/g, '\\')

  // Fix Unicode arrows (comprehensive)
  cleaned = cleaned.replace(/⇒/g, "=>")
  cleaned = cleaned.replace(/→/g, "=>")
  cleaned = cleaned.replace(/➔/g, "=>")
  cleaned = cleaned.replace(/➜/g, "=>")
  cleaned = cleaned.replace(/➝/g, "=>")
  cleaned = cleaned.replace(/➞/g, "=>")
  cleaned = cleaned.replace(/➡/g, "=>")
  cleaned = cleaned.replace(/⟹/g, "=>")
  cleaned = cleaned.replace(/⟶/g, "=>")
  cleaned = cleaned.replace(/⤇/g, "=>")
  cleaned = cleaned.replace(/⇨/g, "=>")
  cleaned = cleaned.replace(/⇾/g, "=>")
  
  // Unicode escape replacements
  cleaned = cleaned.replace(/\u21D2/g, "=>")
  cleaned = cleaned.replace(/\u2192/g, "=>")
  cleaned = cleaned.replace(/\u27F9/g, "=>")
  cleaned = cleaned.replace(/\u2794/g, "=>")
  cleaned = cleaned.replace(/\u279C/g, "=>")
  cleaned = cleaned.replace(/\u279D/g, "=>")
  cleaned = cleaned.replace(/\u279E/g, "=>")
  cleaned = cleaned.replace(/\u27A1/g, "=>")
  cleaned = cleaned.replace(/\u27F6/g, "=>")
  cleaned = cleaned.replace(/\u2907/g, "=>")
  cleaned = cleaned.replace(/\u21E8/g, "=>")
  cleaned = cleaned.replace(/\u21FE/g, "=>")
  cleaned = cleaned.replace(/\u2B95/g, "=>")
  
  // Catch-all regex for remaining arrow-like characters
  cleaned = cleaned.replace(/\)\s*[\u2190-\u21FF\u2794-\u27BF\u2900-\u297F]\s*/g, ") => ")
  cleaned = cleaned.replace(/\}\s*[\u2190-\u21FF\u2794-\u27BF\u2900-\u297F]\s*/g, "} => ")
  cleaned = cleaned.replace(/\)\s*[⇒→➔➜➝➞➡⟹⟶⤇⇨⇾]\s*\(/g, ") => (")
  cleaned = cleaned.replace(/\)\s*[⇒→➔➜➝➞➡⟹⟶⤇⇨⇾]\s*\{/g, ") => {")

  // Fix incorrect Lucide icon naming
  const iconNameFixes: Record<string, string> = {
    'IconCheck': 'Check',
    'IconInfo': 'Info',
    'IconStar': 'Star',
    'IconHeart': 'Heart',
    'IconUser': 'User',
    'IconHome': 'Home',
    'IconSettings': 'Settings',
    'IconSearch': 'Search',
    'IconMenu': 'Menu',
    'IconClose': 'X',
    'IconArrowRight': 'ArrowRight',
    'IconArrowLeft': 'ArrowLeft',
    'IconChevronRight': 'ChevronRight',
    'IconChevronLeft': 'ChevronLeft',
    'IconChevronDown': 'ChevronDown',
    'IconChevronUp': 'ChevronUp',
    'IconPlus': 'Plus',
    'IconMinus': 'Minus',
    'IconEdit': 'Edit',
    'IconTrash': 'Trash',
    'IconDownload': 'Download',
    'IconUpload': 'Upload',
    'IconMail': 'Mail',
    'IconPhone': 'Phone',
    'IconCalendar': 'Calendar',
    'IconClock': 'Clock',
    'IconLock': 'Lock',
    'IconUnlock': 'Unlock',
    'IconEye': 'Eye',
    'IconEyeOff': 'EyeOff',
    'IconBell': 'Bell',
    'IconBookmark': 'Bookmark',
    'IconShare': 'Share',
    'IconLink': 'Link',
    'IconImage': 'Image',
    'IconVideo': 'Video',
    'IconMusic': 'Music',
    'IconFile': 'File',
    'IconFolder': 'Folder',
    'IconCode': 'Code',
    'IconTerminal': 'Terminal',
    'IconDatabase': 'Database',
  }

  for (const [wrong, correct] of Object.entries(iconNameFixes)) {
    cleaned = cleaned.replace(new RegExp(wrong, 'g'), correct)
  }
  // Strip Icon prefix from any PascalCase name (e.g. IconX → X); map overrides above handle special cases like IconClose → X
  cleaned = cleaned.replace(/\bIcon([A-Z][a-zA-Z0-9]*)\b/g, (_, rest) => iconNameFixes['Icon' + rest] ?? rest)

  // Deduplicate identical import lines (same line text)
  const lines = cleaned.split('\n')
  const seenImports = new Set<string>()
  const deduped: string[] = []
  for (const line of lines) {
    if (/^\s*import\s/.test(line)) {
      const key = line.trim()
      if (!seenImports.has(key)) {
        seenImports.add(key)
        deduped.push(line)
      }
    } else {
      deduped.push(line)
    }
  }
  cleaned = deduped.join('\n')

  // Ensure at least one React import when file contains JSX (Sandpack/runtime may expect it)
  const hasJsx = /<[A-Za-z][\w.-]*[\s/>]|<\/[A-Za-z]/.test(cleaned)
  const hasReactImport = /import\s+.*\s+from\s+['"]react['"]/m.test(cleaned)
  if (hasJsx && !hasReactImport) {
    cleaned = "import React from 'react'\n" + cleaned
  }

  return cleaned
}

/**
 * Validate TypeScript code for common errors
 */
export function validateTypeScriptCode(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check for duplicate declarations
  const declarations = new Map<string, number>()
  const declarationRegex = /(?:function|const|let|var|class|interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=(:({<]/g
  let match
  
  while ((match = declarationRegex.exec(code)) !== null) {
    const name = match[1]
    declarations.set(name, (declarations.get(name) || 0) + 1)
  }
  
  // Check for imports that conflict with declarations
  const importRegex = /import\s*\{([^}]+)\}\s*from/g
  while ((match = importRegex.exec(code)) !== null) {
    const imports = match[1].split(',').map(i => {
      const parts = i.trim().split(' as ')
      return parts[parts.length - 1].trim()
    })
    
    for (const importName of imports) {
      if (declarations.has(importName)) {
        errors.push(`Duplicate declaration: "${importName}" is both imported and declared`)
      }
    }
  }
  
  // Check for multiple declarations of the same name
  for (const [name, count] of declarations.entries()) {
    if (count > 1) {
      errors.push(`Duplicate declaration: "${name}" is declared ${count} times`)
    }
  }
  
  // Check for syntax errors
  if (code.includes('className="{`')) {
    errors.push('Malformed className template literal')
  }
  
  if (/\]\s+use(State|Effect|Callback|Memo)\(/.test(code)) {
    errors.push('Missing = in React hook declaration')
  }
  
  // Check for Unicode arrows
  if (/[←-⇿➔-➿⤀-⥿]/.test(code)) {
    errors.push('Unicode arrow characters detected (should use ASCII =>)')
  }
  
  // Check for missing exports
  if (!code.includes('export default')) {
    errors.push('Missing default export')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Auto-fix common errors in generated code
 */
export function autoFixCommonErrors(code: string, errors: string[]): string {
  let fixed = code

  for (const error of errors) {
    if (error.includes('Malformed className template literal')) {
      console.log('🔧 AUTO-FIX: Fixing malformed className')
      fixed = fixed.replace(/className="\{`([^"]+)"\s+([^`]+)`\}/g, (match, part1, part2) => {
        return `className={\`${part1} ${part2}\`}`
      })
      fixed = fixed.replace(/className="\{`([^`]*)`\}"/g, 'className={`$1`}')
    }

    if (error.includes('Missing = in React hook declaration')) {
      console.log('🔧 AUTO-FIX: Adding = to hook declarations')
      fixed = fixed.replace(/\]\s+useState\(/g, '] = useState(')
      fixed = fixed.replace(/\]\s+useEffect\(/g, '] = useEffect(')
      fixed = fixed.replace(/\]\s+useCallback\(/g, '] = useCallback(')
      fixed = fixed.replace(/\]\s+useMemo\(/g, '] = useMemo(')
    }

    if (error.includes('Unicode arrow')) {
      console.log('🔧 AUTO-FIX: Converting Unicode arrows to ASCII')
      fixed = fixed.replace(/[⇒→⟹➔➜➝➞➡⟶⤇⇨⇾⮕]/g, '=>')
    }

    // Duplicate declaration: same name as import (e.g. Lucide) — rename local to XComponent
    const dupImportMatch = error.match(/Duplicate declaration: "([^"]+)" is both imported and declared/)
    if (dupImportMatch) {
      const name = dupImportMatch[1]
      const suffix = 'Component'
      const newName = name + suffix
      console.log(`🔧 AUTO-FIX: Renaming duplicate declaration "${name}" to "${newName}"`)
      // Rename declaration (function X( or const X = or let X =)
      fixed = fixed.replace(new RegExp(`\\bfunction\\s+${escapeRegExp(name)}\\s*\\(`, 'g'), `function ${newName}(`)
      fixed = fixed.replace(new RegExp(`\\bconst\\s+${escapeRegExp(name)}\\s*=`, 'g'), `const ${newName} =`)
      fixed = fixed.replace(new RegExp(`\\blet\\s+${escapeRegExp(name)}\\s*=`, 'g'), `let ${newName} =`)
      // JSX opening and self-closing
      fixed = fixed.replace(new RegExp(`<${escapeRegExp(name)}(\\s|>|/)`, 'g'), `<${newName}$1`)
      fixed = fixed.replace(new RegExp(`</${escapeRegExp(name)}>`, 'g'), `</${newName}>`)
      // export default X (standalone)
      fixed = fixed.replace(new RegExp(`export\\s+default\\s+${escapeRegExp(name)}\\b`, 'g'), `export default ${newName}`)
    }

    // Duplicate declaration: same name declared multiple times — rename second+ to XComponent
    const dupDeclMatch = error.match(/Duplicate declaration: "([^"]+)" is declared \d+ times/)
    if (dupDeclMatch) {
      const name = dupDeclMatch[1]
      const suffix = 'Component'
      const newName = name + suffix
      console.log(`🔧 AUTO-FIX: Renaming duplicate "${name}" to "${newName}" for later declarations`)
      const declRegex = new RegExp(`(function|const|let|var|class)\\s+${escapeRegExp(name)}\\s*[=(:({<]`, 'g')
      let first = true
      fixed = fixed.replace(declRegex, (match) => {
        if (first) {
          first = false
          return match
        }
        return match.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`), newName)
      })
    }

    if (error.includes('Missing default export')) {
      console.log('🔧 AUTO-FIX: Adding default export')
      // Already has export default — nothing to do
      if (fixed.includes('export default')) {
        continue
      }
      // export default function X
      if (/^function\s+\w+/.test(fixed.trim())) {
        fixed = fixed.replace(/^(\s*)(function\s+\w+)/m, '$1export default $2')
        continue
      }
      // const X = () => ... or const X = function ... — add export default X at end
      const constComponentMatch = fixed.match(/\bconst\s+([A-Z][A-Za-z0-9]*)\s*=\s*(?:\([^)]*\)\s*=>|function)/)
      if (constComponentMatch) {
        const compName = constComponentMatch[1]
        fixed = fixed.trimEnd() + `\nexport default ${compName}\n`
      } else {
        fixed = fixed.replace(/^function\s+(\w+)/, 'export default function $1')
      }
    }
  }

  return fixed
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
