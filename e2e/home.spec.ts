import { test, expect } from "@playwright/test"

test.describe("Home page", () => {
  test("loads and shows Nairi branding", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Nairi|nairi|Reality Executor/i)
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15000 })
  })

  test("has navigation or main content", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("#main-content, main, [role='main']").first()).toBeVisible({ timeout: 15000 })
  })

  test("Explore Marketplace link navigates to /marketplace", async ({ page }) => {
    await page.goto("/")
    const link = page.getByTestId("explore-marketplace-link").or(page.getByRole("link", { name: /explore marketplace/i })).first()
    await expect(link).toBeVisible({ timeout: 10000 })
    await link.click()
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 5000 })
  })

  test("Docs link navigates to /docs", async ({ page }) => {
    await page.goto("/")
    const link = page.getByTestId("docs-nav-link").or(page.getByTestId("docs-nav-link-mobile")).or(page.getByRole("link", { name: "Docs" })).first()
    await expect(link).toBeVisible({ timeout: 10000 })
    await link.click()
    await expect(page).toHaveURL(/\/docs/, { timeout: 5000 })
  })
})
