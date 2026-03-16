"use client"

import { useState } from "react"
import { FileText, Presentation, Globe, ImageIcon, Lightbulb, Boxes, Clock } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export function CapabilitiesSection() {
  const { t } = useTranslation()
  const [activeCard, setActiveCard] = useState<number | null>(null)

  const capabilities: Array<{
    icon: typeof FileText
    title: string
    description: string
    examples: string[]
    comingSoon?: boolean
  }> = [
    {
      icon: FileText,
      title: t.capabilities.items.textFormats.title,
      description: t.capabilities.items.textFormats.description,
      examples: t.capabilities.items.textFormats.examples,
    },
    {
      icon: Presentation,
      title: t.capabilities.items.presentations.title,
      description: t.capabilities.items.presentations.description,
      examples: t.capabilities.items.presentations.examples,
    },
    {
      icon: Globe,
      title: t.capabilities.items.websites.title,
      description: t.capabilities.items.websites.description,
      examples: t.capabilities.items.websites.examples,
    },
    {
      icon: ImageIcon,
      title: t.capabilities.items.visuals.title,
      description: t.capabilities.items.visuals.description,
      examples: t.capabilities.items.visuals.examples,
    },

    {
      icon: Lightbulb,
      title: t.capabilities.items.ideas.title,
      description: t.capabilities.items.ideas.description,
      examples: t.capabilities.items.ideas.examples,
    },
    {
      icon: Boxes,
      title: t.capabilities.items.simulations.title,
      description: t.capabilities.items.simulations.description,
      examples: t.capabilities.items.simulations.examples,
    },
    {
      icon: Clock,
      title: t.capabilities.items.more.title,
      description: t.capabilities.items.more.description,
      examples: t.capabilities.items.more.examples,
      comingSoon: true,
    },
  ]

  return (
    <section id="capabilities" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#e879f9]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t.capabilities.title.split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{t.capabilities.title.split(' ').pop()}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.capabilities.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap, index) => (
            <div
              key={cap.title}
              className={`relative p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-all cursor-pointer ${
                activeCard === index ? "border-[#22d3ee] glow-cyan" : "hover:border-[#22d3ee]/50"
              }`}
              onMouseEnter={() => setActiveCard(index)}
              onMouseLeave={() => setActiveCard(null)}
            >
              {cap.comingSoon && (
                <span className="absolute top-3 right-3 px-2 py-0.5 text-xs rounded-full bg-[#e879f9]/20 text-[#e879f9]">
                  {t.capabilities.comingSoon}
                </span>
              )}
              <cap.icon
                className={`w-8 h-8 mb-3 transition-colors ${
                  activeCard === index ? "text-[#e879f9]" : "text-[#22d3ee]"
                }`}
              />
              <h3 className="font-semibold mb-1">{cap.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{cap.description}</p>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  activeCard === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">{t.capabilities.examplesLabel}</p>
                  <div className="flex flex-wrap gap-1">
                    {cap.examples.map((example) => (
                      <span key={example} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
