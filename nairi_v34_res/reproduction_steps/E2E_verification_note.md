# E2E Verification Note

## Prerequisites

1. **Playwright browsers**. If tests fail with "Executable doesn't exist", run:

   ```bash
   npx playwright install chromium
   ```

2. **Chat tests** (chat-flow.spec.ts). For /chat to load without redirect to login, set `BYPASS_AUTH=true` in `.env` when running E2E (or use an authenticated session). See [lib/auth.ts](../../lib/auth.ts).

## Tests Covering Plan Verification

- **Chat type + send**: `e2e/chat-flow.spec.ts` – "type in chat input, send via button and via Enter" (uses `#chat-input` textarea and "Send message" button).
- **Explore Marketplace**: `e2e/home.spec.ts` – "Explore Marketplace link navigates to /marketplace".
- **Docs link**: `e2e/home.spec.ts` – "Docs link navigates to /docs".

## Running Verification

From project root:

```bash
npx playwright test e2e/home.spec.ts e2e/chat-flow.spec.ts
```

Optional manual verification: follow [CRIT-001_reproduction.md](CRIT-001_reproduction.md) to confirm chat input behavior after CRIT-001 fix.
