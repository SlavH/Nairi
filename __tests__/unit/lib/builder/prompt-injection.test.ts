import { describe, it, expect } from "vitest"

import { BUILDER_OPENCODE_INSTRUCTION } from "@/lib/builder/opencode-prompt"
import { BUILDER_SYSTEM_PROMPT_V2 as BUILD_SYSTEM_PROMPT } from "@/lib/builder/prompts/system-prompt"

// F15: both builder prompts must carry injection-resistance rules in the
// highest-priority tier. Guards against accidental removal during edits.
describe("builder prompt injection resistance (F15)", () => {
  it("system prompt has a top-tier instruction-hierarchy section", () => {
    expect(BUILD_SYSTEM_PROMPT).toMatch(/INSTRUCTION HIERARCHY/)
    expect(BUILD_SYSTEM_PROMPT).toMatch(/UNTRUSTED DATA/i)
    expect(BUILD_SYSTEM_PROMPT).toMatch(/injection/i)
  })

  it("opencode instruction forbids following embedded directives", () => {
    expect(BUILDER_OPENCODE_INSTRUCTION).toMatch(/DATA, not instructions/i)
    expect(BUILDER_OPENCODE_INSTRUCTION).toMatch(/secrets\/env\/API keys/i)
  })
})
