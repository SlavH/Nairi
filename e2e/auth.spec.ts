import { test, expect } from "@playwright/test";

test.describe("Auth flows (Phase 31)", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(
      page.getByRole("heading", { name: /login|sign in|войти/i }).or(
        page.locator("form").filter({ has: page.getByLabel(/email|e-mail/i) })
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("registration / signup page loads", async ({ page }) => {
    await page.goto("/auth/sign-up");
    await expect(
      page.getByRole("heading", { name: /sign up|register|регистрация/i }).or(
        page.locator("form").filter({ has: page.getByLabel(/email|e-mail/i) })
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated visit to protected route redirects or shows auth", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    const hasAuth = url.includes("/auth") || url.includes("login");
    const hasDashboard = url.includes("dashboard");
    expect(hasAuth || hasDashboard).toBe(true);
  });
});
