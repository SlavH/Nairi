"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { WaitlistModal } from "@/components/waitlist-modal"
import { useTranslation } from "@/lib/i18n/context"

export function FutureSection() {
  const { t } = useTranslation()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false)

  return (
    <>
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e879f9]/30 bg-[#e879f9]/10 mb-8">
              <Sparkles className="w-4 h-4 text-[#e879f9]" />
              <span className="text-sm text-[#e879f9]">{t.future.horizon}</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              {t.future.title.split(' ').slice(0, -2).join(' ')} <span className="gradient-text">{t.future.title.split(' ').slice(-2).join(' ')}</span>
            </h2>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {t.future.subtitle}
            </p>

            <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm mb-10">
              <p className="text-xl md:text-2xl font-medium text-balance">
                "{t.future.quote}"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90 px-8 h-12 text-base"
                onClick={() => setAuthModalOpen(true)}
              >
                {t.future.beginJourney}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-card px-8 h-12 text-base bg-transparent"
                onClick={() => setWaitlistModalOpen(true)}
              >
                {t.future.joinWaitlist}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab="signup" />
      <WaitlistModal isOpen={waitlistModalOpen} onClose={() => setWaitlistModalOpen(false)} />
    </>
  )
}
