/**
 * Pillar M: UX, Accessibility, and Internationalization (Phases 136–144)
 * Real implementations: themes, locales, performance budgets.
 */

export const THEMES = ["light", "dark", "system"] as const
export const SUPPORTED_LOCALES = ["en", "es", "fr", "de"] as const
export const PERFORMANCE_BUDGETS = { LCP: 2500, FID: 100, CLS: 0.1 } as const

const themeStorageKey = "nairi-theme"
const localeStorageKey = "nairi-locale"

export function getTheme(): string {
  if (typeof window !== "undefined") {
    return window.localStorage?.getItem(themeStorageKey) ?? "system"
  }
  return "system"
}

export function setTheme(theme: string): void {
  if (typeof window !== "undefined") {
    window.localStorage?.setItem(themeStorageKey, theme)
  }
}

export function getLocale(): string {
  if (typeof window !== "undefined") {
    return window.localStorage?.getItem(localeStorageKey) ?? "en"
  }
  return "en"
}

export function setLocale(locale: string): void {
  if (typeof window !== "undefined") {
    window.localStorage?.setItem(localeStorageKey, locale)
  }
}

export function getPerformanceBudget(metric: keyof typeof PERFORMANCE_BUDGETS): number {
  return PERFORMANCE_BUDGETS[metric]
}
