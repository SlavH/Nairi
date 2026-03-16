# E2E Run Notes (Full Audit 2026-02-15)

## Status

E2E was **not executed** in this audit run.

## Reason

Playwright browser executables were not installed. Error observed:

```
Error: browserType.launch: Executable doesn't exist at
C:\Users\User\AppData\Local\ms-playwright\chromium_headless_shell-1208\chrome-headless-shell-win64\chrome-headless-shell.exe
```

Playwright recommends: `npx playwright install`

## Commands to Run E2E

1. Install browsers: `npx playwright install`
2. Start app (or rely on playwright webServer): `npm run dev` (baseURL http://localhost:3000)
3. Run E2E: `npm run test:e2e`

## E2E Specs in Project

- e2e/auth.spec.ts
- e2e/builder.spec.ts
- e2e/chat-flow.spec.ts (includes type + send test)
- e2e/health-api.spec.ts (expects /api/v1/health; verify route)
- e2e/home.spec.ts (Explore Marketplace, Docs link)
- e2e/learn.spec.ts
- e2e/marketplace.spec.ts
- e2e/presentations.spec.ts
- e2e/workspace.spec.ts

## Health API Note

health-api.spec.ts asserts `GET /api/v1/health` returns 200 and `{ status: "healthy", version: "v1" }`. If the application exposes `GET /api/health` with a different shape, update the spec or the route so E2E passes.

## After Running E2E

- Record pass/fail per spec in executive summary or a short E2E_results.md.
- For any failure, add reproduction steps and consider opening an issue in critical_issues/ or major_issues/ if it indicates a regression.
