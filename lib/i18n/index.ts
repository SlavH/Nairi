/**
 * Internationalization utilities for Nairi
 * Lightweight i18n implementation without external dependencies
 */

import { Locale, defaultLocale, locales, isRTL } from './config'

type TranslationKey = string
type Translations = Record<string, any>

// Translation cache
const translationCache = new Map<Locale, Translations>()

// Current locale
let currentLocale: Locale = defaultLocale

// Load translations for a locale
export async function loadTranslations(locale: Locale): Promise<Translations> {
  // Check cache first
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!
  }

  try {
    // Dynamic import of translation file
    const translations = await import(`./translations/${locale}.json`)
    translationCache.set(locale, translations.default || translations)
    return translations.default || translations
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error)
    
    // Fallback to default locale
    if (locale !== defaultLocale) {
      return loadTranslations(defaultLocale)
    }
    
    return {}
  }
}

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Translate a key
export function translate(
  key: TranslationKey,
  params?: Record<string, string | number>,
  locale: Locale = currentLocale
): string {
  const translations = translationCache.get(locale)
  
  if (!translations) {
    console.warn(`Translations not loaded for locale: ${locale}`)
    return key
  }

  let translation = getNestedValue(translations, key)

  // Fallback to default locale if translation not found
  if (!translation && locale !== defaultLocale) {
    const defaultTranslations = translationCache.get(defaultLocale)
    translation = defaultTranslations ? getNestedValue(defaultTranslations, key) : undefined
  }

  // Fallback to key if still not found
  if (!translation) {
    console.warn(`Translation not found for key: ${key}`)
    return key
  }

  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(value))
    })
  }

  return translation
}

// Short alias for translate
export const t = translate

// Set current locale
export function setLocale(locale: Locale): void {
  if (!locales.includes(locale)) {
    console.warn(`Invalid locale: ${locale}. Using default: ${defaultLocale}`)
    currentLocale = defaultLocale
    return
  }

  currentLocale = locale

  // Update HTML lang attribute
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
    document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr'
  }

  // Store in localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('locale', locale)
  }
}

// Get current locale
export function getLocale(): Locale {
  return currentLocale
}

// Initialize i18n
export async function initI18n(locale?: Locale): Promise<void> {
  // Determine locale
  let targetLocale = locale

  if (!targetLocale && typeof localStorage !== 'undefined') {
    targetLocale = localStorage.getItem('locale') as Locale
  }

  if (!targetLocale && typeof navigator !== 'undefined') {
    const browserLocale = navigator.language.split('-')[0] as Locale
    if (locales.includes(browserLocale)) {
      targetLocale = browserLocale
    }
  }

  targetLocale = targetLocale || defaultLocale

  // Load translations
  await loadTranslations(targetLocale)
  
  // Also load default locale as fallback
  if (targetLocale !== defaultLocale) {
    await loadTranslations(defaultLocale)
  }

  // Set locale
  setLocale(targetLocale)
}

// Format number based on locale
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: Locale = currentLocale
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

// Format currency based on locale
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: Locale = currentLocale
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)
}

// Format date based on locale
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale: Locale = currentLocale
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, options).format(dateObj)
}

// Format relative time
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: Locale = currentLocale
): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit)
}

// Pluralization helper
export function plural(
  count: number,
  singular: string,
  plural: string,
  zero?: string
): string {
  if (count === 0 && zero) return zero
  return count === 1 ? singular : plural
}

// Export all
export * from './config'
