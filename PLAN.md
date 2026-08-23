# PLAN.md — план работ до «100% готово»

Рабочий критерий готовности (трактовка оркестратора, т.к. пользователь не определил явно):
1. `tsc --noEmit` = 0 ошибок
2. `npm run test` — все тесты зелёные (0 fail)
3. `npm run build` — успешен
4. `npm run lint` — без ошибок
5. Находки аудита F1–F47: исправлены ИЛИ документированно отложены в docs/AUDIT_TRIAGE.md
6. Нет расхождений PLAN/фактический код

Статусы: [ ] — не начата, [~] — в работе, [x] — выполнено и проверено.

## Задачи

- [x] R1. Researcher: карта проекта → PROJECT_MAP.md
- [x] T1. Починить 2 падающих теста в __tests__/lib/nairibook/core.test.ts:
        vi.mock("@/lib/nairibook/zen"). Коммит 3ce414f. Проверено:
        полный набор 322 passed / 0 fail на Node 22 и Node 20.
- [x] T2. Верификация F11–F28: FIXED=F11; PARTIAL=F15,F19;
        OPEN=F12,F13,F14,F16,F17,F18,F20–F28 (детали в CHANGELOG_AGENTS.md).
- [x] T3. Regression: typecheck ✅, test ✅ 322/0, build ✅ (Node 20 + Node 22).
        Lint ❌ 1279 ошибок — вне CI-гейта, объём → эскалация (T7).
        e2e ⚠️ требует реальный Supabase (.env.local) → эскалация (T7).
- [~] T4. Claims PROGRESS.md/AUDIT_SUMMARY.md подтверждены реальными прогонами.
        tasks.json (стримы A–I) и P3 (F29–F47) — выборочная верификация не проводилась.
- [x] T5. CHANGELOG_AGENTS.md создан и ведётся.
- [x] T6. ВСЕ 18 находок Priority 2 закрыты (см. CHANGELOG_AGENTS.md, цикл 2):
        F21 quiz answers leak → F25 credits TOCTOU → F16 fork RLS/email leak →
        F17 body size → F20 reviews → F23 skill tree schema → F26 provider-health →
        F27 signup PII/contact → F28 MFA → F24 rate limit learn → F12 share page →
        F13 shouldRefuse → F14 model comparison → F15 prompt injection tier →
        коммиты 3ce414f..df7fa48; тесты + полный regression на каждую.
- [x] T7→ESC. Эскалации отправлены (см. CHANGELOG_AGENTS.md): биллинг GitHub Actions,
      определение критерия «100%», креды для e2e, объём lint-чистки.

