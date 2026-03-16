"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Check,
  Download,
  Undo,
  Redo,
  Search,
  Settings,
  Maximize2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { ProjectFile } from "@/lib/builder-v2/types"

interface CodeEditorProps {
  file: ProjectFile
  onChange: (content: string) => void
}

// Simple syntax highlighting (in production, use Monaco or CodeMirror)
function highlightCode(code: string, language: string): string {
  // Basic keyword highlighting for TypeScript/JavaScript
  if (language === "typescript" || language === "javascript") {
    return code
      .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|new|this|async|await|try|catch|throw|default)\b/g, '<span class="text-purple-500">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-orange-500">$1</span>')
      .replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="text-green-500">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-blue-500">$1</span>')
  }
  return code
}

export function CodeEditor({ file, onChange }: CodeEditorProps) {
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(file.content)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  // Download file
  const handleDownload = () => {
    const blob = new Blob([file.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${file.name}`)
  }

  // Calculate line numbers
  const lines = file.content.split("\n")
  const lineCount = lines.length

  // Handle tab key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newContent = file.content.substring(0, start) + "  " + file.content.substring(end)
      onChange(newContent)
      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#333] px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-[#333] border-[#444] text-gray-300">
            {file.language}
          </Badge>
          <span className="text-sm text-gray-400">{file.path}</span>
          {file.isModified && (
            <span className="h-2 w-2 rounded-full bg-blue-500" title="Modified" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-[#333]"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-[#333]"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-[#333]"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 shrink-0 overflow-hidden bg-[#1e1e1e] text-right font-mono text-sm text-gray-500 select-none"
        >
          <div className="py-2 pr-3">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1} className="leading-6">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code area */}
        <div className="relative flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={file.content}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            className={cn(
              "absolute inset-0 w-full h-full resize-none bg-transparent p-2 font-mono text-sm leading-6 text-gray-200 outline-none",
              "caret-white selection:bg-blue-500/30"
            )}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-[#333] px-4 py-1 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Ln {lineCount}, Col 1</span>
          <span>{file.content.length} characters</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{file.language.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}
