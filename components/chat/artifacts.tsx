"use client"

import { useState, useCallback } from "react"
import { X, Copy, Download, Maximize2, Minimize2, Code, FileText, Table, Play, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ArtifactType = "code" | "html" | "markdown" | "table" | "mermaid" | "svg"

interface ArtifactProps {
  type: ArtifactType
  title: string
  content: string
  language?: string
  onClose?: () => void
}

export function Artifact({ type, title, content, language = "javascript", onClose }: ArtifactProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(type === "html" || type === "svg")

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy")
    }
  }, [content])

  const downloadFile = useCallback(() => {
    const extensions: Record<ArtifactType, string> = {
      code: language === "python" ? ".py" : language === "javascript" ? ".js" : language === "typescript" ? ".ts" : ".txt",
      html: ".html",
      markdown: ".md",
      table: ".csv",
      mermaid: ".mmd",
      svg: ".svg"
    }
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, "_")}${extensions[type]}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("File downloaded")
  }, [content, title, type, language])

  const getIcon = () => {
    switch (type) {
      case "code": return <Code className="h-4 w-4" />
      case "table": return <Table className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const renderContent = () => {
    if (type === "html" && showPreview) {
      return (
        <iframe
          srcDoc={content}
          className="w-full h-full min-h-[300px] bg-white rounded"
          sandbox="allow-scripts"
          title={title}
        />
      )
    }

    if (type === "svg" && showPreview) {
      return (
        <div 
          className="w-full h-full min-h-[200px] flex items-center justify-center bg-white rounded p-4"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )
    }

    if (type === "markdown") {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none p-4">
          {content}
        </div>
      )
    }

    // Code view
    return (
      <pre className="p-4 overflow-auto text-sm font-mono bg-zinc-950 text-zinc-100 rounded">
        <code>{content}</code>
      </pre>
    )
  }

  return (
    <div
      className={cn(
        "border border-border rounded-lg overflow-hidden bg-card transition-all",
        isExpanded ? "fixed inset-4 z-50" : "max-w-2xl"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium text-sm">{title}</span>
          {language && type === "code" && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {(type === "html" || type === "svg") && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={downloadFile}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={cn("overflow-auto", isExpanded ? "h-[calc(100%-48px)]" : "max-h-[400px]")}>
        {renderContent()}
      </div>
    </div>
  )
}

// Helper to detect and parse artifacts from message content
export function parseArtifacts(content: string): { text: string; artifacts: ArtifactProps[] } {
  const artifacts: ArtifactProps[] = []
  let text = content

  // Match code blocks with language
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  let match
  let index = 0

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || "text"
    const code = match[2].trim()
    
    // Determine artifact type
    let type: ArtifactType = "code"
    if (language === "html") type = "html"
    else if (language === "markdown" || language === "md") type = "markdown"
    else if (language === "mermaid") type = "mermaid"
    else if (language === "svg") type = "svg"

    artifacts.push({
      type,
      title: `Code Block ${++index}`,
      content: code,
      language
    })
  }

  // Remove code blocks from text for cleaner display
  text = content.replace(codeBlockRegex, "[See artifact above]")

  return { text, artifacts }
}

// Alias for backward compatibility


// Export default for easier imports
export default Artifact
