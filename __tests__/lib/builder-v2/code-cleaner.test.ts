import { describe, it, expect } from "vitest"
import { autoFixCommonErrors, validateTypeScriptCode } from "@/lib/builder-v2/generators/code-cleaner"

describe("code-cleaner autoFixCommonErrors", () => {
  it("fixes duplicate declaration (import vs local) by renaming local to XComponent", () => {
    const code = `
import { Button } from "lucide-react"
function Button() { return <div>Click</div> }
export default Button
`
    const { errors } = validateTypeScriptCode(code)
    expect(errors.some((e) => e.includes("Duplicate declaration") && e.includes("imported and declared"))).toBe(true)
    const fixed = autoFixCommonErrors(code, errors)
    expect(fixed).toContain("function ButtonComponent(")
    expect(fixed).toContain("export default ButtonComponent")
    expect(fixed).toContain('import { Button } from "lucide-react"')
    const after = validateTypeScriptCode(fixed)
    expect(after.errors.filter((e) => e.includes("Duplicate declaration"))).toHaveLength(0)
  })

  it("fixes missing default export for top-level function", () => {
    const code = `
function Page() {
  return <div>Hello</div>
}
`
    const { errors } = validateTypeScriptCode(code)
    expect(errors.some((e) => e.includes("Missing default export"))).toBe(true)
    const fixed = autoFixCommonErrors(code, errors)
    expect(fixed).toContain("export default function Page")
    const after = validateTypeScriptCode(fixed)
    expect(after.errors.some((e) => e.includes("Missing default export"))).toBe(false)
  })

  it("fixes missing default export for const arrow component", () => {
    const code = `
const Page = () => {
  return <div>Hello</div>
}
`
    const { errors } = validateTypeScriptCode(code)
    expect(errors.some((e) => e.includes("Missing default export"))).toBe(true)
    const fixed = autoFixCommonErrors(code, errors)
    expect(fixed).toContain("export default Page")
    const after = validateTypeScriptCode(fixed)
    expect(after.errors.some((e) => e.includes("Missing default export"))).toBe(false)
  })

  it("fixes Malformed className template literal", () => {
    const code = `export default function P() { return <div className="{\`a"\s+b\`}">x</div> }`
    const { errors } = validateTypeScriptCode(code)
    const fixed = autoFixCommonErrors(code, errors.filter((e) => e.includes("className")))
    expect(fixed).toMatch(/className=\{\`[^`]*\`\}/)
  })

  it("fixes Unicode arrow in code", () => {
    const code = `export default function P() { const f = () ⇒ 1; return <div /> }`
    const { errors } = validateTypeScriptCode(code)
    expect(errors.some((e) => e.includes("Unicode arrow"))).toBe(true)
    const fixed = autoFixCommonErrors(code, errors)
    expect(fixed).toContain("=>")
    expect(fixed).not.toContain("⇒")
  })
})
