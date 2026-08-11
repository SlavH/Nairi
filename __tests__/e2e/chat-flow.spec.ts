/**
 * Chat Flow E2E Tests (Phase 63)
 */
import { test, expect } from "./fixtures";

test.describe("Chat Flow", () => {
  test("should start a conversation", async ({ page }) => {
    await page.goto("/chat", { waitUntil: "domcontentloaded" });
    if (page.url().includes("/auth/login")) {
      test.skip()
      return
    }
    await page.waitForTimeout(2000);
    const textarea = page.locator("textarea")
    await expect(textarea).toBeVisible({ timeout: 15000 });
    await textarea.fill("Hello, AI!");
    await page.getByRole("button", { name: /send/i }).first().click();
    // Verify message was sent (textarea cleared or user message appears)
    await expect(textarea).toBeEmpty({ timeout: 10000 });
  });
});
