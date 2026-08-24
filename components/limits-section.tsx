"use client"

import { Clock } from "lucide-react"

import { useTranslation } from "@/lib/i18n/context"

export function LimitsSection() {
  const { t } = useTranslation()

  return (
    <section className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t.limits.title.split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{t.limits.title.split(' ').pop()}</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                {t.limits.subtitle}
              </p>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{t.limits.noPaywall.split('.').shift()}.</span> {t.limits.noPaywall.split('.').slice(1).join('.')}
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#e879f9]/10 to-[#22d3ee]/10 border border-border">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <span className="text-sm font-medium">{t.limits.dailyCredits}</span>
                  <span className="text-sm text-muted-foreground">{t.limits.creditsUsed}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-muted/30 text-center flex flex-col items-center justify-center min-h-[200px]">
              <Clock className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                {t.limits.methodsPlaceholder}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
