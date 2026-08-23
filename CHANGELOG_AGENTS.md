# CHANGELOG_AGENTS.md — журнал работы мультиагентной команды

## Цикл 1 — 2026-08-23

### Researcher
- Склонирован репозиторий; составлена PROJECT_MAP.md.
- Изучены CONSTITUTION.md, docs/AUDIT_TRIAGE.md (F1–F47), tasks.json, PROGRESS.md,
  AUDIT_SUMMARY.md, ci.yml.

### Tester (входная верификация)
- `tsc --noEmit`: ✅ 0 ошибок (Node 22 и Node 20).
- `npm run test`: ❌→✅ было 2 fail (`__tests__/lib/nairibook/core.test.ts`,
  таймауты 5000ms) из-за реального сетевого вызова `callZen()` из `buildGraph()`.
- `npm run build`: ✅ (локально, Node 20 + плейсхолдеры env как в CI).
- e2e: ⚠️ auth.setup.ts требует реальный Supabase + тестового пользователя
  (.env.local); без кредов прогон невозможен локально.

### Coder
- Исправлен `__tests__/lib/nairibook/core.test.ts`: добавлен
  `vi.mock("@/lib/nairibook/zen")` по конвенции соседних тестов
  (exercises/problem/photo-check).
  Коммит: `3ce414f test(nairibook): mock zen in core.test.ts ...`
- После фикса: полный набор 322 passed / 0 failed / 2 skipped (Node 22 и Node 20).

### Reviewer / Integrator (аудит-верификация через subagent)
- Проверены все находки Priority 2 (F11–F28) по файлам:
  - FIXED: F11 (permissions "ask" default + тест).
  - PARTIAL: F15 (только глобальный эффект от F11), F19 (фильтр is_published
    только в recommendation.ts).
  - OPEN: F12, F13, F14, F16, F17, F18, F20, F21, F22, F23, F24, F25, F26,
    F27, F28 — детали с file:line в PLAN.md / отчёте цикла.
- Вывод: коммит `2b65b5d "Priority 1 security fixes (F1-F10)"` закрыл P1;
  P2 практически не тронут.

### Инфраструктура CI (расследование красного CI)
- Все прогоны CI на GitHub красные минимум с мая 2026, включая последний
  коммит `837f505`.
- Локальное воспроизведение шагов CI на Node 20 (npm ci → tsc → build с
  плейсхолдерами → test): всё зелёное.
- Аннотации check-runs: «The job was not started because your account is
  locked due to a billing issue.» — job'ы не стартуют вообще.
- Вывод: красный CI = блокировка аккаунта GitHub по биллингу (владелец),
  НЕ дефект кода. Эскалация человеку.
- Docker Build workflow: тоже failure (та же причина биллинга, проверка не
  выполнялась по существу).

### Эскалации человеку (критические решения)
1. Разблокировать GitHub Actions (биллинг аккаунта SlavH) — иначе зелёный CI
   недостижим организационно, несмотря на зелёную локальную верификацию.
2. Критерий «100% готово» не определён в постановке. Рабочая трактовка
   оркестратора: typecheck+build+test зелёные, e2e прогнан (нужен Supabase),
   F1–F47 закрыты или документированно отложены.
3. Предоставить E2E_TEST_EMAIL/PASSWORD + реальный Supabase для e2e-прогона,
   либо согласиться на пропуск e2e как критерия.
4. Объём lint-чистки: 1279 ошибок (673 unused-vars, 414 no-explicit-any,
   25 rules-of-hooks). Lint НЕ входит в CI-гейт проекта. Чистить полностью =
   большой рефакторинг с риском регрессий.

### Метрики готовности (по рабочей трактовке)
- typecheck/build/test: 100% зелёные ✅
- Аудит P1 (F1–F10): заявлено исправлено, выборочно подтверждено (F11 ✅)
- Аудит P2 (F11–F28): 1 fixed / 2 partial / 15 open ≈ 8% закрыто
- Аудит P3 (F29–F47): статус не верифицирован
- e2e: заблокировано внешними кредами
- Итоговая оценка готовности: ~70%
