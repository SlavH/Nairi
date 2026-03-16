"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  ExternalLink,
  MousePointer2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Info,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  SandpackProvider,
  SandpackPreview,
  useSandpack,
  SandpackLayout
} from "@codesandbox/sandpack-react"

interface LivePreviewV2Props {
  code: string
  viewport: "mobile" | "tablet" | "desktop"
  isFullscreen?: boolean
  files?: Record<string, string>
  /** Reason from last generation — shown as info banner when no previewError */
  reason?: string | null
  /** When set, preview shows this AI/API error instead of website (no Sandpack) */
  previewError?: string | null
  onFixError?: (errorMessage: string) => void
  /** Called when Sandpack reports an error (so parent can auto-fix until clean) */
  onErrorDetected?: (errorMessage: string) => void
  /** Called when user chooses to replace code with a safe starter page to unblock preview */
  onUseSafeStarter?: () => void
  /** Called when user clicks "Make it pop" — add wow element via AI */
  onMakeItPop?: () => void
}

const VIEWPORT_WIDTHS = {
  mobile: 375,
  tablet: 768,
  desktop: 1280
}

// Sandpack theme matching Nairi's dark theme
const nairiTheme = {
  colors: {
    surface1: "#0a0a0a",
    surface2: "#1a1a1a",
    surface3: "#2a2a2a",
    clickable: "#999999",
    base: "#ffffff",
    disabled: "#4D4D4D",
    hover: "#c5c5c5",
    accent: "#a855f7",
    error: "#ff453a",
    errorSurface: "#3a1d1d"
  },
  syntax: {
    plain: "#FFFFFF",
    comment: { color: "#757575", fontStyle: "italic" as const },
    keyword: "#c792ea",
    tag: "#80cbc4",
    punctuation: "#89ddff",
    definition: "#82aaff",
    property: "#c792ea",
    static: "#f78c6c",
    string: "#c3e88d"
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "Fira Mono", Menlo, Consolas, monospace',
    size: "13px",
    lineHeight: "20px"
  }
}

// Remove imports for components that are defined in the same file
function removeDuplicateImports(code: string): string {
  // Find all function/const component definitions
  const functionDefs = code.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g) || []
  const constDefs = code.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*[=:]/g) || []
  
  const definedComponents = new Set<string>()
  
  functionDefs.forEach(match => {
    const name = match.match(/function\s+([A-Z][a-zA-Z0-9]*)/)?.[1]
    if (name) definedComponents.add(name)
  })
  
  constDefs.forEach(match => {
    const name = match.match(/const\s+([A-Z][a-zA-Z0-9]*)/)?.[1]
    if (name) definedComponents.add(name)
  })
  
  let result = code
  
  // Remove import statements for components defined in the file
  definedComponents.forEach(componentName => {
    // Remove: import { ComponentName } from './ComponentName'
    // Remove: import ComponentName from './ComponentName'
    // Remove: import { ComponentName } from './path'
    const importPatterns = [
      new RegExp(`import\\s*\\{\\s*${componentName}\\s*\\}\\s*from\\s*['"][^'"]+['"];?\\s*\\n?`, 'g'),
      new RegExp(`import\\s+${componentName}\\s+from\\s*['"][^'"]+['"];?\\s*\\n?`, 'g'),
    ]
    
    importPatterns.forEach(pattern => {
      result = result.replace(pattern, '')
    })
  })
  
  return result
}

// Strip Next.js-specific imports and usage so Sandpack (no "next" dependency) can run the preview
function stripNextJsForPreview(code: string): string {
  let out = code
  // Remove Next.js import lines (type, value, default)
  out = out.replace(/import\s+type\s+\{[^}]*\}\s*from\s*["']next["']\s*;?\s*\n?/g, '')
  out = out.replace(/import\s+type\s+\{[^}]*\}\s*from\s*["']next\/[^"']+["']\s*;?\s*\n?/g, '')
  out = out.replace(/import\s+\{[^}]*\}\s*from\s*["']next\/[^"']+["']\s*;?\s*\n?/g, '')
  out = out.replace(/import\s+\w+\s+from\s*["']next\/[^"']+["']\s*;?\s*\n?/g, '')
  out = out.replace(/import\s+\w+\s+from\s*["']next["']\s*;?\s*\n?/g, '')
  // Remove export const metadata = { ... }; (Next.js App Router) - one-line or multi-line
  out = out.replace(/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{[^}]*\}\s*;?\s*\n?/g, '')
  out = out.replace(/export\s+const\s+metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*\n?/g, '')
  // Replace next/font usage: const X = Font({ ... }) and later X.className -> use a simple substitute
  const fontVarMatch = out.match(/const\s+(\w+)\s*=\s*\w+\s*\(\s*\{[^}]*\}\s*\)\s*;?\s*\n?/)
  if (fontVarMatch) {
    const fontVar = fontVarMatch[1]
    out = out.replace(fontVarMatch[0], '')
    out = out.replace(new RegExp(`\\b${fontVar}\\.className\\b`, 'g'), '"font-sans"')
    out = out.replace(new RegExp(`\\b${fontVar}\\.style\\.fontFamily\\b`, 'g'), '"inherit"')
  }
  // Remove <Head>...</Head> usage (next/head) - replace with fragment so children don't render in wrong place
  out = out.replace(/<Head[^>]*>[\s\S]*?<\/Head>/gi, '<></>')
  out = out.replace(/import\s+Head\s+from\s*["']next\/head["']\s*;?\s*\n?/g, '')
  // Preview only has /styles.css; map globals.css so styles still load
  out = out.replace(/import\s+["']\.\/globals\.css["']\s*;?\s*\n?/g, 'import "./styles.css";\n')
  out = out.replace(/import\s+["']@\/app\/globals\.css["']\s*;?\s*\n?/g, 'import "./styles.css";\n')
  return out
}

// Clean code for Sandpack - fix common issues
function cleanCodeForSandpack(code: string): string {
  let cleaned = stripNextJsForPreview(code)
  cleaned = cleaned
    // Fix Unicode arrows - comprehensive replacement
    // First, replace any arrow-like Unicode characters
    .replace(/[\u21D2\u21d2\u2192\u27F9\u2794\u279C\u279D\u279E\u27A1\u2B95]/g, "=>")
    .replace(/⇒/g, "=>")
    .replace(/→/g, "=>")
    .replace(/➔/g, "=>")
    .replace(/➜/g, "=>")
    .replace(/➝/g, "=>")
    .replace(/➞/g, "=>")
    // Also catch cases where arrow appears in function context
    .replace(/\)\s*[⇒→]\s*/g, ") => ")
    .replace(/\}\s*[⇒→]\s*/g, "} => ")
    // Fix arrow in map/filter contexts with parentheses
    .replace(/\)\s*[\u21d2\u2192]\s*\(/g, ") => (")
    .replace(/\)\s*[\u21d2\u2192]\s*\{/g, ") => {")
    // Fix malformed className template literals with trailing quote
    .replace(/(className=\{`[^`]*`\})"/g, '$1')
    .replace(/(className=\{`[^`]*'\})"/g, '$1')
    .replace(/className="\{`([^`]*)`\}"/g, 'className={`$1`}')
    .replace(/className="\{`([^"]+)"\s+([^`]+)`\}/g, (_, p1, p2) => `className={\`${p1} ${p2}\`}`)
    // Remove "use client" directives (not needed in Sandpack)
    .replace(/"use client"\s*/g, "")
    .replace(/'use client'\s*/g, "")
    .trim()
  
  // Fix incorrect Lucide icon naming (IconXxx -> Xxx)
  // Common pattern: AI generates IconCheck, IconInfo, etc. but lucide-react uses Check, Info
  cleaned = cleaned.replace(/\bIconCheck\b/g, 'Check')
  cleaned = cleaned.replace(/\bIconInfo\b/g, 'Info')
  cleaned = cleaned.replace(/\bIconStar\b/g, 'Star')
  cleaned = cleaned.replace(/\bIconHeart\b/g, 'Heart')
  cleaned = cleaned.replace(/\bIconUser\b/g, 'User')
  cleaned = cleaned.replace(/\bIconHome\b/g, 'Home')
  cleaned = cleaned.replace(/\bIconSettings\b/g, 'Settings')
  cleaned = cleaned.replace(/\bIconSearch\b/g, 'Search')
  cleaned = cleaned.replace(/\bIconMenu\b/g, 'Menu')
  cleaned = cleaned.replace(/\bIconClose\b/g, 'X')
  cleaned = cleaned.replace(/\bIconArrowRight\b/g, 'ArrowRight')
  cleaned = cleaned.replace(/\bIconArrowLeft\b/g, 'ArrowLeft')
  // Generic pattern: Icon followed by capital letter -> remove Icon prefix
  cleaned = cleaned.replace(/\bIcon([A-Z][a-zA-Z0-9]*)\b/g, '$1')
  
  // Remove duplicate imports for locally defined components
  cleaned = removeDuplicateImports(cleaned)
  
  // Apply syntax error fixes as final step
  cleaned = fixCommonSyntaxErrors(cleaned)
  
  return cleaned
}

// Move fixCommonSyntaxErrors BEFORE cleanCodeForSandpack calls it

// Check if code is valid React/JSX code (not JSON or incomplete)
function isValidReactCode(code: string): boolean {
  if (!code || code.trim().length < 50) return false
  
  // Check for common invalid patterns (JSON, incomplete code)
  const trimmed = code.trim()
  // Reject JSON plan data
  if (trimmed.startsWith('{') && trimmed.includes('"plan"')) return false
  if (trimmed.startsWith('json')) return false
  if (trimmed.includes('"plan":')) return false
  if (trimmed.startsWith('[')) return false
  if (trimmed.includes('```')) return false
  // Reject if it looks like a JSON object without React code
  if (trimmed.startsWith('{') && !trimmed.includes('function') && !trimmed.includes('const') && !trimmed.includes('<')) return false
  
  // Must contain JSX-like patterns or function/const declarations
  const hasJSX = /<[A-Z][a-zA-Z]*|<div|<span|<button|<input/i.test(code)
  const hasComponent = /function\s+\w+|const\s+\w+\s*=/.test(code)
  
  return hasJSX || hasComponent
}

// Fix common syntax errors in generated code
function fixCommonSyntaxErrors(code: string): string {
  let fixed = code
  
  // Remove stray backticks that appear after closing braces (very common AI error)
  // Pattern: }` or };` at end of lines
  fixed = fixed.replace(/\}\s*`\s*$/gm, '}')
  fixed = fixed.replace(/\};\s*`\s*$/gm, '};')
  fixed = fixed.replace(/\)\s*;\s*`\s*$/gm, ');')
  
  // Remove backticks that appear alone on a line or after })
  fixed = fixed.replace(/^\s*`\s*$/gm, '')
  fixed = fixed.replace(/\}\)\s*`/g, '})')
  fixed = fixed.replace(/\}\s*`\s*\}/g, '}\n}')
  
  // Remove stray backticks after closing tags
  fixed = fixed.replace(/<\/[a-zA-Z]+>\s*`/g, (match) => match.replace('`', ''))
  
  // Remove undefined variable references - common AI error
  // If customStyles is referenced but not defined, remove the entire line or element
  if (fixed.includes('customStyles') && !fixed.includes('const customStyles') && !fixed.includes('let customStyles')) {
    // Remove <style>{customStyles}</style> entirely
    fixed = fixed.replace(/<style>\{customStyles\}<\/style>/g, '')
    fixed = fixed.replace(/<style>\s*\{customStyles\}\s*<\/style>/g, '')
    // Replace style prop references
    fixed = fixed.replace(/style=\{customStyles\}/g, '')
    fixed = fixed.replace(/style=\{customStyles\.[^}]+\}/g, '')
    fixed = fixed.replace(/\{\.\.\.customStyles\}/g, '')
    fixed = fixed.replace(/className=\{customStyles\.[^}]+\}/g, 'className=""')
  }
  
  // Fix unterminated template literals - find backticks and ensure they're paired
  const backtickCount = (fixed.match(/`/g) || []).length
  if (backtickCount % 2 !== 0) {
    // Remove the last stray backtick if odd number
    const lastBacktickIndex = fixed.lastIndexOf('`')
    if (lastBacktickIndex > -1) {
      // Check context - if it's after a } or ; it's likely stray
      const beforeBacktick = fixed.substring(Math.max(0, lastBacktickIndex - 5), lastBacktickIndex)
      if (/[};)\]]\s*$/.test(beforeBacktick)) {
        // Remove the stray backtick
        fixed = fixed.substring(0, lastBacktickIndex) + fixed.substring(lastBacktickIndex + 1)
      }
    }
  }
  
  // Fix unmatched braces - count opening and closing
  const openBraces = (fixed.match(/\{/g) || []).length
  const closeBraces = (fixed.match(/\}/g) || []).length
  if (openBraces > closeBraces) {
    // Add missing closing braces at the end
    fixed = fixed + '\n' + '}'.repeat(openBraces - closeBraces)
  }
  
  // Fix unmatched parentheses
  const openParens = (fixed.match(/\(/g) || []).length
  const closeParens = (fixed.match(/\)/g) || []).length
  if (openParens > closeParens) {
    fixed = fixed + ')'.repeat(openParens - closeParens)
  }
  
  // Fix className with mixed quotes and template literals
  fixed = fixed.replace(/className="\{`([^`]+)`\}"/g, 'className={`$1`}')
  fixed = fixed.replace(/className='\{`([^`]+)`\}'/g, 'className={`$1`}')
  // CRITICAL FIX: Guard against unterminated template literals in className
  // Example broken pattern:
  // className={`base classes ${
  //   condition ? "extra" : ""
  // }
  // We fall back to keeping only the stable prefix (`base classes`) and drop the dynamic part
  fixed = fixed.replace(
    /className=\{\`([^`]*?)\$\{[\s\S]*?\n\s*\}\s*/g,
    'className="$1" '
  )
  
  // CRITICAL FIX: Fix stray '>' characters after JSX opening tags
  // Pattern: <main className="..."> > -> <main className="...">
  fixed = fixed.replace(/(<[A-Za-z][^>]*>)\s*>/g, '$1')
  
  // CRITICAL FIX: Remove standalone JSX comments that can break parsing
  // Pattern (line with only a JSX comment): {/* Hero Section */}
  fixed = fixed.replace(/^\s*\{\s*\/\*[\s\S]*?\*\/\s*\}\s*$/gm, '')
  
  // Clean up any double newlines created by removals
  fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n')
  
  return fixed
}

// Strip html/body/head to a single-page React component so preview works (incl. multi-page/layout output).
function stripHtmlBodyToPageContent(content: string): string {
  let out = content
  out = out.replace(/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*\n?/g, '')
  out = out.replace(/export\s+const\s+metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*\n?/g, '')

  let inner: string | null = null
  const bodyMatch = out.match(/<body[^>]*>([\s\S]*?)<\/body\s*>/i)
  if (bodyMatch) {
    inner = bodyMatch[1].trim()
  } else {
    const htmlMatch = out.match(/<html[^>]*>([\s\S]*?)<\/html\s*>/i)
    if (htmlMatch) inner = htmlMatch[1].trim()
  }

  if (inner) {
    inner = inner.replace(/<head[^>]*>[\s\S]*?<\/head\s*>/gi, '').trim()
    const pageJsx = `<>${inner}</>`
    out = out.replace(/\bexport\s+default\s+[\s\S]*$/m, '').trimEnd()
    out = `${out}\n\nexport default function Page() {\n  return (\n    ${pageJsx}\n  )\n}`
  } else {
    out = out.replace(/<\s*head[^>]*>[\s\S]*?<\/head\s*>/gi, '')
    out = out.replace(/<\s*body[^>]*>/gi, '<>')
    out = out.replace(/<\/body\s*>/gi, '</>')
    out = out.replace(/<\s*html[^>]*>/gi, '')
    out = out.replace(/<\/html\s*>/gi, '')
    out = out.replace(/\bRootLayout\b/g, 'Page')
  }
  return out
}

// Fallback: aggressively remove document tags so we always get renderable JSX (supports multi-page/layout output).
function aggressiveStripDocumentTags(content: string): string {
  let out = content
  out = out.replace(/export\s+const\s+metadata\s*:\s*Metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*\n?/g, '')
  out = out.replace(/export\s+const\s+metadata\s*=\s*\{[\s\S]*?\}\s*;?\s*\n?/g, '')
  out = out.replace(/<head[^>]*>[\s\S]*?<\/head\s*>/gi, '')
  out = out.replace(/<\s*body[^>]*>/gi, '<>')
  out = out.replace(/<\/body\s*>/gi, '</>')
  out = out.replace(/<\s*html[^>]*>/gi, '')
  out = out.replace(/<\/html\s*>/gi, '')
  out = out.replace(/\bRootLayout\b/g, 'Page')
  return out
}

function hasDocumentTags(s: string): boolean {
  return /<\s*html|<\s*head|<\s*body/i.test(s)
}

// Build Sandpack files from code
function buildSandpackFiles(code: string): Record<string, string> {
  // First fix common syntax errors, then clean for Sandpack
  let cleanCode = fixCommonSyntaxErrors(code)
  cleanCode = cleanCodeForSandpack(cleanCode)
  
  // If code contains html/body/head (e.g. multi-page layout), strip to a single React component so preview works.
  if (hasDocumentTags(cleanCode)) {
    let stripped = stripHtmlBodyToPageContent(cleanCode)
    if (hasDocumentTags(stripped)) {
      stripped = aggressiveStripDocumentTags(stripped)
    }
    if (hasDocumentTags(stripped)) {
      stripped = aggressiveStripDocumentTags(cleanCode)
    }
    // Use stripped result if we have substantial content; only show error when nothing usable remains
    if (stripped.trim().length > 50) {
      cleanCode = stripped
    } else {
      cleanCode = `import React from "react"

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 text-sm text-red-600">
      <p>
        Preview not available: generated layout uses &lt;html&gt;/&lt;body&gt; structure.
        Please regenerate or simplify your request so it produces a single-page React component instead.
      </p>
    </main>
  )
}
`
    }
  }
  
  // Ensure React import exists (required for JSX)
  if (!cleanCode.includes("import React") && !cleanCode.includes("from 'react'") && !cleanCode.includes('from "react"')) {
    // Check if code uses hooks
    const usesHooks = /\b(useState|useEffect|useCallback|useMemo|useRef|useContext|useReducer)\b/.test(cleanCode)
    if (usesHooks) {
      // Extract which hooks are used
      const hooks: string[] = []
      if (/\buseState\b/.test(cleanCode)) hooks.push('useState')
      if (/\buseEffect\b/.test(cleanCode)) hooks.push('useEffect')
      if (/\buseCallback\b/.test(cleanCode)) hooks.push('useCallback')
      if (/\buseMemo\b/.test(cleanCode)) hooks.push('useMemo')
      if (/\buseRef\b/.test(cleanCode)) hooks.push('useRef')
      if (/\buseContext\b/.test(cleanCode)) hooks.push('useContext')
      if (/\buseReducer\b/.test(cleanCode)) hooks.push('useReducer')
      cleanCode = `import React, { ${hooks.join(', ')} } from "react"\n\n${cleanCode}`
    } else {
      cleanCode = `import React from "react"\n\n${cleanCode}`
    }
  }
  
  // Ensure export default exists
  if (!cleanCode.includes("export default")) {
    // Try to find the main component function
    const functionMatch = cleanCode.match(/function\s+(\w+)\s*\(/)
    const constMatch = cleanCode.match(/const\s+(\w+)\s*=\s*\(/)
    const componentName = functionMatch?.[1] || constMatch?.[1]
    
    if (componentName) {
      cleanCode += `\n\nexport default ${componentName}`
    }
  }

  return {
    "/App.tsx": cleanCode,
    "/index.tsx": `import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./styles.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
    "/styles.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Syne:wght@400;600;700&family=Outfit:wght@400;500;600;700&display=swap');

* { 
  box-sizing: border-box; 
  margin: 0;
  padding: 0;
}

body { 
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Base keyframes for builder "wow" animations - use with Tailwind animate-[name_duration_easing] */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes blob {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1); }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: scale(1.05); }
}
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 20px currentColor; }
  50% { opacity: 0.8; box-shadow: 0 0 40px currentColor; }
}`
  }
}

// Sandpack status listener component
function SandpackStatusListener({ 
  onReady, 
  onError 
}: { 
  onReady: () => void
  onError: (error: string) => void 
}) {
  const { sandpack } = useSandpack()
  const hasCalledReady = React.useRef(false)
  const lastErrorRef = React.useRef<string | null>(null)
  
  useEffect(() => {
    // Reset refs when sandpack restarts
    if (sandpack.status === "idle") {
      hasCalledReady.current = false
      lastErrorRef.current = null
    }
    
    if (sandpack.status === "running" && !hasCalledReady.current) {
      hasCalledReady.current = true
      onReady()
    }
    if (sandpack.status === "timeout") {
      onError("Preview timed out")
    }
  }, [sandpack.status]) // Remove onReady/onError from deps to prevent infinite loop

  // Listen for errors in bundler
  useEffect(() => {
    const errors = sandpack.error
    if (errors && errors.message !== lastErrorRef.current) {
      lastErrorRef.current = errors.message || "Compilation error"
      onError(lastErrorRef.current)
    }
  }, [sandpack.error]) // Remove onError from deps to prevent infinite loop

  return null
}

// Inner preview component that uses Sandpack context
function SandpackPreviewInner({
  isFullscreen,
  onReady,
  onError
}: {
  isFullscreen?: boolean
  onReady: () => void
  onError: (error: string) => void
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Set iframe title for screen readers (Sandpack does not expose this prop; iframe may mount async)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const setTitle = () => {
      const iframe = el.querySelector("iframe")
      if (iframe) iframe.setAttribute("title", "Live preview")
    }
    setTitle()
    const t = setTimeout(setTitle, 500)
    const observer = new MutationObserver(setTitle)
    observer.observe(el, { childList: true, subtree: true })
    return () => {
      clearTimeout(t)
      observer.disconnect()
    }
  }, [isFullscreen])

  return (
    <div ref={containerRef} className="h-full w-full">
      <SandpackStatusListener onReady={onReady} onError={onError} />
      <SandpackPreview
        showNavigator={false}
        showRefreshButton={false}
        showOpenInCodeSandbox={false}
        style={{
          height: "100%",
          minHeight: isFullscreen ? "100%" : 600,
          width: "100%"
        }}
      />
    </div>
  )
}

const SAFE_STARTER_PAGE = `import React from "react"

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-8">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">Safe starter page</h1>
        <p className="text-slate-300">
          The previous code had errors. Use this starter or regenerate from the chat.
        </p>
      </div>
    </main>
  )
}
`

export function LivePreviewV2({ 
  code, 
  viewport, 
  isFullscreen, 
  files: additionalFiles,
  reason,
  previewError,
  onFixError,
  onErrorDetected,
  onUseSafeStarter,
  onMakeItPop,
}: LivePreviewV2Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [key, setKey] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const MAX_RETRIES = 3
  const TIMEOUT_MS = 5000 // 5 seconds timeout

  // Build Sandpack files
  const sandpackFiles = useMemo(() => {
    try {
      const files = buildSandpackFiles(code)
      // Merge additional files if provided (e.g. /components/ProjectCard.tsx) so multi-file projects resolve
      if (additionalFiles) {
        Object.entries(additionalFiles).forEach(([path, content]) => {
          const isCode = /\.(tsx?|jsx?)$/i.test(path)
          files[path] = isCode ? cleanCodeForSandpack(content) : content
        })
      }
      return files
    } catch (e) {
      setError("Failed to process code")
      return {}
    }
  }, [code, additionalFiles])

  // Reset loading when code changes
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setRetryCount(0)
  }, [code])

  // Auto-refresh timeout - if preview doesn't load in 5 seconds, auto-retry
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Only set timeout if we're loading and have valid code
    if (isLoading && code && code.trim().length > 0) {
      timeoutRef.current = setTimeout(() => {
        if (isLoading && retryCount < MAX_RETRIES) {
          console.log(`[LivePreview] Auto-refresh attempt ${retryCount + 1}/${MAX_RETRIES}`)
          setRetryCount(prev => prev + 1)
          setKey(prev => prev + 1)
          toast.info(`Preview loading slow, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
        } else if (retryCount >= MAX_RETRIES) {
          setError("Preview failed to load after multiple attempts. Click refresh to try again.")
          setIsLoading(false)
        }
      }, TIMEOUT_MS)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading, key, retryCount, code])

  const handleReady = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    let displayMessage = errorMessage

    // Sandpack/Babel sometimes throws a meta-error around a real SyntaxError.
    // Make this readable by surfacing only the underlying syntax problem.
    if (errorMessage.includes("Cannot assign to read only property 'message'")) {
      const syntaxPart = errorMessage.match(/SyntaxError:[\s\S]*/)
      displayMessage =
        syntaxPart?.[0] ||
        "Preview failed due to invalid JSX. Check for unclosed tags, stray '>' characters, or incomplete comments, then try again."
    }

    setError(displayMessage)
    setIsLoading(false)
    onErrorDetected?.(errorMessage)
  }, [onErrorDetected])

  const handleRefresh = useCallback(() => {
    setKey(prev => prev + 1)
    setIsLoading(true)
    setError(null)
    setRetryCount(0) // Reset retry count on manual refresh
    toast.success("Preview refreshed")
  }, [])

  const handleOpenExternal = useCallback(() => {
    // Create a blob URL with the preview HTML for external viewing
    const cleanCode = cleanCodeForSandpack(code).replace(/export\s+default\s+/, 'const App = ')
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Inter', sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    ${cleanCode}
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  <\/script>
</body>
</html>`
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    window.open(url, "_blank")
  }, [code])

  const hasValidCode = code && isValidReactCode(code)
  // Don't treat HTML (e.g. error pages) as a displayable reason/error
  const isHtml = (s: string) => s.trimStart().startsWith("<!") || s.trimStart().toLowerCase().startsWith("<html")
  const safePreviewError = previewError && !isHtml(previewError) ? previewError : (previewError && isHtml(previewError) ? "The server returned an error page. Check the network tab or try again." : previewError)
  const showApiError = safePreviewError != null && String(safePreviewError).trim() !== ""

  return (
    <div className="flex h-full flex-col bg-[#f5f5f5] dark:bg-[#1a1a1a]">
      {/* AI/API error — show current reason as error instead of website */}
      {showApiError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive shrink-0" aria-hidden />
          <div>
            <h3 className="font-semibold text-destructive mb-1">AI / API Error</h3>
            <p id="preview-api-error-message" className="text-sm text-muted-foreground max-w-md whitespace-pre-wrap">
              {safePreviewError.length > 600 ? safePreviewError.slice(0, 600) + "…" : safePreviewError}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Fix the issue (e.g. set BITNET_BASE_URL to your Colab URL, check rate limits) and try again.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {onUseSafeStarter && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onUseSafeStarter}
                aria-describedby={safePreviewError.length > 200 ? "preview-api-error-message" : undefined}
              >
                Use safe starter page
              </Button>
            )}
            {onFixError && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onFixError(safePreviewError)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                aria-describedby={safePreviewError.length > 200 ? "preview-api-error-message" : undefined}
              >
                <Wrench className="h-4 w-4 mr-1" />
                Fix Error
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
      {/* Reason banner — info only when no previewError; never show HTML */}
      {reason && reason.trim() && !reason.trimStart().startsWith("<!") && !reason.trimStart().toLowerCase().startsWith("<html") && (
        <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left">
          <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200 flex-1 min-w-0">
            <span className="font-medium">Reason: </span>
            {reason.length > 400 ? reason.slice(0, 400) + "…" : reason}
          </p>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {viewport} - {VIEWPORT_WIDTHS[viewport]}px
          </Badge>
          {isLoading && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </div>
          )}
          {!isLoading && !error && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Ready
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              Error
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onMakeItPop && code.trim().length > 100 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs text-violet-600 border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-500"
              onClick={onMakeItPop}
            >
              <Sparkles className="h-3 w-3" />
              Make it pop
            </Button>
          )}
          <Button
            variant={isEditMode ? "secondary" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <MousePointer2 className="h-3 w-3" />
            Edit Mode
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleOpenExternal}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        <div
          className={cn(
            "relative bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300",
            isFullscreen ? "w-full h-full" : ""
          )}
          style={{
            width: isFullscreen ? "100%" : VIEWPORT_WIDTHS[viewport],
            height: isFullscreen ? "100%" : "auto",
            minHeight: isFullscreen ? "100%" : 600,
            maxHeight: isFullscreen ? "100%" : "calc(100vh - 200px)"
          }}
        >
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading preview...</span>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-destructive/10 p-8">
              <div className="flex flex-col items-center gap-2 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <span className="font-medium text-destructive">Preview Error</span>
                <span className="text-sm text-muted-foreground max-w-md">{error}</span>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                  {onUseSafeStarter && (
                    <Button variant="secondary" size="sm" onClick={onUseSafeStarter}>
                      Use safe starter page
                    </Button>
                  )}
                  {onFixError && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => onFixError(error)}
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    >
                      <Wrench className="h-4 w-4 mr-1" />
                      Fix Error
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sandpack Preview */}
          {hasValidCode ? (
            <SandpackProvider
              key={key}
              template="react-ts"
              theme={nairiTheme}
              files={sandpackFiles}
              customSetup={{
                dependencies: {
                  "lucide-react": "latest"
                }
              }}
              options={{
                externalResources: [
                  "https://cdn.tailwindcss.com",
                  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Syne:wght@400;600;700&family=Outfit:wght@400;500;600;700&display=swap"
                ],
                classes: {
                  "sp-wrapper": "!h-full",
                  "sp-layout": "!h-full !border-0",
                  "sp-preview": "!h-full",
                  "sp-preview-container": "!h-full"
                }
              }}
            >
              <SandpackLayout style={{ height: "100%", border: "none" }}>
                <SandpackPreviewInner
                  isFullscreen={isFullscreen}
                  onReady={handleReady}
                  onError={handleError}
                />
              </SandpackLayout>
            </SandpackProvider>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50">
              <div className="text-center p-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Nairi Builder</h2>
                <p className="text-gray-500">Enter a prompt to generate your website</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
    )}
    </div>
  )
}
