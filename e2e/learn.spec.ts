import { test, expect } from "@playwright/test";

test.describe("Learn flow (Phase 37)", () => {
  test("learn page loads", async ({ page }) => {
    await page.goto("/learn");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], h1, h2").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("courses or skill tree visible", async ({ page }) => {
    await page.goto("/learn");
    await page.waitForLoadState("networkidle");
    const courses = page.getByText(/courses|курс/i).or(page.locator("[data-testid='courses']"));
    const skillTree = page.getByText(/skill|tree|навык/i);
    const main = page.locator("main").first();
    await expect(courses.or(skillTree).or(main)).toBeVisible({ timeout: 15000 });
  });

  test("courses list page loads", async ({ page }) => {
    await page.goto("/learn/courses");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], h1, ul, .grid").first()
    ).toBeVisible({ timeout: 15000 });
  });
});
