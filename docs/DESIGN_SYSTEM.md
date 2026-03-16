# Nairi Design System

This document describes design tokens and patterns used across the app. Tokens are defined in [app/globals.css](app/globals.css) and mapped into Tailwind via `@theme inline`.

## Design tokens

### Colors (CSS variables)

All colors use oklch for consistency. Use Tailwind classes or `var(--*)` in CSS.

| Token | Usage |
|-------|--------|
| `--background`, `--foreground` | Page background and body text |
| `--card`, `--card-foreground` | Cards and surfaces |
| `--primary`, `--primary-foreground` | Primary actions, links, ring |
| `--secondary`, `--secondary-foreground` | Secondary actions |
| `--muted`, `--muted-foreground` | De-emphasized text and backgrounds |
| `--accent`, `--accent-foreground` | Highlights, hover states |
| `--destructive`, `--destructive-foreground` | Errors, delete actions |
| `--border`, `--input`, `--ring` | Borders, inputs, focus ring |
| `--chart-1` … `--chart-5` | Charts and data viz |
| `--sidebar-*` | Sidebar surfaces and text |

**Tailwind usage:** `bg-background`, `text-foreground`, `bg-primary`, `border-border`, etc.

### Contrast (WCAG AA)

- Foreground on background and card meets WCAG AA for body text.
- Primary and primary-foreground are chosen for sufficient contrast on buttons.
- Muted-foreground is intended for secondary text; ensure it meets 4.5:1 (or 3:1 for large text) on background/card where used.
- If contrast fails in a theme, adjust oklch lightness in `:root` (and `.dark` if present) in globals.css and re-test.

### Radius

- `--radius`: base radius (0.75rem).
- Tailwind: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` (calc from base).
- Use `rounded-md`, `rounded-lg`, etc. for consistent corners on cards, buttons, inputs.

### Motion (Phase 402)

- `--duration-fast`: 150ms
- `--duration-normal`: 250ms
- `--duration-slow`: 350ms
- `--ease-default`: cubic-bezier(0.4, 0, 0.2, 1)
- `--ease-out`: cubic-bezier(0, 0, 0.2, 1)

Use for transitions and animations so timing is consistent. Respect `prefers-reduced-motion` (see Animations).

### Typography

- **Fonts:** `--font-sans` (Inter), `--font-mono` (Geist Mono). Set in layout via next/font.
- **Scale:** Use Tailwind text utilities consistently:
  - Body: `text-sm`, `text-base`
  - Headings: `text-lg`, `text-xl`, `text-2xl`, `text-3xl` with `font-semibold` or `font-bold`
  - Small/labels: `text-xs`, `text-sm`
- **Line height:** Default Tailwind (e.g. `leading-tight` for headings, default for body).

### Spacing scale

Use Tailwind spacing (4px base): `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px). Prefer `gap-4`, `p-4`, `mb-6` etc. for consistency. Avoid arbitrary values unless needed for alignment.

### Icon sizes

- Inline with text: `size-4` (16px) or `size-5` (20px).
- Buttons / nav: `size-5` or `size-6` (20–24px).
- Large feature icons: `size-8`, `size-10`.
- Use Lucide React; keep size consistent within a context (e.g. all nav icons `size-5`).

### Border and shadow

- **Border:** `border border-border`; use `border-muted` for subtle dividers.
- **Shadow:** Prefer Tailwind `shadow-sm`, `shadow`, `shadow-md` for cards and dropdowns. Use custom `.glow-pink` / `.glow-cyan` sparingly for hero or CTAs.
- Avoid hardcoded box-shadow values; extend Tailwind theme if a new shadow level is needed.

### Dark / light parity

ThemeProvider (next-themes) toggles `.dark` on the root. All colors use the same token names in `:root`; when a light theme is added, define `.light` or override `:root` and keep token names so components work in both. Do not hardcode hex/oklch in components; use `bg-background`, `text-foreground`, etc.

### Component tokens

Shadcn/ui components in [components/ui](components/ui) use the CSS variables above. When adding or editing components, use `var(--primary)`, `var(--radius)`, or Tailwind classes that map to these tokens. Replace any remaining hardcoded hex/oklch with token references.

---

## Animations

- **Reduced motion:** `prefers-reduced-motion: reduce` in globals.css shortens all CSS animations and transitions. Framer Motion usage (e.g. circular nav) should respect reduced motion (e.g. `useReducedMotion()` or disable animations when true).
- **When to use CSS vs Framer Motion:** Use CSS (Tailwind or keyframes in globals) for simple enter/exit and hover (modals, dropdowns, buttons). Use Framer Motion for orchestrated or list stagger animations (e.g. nav, dashboard cards).
- **Duration:** Use motion tokens (`--duration-fast`, `--duration-normal`) so animations feel consistent (e.g. modal 250ms, button hover 150ms).
- **Entrance/exit:** Reusable keyframes in globals: `fadeInUp`, `scaleIn`, `float`, `pulse-glow`, `shimmer`. Use `.animate-fade-in-up`, `.animate-scale-in` or equivalent. For Framer Motion, use shared variants in `lib/motion.ts` (getEntranceVariants, getTransition). Builder animation library ([components/builder-v2/animation-library.tsx](components/builder-v2/animation-library.tsx)) uses the same timing (DURATION_NORMAL_S = 0.25s) for entrance/exit so generated code matches design tokens.

---

## Loading and empty states

- **Loading:** Use [components/ui/skeleton](components/ui/skeleton.tsx) or [components/ui/spinner](components/ui/spinner.tsx). Route-level loading: add `loading.tsx` with skeleton layout and `aria-busy`/`aria-live` where appropriate. Use [components/loading/skeleton-layouts](components/loading/skeleton-layouts.tsx) (SkeletonCardGrid, SkeletonListRow) for consistent layouts.
- **Empty:** Use [components/ui/empty](components/ui/empty.tsx) for "no data" views (e.g. no creations, no conversations). Include icon/illustration and a clear CTA (e.g. "Create your first"). Use EmptyHeader, EmptyMedia (variant="icon"), EmptyTitle, EmptyDescription, EmptyContent.
- **Button loading:** Use the Button `loading` prop for primary actions (submit, create, send) so the button shows a spinner and is disabled to prevent double submit.
- **Error state:** Use consistent layout and messaging; include retry button. Use `role="alert"` and `aria-live` where appropriate (e.g. error boundary fallback).

---

## Z-index scale

Use a consistent order to avoid stacking conflicts:

- Base content: 0
- Sticky header: 50 (e.g. `z-50`)
- Dropdowns / popovers: 50
- Modal overlay: 50–100
- Modal content: 100
- Toast / sonner: 100+
- Nav overlay: 50 (ensure it sits above page content, below toast)

Define these in a single place (e.g. globals or tailwind config) if needed.

---

## Breakpoints

Tailwind default: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px. Use these consistently for header, nav, dashboard, and builder so layout responds the same way across pages.

- **Mobile:** Below `md` (768px). Use for “mobile” detection (e.g. `useIsMobile` at 768px) and header mobile menu.
- **Sidebar collapses to overlay:** Below `lg` (1024px). Dashboard and chat sidebars are fixed overlay on small screens, static on `lg+`.

## Responsiveness

- **Container pattern:** Use `.page-container` (globals.css: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) for main content so long lines don’t hurt readability on large screens.
- **Touch target minimum:** 44×44px on mobile for nav toggles, primary CTAs, and header/footer links. Use `min-h-[44px] min-w-[44px]` or `size-12` for icon buttons where they are primary on small screens.
- **Sidebar pattern:** Fixed overlay on small screens (slide-in), static on `lg+`. Use a single “mobile” source (e.g. `useIsMobile` / `use-mobile` at 768px); see [hooks/use-mobile.ts](hooks/use-mobile.ts).
- **Viewport zoom:** Do not set `maximumScale: 1`; allow user zoom (e.g. `maximumScale: 5`) for WCAG 2.1 (1.4.4 Resize text).
- **Global nav button:** Fixed left edge; hidden on `/dashboard*` so it does not overlap the sidebar hamburger. On dashboard, use the header “Open navigation hub” button to open the circular nav.

## Touch targets (Phase 432)

On mobile, ensure interactive elements (buttons, nav items, links) meet a minimum touch target of 44×44px (e.g. `min-h-[44px] min-w-[44px]` or use `size-12` for icon buttons). Audit header, circular nav, sidebar toggles, and key CTAs.

## Container and max-width (Phase 434)

Use the `.page-container` class (globals.css: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) for main content areas so long lines don’t hurt readability on large screens.

## Gradient and glass (Phase 453)

Use `gradient-text` and `gradient-border` (or glass effects like `backdrop-blur-sm bg-card/50`) sparingly so pages don't feel noisy. Prefer for hero, primary CTAs, and key badges; avoid overuse in body content. Hero background blobs use CSS animation (pulse-glow) which is shortened by `prefers-reduced-motion` in globals.css.

## Landing performance (Phase 459)

Use lazy loading for below-fold images (`loading="lazy"` or Next.js Image default). Consider code-splitting heavy components below the fold. Avoid blocking LCP with heavy animation; hero typing and blobs are lightweight.

## Performance (Phase 471–480)

- **LCP:** Ensure largest contentful element (hero or dashboard header) loads quickly; use `priority` for above-fold images and avoid blocking scripts.
- **CLS:** Minimize layout shift: reserve space for skeletons, images (aspect ratio), and dynamic content; avoid inserting content above existing layout.
- **INP / responsiveness:** Keep main thread work light during interactions (e.g. debounce search, virtualize long lists if needed); ensure buttons and inputs feel responsive.
- **Fonts:** Inter and Geist Mono are loaded via next/font in layout; ensure `font-display` or fallbacks are set so FOUT/FOIT is minimal.
- **Animation performance:** Prefer `transform` and `opacity` for animations to avoid layout/paint; avoid animating width/height or top/left where transform can be used.
- **Error and retry:** If a view fails to load, show a clear error and retry button; avoid infinite spinners without feedback.
- **Optional:** Lighthouse CI or a performance budget (LCP, CLS, bundle size) can be added and documented in production/TESTING to track regressions.
