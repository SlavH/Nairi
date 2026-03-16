/**
 * JSON normalizers for builder generate API: fix common LLM output (backticks, control chars, trailing commas, unescaped quotes).
 * Used by app/api/builder/generate/route.ts. Tests in __tests__/lib/builder-v2/json-normalizers.test.ts.
 */

export function normalizeJsonBacktickStrings(str: string): string {
  const result: string[] = []
  let i = 0
  while (i < str.length) {
    const rest = str.slice(i)
    const keyMatch = rest.match(/^(\s*"[^"]+"\s*:\s*)`/)
    if (keyMatch) {
      result.push(keyMatch[1])
      i += keyMatch[0].length
      let content = ""
      while (i < str.length) {
        if (str[i] === "\\" && str[i + 1] === "`") {
          content += "`"
          i += 2
          continue
        }
        if (str[i] === "`") {
          i++
          break
        }
        content += str[i]
        i++
      }
      const escaped = content
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t")
      result.push('"', escaped, '"')
      continue
    }
    result.push(str[i])
    i++
  }
  return result.join("")
}

export function escapeControlCharsInJsonStrings(str: string): string {
  const result: string[] = []
  let inString = false
  let i = 0
  while (i < str.length) {
    const c = str[i]
    if (!inString) {
      result.push(c)
      if (c === '"') inString = true
      i++
      continue
    }
    if (c === "\\") {
      result.push(c, str[i + 1] ?? "")
      i += 2
      continue
    }
    if (c === '"') {
      inString = false
      result.push(c)
      i++
      continue
    }
    if (c === "\n") {
      result.push("\\", "n")
      i++
      continue
    }
    if (c === "\r") {
      result.push("\\", "r")
      i++
      continue
    }
    if (c === "\t") {
      result.push("\\", "t")
      i++
      continue
    }
    result.push(c)
    i++
  }
  return result.join("")
}

export function escapeUnescapedQuotesInJsonStrings(str: string): string {
  const result: string[] = []
  let inString = false
  let i = 0
  while (i < str.length) {
    const c = str[i]
    if (!inString) {
      result.push(c)
      if (c === '"') inString = true
      i++
      continue
    }
    if (c === "\\") {
      result.push(c, str[i + 1] ?? "")
      i += 2
      continue
    }
    if (c === '"') {
      let j = i + 1
      while (j < str.length && /[\s\n\r\t]/.test(str[j])) j++
      const next = str[j]
      if (next === '"' || next === ":" || next === "," || next === "}" || next === "]" || next === undefined) {
        inString = false
        result.push(c)
        i++
        continue
      }
      result.push("\\", '"')
      i++
      continue
    }
    result.push(c)
    i++
  }
  return result.join("")
}

export function removeTrailingCommasInJson(str: string): string {
  const result: string[] = []
  let i = 0
  let inString = false
  while (i < str.length) {
    const c = str[i]
    if (inString) {
      if (c === "\\") {
        result.push(c, str[i + 1] ?? "")
        i += 2
        continue
      }
      if (c === '"') {
        inString = false
        result.push(c)
        i++
        continue
      }
      result.push(c)
      i++
      continue
    }
    if (c === '"') {
      inString = true
      result.push(c)
      i++
      continue
    }
    if (c === ",") {
      let j = i + 1
      while (j < str.length && /[\s\n\r\t]/.test(str[j])) j++
      if (j < str.length && (str[j] === "]" || str[j] === "}")) {
        i = j
        continue
      }
    }
    result.push(c)
    i++
  }
  return result.join("")
}

export function extractJsonWithBalancedBraces(str: string): string | null {
  const start = str.indexOf("{")
  if (start === -1) return null
  let depth = 0
  let inDouble = false
  let i = start
  while (i < str.length) {
    const c = str[i]
    if (inDouble) {
      if (c === "\\") {
        i += 2
        continue
      }
      if (c === '"') {
        inDouble = false
        i++
        continue
      }
      i++
      continue
    }
    if (c === '"') {
      inDouble = true
      i++
      continue
    }
    if (c === "{") {
      depth++
      i++
      continue
    }
    if (c === "}") {
      depth--
      if (depth === 0) return str.slice(start, i + 1)
      i++
      continue
    }
    i++
  }
  return null
}

/**
 * Attempt to repair truncated JSON by closing open brackets and braces.
 * Does not modify the string if it already parses. Returns repaired string for parsing;
 * if parse still fails, caller should not overwrite original so other extraction steps can run.
 */
export function repairTruncatedJson(str: string): string {
  const trimmed = str.trim()
  if (!trimmed) return trimmed
  let openBraces = 0
  let openBrackets = 0
  let inString = false
  let escape = false
  let quote = ""
  let i = 0
  while (i < trimmed.length) {
    const c = trimmed[i]
    if (escape) {
      escape = false
      i++
      continue
    }
    if (inString) {
      if (c === quote) inString = false
      else if (c === "\\") escape = true
      i++
      continue
    }
    if (c === '"' || c === "'") {
      inString = true
      quote = c
      i++
      continue
    }
    if (c === "{") openBraces++
    else if (c === "}") openBraces--
    else if (c === "[") openBrackets++
    else if (c === "]") openBrackets--
    i++
  }
  let suffix = ""
  while (openBrackets > 0) {
    suffix += "]"
    openBrackets--
  }
  while (openBraces > 0) {
    suffix += "}"
    openBraces--
  }
  return trimmed + suffix
}

const normalizerPipeline = (s: string) =>
  removeTrailingCommasInJson(
    escapeUnescapedQuotesInJsonStrings(escapeControlCharsInJsonStrings(normalizeJsonBacktickStrings(s)))
  )

export interface ParsedBuilderResponse {
  plan?: string[]
  files?: { path: string; content: string }[]
  message?: string
}

/**
 * Normalize and parse a JSON string that may contain LLM-style quirks (backticks, control chars, trailing commas).
 * Returns parsed object or throws.
 */
export function normalizeAndParseBuilderJson(jsonStr: string): ParsedBuilderResponse {
  const trimmed = jsonStr.trim()
  let toParse = trimmed
  const jsonBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/m)
  if (jsonBlockMatch) {
    toParse = jsonBlockMatch[1].trim()
  } else {
    const balanced = extractJsonWithBalancedBraces(trimmed)
    if (balanced) toParse = balanced
  }
  const normalized = normalizerPipeline(toParse)
  return JSON.parse(normalized) as ParsedBuilderResponse
}
