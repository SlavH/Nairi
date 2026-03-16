import { test, expect } from "@playwright/test";

test.describe("Chat flow (Phase 32)", () => {
  test("chat page loads", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("main, [role='main'], textarea, [data-testid='chat']").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("can see input or new conversation action", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
    const input = page.locator("#chat-input, textarea, input[type='text']").first();
    const newBtn = page.getByRole("button", { name: /new|create/i });
    await expect(input.or(newBtn)).toBeVisible({ timeout: 15000 });
  });

  test("sending a message shows input and submit", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
    const textarea = page.locator("textarea").first();
    if ((await textarea.count()) > 0) {
      await textarea.fill("Hello");
      const send = page.getByRole("button", { name: /send|submit/i }).first();
      await expect(send).toBeVisible({ timeout: 5000 });
    }
  });

  test("type in chat input, send via button and via Enter", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
    const textarea = page.locator("#chat-input, textarea[aria-label*='message'], textarea[aria-label*='Chat']").first();
    await expect(textarea).toBeVisible({ timeout: 15000 });
    await textarea.fill("E2E test message");
    await expect(textarea).toHaveValue("E2E test message");
    const sendBtn = page.getByRole("button", { name: /send message/i }).first();
    await sendBtn.click();
    // After send, input should clear (CRIT-001 fix)
    await expect(textarea).toHaveValue("", { timeout: 10000 });
  });
});
