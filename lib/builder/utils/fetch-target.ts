/**
 * SSRF Guard - Validates fetch targets to prevent Server-Side Request Forgery
 * 
 * Rules:
 * - Only HTTPS allowed (http:// rejected)
 * - Blocks private IP ranges (RFC1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
 * - Blocks loopback: 127.0.0.0/8, ::1/128
 * - Blocks link-local: 169.254.0.0/16, fe80::/10
 * - Blocks metadata: 169.254.169.254
 * - Blocks localhost hostname
 */

export function validateFetchTarget(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error("Invalid URL")
  }

  // Only allow HTTPS
  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed")
  }

  const hostname = parsed.hostname

  // Block localhost hostname
  if (hostname === "localhost" || hostname === "localhost.localdomain") {
    throw new Error("Localhost URLs are not allowed")
  }

  // Check if hostname is an IP address
  if (isIpAddress(hostname)) {
    const ip = hostname.replace(/^\[|\]$/g, "") // Remove IPv6 brackets
    
    if (isPrivateOrReservedIp(ip)) {
      throw new Error("Private/reserved IP addresses are not allowed")
    }
  }
}

/**
 * Check if a string is an IP address (IPv4 or IPv6)
 */
function isIpAddress(hostname: string): boolean {
  // IPv4 pattern
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(hostname)) {
    const parts = hostname.split(".")
    return parts.every(part => parseInt(part, 10) <= 255)
  }

  // IPv6 pattern (simplified - in brackets or not)
  const ipv6Regex = /^\[?([0-9a-fA-F:]+)\]?$/
  if (ipv6Regex.test(hostname)) {
    const ip = hostname.replace(/^\[|\]$/g, "")
    return ip.includes(":") && ip.split(":").length >= 3
  }

  return false
}

/**
 * Check if an IP address is private, reserved, loopback, link-local, or metadata
 */
function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4 checks
  if (ip.includes(".")) {
    const parts = ip.split(".").map(p => parseInt(p, 10))
    
    // 127.0.0.0/8 - Loopback
    if (parts[0] === 127) return true
    
    // 10.0.0.0/8 - RFC1918 Private
    if (parts[0] === 10) return true
    
    // 172.16.0.0/12 - RFC1918 Private (172.16.0.0 - 172.31.255.255)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    
    // 192.168.0.0/16 - RFC1918 Private
    if (parts[0] === 192 && parts[1] === 168) return true
    
    // 169.254.0.0/16 - Link-local (includes metadata 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true
    
    // 0.0.0.0/8 - Current network
    if (parts[0] === 0) return true
    
    // 224.0.0.0/4 - Multicast
    if (parts[0] >= 224 && parts[0] <= 239) return true
    
    // 240.0.0.0/4 - Reserved
    if (parts[0] >= 240) return true
    
    // 255.255.255.255 - Broadcast
    if (ip === "255.255.255.255") return true
    
    return false
  }

  // IPv6 checks
  if (ip.includes(":")) {
    const lowerIp = ip.toLowerCase()
    
    // ::1/128 - Loopback
    if (lowerIp === "::1" || lowerIp === "0:0:0:0:0:0:0:1") return true
    
    // ::/128 - Unspecified
    if (lowerIp === "::" || lowerIp === "0:0:0:0:0:0:0:0") return true
    
    // fe80::/10 - Link-local
    if (lowerIp.startsWith("fe80:") || lowerIp.startsWith("fe90:") || 
        lowerIp.startsWith("fea0:") || lowerIp.startsWith("feb0:")) return true
    
    // fc00::/7 - Unique local (RFC4193)
    if (lowerIp.startsWith("fc") || lowerIp.startsWith("fd")) return true
    
    // ff00::/8 - Multicast
    if (lowerIp.startsWith("ff")) return true
    
    // 2001:db8::/32 - Documentation
    if (lowerIp.startsWith("2001:db8:")) return true
    
    // ::ffff:0:0/96 - IPv4-mapped (check embedded IPv4)
    if (lowerIp.startsWith("::ffff:")) {
      const embeddedIpv4 = lowerIp.replace("::ffff:", "")
      if (isPrivateOrReservedIp(embeddedIpv4)) return true
    }
    
    return false
  }

  return false
}

/**
 * Fetch with SSRF protection, timeout, and size limit
 */
export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Validate the target URL first
  validateFetchTarget(url)

  // 10 second timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Don't follow redirects automatically to prevent redirect-based SSRF
      redirect: "manual",
    })

    // Check for redirect to internal addresses
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (location) {
        try {
          validateFetchTarget(location)
        } catch {
          throw new Error("Redirect to disallowed URL")
        }
      }
    }

    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Fetch text with SSRF protection, timeout, and 1MB size limit
 */
export async function safeFetchText(url: string, options: RequestInit = {}): Promise<string | null> {
  const response = await safeFetch(url, options)
  
  if (!response.ok) {
    return null
  }

  // 1MB response cap
  const maxSize = 1_048_576 // 1MB
  const contentLength = response.headers.get("content-length")
  
  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    throw new Error("Response too large")
  }

  // Read with size limit
  const reader = response.body?.getReader()
  if (!reader) {
    return await response.text()
  }

  let receivedSize = 0
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    receivedSize += value.length
    if (receivedSize > maxSize) {
      throw new Error("Response too large")
    }
    
    chunks.push(value)
  }

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(totalSize)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return new TextDecoder().decode(result)
}