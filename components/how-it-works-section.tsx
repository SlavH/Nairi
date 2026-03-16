"use client"

import { useEffect, useRef, useState } from "react"
import { MessageSquare, Brain, Zap, CheckCircle2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

const steps = [
  {
    icon: MessageSquare,
    key: "speakMind" as const,
  },
  {
    icon: Brain,
    key: "understands" as const,
  },
  {
    icon: Zap,
    key: "execution" as const,
  },
  {
    icon: CheckCircle2,
    key: "receiveResult" as const,
  },
]

export function HowItWorksSection() {
  const { t } = useTranslation()
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the animation of each step
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleSteps((prev) => [...new Set([...prev, index])])
              }, index * 200)
            })
          }
        })
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="how-it-works" className="py-20 md:py-32 relative" ref={sectionRef}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#22d3ee]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t.howItWorks.title.split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{t.howItWorks.title.split(' ').pop()}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`relative group transition-all duration-500 ${
                visibleSteps.includes(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm h-full transition-all hover:border-[#e879f9]/50 hover:glow-pink cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="w-6 h-6 text-[#e879f9]" />
                </div>
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-sm font-medium gradient-text">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{t.howItWorks.steps[step.key].title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.howItWorks.steps[step.key].description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-[#e879f9]/50 to-[#22d3ee]/50" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
