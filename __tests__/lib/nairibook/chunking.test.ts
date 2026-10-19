import { describe, it, expect } from "vitest"

import { chunkDocument } from "@/lib/nairibook/chunking"
import type { ParsedDocument } from "@/lib/nairibook/types"

function makeLongChapterDoc(): { doc: ParsedDocument; chapterText: string } {
  const sentence = (i: number) =>
    `Observation ${i}: the ball rolls down the ramp and gains speed while friction quietly subtracts energy from the system.`
  const parts: string[] = []
  for (let i = 0; i < 16; i++) parts.push(sentence(i))
  const chapterText = parts.join(" ")
  return {
    doc: {
      title: "Physics",
      format: "text",
      chapters: [{ index: 0, title: "Motion", level: 1, text: chapterText }],
    },
    chapterText,
  }
}

describe("NairiBook chunking — start/end offsets", () => {
  it("produces overlapping chunks whose offsets point at their true source position", () => {
    const { doc, chapterText } = makeLongChapterDoc()
    const chunks = chunkDocument(doc, "book-offsets")

    expect(chunks.length).toBeGreaterThanOrEqual(2)

    for (const c of chunks) {
      expect(chapterText.slice(c.start_offset, c.start_offset + c.text.length)).toBe(c.text)
      expect(c.end_offset).toBe(c.start_offset + c.text.length)
    }
  })

  it("advances start_offset for each subsequent chunk (overlap is not anchored at 0)", () => {
    const { doc, chapterText } = makeLongChapterDoc()
    const chunks = chunkDocument(doc, "book-offsets")

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    const first = chunks[0]
    const second = chunks[1]
    expect(second.start_offset).toBeGreaterThan(first.start_offset)
    expect(chapterText.indexOf(second.text)).toBe(second.start_offset)
    expect(second.text.length).toBeGreaterThan(first.text.slice(-120).length)
    expect(first.text).toContain(second.text.slice(0, 30))
  })
})
