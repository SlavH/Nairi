"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  HelpCircle,
  Brain,
  BookOpen,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Scale,
} from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

interface ConfidenceBreakdown {
  overall: number
  factual: number
  reasoning: number
  sourceQuality: number
  explanation: string
}

interface SourceInfo {
  type: "peer-reviewed" | "first-hand" | "opinion" | "unknown"
  strength: number
  description: string
}

interface ExplainWhyModalProps {
  responseText: string
  confidence: ConfidenceBreakdown
  sources?: SourceInfo[]
  reasoningSteps?: string[]
  alternativeViews?: string[]
  trigger?: React.ReactNode
}

export function ExplainWhyModal({
  responseText,
  confidence,
  sources = [],
  reasoningSteps = [],
  alternativeViews = [],
  trigger,
}: ExplainWhyModalProps) {
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState("reasoning")

  const getSourceIcon = (type: SourceInfo["type"]) => {
    switch (type) {
      case "peer-reviewed":
        return <Shield className="h-4 w-4 text-green-500" />
      case "first-hand":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case "opinion":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
  }

  const getConfidenceColor = (value: number) => {
    if (value >= 0.8) return "text-green-500"
    if (value >= 0.6) return "text-yellow-500"
    return "text-orange-500"
  }

  const getProgressColor = (value: number) => {
    if (value >= 0.8) return "bg-green-500"
    if (value >= 0.6) return "bg-yellow-500"
    return "bg-orange-500"
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
            {t.chat.explainWhy.button}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t.chat.explainWhy.title}
          </DialogTitle>
          <DialogDescription>Transparency into how this response was generated</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reasoning" className="gap-1">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">{t.chat.explainWhy.reasoning}</span>
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t.chat.explainWhy.sources}</span>
            </TabsTrigger>
            <TabsTrigger value="confidence" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t.chat.explainWhy.confidence}</span>
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="gap-1">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">{t.chat.explainWhy.alternatives}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reasoning" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reasoning Process</CardTitle>
                <CardDescription>Step-by-step breakdown of how this answer was formed</CardDescription>
              </CardHeader>
              <CardContent>
                {reasoningSteps.length > 0 ? (
                  <div className="space-y-3">
                    {reasoningSteps.map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        1
                      </div>
                      <p className="text-sm text-muted-foreground pt-0.5">
                        Analyzed the input query and identified key concepts
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        2
                      </div>
                      <p className="text-sm text-muted-foreground pt-0.5">
                        Retrieved relevant knowledge from training data
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        3
                      </div>
                      <p className="text-sm text-muted-foreground pt-0.5">
                        Synthesized information with logical reasoning
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        4
                      </div>
                      <p className="text-sm text-muted-foreground pt-0.5">
                        Formatted response for clarity and usefulness
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.trust.sourceStrength}</CardTitle>
                <CardDescription>Evaluation of information sources used</CardDescription>
              </CardHeader>
              <CardContent>
                {sources.length > 0 ? (
                  <div className="space-y-3">
                    {sources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {getSourceIcon(source.type)}
                          <div>
                            <p className="font-medium text-sm capitalize">{source.type.replace("-", " ")}</p>
                            <p className="text-xs text-muted-foreground">{source.description}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            source.strength >= 0.8
                              ? "border-green-500/50 text-green-500"
                              : source.strength >= 0.5
                                ? "border-yellow-500/50 text-yellow-500"
                                : "border-orange-500/50 text-orange-500",
                          )}
                        >
                          {Math.round(source.strength * 100)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Brain className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">Training Knowledge</p>
                          <p className="text-xs text-muted-foreground">Based on pre-trained knowledge base</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-500/50 text-blue-500">
                        Primary
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{t.trust.verifyWithSources}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confidence" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.trust.confidenceScore}</CardTitle>
                <CardDescription>{confidence.explanation}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Score */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-[#e052a0]/10 to-[#00c9c8]/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Confidence</span>
                    <span className={cn("font-bold text-lg", getConfidenceColor(confidence.overall))}>
                      {Math.round(confidence.overall * 100)}%
                    </span>
                  </div>
                  <Progress value={confidence.overall * 100} className="h-3" />
                </div>

                {/* Breakdown */}
                <div className="grid gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t.trust.factual}</span>
                      <span className={cn("text-sm font-medium", getConfidenceColor(confidence.factual))}>
                        {Math.round(confidence.factual * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getProgressColor(confidence.factual))}
                        style={{ width: `${confidence.factual * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t.trust.reasoning}</span>
                      <span className={cn("text-sm font-medium", getConfidenceColor(confidence.reasoning))}>
                        {Math.round(confidence.reasoning * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getProgressColor(confidence.reasoning))}
                        style={{ width: `${confidence.reasoning * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t.trust.sourceQuality}</span>
                      <span className={cn("text-sm font-medium", getConfidenceColor(confidence.sourceQuality))}>
                        {Math.round(confidence.sourceQuality * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getProgressColor(confidence.sourceQuality))}
                        style={{ width: `${confidence.sourceQuality * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alternatives" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  {t.trust.antiEchoChamber}
                </CardTitle>
                <CardDescription>{t.trust.opposingView}</CardDescription>
              </CardHeader>
              <CardContent>
                {alternativeViews.length > 0 ? (
                  <div className="space-y-3">
                    {alternativeViews.map((view, index) => (
                      <div key={index} className="p-3 rounded-lg border border-border bg-muted/30">
                        <p className="text-sm">{view}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-500">Consider Alternative Views</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            This response represents one perspective. Complex topics often have multiple valid
                            viewpoints. Consider exploring different angles or consulting additional sources.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        To see specific alternative perspectives, try asking: "What are opposing views on this?" or
                        "What might someone disagree with here?"
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
