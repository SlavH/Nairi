"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { SUPPORTED_LOCALES, LOCALE_NAMES, LOCALE_FLAGS, type Locale } from "@/lib/i18n/translations"
import { Check, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export function LanguageSettings() {
  const { locale, setLocale } = useI18n()

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Language Settings
        </CardTitle>
        <CardDescription>
          Choose your preferred language for the Nairi interface. All content will be displayed in the selected language.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {SUPPORTED_LOCALES.map((loc) => (
            <Button
              key={loc}
              variant={locale === loc ? "default" : "outline"}
              className={cn(
                "w-full justify-between h-auto py-4 px-4",
                locale === loc
                  ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white border-0"
                  : "bg-transparent hover:bg-accent"
              )}
              onClick={() => setLocale(loc)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{LOCALE_FLAGS[loc as Locale]}</span>
                <div className="text-left">
                  <p className="font-medium">{LOCALE_NAMES[loc as Locale]}</p>
                  <p className={cn(
                    "text-xs",
                    locale === loc ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {loc === "en" && "English (United States)"}
                    {loc === "ru" && "Russian (\u0420\u0443\u0441\u0441\u043a\u0438\u0439)"}
                    {loc === "hy" && "Armenian (\u0540\u0561\u0575\u0565\u0580\u0565\u0576)"}
                  </p>
                </div>
              </div>
              {locale === loc && <Check className="h-5 w-5" />}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Your language preference is saved automatically and will be remembered on your next visit.
        </p>
      </CardContent>
    </Card>
  )
}
