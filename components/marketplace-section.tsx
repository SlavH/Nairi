"use client"

import Link from "next/link"

import { useState } from "react"
import { Store, Download, Edit3, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketplaceItemModal } from "@/components/marketplace-item-modal"
import { useTranslation } from "@/lib/i18n/context"

const trendingItems = [
  { name: "E-commerce Template", creator: "Alex M.", type: "Website", price: "$49" },
  { name: "Financial Report Generator", creator: "Sarah K.", type: "Tool", price: "$29" },
  { name: "Brand Identity Kit", creator: "Design Co.", type: "Visual", price: "$79" },
  { name: "Learning Path Builder", creator: "EduTech", type: "Interactive", price: "$39" },
]

export function MarketplaceSection() {
  const { t } = useTranslation()
  const [selectedItem, setSelectedItem] = useState<(typeof trendingItems)[0] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleItemClick = (item: (typeof trendingItems)[0]) => {
    setSelectedItem(item)
    setModalOpen(true)
  }

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
              <div className="relative rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">{t.marketplaceSection.trendingCreations}</h3>
                  <span className="text-sm text-muted-foreground">{t.marketplaceSection.thisWeek}</span>
                </div>
                <div className="space-y-4">
                  {trendingItems.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#e879f9]/30 to-[#22d3ee]/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-lg">✦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-[#e879f9] transition-colors">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.creator} • {item.type}
                        </p>
                      </div>
                      <span className="font-semibold text-[#22d3ee]">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketplaceItemModal isOpen={modalOpen} onClose={() => setModalOpen(false)} item={selectedItem} />
    </>
  )
}
