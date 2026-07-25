"use client"

import Link from "next/link"

import { Store, Download, Edit3, Users } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export function MarketplaceSection() {
  const { t } = useTranslation()

  const features = [
    {
      icon: Store,
      title: t.marketplaceSection.features.sellCreations.title,
      description: t.marketplaceSection.features.sellCreations.description,
    },
    {
      icon: Download,
      title: t.marketplaceSection.features.discoverAcquire.title,
      description: t.marketplaceSection.features.discoverAcquire.description,
    },
    {
      icon: Edit3,
      title: t.marketplaceSection.features.remixImprove.title,
      description: t.marketplaceSection.features.remixImprove.description,
    },
    {
      icon: Users,
      title: t.marketplaceSection.features.growTogether.title,
      description: t.marketplaceSection.features.growTogether.description,
    },
  ]

  return (
    <>
      <section id="marketplace" className="py-20 md:py-32 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-card/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                {t.marketplaceSection.title.split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{t.marketplaceSection.title.split(' ').pop()}</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                {t.marketplaceSection.subtitle}
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature) => (
                  <div key={feature.title} className="flex gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-5 h-5 text-[#e879f9]" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-0.5">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#e879f9] to-[#22d3ee] px-4 py-2 text-sm font-medium text-white shadow-xs transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                data-testid="explore-marketplace-link"
              >
                {t.marketplaceSection.exploreMarketplace}
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-border bg-card p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 flex items-center justify-center mx-auto mb-5">
                  <Store className="w-8 h-8 text-[#e879f9]" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t.marketplaceSection.emptyStateTitle}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  {t.marketplaceSection.emptyStateDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
