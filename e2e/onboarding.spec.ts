import { test, expect } from "@playwright/test";

test.describe("Onboarding (smoke)", () => {
  test("onboarding page loads", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], h1, h2, form").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("onboarding has at least one visible CTA or step", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForLoadState("networkidle");
    const cta = page.getByRole("button").or(page.getByRole("link"));
    const heading = page.locator("h1, h2").first();
    await expect(cta.or(heading)).toBeVisible({ timeout: 15000 });
  });
});
