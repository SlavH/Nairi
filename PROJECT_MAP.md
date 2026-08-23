# PROJECT_MAP.md — Nairi (github.com/SlavH/Nairi)

Обновлено: цикл 1, агент-Researcher.

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

## Фактическое состояние (проверено запуском, не по описанию)
- ✅ `npx tsc --noEmit` — 0 ошибок
- ❌ `npm run test` — 2 FAIL из 324: `__tests__/lib/nairibook/core.test.ts`
  - Причина: тесты "creates a DAG..." и "detects and breaks a cyclic graph" вызывают
    `buildGraph()` → `callZen()` → реальный fetch на https://opencode.ai/zen/v1 без мока.
  - Соседние тесты (exercises/problem/photo-check) мокают `@/lib/nairibook/zen` — конвенция нарушена только здесь.
- ⏳ lint, build, e2e — ещё не прогнаны в этом цикле

## Известные открытые вопросы
- Статус F11–F28 (Priority 2 аудита) не подтверждён коммитами/тестами
- Критерий «100% готово» пользователем явно не определён; рабочая трактовка оркестратора:
  CI полностью зелёный (typecheck/build/test/lint) + находки аудита F1–F47 исправлены
  или документированно отложены + расхождений план/код нет.
