import { test, expect } from "./fixtures"

test.describe("Workspace & Simulations (logged in)", () => {
  test("workspace page loads", async ({ page }) => {
    await page.goto("/workspace", { waitUntil: "domcontentloaded" })
    await expect(page.locator("body")).toBeVisible()
    await page.waitForTimeout(1200)
  })

  test("simulations page loads", async ({ page }) => {
    await page.goto("/simulations", { waitUntil: "domcontentloaded" })
    await expect(page.locator("body")).toBeVisible()
    await page.waitForTimeout(1200)
  })
})
