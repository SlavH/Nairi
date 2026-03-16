import { test, expect } from "@playwright/test";

test.describe("Studio (smoke)", () => {
  test("studio page loads", async ({ page }) => {
    await page.goto("/studio");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], h1, .page-container").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("studio shows Nairi Studio heading or tabs", async ({ page }) => {
    await page.goto("/studio");
    await page.waitForLoadState("networkidle");
    const heading = page.getByText(/Nairi Studio/i);
    const tabs = page.locator("[role='tablist'], [role='tab'], button").filter({ hasText: /image|video|audio|slide/i });
    await expect(heading.or(tabs.first())).toBeVisible({ timeout: 15000 });
  });
});
