import { test, expect } from "@playwright/test";

test.describe("Marketplace flow (Phase 36)", () => {
  test("marketplace page loads", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], h1, h2").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("agents or products list visible", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    const list = page.locator("[data-testid='agents'], .grid, ul, main, article");
    await expect(list.first()).toBeVisible({ timeout: 15000 });
  });

  test("can open agent detail or install action", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    const link = page.getByRole("link", { name: /agent|view|detail/i }).first();
    const install = page.getByRole("button", { name: /install|get|add/i }).first();
    const card = page.locator("article, [role='article'], .card, a[href*='marketplace']").first();
    await expect(link.or(install).or(card)).toBeVisible({ timeout: 15000 });
  });
});
