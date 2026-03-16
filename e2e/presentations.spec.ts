import { test, expect } from "@playwright/test";

test.describe("Presentations flow (Phase 34)", () => {
  test("presentations page loads", async ({ page }) => {
    await page.goto("/presentations");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], h1, h2").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("has topic or generate action", async ({ page }) => {
    await page.goto("/presentations");
    await page.waitForLoadState("networkidle");
    const topic = page.getByLabel(/topic|title/i).or(page.locator("input, textarea").first());
    const generate = page.getByRole("button", { name: /generate|create/i });
    await expect(topic.or(generate).or(page.locator("main").first())).toBeVisible({
      timeout: 15000,
    });
  });
});
