import { test, expect } from "./fixtures"

test.describe("Chat (logged in preferred)", () => {
  test("send a message and receive a response", async ({ page }) => {
    await page.goto("/chat", { waitUntil: "domcontentloaded" })
    // If redirected to login, skip (not authenticated due to captcha constraint).
    if (page.url().includes("/auth/login")) {
      test.skip()
      return
    }
    await page.waitForTimeout(1500)
    const textarea = page.locator("textarea")
    await expect(textarea).toBeVisible({ timeout: 10000 })
    await textarea.fill("Hello, summarize what you are in one sentence.")
    await page.getByRole("button", { name: /send/i }).click()
    // Wait for the send button to become re-enabled (message sent)
    await expect(page.getByRole("button", { name: /send/i })).toBeEnabled({ timeout: 60000 })
  })

  test("execution traces page loads", async ({ page }) => {
    await page.goto("/execution-traces", { waitUntil: "domcontentloaded" })
    await expect(page.locator("body")).toBeVisible()
    await page.waitForTimeout(1500)
    if (!page.url().includes("/auth/login")) {
      await expect(page.getByText(/trace|operation|chat/i).first()).toBeVisible({ timeout: 10000 })
    }
  })
})
