"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sparkles, FileText, Globe, BarChart3, ArrowRight, Code, Palette, Play, BookOpen, Zap, Lock } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import { useState } from "react"
import Link from "next/link"

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

const examplePrompts = [
  { 
    icon: FileText, 
    labelKey: "presentations",
    category: "Presentation",
    descriptionKey: "presentationDesc" 
  },
  { 
    icon: Globe, 
    labelKey: "websites",
    category: "Website",
    descriptionKey: "websiteDesc" 
  },
  { 
    icon: BarChart3, 
    labelKey: "analysis",
    category: "Analysis",
    descriptionKey: "analysisDesc" 
  },
]

const sampleTemplates = [
  {
    id: "startup-pitch",
    titleKey: "startupPitch",
    descriptionKey: "startupPitchDesc",
    icon: FileText,
    category: "Presentation",
    color: "from-orange-500 to-red-500"
  },
  {
    id: "saas-landing",
    titleKey: "saasLanding",
    descriptionKey: "saasLandingDesc",
    icon: Globe,
    category: "Website",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "brand-identity",
    titleKey: "brandIdentity",
    descriptionKey: "brandIdentityDesc",
    icon: Palette,
    category: "Visual",
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "api-code",
    titleKey: "restApi",
    descriptionKey: "restApiDesc",
    icon: Code,
    category: "Code",
    color: "from-slate-500 to-zinc-600"
  },
  {
    id: "market-analysis",
    titleKey: "marketAnalysis",
    descriptionKey: "marketAnalysisDesc",
    icon: BarChart3,
    category: "Analysis",
    color: "from-indigo-500 to-violet-500"
  }
]

const guidedTutorials = [
  {
    id: "first-creation",
    titleKey: "firstCreation",
    descriptionKey: "firstCreationDesc",
    icon: Sparkles,
    stepsKey: "firstCreationSteps" as const
  },
  {
    id: "marketplace-intro",
    titleKey: "marketplaceIntro",
    descriptionKey: "marketplaceIntroDesc",
    icon: BookOpen,
    stepsKey: "marketplaceIntroSteps" as const
  },
  {
    id: "earn-credits",
    titleKey: "earnCredits",
    descriptionKey: "earnCreditsDesc",
    icon: Zap,
    stepsKey: "earnCreditsSteps" as const
  }
]

const tutorialSteps: Record<string, string[]> = {
  firstCreationSteps: ["Choose a creation type", "Describe your idea", "Review and refine", "Export or share"],
  marketplaceIntroSteps: ["Browse categories", "Preview agent capabilities", "Add to your workspace", "Start using"],
  earnCreditsSteps: ["Daily login rewards", "Watch educational content", "Invite friends", "Complete challenges"]
}

const exampleDescriptions: Record<string, string> = {
  presentationDesc: "A complete 12-slide deck with visuals, data, and narrative — generated from a single sentence.",
  websiteDesc: "A fully designed, responsive landing page with hero, features, pricing, and testimonials sections.",
  analysisDesc: "Deep market analysis with data visualizations, trend projections, and actionable recommendations."
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("examples")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-background border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t.demoModal.title}
          </DialogTitle>
          <DialogDescription>{t.demoModal.description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t.demoModal.tabs.examples}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t.demoModal.tabs.templates}
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              {t.demoModal.tabs.tutorials}
            </TabsTrigger>
          </TabsList>

          {/* Examples Tab — static preview of what Nairi creates */}
          <TabsContent value="examples" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 min-h-[350px] max-h-[400px] rounded-xl border border-border bg-card/50 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground mb-4">{t.demoModal.examplesIntro}</p>
              <div className="space-y-3">
                {examplePrompts.map((example) => (
                  <div
                    key={example.labelKey}
                    className="p-4 rounded-xl border border-border bg-background/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 flex items-center justify-center shrink-0">
                        <example.icon className="w-5 h-5 text-[#e879f9]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground">
                            {t.demoModal.examples[example.labelKey as keyof typeof t.demoModal.examples]}
                          </span>
                          <Badge variant="outline" className="text-xs">{example.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {exampleDescriptions[example.descriptionKey]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab — inspiration gallery */}
          <TabsContent value="templates" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 min-h-[350px] max-h-[400px] rounded-xl border border-border bg-card/50 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground mb-4">{t.demoModal.templatesIntro}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {sampleTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-xl border border-border bg-background/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center shrink-0`}>
                        <template.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">
                            {t.demoModal.templates[template.titleKey as keyof typeof t.demoModal.templates]}
                          </span>
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {t.demoModal.templates[template.descriptionKey as keyof typeof t.demoModal.templates]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tutorials Tab — informational, unchanged */}
          <TabsContent value="tutorials" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 min-h-[350px] max-h-[400px] rounded-xl border border-border bg-card/50 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground mb-4">{t.demoModal.tutorialsIntro}</p>
              <div className="space-y-4">
                {guidedTutorials.map((tutorial, idx) => (
                  <div
                    key={tutorial.id}
                    className="p-4 rounded-xl border border-border bg-background/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center text-white font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <tutorial.icon className="w-4 h-4 text-[#e879f9]" />
                          <span className="font-medium text-foreground">
                            {t.demoModal.tutorials[tutorial.titleKey as keyof typeof t.demoModal.tutorials]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {t.demoModal.tutorials[tutorial.descriptionKey as keyof typeof t.demoModal.tutorials]}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tutorialSteps[tutorial.stepsKey].map((step, stepIdx) => (
                            <span
                              key={stepIdx}
                              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                            >
                              {stepIdx + 1}. {step}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Honest CTA */}
        <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#e879f9]/10 to-[#22d3ee]/10 border border-border">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">{t.demoModal.ctaTitle}</p>
              <p className="text-sm text-muted-foreground">{t.demoModal.ctaSubtitle}</p>
            </div>
          </div>
          <Button asChild className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90">
            <Link href="/auth/sign-up">
              {t.demoModal.ctaButton}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
