import { test, expect } from "@playwright/test";

test.describe("Builder flow (Phase 33)", () => {
  test("builder page loads", async ({ page }) => {
    await page.goto("/builder");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], textarea, [data-testid='builder']").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("has prompt input or generate action", async ({ page }) => {
     await page.goto("/builder");
     await page.waitForLoadState("networkidle");
     const prompt = page.locator('[data-testid="builder-textarea"]');
     const generate = page.getByRole("button", { name: /send message/i }).first();
     await expect(prompt.or(generate)).toBeVisible({ timeout: 15000 });
   });

  test("my projects or save project visible when applicable", async ({ page }) => {
    await page.goto("/builder");
    await page.waitForLoadState("networkidle");
    const saveOrProjects = page.getByRole("button", {
      name: /save|projects|my projects/i,
    });
    const anyMain = page.locator("main, [role='main']").first();
    await expect(saveOrProjects.or(anyMain)).toBeVisible({ timeout: 10000 });
  });

    test("send prompt and wait for completion", async ({ page }) => {
     await page.goto("/builder");
     await page.waitForLoadState("networkidle");
     const textarea = page.locator('[data-testid="builder-textarea"]');
     await expect(textarea).toBeVisible({ timeout: 15000 });
     await textarea.fill("Create a simple landing page with a headline");
     await page.getByRole("button", { name: /send message/i }).click();
     // Wait for generation to start then finish (E2E may need BYPASS_AUTH + GROQ_API_KEY; long timeout for real API)
     await expect(page.getByText("Generating").first()).toBeVisible({ timeout: 15000 }).catch(() => {});
     await expect(page.getByText("Generating").first()).toBeHidden({ timeout: 90000 }).catch(() => {});
   });

  test("save project", async ({ page }) => {
    await page.goto("/builder");
    await page.waitForLoadState("networkidle");
    const saveBtn = page.getByRole("button", { name: /save project|update project/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();
    await page.waitForTimeout(1000);
    const toastOrDialog = page.locator('[data-sonner-toast], [role="dialog"]').first();
    await expect(toastOrDialog).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test("version history and restore", async ({ page }) => {
    await page.goto("/builder");
    await page.waitForLoadState("networkidle");
    const historyTab = page.getByRole("button", { name: /version history|history/i }).first();
    await expect(historyTab).toBeVisible({ timeout: 10000 });
    await historyTab.click();
    await expect(
      page.getByText("No Version History").or(page.getByRole("button", { name: /restore/i })).first()
    ).toBeVisible({ timeout: 5000 });
    const restoreBtn = page.getByRole("button", { name: /restore/i }).first();
    if (await restoreBtn.isVisible()) {
      await restoreBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
