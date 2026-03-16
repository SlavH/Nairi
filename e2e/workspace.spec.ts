import { test, expect } from "@playwright/test";

test.describe("Workspace flow (Phase 35)", () => {
  test("workspace page loads", async ({ page }) => {
    await page.goto("/workspace");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], h1, h2").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("create or list visible", async ({ page }) => {
    await page.goto("/workspace");
    await page.waitForLoadState("networkidle");
    const create = page.getByRole("link", { name: /create/i }).or(
      page.getByRole("button", { name: /create|new/i })
    );
    const list = page.locator("[data-testid='creations'], .grid, ul, main");
    await expect(create.or(list.first())).toBeVisible({ timeout: 15000 });
  });

  test("workspace create page loads", async ({ page }) => {
    await page.goto("/workspace/create");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, form, select, [role='combobox']").first()
    ).toBeVisible({ timeout: 15000 });
  });
});
