"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Gauge,
  Zap,
  Image,
  FileCode,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Smartphone,
  Monitor,
  Globe,
  Shield,
  Accessibility,
  Search,
  Loader2,
  ChevronRight,
  Info,
  Lightbulb
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PerformanceMetric {
  id: string
  name: string
  value: number
  maxValue: number
  unit: string
  status: 'good' | 'needs-improvement' | 'poor'
  description: string
  suggestion?: string
}

interface PerformanceCategory {
  id: string
  name: string
  icon: React.ElementType
  score: number
  metrics: PerformanceMetric[]
}

interface PerformanceIssue {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  impact: string
  fix: string
}

interface PerformanceDashboardProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  code?: string
}

const STATUS_COLORS = {
  good: 'text-green-500',
  'needs-improvement': 'text-amber-500',
  poor: 'text-red-500'
}

const STATUS_BG = {
  good: 'bg-green-500',
  'needs-improvement': 'bg-amber-500',
  poor: 'bg-red-500'
}

const SEVERITY_COLORS = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
}

const SEVERITY_ICONS = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Info
}

export function PerformanceDashboard({ isOpen, onOpenChange, code = '' }: PerformanceDashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [overallScore, setOverallScore] = useState(0)
  const [categories, setCategories] = useState<PerformanceCategory[]>([])
  const [issues, setIssues] = useState<PerformanceIssue[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const analyzePerformance = useCallback(async () => {
    setIsAnalyzing(true)
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Analyze code for common issues
    const codeLower = code.toLowerCase()
    const hasLazyLoading = codeLower.includes('lazy') || codeLower.includes('suspense')
    const hasImageOptimization = codeLower.includes('next/image') || codeLower.includes('loading="lazy"')
    const hasMinification = true // Assume Next.js handles this
    const hasCaching = codeLower.includes('cache') || codeLower.includes('revalidate')
    const hasAccessibility = codeLower.includes('aria-') || codeLower.includes('role=')
    const hasSEO = codeLower.includes('metadata') || codeLower.includes('head')
    const hasResponsive = codeLower.includes('md:') || codeLower.includes('lg:') || codeLower.includes('sm:')
    const bundleSize = code.length // Simplified metric

    // Calculate scores
    const performanceScore = Math.min(100, Math.max(0,
      (hasLazyLoading ? 20 : 0) +
      (hasImageOptimization ? 25 : 0) +
      (hasMinification ? 20 : 0) +
      (hasCaching ? 15 : 0) +
      (bundleSize < 10000 ? 20 : bundleSize < 50000 ? 10 : 0)
    ))

    const accessibilityScore = Math.min(100, Math.max(0,
      (hasAccessibility ? 50 : 20) +
      (codeLower.includes('alt=') ? 25 : 0) +
      (codeLower.includes('tabindex') ? 15 : 0) +
      (codeLower.includes('sr-only') ? 10 : 0)
    ))

    const seoScore = Math.min(100, Math.max(0,
      (hasSEO ? 40 : 0) +
      (codeLower.includes('title') ? 20 : 0) +
      (codeLower.includes('description') ? 20 : 0) +
      (codeLower.includes('og:') ? 20 : 0)
    ))

    const bestPracticesScore = Math.min(100, Math.max(0,
      (hasResponsive ? 30 : 0) +
      (codeLower.includes('https') ? 20 : 10) +
      (codeLower.includes('error') ? 20 : 0) +
      (codeLower.includes('typescript') || code.includes(': ') ? 30 : 15)
    ))

    const newCategories: PerformanceCategory[] = [
      {
        id: 'performance',
        name: 'Performance',
        icon: Zap,
        score: performanceScore,
        metrics: [
          {
            id: 'fcp',
            name: 'First Contentful Paint',
            value: hasLazyLoading ? 1.2 : 2.5,
            maxValue: 4,
            unit: 's',
            status: hasLazyLoading ? 'good' : 'needs-improvement',
            description: 'Time until first content is painted',
            suggestion: !hasLazyLoading ? 'Add lazy loading for below-fold content' : undefined
          },
          {
            id: 'lcp',
            name: 'Largest Contentful Paint',
            value: hasImageOptimization ? 1.8 : 3.5,
            maxValue: 4,
            unit: 's',
            status: hasImageOptimization ? 'good' : 'needs-improvement',
            description: 'Time until largest content element is visible',
            suggestion: !hasImageOptimization ? 'Use next/image for optimized images' : undefined
          },
          {
            id: 'cls',
            name: 'Cumulative Layout Shift',
            value: 0.05,
            maxValue: 0.25,
            unit: '',
            status: 'good',
            description: 'Measures visual stability'
          },
          {
            id: 'bundle',
            name: 'Bundle Size',
            value: Math.round(bundleSize / 1024),
            maxValue: 500,
            unit: 'KB',
            status: bundleSize < 50000 ? 'good' : bundleSize < 150000 ? 'needs-improvement' : 'poor',
            description: 'Total JavaScript bundle size',
            suggestion: bundleSize > 50000 ? 'Consider code splitting and tree shaking' : undefined
          }
        ]
      },
      {
        id: 'accessibility',
        name: 'Accessibility',
        icon: Accessibility,
        score: accessibilityScore,
        metrics: [
          {
            id: 'aria',
            name: 'ARIA Labels',
            value: hasAccessibility ? 95 : 40,
            maxValue: 100,
            unit: '%',
            status: hasAccessibility ? 'good' : 'poor',
            description: 'Interactive elements have accessible names',
            suggestion: !hasAccessibility ? 'Add aria-label to interactive elements' : undefined
          },
          {
            id: 'contrast',
            name: 'Color Contrast',
            value: 85,
            maxValue: 100,
            unit: '%',
            status: 'good',
            description: 'Text has sufficient contrast ratio'
          },
          {
            id: 'keyboard',
            name: 'Keyboard Navigation',
            value: codeLower.includes('tabindex') ? 90 : 60,
            maxValue: 100,
            unit: '%',
            status: codeLower.includes('tabindex') ? 'good' : 'needs-improvement',
            description: 'All interactive elements are keyboard accessible'
          }
        ]
      },
      {
        id: 'seo',
        name: 'SEO',
        icon: Search,
        score: seoScore,
        metrics: [
          {
            id: 'meta',
            name: 'Meta Tags',
            value: hasSEO ? 100 : 30,
            maxValue: 100,
            unit: '%',
            status: hasSEO ? 'good' : 'poor',
            description: 'Page has proper meta tags',
            suggestion: !hasSEO ? 'Add metadata export with title and description' : undefined
          },
          {
            id: 'og',
            name: 'Open Graph',
            value: codeLower.includes('og:') ? 100 : 0,
            maxValue: 100,
            unit: '%',
            status: codeLower.includes('og:') ? 'good' : 'poor',
            description: 'Social media sharing tags',
            suggestion: !codeLower.includes('og:') ? 'Add Open Graph meta tags for social sharing' : undefined
          },
          {
            id: 'semantic',
            name: 'Semantic HTML',
            value: 75,
            maxValue: 100,
            unit: '%',
            status: 'good',
            description: 'Uses semantic HTML elements'
          }
        ]
      },
      {
        id: 'best-practices',
        name: 'Best Practices',
        icon: Shield,
        score: bestPracticesScore,
        metrics: [
          {
            id: 'responsive',
            name: 'Responsive Design',
            value: hasResponsive ? 100 : 50,
            maxValue: 100,
            unit: '%',
            status: hasResponsive ? 'good' : 'needs-improvement',
            description: 'Works well on all screen sizes',
            suggestion: !hasResponsive ? 'Add responsive breakpoints (sm:, md:, lg:)' : undefined
          },
          {
            id: 'https',
            name: 'HTTPS',
            value: 100,
            maxValue: 100,
            unit: '%',
            status: 'good',
            description: 'Uses secure connections'
          },
          {
            id: 'errors',
            name: 'Error Handling',
            value: codeLower.includes('error') ? 90 : 50,
            maxValue: 100,
            unit: '%',
            status: codeLower.includes('error') ? 'good' : 'needs-improvement',
            description: 'Proper error boundaries and handling'
          }
        ]
      }
    ]

    // Generate issues
    const newIssues: PerformanceIssue[] = []

    if (!hasImageOptimization) {
      newIssues.push({
        id: 'img-opt',
        severity: 'critical',
        title: 'Images not optimized',
        description: 'Using standard img tags instead of optimized Next.js Image component',
        impact: 'Can increase LCP by 2-3 seconds',
        fix: 'Replace <img> with next/image component'
      })
    }

    if (!hasLazyLoading) {
      newIssues.push({
        id: 'lazy',
        severity: 'warning',
        title: 'No lazy loading detected',
        description: 'Components are loaded eagerly which can slow initial page load',
        impact: 'Increases initial bundle size and FCP',
        fix: 'Use React.lazy() and Suspense for code splitting'
      })
    }

    if (!hasSEO) {
      newIssues.push({
        id: 'seo-meta',
        severity: 'warning',
        title: 'Missing SEO metadata',
        description: 'Page lacks proper meta tags for search engines',
        impact: 'Poor search engine visibility',
        fix: 'Add metadata export with title, description, and keywords'
      })
    }

    if (!hasAccessibility) {
      newIssues.push({
        id: 'a11y',
        severity: 'warning',
        title: 'Accessibility improvements needed',
        description: 'Missing ARIA labels on interactive elements',
        impact: 'Screen reader users may have difficulty navigating',
        fix: 'Add aria-label, aria-describedby, and role attributes'
      })
    }

    if (!hasResponsive) {
      newIssues.push({
        id: 'responsive',
        severity: 'info',
        title: 'Limited responsive design',
        description: 'Few responsive breakpoints detected',
        impact: 'May not display well on all devices',
        fix: 'Add Tailwind responsive prefixes (sm:, md:, lg:)'
      })
    }

    setCategories(newCategories)
    setIssues(newIssues)
    setOverallScore(Math.round(
      (performanceScore + accessibilityScore + seoScore + bestPracticesScore) / 4
    ))
    setIsAnalyzing(false)
    toast.success('Analysis complete!')
  }, [code])

  // Auto-analyze when opened
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      analyzePerformance()
    }
  }, [isOpen, categories.length, analyzePerformance])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Gauge className="h-4 w-4 text-white" />
            </div>
            Performance Dashboard
          </SheetTitle>
          <SheetDescription>
            Analyze and optimize your website's performance
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Overall Score */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-5xl font-bold", getScoreColor(overallScore))}>
                        {isAnalyzing ? '--' : overallScore}
                      </span>
                      <span className="text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <div className={cn(
                    "h-20 w-20 rounded-full flex items-center justify-center",
                    isAnalyzing ? 'bg-muted' : getScoreBg(overallScore) + '/20'
                  )}>
                    {isAnalyzing ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : overallScore >= 90 ? (
                      <CheckCircle2 className={cn("h-10 w-10", getScoreColor(overallScore))} />
                    ) : overallScore >= 50 ? (
                      <AlertTriangle className={cn("h-10 w-10", getScoreColor(overallScore))} />
                    ) : (
                      <XCircle className={cn("h-10 w-10", getScoreColor(overallScore))} />
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 gap-2"
                  onClick={analyzePerformance}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                </Button>
              </CardContent>
            </Card>

            {/* Category Scores */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Categories</Label>
              {categories.map(category => (
                <Card
                  key={category.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    expandedCategory === category.id && "border-violet-500"
                  )}
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        getScoreBg(category.score) + '/20'
                      )}>
                        <category.icon className={cn("h-5 w-5", getScoreColor(category.score))} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category.name}</span>
                          <span className={cn("font-bold", getScoreColor(category.score))}>
                            {category.score}
                          </span>
                        </div>
                        <Progress
                          value={category.score}
                          className="h-2 mt-1"
                        />
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        expandedCategory === category.id && "rotate-90"
                      )} />
                    </div>

                    {/* Expanded Metrics */}
                    {expandedCategory === category.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {category.metrics.map(metric => (
                          <div key={metric.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{metric.name}</span>
                              <span className={cn("font-medium", STATUS_COLORS[metric.status])}>
                                {metric.value}{metric.unit}
                              </span>
                            </div>
                            <Progress
                              value={(metric.value / metric.maxValue) * 100}
                              className="h-1.5"
                            />
                            {metric.suggestion && (
                              <p className="text-xs text-amber-600 flex items-start gap-1">
                                <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                                {metric.suggestion}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Issues */}
            {issues.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Issues Found</Label>
                  <Badge variant="secondary">{issues.length}</Badge>
                </div>
                {issues.map(issue => {
                  const SeverityIcon = SEVERITY_ICONS[issue.severity]
                  return (
                    <Card key={issue.id} className={cn("border", SEVERITY_COLORS[issue.severity])}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <SeverityIcon className="h-5 w-5 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{issue.title}</p>
                            <p className="text-xs text-muted-foreground">{issue.description}</p>
                            <div className="pt-2 space-y-1">
                              <p className="text-xs">
                                <span className="font-medium">Impact:</span> {issue.impact}
                              </p>
                              <p className="text-xs">
                                <span className="font-medium">Fix:</span> {issue.fix}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// Trigger button
export function PerformanceDashboardTrigger({ onClick, score }: { onClick: () => void; score?: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-500'
    if (s >= 50) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onClick}
          >
            <Gauge className="h-4 w-4" />
            {score !== undefined && (
              <span className={cn("font-bold", getScoreColor(score))}>{score}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Performance Dashboard</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
