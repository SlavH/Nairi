import { describe, it, expect, vi } from "vitest"

// F12: shared-chat slugs must be unpredictable (Math.random removed) and the
// /share/chat/[slug] page must exist and render a transcript read-only.

describe("F12 shared chat", () => {
  it("share/chat page exists at the app route", async () => {
    const fs = await import("fs")
    expect(fs.existsSync("app/share/chat/[slug]/page.tsx")).toBe(true)
  })

  it("slug generation no longer uses Math.random", async () => {
    const fs = await import("fs")
    const source = fs.readFileSync("lib/features/chat/index.ts", "utf8")
    const createSharedLink = source.slice(
      source.indexOf("createSharedLink"),
      source.indexOf("getSharedConversation")
    )
    expect(createSharedLink).toContain("crypto.randomUUID")
    expect(createSharedLink).not.toContain("Math.random")
  })
})
