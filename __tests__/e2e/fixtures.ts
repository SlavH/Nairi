import { test as base, expect } from "@playwright/test"

/**
 * Shared fixtures:
 * - Collects console errors and failed/aborted network requests during each test.
 * - Fails the test if any unexpected error surfaces, so regressions are caught
 *   automatically (no manual console pasting).
 *
 * Known-benign patterns can be added to ALLOWLIST below.
 */
const ALLOWLIST = [
  // hCaptcha test-mode may emit non-fatal warnings; only hard errors fail.
  /hcaptcha/i,
  // Favicon / icon 404s that are not app-breaking (verify intentionally removed ones separately).
  /\/favicon\.ico/i,
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
]

function isAllowed(text: string): boolean {
  return ALLOWLIST.some((re) => re.test(text))
}

export const test = base.extend<{}, {}>({})

test.beforeEach(async ({ page }, testInfo) => {
  const consoleErrors: string[] = []
  const networkErrors: string[] = []

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text()
      if (!isAllowed(text)) consoleErrors.push(text)
    }
  })

  page.on("pageerror", (err) => {
    networkErrors.push(`pageerror: ${err.message}`)
  })

  page.on("requestfailed", (req) => {
    const url = req.url()
    if (isAllowed(url)) return
    // Ignore aborted navigations during normal flow.
    const failure = req.failure()?.errorText || ""
    if (/net::ERR_ABORTED|Navigation|Timeout/i.test(failure) && /favicon/i.test(url)) return
    networkErrors.push(`requestfailed: ${req.method()} ${url} -> ${failure}`)
  })

  // Attach to testInfo so afterEach can read it.
  ;(testInfo as any).__consoleErrors = consoleErrors
  ;(testInfo as any).__networkErrors = networkErrors
})

test.afterEach(async ({}, testInfo) => {
  if (testInfo.status !== "passed") return
  const consoleErrors: string[] = (testInfo as any).__consoleErrors || []
  const networkErrors: string[] = (testInfo as any).__networkErrors || []
  if (consoleErrors.length || networkErrors.length) {
    throw new Error(
      `Console/network errors detected:\n` +
        consoleErrors.map((e) => `  console.error: ${e}`).join("\n") +
        "\n" +
        networkErrors.map((e) => `  ${e}`).join("\n")
    )
  }
})

export { expect }
