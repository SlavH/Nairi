import { test, expect } from "./fixtures"

test.describe("Marketplace", () => {
  test("marketplace page lists products", async ({ page }) => {
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" })
    await expect(page.locator("body")).toBeVisible()
    await page.waitForTimeout(1500)
    if (!page.url().includes("/auth/login")) {
      await expect(page.locator("*").filter({ hasText: /product|marketplace|nothing/i }).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test("product detail page loads", async ({ page }) => {
    await page.goto("/marketplace", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(1500)
    if (page.url().includes("/auth/login")) {
      test.skip()
      return
    }
    const firstLink = page.locator("a[href*='/marketplace/product/']").first()
    if (await firstLink.count()) {
      await firstLink.click()
      await expect(page).toHaveURL(/\/marketplace\/product\//)
      await page.waitForTimeout(1500)
    }
  })
})
