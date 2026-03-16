/**
 * Chat Flow E2E Tests (Phase 63)
 */
import { test, expect } from "@playwright/test";

test.describe("Chat Flow", () => {
  test("should create a new conversation", async ({ page }) => {
    await page.goto("/chat");
    await page.click('button:has-text("New Conversation")');
    await expect(page.locator("textarea")).toBeVisible();
  });

  test("should send a message", async ({ page }) => {
    await page.goto("/chat");
    await page.fill("textarea", "Hello, AI!");
    await page.click('button:has-text("Send")');
    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 30000,
    });
  });
});
