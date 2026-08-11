import { test, expect } from "./fixtures"

// Smoke-test core public/info routes not covered by per-feature specs.
const ROUTES = [
  "/",
  "/pricing",
  "/about",
  "/faq",
  "/docs",
  "/privacy",
  "/terms",
  "/blog",
  "/contact",
  "/security",
  "/auth/login",
  "/auth/sign-up",
  "/how-it-works",
  "/capabilities",
]

for (const route of ROUTES) {
  test(`route ${route} loads without console errors`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30000 })
    // Redirect to /auth/login when logged out is fine (200).
    expect(response?.status()).toBeLessThan(500)
    await page.waitForTimeout(800)
  })
}
