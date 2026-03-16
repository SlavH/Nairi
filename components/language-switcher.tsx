"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { SUPPORTED_LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/translations"
import { cn } from "@/lib/utils"

export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "minimal" }) {
  const { locale, setLocale } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "minimal" ? "icon" : "sm"}
          className="gap-2"
          suppressHydrationWarning
        >
          <Globe className="h-4 w-4" />
          {variant === "default" && <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={cn("flex items-center justify-between gap-2", locale === loc && "bg-accent")}
            suppressHydrationWarning
          >
            <span>{LOCALE_NAMES[loc as Locale]}</span>
            {locale === loc && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
