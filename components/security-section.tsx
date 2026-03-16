"use client"

import { useState } from "react"
import { Shield, Eye, Lock, AlertCircle, ChevronDown } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"

export function SecuritySection() {
  const { t } = useTranslation()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const securityFeatures = [
    {
      icon: Shield,
      title: t.security?.features?.isolatedExecution?.title ?? "Isolated execution",
      description: t.security?.features?.isolatedExecution?.description ?? "All operations run in secure, sandboxed environments.",
      details: t.security?.features?.isolatedExecution?.details ?? "Each task runs in its own isolated container with no access to other users' data.",
    },
    {
      icon: Eye,
      title: t.security?.features?.fullTransparency?.title ?? "Full transparency",
      description: t.security?.features?.fullTransparency?.description ?? "See exactly what Nairi is doing at any moment.",
      details: t.security?.features?.fullTransparency?.details ?? "Real-time activity logs and detailed execution traces.",
    },
    {
      icon: Lock,
      title: t.security?.features?.criticalConfirmation?.title ?? "Critical confirmation",
      description: t.security?.features?.criticalConfirmation?.description ?? "Important operations require your explicit approval.",
      details: t.security?.features?.criticalConfirmation?.details ?? "Configurable approval thresholds and two-factor confirmation.",
    },
    {
      icon: AlertCircle,
      title: t.security?.features?.intelligentRefusal?.title ?? "Intelligent refusal",
      description: t.security?.features?.intelligentRefusal?.description ?? "Nairi will refuse requests it deems harmful or ineffective.",
      details: t.security?.features?.intelligentRefusal?.details ?? "Built-in safety guardrails and ethical boundaries.",
    },
  ]

  return (
    <section id="security" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#22d3ee]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {(t.security?.title ?? "Power with control").split(' ').slice(0, -1).join(' ')} <span className="gradient-text">{(t.security?.title ?? "Power with control").split(' ').pop()}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.security?.subtitle ?? "Autonomy doesn't mean opacity. You always understand what's happening and retain complete control."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {securityFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`p-6 rounded-2xl border bg-card/50 backdrop-blur-sm cursor-pointer transition-all ${
                expandedIndex === index ? "border-[#22d3ee] glow-cyan" : "border-border hover:border-[#22d3ee]/50"
              }`}
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#22d3ee]" />
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    expandedIndex === index ? "rotate-180" : ""
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  expandedIndex === index ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0"
                }`}
              >
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">{feature.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
