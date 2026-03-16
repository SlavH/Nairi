# MIN-003: E2E Not Run - Playwright Browsers Not Installed

## Summary

Playwright E2E tests were not executed during the full audit because browser executables were not installed.

## Location

- **Audit run**: audit_runs/2026-02-15
- **Environment**: Audit execution environment

## Severity

**MINOR** - Stability and core-flow verification deferred; does not block remediation validation.

## Description

Running `npm run test:e2e` failed with:

```
Error: browserType.launch: Executable doesn't exist at
...\ms-playwright\chromium_headless_shell-1208\chrome-headless-shell-win64\chrome-headless-shell.exe
```

Playwright prompts: `npx playwright install`

## Expected Behavior

- E2E runs; pass/fail recorded per spec; failures mapped to issue docs.

## Actual Behavior

- E2E did not run; stability score (7/10) and conclusion do not include E2E verification.

## Impact

- **Audit impact**: Stability and core-flow coverage not automated in this run.
- **Production readiness**: Re-run E2E after `npx playwright install` to confirm no regressions.

## Reproduction Steps

1. In project root, run `npm run test:e2e`.
2. Observe browser launch error if Playwright browsers are not installed.

## Suggested Fix

1. Run `npx playwright install` to install Chromium (and optionally other browsers).
2. Re-run `npm run test:e2e` and record results.
3. Update audit run executive summary with E2E pass/fail and any new issues.

## Priority

**P2 - MEDIUM** (run before production release to verify stability).
