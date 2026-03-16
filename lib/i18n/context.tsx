"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Locale, TranslationStrings } from "./translations"
import { translations, SUPPORTED_LOCALES } from "./translations"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationStrings
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LOCALE_STORAGE_KEY = "nairi-locale"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    // Try to get locale from localStorage
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      setLocaleState(stored)
      if (typeof document !== 'undefined') {
        document.documentElement.lang = stored
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    // Update html lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
    }
  }

  // Always provide translations - never undefined
  const t = translations[locale] || translations["en"]

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

// Returns both { t } object and t directly for backwards compatibility
export function useTranslation(): { t: TranslationStrings } & TranslationStrings {
  const { t } = useI18n()
  // Return object with t property, but also spread t for direct access
  return { t, ...t }
}
