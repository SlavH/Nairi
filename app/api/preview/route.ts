import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 })
    }
    
    // Clean the code for preview
    let cleanCode = code
      // Replace ALL Unicode arrow variants with ASCII arrow (=>)
      .replace(/⇒/g, "=>")
      .replace(/→/g, "=>")
      .replace(/➔/g, "=>")
      .replace(/➜/g, "=>")
      .replace(/➝/g, "=>")
      .replace(/⟹/g, "=>")
      .replace(/\u21D2/g, "=>")
      .replace(/\u2192/g, "=>")
      // Remove directives
      .replace(/"use client"\s*/g, "")
      .replace(/'use client'\s*/g, "")
      .replace(/"use server"\s*/g, "")
      .replace(/'use server'\s*/g, "")
      // Remove all import statements
      .replace(/import\s+.*?from\s+["'].*?["'];?\s*/g, "")
      .replace(/import\s+{[^}]*}\s+from\s+["'].*?["'];?\s*/g, "")
      .replace(/import\s+["'].*?["'];?\s*/g, "")
      // Remove export type statements
      .replace(/export\s+type\s+.*?;/g, "")
      .trim()
    
    // Rename the component to App
    cleanCode = cleanCode.replace(
      /export\s+default\s+function\s+(\w+)\s*\(/,
      "function App("
    )
    cleanCode = cleanCode.replace(
      /export\s+default\s+(\w+)\s*;?\s*$/,
      "const App = $1;"
    )
    
    // Handle arrow function components
    const arrowMatch = cleanCode.match(/const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/)
    if (arrowMatch && !cleanCode.includes("function App") && !cleanCode.includes("const App =")) {
      const componentName = arrowMatch[1]
      cleanCode = cleanCode.replace(
        new RegExp(`const\\s+${componentName}\\s*=`),
        "const App ="
      )
      cleanCode = cleanCode.replace(new RegExp(`export\\s+default\\s+${componentName}\\s*;?`), "")
    }
    
    // Remove leftover export statements
    cleanCode = cleanCode.replace(/export\s+{\s*\w+\s*(as\s+default)?\s*}\s*;?/g, "")
    cleanCode = cleanCode.replace(/export\s+default\s*;?/g, "")
    
    // Strip TypeScript type annotations
    cleanCode = cleanCode.replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
    cleanCode = cleanCode.replace(/type\s+\w+\s*=\s*\{[\s\S]*?\}/g, '')
    cleanCode = cleanCode.replace(/type\s+\w+\s*=\s*[^;\n]+;?/g, '')
    cleanCode = cleanCode.replace(/\}\s*:\s*\{[\s\S]*?\}\s*\)/g, '})')
    cleanCode = cleanCode.replace(/:\s*(string|number|boolean|any|void|null|undefined|React\.\w+|[A-Z]\w*)(\[\])?\s*=/g, ' =')
    cleanCode = cleanCode.replace(/\)\s*:\s*[A-Za-z][\w<>\[\]|&\s]*\s*\{/g, ') {')
    cleanCode = cleanCode.replace(/\)\s*:\s*[A-Za-z][\w<>\[\]|&\s]*\s*=>/g, ') =>')
    cleanCode = cleanCode.replace(/\(([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[^)]+\)/g, '($1)')
    cleanCode = cleanCode.replace(/<[A-Z][\w\s,<>]*>/g, '')
    cleanCode = cleanCode.replace(/:\s*React\.(FC|FunctionComponent|ComponentType)[<>\w\s,]*/g, '')
    
    // Replace React.useState etc with just the hook name
    cleanCode = cleanCode.replace(/React\.(useState|useEffect|useCallback|useMemo|useRef|useReducer|useContext|createContext)/g, '$1')
    
    // Expose App to window
    if (cleanCode.includes('function App') || cleanCode.includes('const App')) {
      cleanCode += '\n\nwindow.App = App;'
    }
    
    // Escape the code for embedding in HTML
    const escapedCode = cleanCode
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$')
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; }
    .error-display { padding: 20px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; margin: 20px; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useCallback, useMemo, useRef, useReducer, createContext, useContext, Fragment } = React;
    const cn = (...classes) => classes.filter(Boolean).join(' ');
    
    try {
      ${escapedCode}
      
      const rootElement = document.getElementById('root');
      const root = ReactDOM.createRoot(rootElement);
      
      if (typeof window.App === 'function') {
        root.render(React.createElement(window.App));
      } else if (typeof App === 'function') {
        root.render(React.createElement(App));
      } else {
        throw new Error('No App component found');
      }
    } catch (error) {
      document.getElementById('root').innerHTML = '<div class="error-display"><strong>Preview Error:</strong>\\n\\n' + error.message + '</div>';
      console.error('Preview Error:', error);
    }
  </script>
</body>
</html>`
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Preview API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
