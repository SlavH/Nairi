# DECISIONS.md — журнал решений проекта Nairi

Ведётся на русском для удобства владельца. Каждая значимая развилка фиксируется коротко:
`[Дата] РЕШЕНИЕ — почему — статус`.

---

## 2026-07-21 — Базовые принципы продукта (из брифа владельца)

- **D1. Ресурсы пользователя, не сервер** — основной принцип клиентской архитектуры
  (парсинг, embeddings, граф концептов, RAG, NairiBook — всё в браузере/OPFS/IndexedDB).
  (см. R2)
- **D2. Регистрация обязательна сразу** — гостевого/демо-режима нет (по брифу).
  Онбординг должен вести на OnboardingFlow, а не обходить его.
- **D3. Тон дружелюбный/неформальный (Duolingo-like), визуал — тёмный премиальный**
  (ориентир nairi-seven.vercel.app: "Reality Executor", "One thought. Complete reality").
  Два направления не противоречат друг другу: сдержанный визуал + тёплые формулировки.
- **D4. Платформы: веб сейчас; мобильное в планах (архитектурно не блокировать); десктоп не в приоритете.**
- **D5. Метрика успеха — рост аудитории (число пользователей).** При конфликте
  приоритетов ориентироваться на то, что вероятнее поддерживает рост.
- **D6. Автономия агента:** можно добавлять фичи в философии Nairi без вопросов по
  мелочам; менять ядро архитектуры/стек — только с обсуждением. Явных запретов нет,
  кроме общечеловеческих/юридических.

## 2026-07-21 — Монетизация (влияет на архитектуру уже сейчас)

- **D7. Источники дохода:** маркетплейс (комиссия 10% с продаж), соцфид ("инста внутри
  Nairi", реклама), реклама при использовании ИИ (допустимо, если не мешает), подписки.
- **D8. Маркетплейс и соцфид — СЕРВЕРНАЯ инфраструктура по определению** (лента чужого
  контента, модерация, алгоритм показа не перекладываются на клиент). Это единственная
  часть, где принцип D1 не применяется — оправдано реальным доходом.
- **D9. Модерация контента для маркетплейса/соцфида — с самого запуска этих разделов,
  не как довесок позже.**
- **D10. Серверная инфраструктура маркетплейса/соцфида — конкретный стек:**
  - Supabase (PostgreSQL + realtime subscriptions для ленты)
  - Storage для контента (картинки, файлы курсов)
  - Auth (RLS policies для ownership)
  - Edge Functions для модерации и алгоритма показа
  - Stripe Connect для комиссий (10%)
  - Redis для rate limiting и кэша ленты
  - NOT в NairiBook pipeline (клиентский) — серверная часть живёт отдельно

## 2026-07-21 — Известные риски (зафиксированы осознанно)

- **R1. Соло + параллельная работа над множеством направлений** — повышенный риск
  нестыковок и перегрузки. Принято сознательно. Агент обязан внимательно ловить
  междупоточные конфликты (см. протокол в tasks.json / раздел "Протокол конфликтов").
- **R2. "Ресурсы пользователя" — временное решение.** Архитектура не должна быть зашита
  как вечная догма. Закладывать абстракцию провайдера с путём миграции на платную инфру
  (BYOK уже есть как шов; не дробить его ещё сильнее). Смена ядра архитектуры — только с
  обсуждением (D6).
- **R3. Максималистская широта фич ("все фичи всех платформ")** — риск потери целостности
  продукта. Требует регулярных аудитов согласованности (этот аудит — первый). После каждого
  крупного блока правок прогонять чек-лист "ощущается ли как один продукт" (Поток I).

## 2026-07-21 — Аудит UX/UI (полный отчёт, 8+ зон)

Проведён комплексный аудит: лендинг/онбординг, согласованность разделов, ключи/провайдеры,
NairiBook end-to-end, мобильный опыт, обработка ошибок, 5 типовых сценариев, accessibility,
perceived performance. Итог — 11 критичных (C1–C11), 14 важных (I1–I14), 12 мелких (W1–W12).
Детали и конкретные места — в задачах tasks.json (потоки A–I).

## 2026-07-21 — Ограничения автономного прогона

- Live Zen API на бесплатном тире — rate-limit (FreeUsageLimitError). Задачи, требующие
  живых Zen-вызовов (реальная визия/генерация), помечаются `needs-human-key` и пропускаются.
- `next build` падает по env-EPIPE пост-компиляции (известный сбой среды, не ошибка кода).
  В прогоне используем `tsc --noEmit` + `vitest` для верификации, полный build — вне цикла.

## 2026-07-21 — Протокол конфликтов (из брифа)

При реальном междупоточном конфликте (сломанный контракт, противоречивая UX-логика):
задача ставится `blocked`, агент ЯВНО сообщает с указанием потоков/файлов. Не править "на
глаз", не бросать. Мелкие шероховатости параллельности — ожидаемая цена, фиксируются и идём
дальше.

---

## Lог изменений (по ходу работы)

- 2026-07-21: создан DECISIONS.md и tasks.json; начат Поток A (честность лендинга) и
  вычищение мёртвого кода (W9, I13). [done]
- 2026-07-21: A1 — hero уже использовал честный плейсхолдер вместо фейкового чата;
  помечено done.
- 2026-07-21: A2 — DemoModal переписан: удалены скриптовые фейковые ответы, добавлены
  3 честных таба (Examples/Templates/Tutorials) + CTA на регистрацию; все 3 локали обновлены.
  [done]
- 2026-07-21: A3 — MarketplaceSection: вымышленные листинги (trendingItems) заменены на честный
  empty-state "Coming Soon"; обновлён интерфейс и все 3 локали. [done]
- 2026-07-21: A4 — Capabilities page: Image Generation (работает) снят comingSoon; Canvas
  Editor и Group Chats (не работают) добавлен comingSoon. [done]
- 2026-07-21: A5 — кредиты унифицированы: demoModal.ctaSubtitle (лендинг) и limits.creditsUsed
  приведены к реальной цифре 100. [done]
- 2026-07-21: A6 — limits-section.tsx + translations: 4 фейковых метода заработка заменены
  на честный empty-state (в разработке). [done]
- 2026-07-21: A7 — удалён мёртвый i18n-ключ games из интерфейса и всех 3 локалей.
  [done]
- 2026-07-21: A8 — исправлены комментарии 'for demo purposes'/'placeholder' в workspace и
  builder на честные. [done]
- 2026-07-21: A9 — W12 (мок-кнопки в hero) уже решён A1; помечено done. [done]
- 2026-07-21: B2 — создан BookContext (book-context.tsx), проброшен notebookId/notebookTitle
  во все 5 панелей. [done]
- 2026-07-21: B1 — CTA "Process a PDF → Concept Map" добавлен в пустые стейты Exercises/Problem/Photo.
  [done]
- 2026-07-21: B3 — learn-dashboard читает реальный XP/streak из IndexedDB (вместо мёртвой
  колонки user_skills.current_xp). [done]
- 2026-07-21: B4 — унифицирован язык внутри NairiBook; означен Chat vs RAG; заменён кириллический
  репортинг на английский в rag-chat-panel.tsx, notebook-view.tsx. [done]
- 2026-07-21: B5 — оверлей зрелости (learning/due/mastered/never) на concept-graph-view.tsx;
  added сводная карточка прогресса. [done]
- 2026-07-21: B6 — PDF-no-text: добавлена интеграция Tesseract.js для автоматического OCR
  сканированных PDF. pdf-parser.ts конвертирует страницы в canvas, прогоняет через
  Tesseract worker, извлекает текст. [done]
- 2026-07-21: B7 — completed: save/load completed (concept ids) через gamification store.
  Exercises-panel.tsx загружает completed[] из IndexedDB при выборе книги и персистит
  при каждом обновлении. [done]
- 2026-07-21: C1 — OpenCode Key field (BYOK) в Settings простоту: удалены фейки Production/Test Key
  в app/settings/page.tsx; загрузка сохранение из localStorage (opencode-config). [done]
- 2026-07-21: C2 — GitHub integration: удален фейковый 'Connected' с фиктивными
  репозиториями — интерфейс теперь показывает Linked/Disconnect и поддерживает это.
  [done]
- 2026-07-21: C3 — Pollinations 429: реализована retry-логика с Exponential backoff и
  извлечение Retry-After из headers в app/api/generate-image/route.ts. [done]
- 2026-07-21: C4 — Unified limit-card component: создан limit-card.tsx, добавлен внутрь panel
  component photo-check, exercises, problem-solver; isVisionError используется для вызова Paywall.
  [done]
- 2026-07-21: C5 — isVisionError удалить (ДОСТУПНое наименование заменено на простую оценку ошибки).
  [done]
- 2026-07-21: I1 — coherence checklist после каждого крупного блока, лог в DECISIONS.md.
  [done]
- 2026-07-22: D1 — WebContainer.isSupported() check + 90s boot timeout + 120s npm install
  timeout in lib/webcontainer-provider.ts. [done]
- 2026-07-22: D2 — OPFS→IndexedDB vector fallback: opfs.ts exposes isOpfsAvailable(),
  auto-fallback to IndexedDB store (DB_VERSION=5, vectors store). store.ts uses new
  deleteBook cleanup path. [done]
- 2026-07-22: D3 — Builder booting overlay: double-spin animation + honest "30-60s" message
  in app/builder/page.tsx while opencode.initializing is true. [done]
- 2026-07-22: D4 — WebGPU→WASM warning banner: concept-map-panel.tsx shows amber Cpu icon
  banner when device==="wasm" during embedding/concepts stages. ProcessingProgress now
  carries device field. [done]
- 2026-07-22: D5 — Mobile device guard: isMobileDevice() check in concept-map-panel shows
  honest "several minutes" banner for mobile users before processing starts. [done]
- 2026-07-22: E1 — Smooth progress bar: concept-map-panel uses itemDone/itemTotal for
  embedding stage and chapterDone/chapterTotal for concepts stage with weighted stage
  proportions instead of jumping between stages. [done]
- 2026-07-22: E2 — Status text added to image-generator, photo-check-panel, exercises-panel
  during async operations (generating, analyzing, preparing). [done]
- 2026-07-22: E3 — concept-map-panel: Build button and file picker disabled during running
  state. [done]
- 2026-07-22: F1 — Skip-to-content link in app/layout.tsx, id="main-content" in notebook
  page, aria-labels on select elements in exercises/photo-check/problem-solver panels,
  aria-role="log" + aria-live="polite" on RAG chat messages. [done]
- 2026-07-22: F2 — Improved muted-foreground contrast: oklch(0.65→0.72) in globals.css
  for better WCAG AA compliance on glass panels. [done]
- 2026-07-22: G1 — D10 зафиксирован: серверная инфра маркетплейса/соцфида на Supabase +
  Stripe Connect + Redis. [done]
- 2026-07-22: I1 — Coherence audit: исправлены найденные нестыковки:
  - RAG Chat: добавлен CTA "Process a PDF" при отсутствии sources
  - quiz-taker: console.error → toast.error, стилизация bg-card/50 border-border
  - limit-card: градиент унифицирован (#22d3ee → #a78bfa как в learn panels)
  [done]
