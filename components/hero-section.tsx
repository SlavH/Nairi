"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, MessageSquare } from "lucide-react"
import Link from "next/link"
import { DemoModal } from "@/components/demo-modal"
import { useTranslation } from "@/lib/i18n/context"

export function HeroSection() {
  const { t } = useTranslation()
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
            style={{
              background: '#e879f9',
              opacity: 0.5,
              filter: 'blur(80px)',
              animation: 'pulse-glow 3s ease-in-out infinite'
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
            style={{
              background: '#22d3ee',
              opacity: 0.5,
              filter: 'blur(80px)',
              animation: 'pulse-glow 3s ease-in-out infinite',
              animationDelay: '1.5s'
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
          <div
            className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-8">
              <Sparkles className="w-4 h-4 text-[#e879f9]" />
              <span className="text-sm text-muted-foreground">{t.hero.badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-foreground">{t.hero.title}</span>
              <br />
              <span className="gradient-text">{t.hero.subtitle}</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {t.hero.tagline}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90 px-8 h-12 text-base"
                asChild
              >
                <Link href="/auth/sign-up">
                  {t.hero.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-card px-8 h-12 text-base bg-transparent"
                onClick={() => setDemoModalOpen(true)}
              >
                {t.hero.secondaryCta}
              </Button>
            </div>
          </div>

          <div
            className={`mt-20 relative transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 glow-pink text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-[#e879f9]" />
                <span className="text-sm font-medium">{t.hero.interfaceTitle}</span>
              </div>
              <p className="text-muted-foreground text-base max-w-md mx-auto">
                {t.hero.interfacePlaceholder}
              </p>
              <div className="mt-6 flex justify-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/40" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/40" />
                <div className="w-2 h-2 rounded-full bg-green-500/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  )
}
