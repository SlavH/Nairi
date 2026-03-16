/**
 * Internationalization configuration for Nairi
 */

export const defaultLocale = 'en' as const

export const locales = ['en', 'ru', 'hy', 'es', 'fr', 'de', 'ja', 'zh', 'ar'] as const

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
  hy: 'Հայերեն',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
  ar: 'العربية',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
  hy: '🇦🇲',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ar: '🇸🇦',
}

// RTL languages
export const rtlLocales: Locale[] = ['ar']

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale)
}
