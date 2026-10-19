# PROJECT_MAP.md — Nairi (github.com/SlavH/Nairi)

Обновлено: цикл 3, локальная верификация (Node 20 + Node 22).

## Стек
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Supabase (Postgres + RLS + auth), Stripe, ioredis (rate-limit)
- Vitest (unit/integration), Playwright (e2e), ESLint 9 flat config
- AI: OpenAI-совместимые бэкенды через fallback-цепочку (NAIRI_AI_BASE_URL → Groq → OpenRouter); Zen (opencode.ai) в NairiBook; WebContainers в Builder

## Точки входа
- `app/` — ~46 маршрутов страниц; `app/api/` — 100+ API routes
- `lib/nairibook/` — NairiBook pipeline (chunking → concepts → graph → embeddings → SRS)
- `scripts/` — SQL-миграции Supabase (001–025+)
- CI: `.github/workflows/ci.yml` = tsc --noEmit → next build → vitest → playwright e2e

## Документация-источники истины
- CONSTITUTION.md — принципы (тесты обязательны для каждой фичи)
- docs/AUDIT_TRIAGE.md — F1–F47: Priority 1 (F1–F10, заявлено исправлено), P2 (F11–F28), P3 (F29–F47)
- tasks.json — все задачи стримов A–I помечены done (требует выборочной верификации)
- PROGRESS.md / AUDIT_SUMMARY.md / PRODUCTION_CHECKLIST.md — заявлено: typecheck чистый, тесты зелёные

## Фактическое состояние (проверено запуском, цикл 3, не по описанию)
- ✅ `npx tsc --noEmit` — 0 ошибок (Node 20 и Node 22)
- ✅ `npm run test` — 388 passed / 2 skipped (54 файла) на Node 20 и Node 22.
  Прежние 2 FAIL из цикла 1 закрыты коммитом `3ce414f` (mock `@/lib/nairibook/zen`).
- ✅ `npm run build` — успешен (Node 20 и Node 22, `ignoreBuildErrors: false`)
- ❌ `npm run lint` — 1392 проблемы (1329 errors / 63 warnings), вне CI-гейта.
  Доминируют `no-unused-vars` (674), `no-explicit-any` (458); реальные баги —
  `rules-of-hooks` (25), `set-state-in-effect` (33), `purity` (22), `immutability` (11).
- ❌ `npm run migrate:validate` — нет rollback-скриптов для многих миграций;
  дубль номера 25 (F41).
- ⏳ e2e — не прогнан (нужны Supabase anon/service keys + тестовый пользователь).
  Обнаружен дублирующий набор специй: `e2e/` (11 файлов) не подключён,
  `playwright.config.ts` указывает `testDir: ./__tests__/e2e`.

## Известные открытые вопросы
- Статус F11–F28 (Priority 2 аудита) не подтверждён коммитами/тестами
- Критерий «100% готово» пользователем явно не определён; рабочая трактовка оркестратора:
  CI полностью зелёный (typecheck/build/test/lint) + находки аудита F1–F47 исправлены
  или документированно отложены + расхождений план/код нет.
