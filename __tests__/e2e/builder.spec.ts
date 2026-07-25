import { test, expect } from "./fixtures"

test.describe("Builder", () => {
  test("visual builder loads", async ({ page }) => {
    await page.goto("/builder/visual", { waitUntil: "domcontentloaded" })
    await expect(page.locator("body")).toBeVisible({ timeout: 60000 })
    await page.waitForTimeout(1500)
    if (page.url().includes("/auth/login")) {
      test.skip()
      return
    }
    const deployTrigger = page.getByRole("button", { name: /deploy|publish|rocket/i }).first()
    if (await deployTrigger.count()) {
      await deployTrigger.click()
      await page.waitForTimeout(800)
    }
  })
})
