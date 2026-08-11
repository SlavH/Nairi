/**
 * Utility for parsing generated React/JSX code and injecting it into the visual builder
 */

export interface BuilderElement {
  id: string
  type: string
  props: Record<string, unknown>
  children?: BuilderElement[]
}

export interface ParsedCode {
  elements: BuilderElement[]
  imports: string[]
  exports: string[]
}

/**
 * Parse JSX/TSX code into builder elements
 * This is a simplified parser that handles common patterns
 */
export function parseReactToElements(code: string): ParsedCode {
  const elements: BuilderElement[] = []
  const imports: string[] = []
  const exports: string[] = []

  // Extract imports
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g
  let match
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[0])
  }

  // Extract exports
  const exportRegex = /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g
  while ((match = exportRegex.exec(code)) !== null) {
    exports.push(match[1])
  }

  // Try to extract JSX elements
  const jsxElements = extractJsxElements(code)
  elements.push(...jsxElements)

  return { elements, imports, exports }
}

/**
 * Extract JSX elements from code
 */
function extractJsxElements(code: string): BuilderElement[] {
  const elements: BuilderElement[] = []
  
  // Simple regex-based extraction for common patterns
  // This is a fallback - in production, use a proper JSX parser
  
  // Match div elements with className
  const divRegex = /<div\s+className=["']([^"']+)["'][^>]*>/g
  let match
  while ((match = divRegex.exec(code)) !== null) {
    elements.push({
      id: `el-${Date.now()}-${elements.length}`,
      type: "div",
      props: {
        className: match[1],
      },
    })
  }

  // Match h1-h6 elements
  const headingRegex = /<(h[1-6])\s+className=["']([^"']+)["'][^>]*>([^<]*)<\//g
  while ((match = headingRegex.exec(code)) !== null) {
    elements.push({
      id: `el-${Date.now()}-${elements.length}`,
      type: match[1],
      props: {
        className: match[2],
        children: match[3],
      },
    })
  }

  // Match button elements
  const buttonRegex = /<button\s+className=["']([^"']+)["'][^>]*>([^<]*)<\//g
  while ((match = buttonRegex.exec(code)) !== null) {
    elements.push({
      id: `el-${Date.now()}-${elements.length}`,
      type: "button",
      props: {
        className: match[1],
        children: match[2],
      },
    })
  }

  // Match p elements
  const pRegex = /<p\s+className=["']([^"']+)["'][^>]*>([^<]*)<\//g
  while ((match = pRegex.exec(code)) !== null) {
    elements.push({
      id: `el-${Date.now()}-${elements.length}`,
      type: "p",
      props: {
        className: match[1],
        children: match[2],
      },
    })
  }

  // Match img elements
  const imgRegex = /<img\s+src=["']([^"']+)["']\s+alt=["']([^"']+)["'][^>]*\/?>/g
  while ((match = imgRegex.exec(code)) !== null) {
    elements.push({
      id: `el-${Date.now()}-${elements.length}`,
      type: "img",
      props: {
        src: match[1],
        alt: match[2],
      },
    })
  }

  return elements
}

/**
 * Convert builder elements to JSX string
 */
export function elementsToJsx(elements: BuilderElement[]): string {
  return elements
    .map((el) => {
      const props = Object.entries(el.props)
        .filter(([key]) => key !== "children")
        .map(([key, value]) => {
          if (typeof value === "string") {
            return `${key}="${value}"`
          }
          if (typeof value === "boolean") {
            return value ? key : `${key}={false}`
          }
          return `${key}={${JSON.stringify(value)}}`
        })
        .join(" ")

      const children = el.props.children as string | undefined

      if (children) {
        return `<${el.type} ${props}>${children}</${el.type}>`
      }
      if (el.children && el.children.length > 0) {
        const childrenJsx = elementsToJsx(el.children)
        return `<${el.type} ${props}>\n${childrenJsx}\n</${el.type}>`
      }
      return `<${el.type} ${props} />`
    })
    .join("\n")
}

/**
 * Convert builder elements to React component string
 */
export function elementsToReactComponent(
  elements: BuilderElement[],
  componentName: string = "GeneratedComponent"
): string {
  const jsx = elementsToJsx(elements)
  
  return `"use client"

import React from "react"

export function ${componentName}() {
  return (
    <div className="min-h-screen">
${jsx.split("\n").map((line) => `      ${line}`).join("\n")}
    </div>
  )
}

export default ${componentName}
`
}

/**
 * Merge generated elements with existing elements
 */
export function mergeElements(
  existing: BuilderElement[],
  generated: BuilderElement[],
  position?: "before" | "after" | "replace"
): BuilderElement[] {
  if (position === "replace") {
    return generated
  }
  if (position === "before") {
    return [...generated, ...existing]
  }
  return [...existing, ...generated]
}
