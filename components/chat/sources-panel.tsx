"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  ExternalLink, 
  Globe, 
  FileText, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Link2,
  Quote,
  CheckCircle,
  Clock
} from "lucide-react"

export interface Source {
  id: string
  title: string
  url: string
  snippet: string
  domain: string
  favicon?: string
  publishedDate?: string
  author?: string
  type: "web" | "academic" | "news" | "documentation" | "video"
  citationNumber?: number
  relevanceScore?: number
}

interface SourcesPanelProps {
  sources: Source[]
  isLoading?: boolean
  onSourceClick?: (source: Source) => void
  compact?: boolean
}

const sourceTypeIcons = {
  web: Globe,
  academic: BookOpen,
  news: FileText,
  documentation: FileText,
  video: Globe
}

const sourceTypeColors = {
  web: "bg-blue-500/10 text-blue-500",
  academic: "bg-purple-500/10 text-purple-500",
  news: "bg-green-500/10 text-green-500",
  documentation: "bg-orange-500/10 text-orange-500",
  video: "bg-red-500/10 text-red-500"
}

export function SourcesPanel({ sources, isLoading, onSourceClick, compact = false }: SourcesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [hoveredSource, setHoveredSource] = useState<string | null>(null)

  if (sources.length === 0 && !isLoading) return null

  return (
    <Card className="border-muted-foreground/20">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            Sources ({sources.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {sources.map((source, index) => {
                  const Icon = sourceTypeIcons[source.type]
                  const colorClass = sourceTypeColors[source.type]
                  
                  return (
                    <TooltipProvider key={source.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`p-3 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer ${
                              hoveredSource === source.id ? "bg-muted/50" : "bg-background"
                            }`}
                            onMouseEnter={() => setHoveredSource(source.id)}
                            onMouseLeave={() => setHoveredSource(null)}
                            onClick={() => onSourceClick?.(source)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Citation Number */}
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                {source.citationNumber || index + 1}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {source.favicon ? (
                                    <img 
                                      src={source.favicon} 
                                      alt="" 
                                      className="w-4 h-4 rounded"
                                    />
                                  ) : (
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-xs text-muted-foreground truncate">
                                    {source.domain}
                                  </span>
                                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${colorClass}`}>
                                    {source.type}
                                  </Badge>
                                </div>
                                
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium hover:text-primary line-clamp-1 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {source.title}
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                </a>
                                
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {source.snippet}
                                </p>

                                {(source.author || source.publishedDate) && (
                                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                                    {source.author && <span>{source.author}</span>}
                                    {source.author && source.publishedDate && <span>•</span>}
                                    {source.publishedDate && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {source.publishedDate}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Relevance Score */}
                              {source.relevanceScore && (
                                <div className="flex-shrink-0">
                                  <Badge variant="outline" className="text-[10px]">
                                    {source.relevanceScore}%
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="text-xs">{source.snippet}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Inline citation component for use within message text
export function InlineCitation({ number, source }: { number: number; source: Source }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-medium hover:bg-primary/30 transition-colors align-super ml-0.5"
          >
            {number}
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-xs">{source.title}</p>
            <p className="text-[10px] text-muted-foreground">{source.domain}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Component to render text with inline citations
export function TextWithCitations({ 
  text, 
  sources 
}: { 
  text: string
  sources: Source[] 
}) {
  // Parse text for citation markers like [1], [2], etc.
  const parts = text.split(/(\[\d+\])/g)
  
  return (
    <span>
      {parts.map((part, index) => {
        const match = part.match(/\[(\d+)\]/)
        if (match) {
          const citationNum = parseInt(match[1])
          const source = sources.find(s => s.citationNumber === citationNum)
          if (source) {
            return <InlineCitation key={index} number={citationNum} source={source} />
          }
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
