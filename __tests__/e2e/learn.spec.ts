import { test, expect } from "./fixtures"

test.describe("Learn", () => {
  test("learn dashboard renders", async ({ page }) => {
    await page.goto("/learn", { waitUntil: "domcontentloaded" })
    await expect(page.locator("body")).toBeVisible()
    await page.waitForTimeout(1500)
    if (!page.url().includes("/auth/login")) {
      await expect(page.getByText(/nairi learn|courses|skill/i).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test("skill tree page renders", async ({ page }) => {
    await page.goto("/learn/skill-tree", { waitUntil: "domcontentloaded" })
    await expect(page.locator("body")).toBeVisible()
    await page.waitForTimeout(1200)
  })
})
