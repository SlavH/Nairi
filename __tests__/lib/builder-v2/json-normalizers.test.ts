import { describe, it, expect } from "vitest"
import {
  normalizeJsonBacktickStrings,
  escapeControlCharsInJsonStrings,
  escapeUnescapedQuotesInJsonStrings,
  removeTrailingCommasInJson,
  extractJsonWithBalancedBraces,
  repairTruncatedJson,
  normalizeAndParseBuilderJson,
} from "@/lib/builder-v2/json-normalizers"

describe("builder generate JSON normalizers", () => {
  describe("normalizeAndParseBuilderJson", () => {
    it("parses valid JSON with plan and files", () => {
      const json = `{"plan":["Step 1"],"files":[{"path":"/app/page.tsx","content":"export default function Page() { return <div>Hi</div> }"}],"message":"Done"}`
      const parsed = normalizeAndParseBuilderJson(json)
      expect(parsed.plan).toEqual(["Step 1"])
      expect(parsed.files).toHaveLength(1)
      expect(parsed.files![0].path).toBe("/app/page.tsx")
      expect(parsed.files![0].content).toContain("export default function Page")
      expect(parsed.message).toBe("Done")
    })

    it("parses JSON wrapped in ```json block", () => {
      const block = "```json\n" + '{"files":[{"path":"/app/page.tsx","content":"x"}]}\n' + "```"
      const parsed = normalizeAndParseBuilderJson(block)
      expect(parsed.files).toHaveLength(1)
      expect(parsed.files![0].path).toBe("/app/page.tsx")
    })

    it("parses JSON with backtick-quoted content string", () => {
      const json = `{"files":[{"path":"/app/page.tsx","content":\`export default () => <div>Hello\`}]}`
      const parsed = normalizeAndParseBuilderJson(json)
      expect(parsed.files).toHaveLength(1)
      expect(parsed.files![0].content).toBe("export default () => <div>Hello")
    })

    it("parses JSON with control chars in string (newline)", () => {
      const json = '{"files":[{"path":"/app/page.tsx","content":"line1\nline2"}]}'
      const parsed = normalizeAndParseBuilderJson(json)
      expect(parsed.files).toHaveLength(1)
      expect(parsed.files![0].content).toBe("line1\nline2")
    })

    it("parses JSON with trailing comma before ]", () => {
      const json = '{"files":[{"path":"/app/page.tsx","content":"x"},]}'
      const parsed = normalizeAndParseBuilderJson(json)
      expect(parsed.files).toHaveLength(1)
      expect(parsed.files![0].path).toBe("/app/page.tsx")
    })

    it("throws on invalid/malformed JSON", () => {
      expect(() => normalizeAndParseBuilderJson("not json")).toThrow()
      expect(() => normalizeAndParseBuilderJson("{")).toThrow()
      expect(() => normalizeAndParseBuilderJson('{"files": [}')).toThrow()
    })

    it("does not crash on empty string", () => {
      expect(() => normalizeAndParseBuilderJson("")).toThrow()
    })
  })

  describe("normalizeJsonBacktickStrings", () => {
    it("converts backtick-quoted value to double-quoted", () => {
      const input = `"content": \`hello world\``
      const out = normalizeJsonBacktickStrings(input)
      expect(out).toContain('"content": "hello world"')
    })
  })

  describe("escapeControlCharsInJsonStrings", () => {
    it("escapes newline inside string", () => {
      const input = '{"x":"a\nb"}'
      const out = escapeControlCharsInJsonStrings(input)
      expect(JSON.parse(out).x).toBe("a\nb")
    })
  })

  describe("removeTrailingCommasInJson", () => {
    it("removes trailing comma before ]", () => {
      const input = '{"arr":[1,2,]}'
      const out = removeTrailingCommasInJson(input)
      expect(JSON.parse(out).arr).toEqual([1, 2])
    })
  })

  describe("extractJsonWithBalancedBraces", () => {
    it("extracts outermost object when content has nested braces", () => {
      const input = '{"files":[{"path":"/app/page.tsx","content":"const x = { a: 1 }"}]}'
      const out = extractJsonWithBalancedBraces(input)
      expect(out).toBe(input)
      const parsed = JSON.parse(out!)
      expect(parsed.files[0].content).toBe("const x = { a: 1 }")
    })
  })

  describe("repairTruncatedJson", () => {
    it("closes unclosed array and object when truncated after a value", () => {
      // Truncate after "files":[ so we have unclosed [ and {
      const truncated = '{"plan":["Step 1"],"files":['
      const repaired = repairTruncatedJson(truncated)
      expect(() => JSON.parse(repaired)).not.toThrow()
      const parsed = JSON.parse(repaired)
      expect(parsed.plan).toEqual(["Step 1"])
      expect(Array.isArray(parsed.files)).toBe(true)
      expect(parsed.files).toHaveLength(0)
    })

    it("leaves already balanced JSON unchanged in structure", () => {
      const valid = '{"a":1,"b":[2]}'
      const repaired = repairTruncatedJson(valid)
      expect(JSON.parse(repaired)).toEqual({ a: 1, b: [2] })
    })
  })
})
