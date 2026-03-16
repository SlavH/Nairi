"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  Globe, 
  FileText, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react"

interface Source {
  id: string
  title: string
  url: string
  snippet: string
  relevance: number
  domain: string
}

interface ResearchStep {
  id: string
  title: string
  status: "pending" | "in-progress" | "completed"
  description?: string
}

interface DeepResearchProps {
  query: string
  isActive: boolean
  onComplete?: (result: ResearchResult) => void
}

interface ResearchResult {
  summary: string
  sources: Source[]
  keyFindings: string[]
  relatedQuestions: string[]
}

const defaultSteps: ResearchStep[] = [
  { id: "1", title: "Analyzing query", status: "pending" },
  { id: "2", title: "Searching sources", status: "pending" },
  { id: "3", title: "Reading documents", status: "pending" },
  { id: "4", title: "Cross-referencing", status: "pending" },
  { id: "5", title: "Synthesizing findings", status: "pending" },
  { id: "6", title: "Generating report", status: "pending" },
]

export function DeepResearch({ query, isActive, onComplete }: DeepResearchProps) {
  const [steps, setSteps] = useState<ResearchStep[]>(defaultSteps)
  const [sources, setSources] = useState<Source[]>([])
  const [progress, setProgress] = useState(0)
  const [isExpanded, setIsExpanded] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)

  // Real research process using API
  const startResearch = async () => {
    try {
      // Update first step
      setCurrentStep(0)
      setSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === 0 ? "in-progress" : "pending"
      })))
      setProgress(10)

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, depth: 'standard' })
      })

      if (!response.ok) {
        throw new Error('Research request failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullContent = ''
      let keyFindings: string[] = []
      let relatedQuestions: string[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'status') {
                // Update steps based on status
                if (data.step === 'analyzing') {
                  setCurrentStep(0)
                  setProgress(20)
                } else if (data.step === 'researching') {
                  setCurrentStep(2)
                  setProgress(50)
                  setSteps(prev => prev.map((step, idx) => ({
                    ...step,
                    status: idx <= 2 ? "completed" : idx === 3 ? "in-progress" : "pending"
                  })))
                }
              }
              
              if (data.type === 'content') {
                fullContent += data.content
                // Progress based on content length
                setProgress(Math.min(90, 50 + (fullContent.length / 100)))
              }
              
              if (data.type === 'complete') {
                keyFindings = data.findings || []
                relatedQuestions = data.relatedQuestions || []
                
                // Generate sources from findings
                setSources(keyFindings.slice(0, 3).map((finding, idx) => ({
                  id: String(idx + 1),
                  title: finding.slice(0, 50) + (finding.length > 50 ? '...' : ''),
                  url: '#',
                  snippet: finding,
                  relevance: 95 - idx * 5,
                  domain: 'research'
                })))
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
      
      // Mark all as completed
      setSteps(prev => prev.map(step => ({ ...step, status: "completed" })))
      setProgress(100)
      
      if (onComplete) {
        onComplete({
          summary: fullContent.slice(0, 500) + '...',
          sources: sources,
          keyFindings,
          relatedQuestions
        })
      }
    } catch (error) {
      console.error('Research error:', error)
      setSteps(prev => prev.map(step => ({ ...step, status: "pending" })))
      setProgress(0)
    }
  }

  if (!isActive) return null

  return (
    <Card className="border-purple-500/30 bg-purple-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-purple-500" />
            Deep Research Mode
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Conducting comprehensive research on: "{query}"
        </p>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Research Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  step.status === "in-progress" ? "bg-purple-500/10" : ""
                }`}
              >
                {step.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : step.status === "in-progress" ? (
                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`text-sm ${
                  step.status === "completed" ? "text-muted-foreground" :
                  step.status === "in-progress" ? "text-foreground font-medium" :
                  "text-muted-foreground"
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Sources Found */}
          {sources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Sources Found ({sources.length})
              </h4>
              <div className="space-y-2">
                {sources.map((source) => (
                  <div 
                    key={source.id}
                    className="p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <a 
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-purple-500 flex items-center gap-1"
                        >
                          {source.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {source.snippet}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {source.relevance}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Button */}
          {progress === 0 && (
            <Button 
              onClick={startResearch}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Start Deep Research
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
