import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

const { buildStorageObjectName } = await import("@/lib/chat/multimodal")

const userId = "00000000-0000-0000-0000-000000000001"
const ts = 1700000000000

describe("buildStorageObjectName (F30)", () => {
  it("keeps normal filenames unchanged", () => {
    expect(buildStorageObjectName(userId, "photo.jpg", ts)).toBe(
      `${userId}/${ts}.jpg`
    )
    expect(buildStorageObjectName(userId, "archive.tar.gz", ts)).toBe(
      `${userId}/${ts}.gz`
    )
    expect(buildStorageObjectName(userId, "Report.PDF", ts)).toBe(
      `${userId}/${ts}.PDF`
    )
    expect(buildStorageObjectName(userId, "Makefile", ts)).toBe(
      `${userId}/${ts}.Makefile`
    )
  })

  it("never lets a crafted filename escape the user folder", () => {
    const evilNames = [
      "../../evil",
      "../../../etc/passwd",
      "x.png/../../../evil",
      "x.png/../../other-bucket/secret",
      "img.jpg\\..\\..\\evil",
      "a.\\u0000\\u0001/../../b",
      "..",
      "/abs/path.txt",
    ]

    for (const evil of evilNames) {
      const name = buildStorageObjectName(userId, evil, ts)
      const segments = name.split("/")
      expect(segments, `crafted name: ${JSON.stringify(evil)}`).toHaveLength(2)
      expect(segments[0]).toBe(userId)
      expect(segments[1]).not.toContain("..")
      expect(segments[1]).toBe(segments[1].replace(/[\\/]|\.\./g, ""))
    }
  })

  it("produces a sanitized extension only", () => {
    const name = buildStorageObjectName(userId, "x.png/../../../etc/passwd", ts)
    const segments = name.split("/")
    expect(segments[1]).toMatch(new RegExp(`^${ts}\\.[A-Za-z0-9_-]{1,16}$`))
    expect(segments[1]).not.toMatch(/[\x00-\x1F\x7F]/)
  })
})
