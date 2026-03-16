/**
 * React hook for translations
 */

import { useState, useEffect } from 'react'
import {
  translate,
  setLocale as setI18nLocale,
  getLocale,
  loadTranslations,
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  type Locale,
} from '@/lib/i18n'

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getLocale())
  const [isLoading, setIsLoading] = useState(false)

  const setLocale = async (newLocale: Locale) => {
    setIsLoading(true)
    try {
      await loadTranslations(newLocale)
      setI18nLocale(newLocale)
      setLocaleState(newLocale)
    } catch (error) {
      console.error('Failed to change locale:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(key, params, locale)
  }

  return {
    t,
    locale,
    setLocale,
    isLoading,
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, options, locale),
    formatCurrency: (value: number, currency?: string) =>
      formatCurrency(value, currency, locale),
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, options, locale),
    formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) =>
      formatRelativeTime(value, unit, locale),
  }
}
