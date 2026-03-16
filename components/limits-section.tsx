"use client"

import { useState } from "react"
import { Play, UserPlus, Zap, ShoppingBag, Check } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export function LimitsSection() {
  const { t } = useTranslation()
  const [activeMethod, setActiveMethod] = useState<number | null>(null)

  const methods = [
    {
      icon: Play,
      title: t.limits.methods.watchAndEarn.title,
      description: t.limits.methods.watchAndEarn.description,
      bonus: t.limits.methods.watchAndEarn.bonus,
    },
    {
      icon: UserPlus,
      title: t.limits.methods.inviteFriends.title,
      description: t.limits.methods.inviteFriends.description,
      bonus: t.limits.methods.inviteFriends.bonus,
    },
    {
      icon: Zap,
      title: t.limits.methods.stayActive.title,
      description: t.limits.methods.stayActive.description,
      bonus: t.limits.methods.stayActive.bonus,
    },
    {
      icon: ShoppingBag,
      title: t.limits.methods.marketplaceActivity.title,
      description: t.limits.methods.marketplaceActivity.description,
      bonus: t.limits.methods.marketplaceActivity.bonus,
    },
  ]

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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t.limits.dailyCredits}</span>
                  <span className="text-sm text-muted-foreground">{t.limits.creditsUsed}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] rounded-full transition-all"
                    style={{ width: "75%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t.limits.resetsIn}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {methods.map((method, index) => (
                <div
                  key={method.title}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    activeMethod === index
                      ? "bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 border-[#e879f9]/50"
                      : "bg-muted/30 border-border hover:border-[#22d3ee]/50"
                  }`}
                  onMouseEnter={() => setActiveMethod(index)}
                  onMouseLeave={() => setActiveMethod(null)}
                >
                  <method.icon
                    className={`w-6 h-6 mb-2 transition-colors ${
                      activeMethod === index ? "text-[#22d3ee]" : "text-[#e879f9]"
                    }`}
                  />
                  <h3 className="font-medium mb-1">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium transition-all ${
                      activeMethod === index ? "text-[#22d3ee]" : "text-[#e879f9]"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    {method.bonus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
