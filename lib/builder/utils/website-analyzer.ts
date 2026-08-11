/**
 * Website Analysis Utilities
 * Complete website crawling and analysis
 */

export interface WebsiteAnalysis {
  colors: { name: string; hex: string; usage: string }[]
  typography: { element: string; font: string; size: string; weight: string }[]
  layout: { component: string; dimensions: string; position: string }[]
  components: { name: string; structure: string; styling: string }[]
  pages: { url: string; purpose: string; elements: string[] }[]
  tailwindClasses: string
}
/**
 * Extract all internal links from HTML
 */
export function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const linkRegex = /href=["']([^"']+)["']/gi
  let match
  
  const base = new URL(baseUrl)
  
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1]
    if (href.startsWith('/') && !href.startsWith('//')) {
      href = `${base.protocol}//${base.host}${href}`
    }
    if (href.startsWith(base.origin) && !href.includes('#') && !href.match(/\.(jpg|png|gif|css|js|svg|ico)$/i)) {
      links.push(href)
    }
  }
  
  return [...new Set(links)].slice(0, 10) // Max 10 pages
}


/**
 * SSRF guard: validate that a URL is safe to fetch from the server.
 * - Allows only https:// scheme
 * - Rejects private/loopback/link-local/metadata hostnames
 */
async function validateFetchTarget(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url)
    
    // Only allow https
    if (parsed.protocol !== 'https:') {
      return false
    }
    
    // Block localhost and local network
    const hostname = parsed.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false
    }
    
    // Block private IP ranges and metadata hostnames
    const blockedPatterns = [
      /^10\./,                    // 10.0.0.0/8
      /^192\.168\./,              // 192.168.0.0/16
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^169\.254\./,              // link-local
      /^127\./,                   // loopback
      /^0\./,                     // this network
      /^::1$/,                    // IPv6 loopback
      /^fe80::/i,                 // IPv6 link-local
      /^fc00::/i,                 // IPv6 unique local
      /^fd00::/i,                 // IPv6 unique local
    ]
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return false
      }
    }
    
    // Block known metadata service hostnames
    const blockedHosts = [
      'metadata.google.internal',
      'metadata',
      '169.254.169.254',
      'instance-data',
      'metadata.azure.com',
      'metadata.aws.internal',
    ]
    
    if (blockedHosts.some(h => hostname === h || hostname.endsWith('.' + h))) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}


/**
 * Extract CSS from HTML (inline styles, style tags, and linked stylesheets)
 */
export async function extractAllCSS(html: string, baseUrl: string): Promise<string> {
  const cssContent: string[] = []
  
  // Extract inline style tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let match
  while ((match = styleRegex.exec(html)) !== null) {
    cssContent.push(match[1])
  }
  
  // Extract linked stylesheets
  const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi
  const base = new URL(baseUrl)
  
  while ((match = linkRegex.exec(html)) !== null) {
    let cssUrl = match[1]
    if (cssUrl.startsWith('/')) {
      cssUrl = `${base.protocol}//${base.host}${cssUrl}`
    } else if (!cssUrl.startsWith('http')) {
      cssUrl = `${base.origin}/${cssUrl}`
    }
    
    // SSRF guard for CSS fetch
    if (!validateFetchTarget(cssUrl)) {
      console.error(`[extractAllCSS] Blocked SSRF attempt: ${cssUrl}`)
    } else {
      try {
        const cssResponse = await fetch(cssUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5_000), // 5s timeout for CSS
        })
        if (cssResponse.ok) {
          const css = await cssResponse.text()
          cssContent.push(css.substring(0, 20000)) // Limit size
        }
      } catch (e) {
        // Skip failed CSS fetches
      }
    }
  }
  
  return cssContent.join('\n')
}


/**
 * SSRF guard: validate that a URL is safe to fetch from the server.
 * - Allows only https:// scheme
 * - Rejects private/loopback/link-local/metadata hostnames
 */
async function validateFetchTarget(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url)
    
    // Only allow https
    if (parsed.protocol !== 'https:') {
      return false
    }
    
    // Block localhost and local network
    const hostname = parsed.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false
    }
    
    // Block private IP ranges and metadata hostnames
    const blockedPatterns = [
      /^10\./,                    // 10.0.0.0/8
      /^192\.168\./,              // 192.168.0.0/16
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^169\.254\./,              // link-local
      /^127\./,                   // loopback
      /^0\./,                     // this network
      /^::1$/,                    // IPv6 loopback
      /^fe80::/i,                 // IPv6 link-local
      /^fc00::/i,                 // IPv6 unique local
      /^fd00::/i,                 // IPv6 unique local
    ]
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return false
      }
    }
    
    // Block known metadata service hostnames
    const blockedHosts = [
      'metadata.google.internal',
      'metadata',
      '169.254.169.254',
      'instance-data',
      'metadata.azure.com',
      'metadata.aws.internal',
    ]
    
    if (blockedHosts.some(h => hostname === h || hostname.endsWith('.' + h))) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}


/**
 * Extract colors from CSS
 */
export function extractColors(css: string): { hex: string; count: number }[] {
  const colorMap = new Map<string, number>()
  
  // Match hex colors
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g
  let match
  while ((match = hexRegex.exec(css)) !== null) {
    let hex = match[0].toLowerCase()
    // Normalize 3-char to 6-char
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    }
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1)
  }
  
  // Match rgb/rgba
  const rgbRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g
  while ((match = rgbRegex.exec(css)) !== null) {
    const hex = `#${parseInt(match[1]).toString(16).padStart(2, '0')}${parseInt(match[2]).toString(16).padStart(2, '0')}${parseInt(match[3]).toString(16).padStart(2, '0')}`
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1)
  }
  
  // Sort by frequency
  return Array.from(colorMap.entries())
    .map(([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}


/**
 * SSRF guard: validate that a URL is safe to fetch from the server.
 * - Allows only https:// scheme
 * - Rejects private/loopback/link-local/metadata hostnames
 */
async function validateFetchTarget(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url)
    
    // Only allow https
    if (parsed.protocol !== 'https:') {
      return false
    }
    
    // Block localhost and local network
    const hostname = parsed.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false
    }
    
    // Block private IP ranges and metadata hostnames
    const blockedPatterns = [
      /^10\./,                    // 10.0.0.0/8
      /^192\.168\./,              // 192.168.0.0/16
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^169\.254\./,              // link-local
      /^127\./,                   // loopback
      /^0\./,                     // this network
      /^::1$/,                    // IPv6 loopback
      /^fe80::/i,                 // IPv6 link-local
      /^fc00::/i,                 // IPv6 unique local
      /^fd00::/i,                 // IPv6 unique local
    ]
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return false
      }
    }
    
    // Block known metadata service hostnames
    const blockedHosts = [
      'metadata.google.internal',
      'metadata',
      '169.254.169.254',
      'instance-data',
      'metadata.azure.com',
      'metadata.aws.internal',
    ]
    
    if (blockedHosts.some(h => hostname === h || hostname.endsWith('.' + h))) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}


/**
 * Extract CSS variables (design tokens)
 */
export function extractCSSVariables(css: string): Record<string, string> {
  const variables: Record<string, string> = {}
  const varRegex = /-([\w-]+)\s*:\s*([^;]+)/g
  let match
  
  while ((match = varRegex.exec(css)) !== null) {
    variables[`--${match[1]}`] = match[2].trim()
  }
  
  return variables
}
