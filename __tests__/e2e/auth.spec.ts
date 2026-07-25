import { test, expect } from "./fixtures"

test.describe("Auth (logged out)", () => {
  test("sign-up page renders form", async ({ page }) => {
    await page.goto("/auth/sign-up", { waitUntil: "domcontentloaded" })
    await expect(page.locator("form")).toBeVisible()
    // hCaptcha only renders with NEXT_PUBLIC_HCAPTCHA_SITE_KEY set (hidden in headless)
  })

  test("login page renders and accepts credentials", async ({ page }) => {
    await page.goto("/auth/login", { waitUntil: "domcontentloaded" })
    await expect(page.locator("input[type='email']")).toBeVisible()
    await expect(page.locator("input[type='password']")).toBeVisible()
  })
})
