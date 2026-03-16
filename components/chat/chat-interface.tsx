"use client"

import type React from "react"
import Image from "next/image"
// Web Speech API types (browser-native)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { 
  SendIcon as Send, BotIcon as Bot, UserIcon as User, Loader2Icon as Loader2, 
  RotateCcwIcon as RotateCcw, MicIcon as Mic, MicOffIcon as MicOff, 
  PaperclipIcon as Paperclip, XIcon as X, 
  ImageIcon, SparklesIcon as Sparkles, PaletteIcon as Palette, 
  CodeIcon as Code, Wand2Icon as Wand2, LayersIcon as Layers, 
  CopyIcon as Copy, CheckIcon as Check, BookOpenIcon as BookOpen, 
  GraduationCapIcon as GraduationCap, LightbulbIcon as Lightbulb, 
  TargetIcon as Target, FileTextIcon as FileText 
} from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ChatMode } from "./chat-mode-selector"
import { ConfidenceIndicator } from "./confidence-indicator"
import { TextToSpeech } from "./text-to-speech"
import { ToolsMenu } from "./tools-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { UsageIndicator } from "./usage-indicator"
import { QuickActions } from "./quick-actions"
import { LiveRegion } from "@/components/ui/live-region"
import { useTranslation } from "@/lib/i18n/context"
import { ThinkingSteps } from "./thinking-steps"
import { AnimatedMessageContent } from "./animated-message-content"
import { AnimatedConversationTitle } from "./animated-conversation-title"

// Voice input languages with native names
const VOICE_LANGUAGES = [
  { code: "en-US", name: "English", native: "English" },
  { code: "hy-AM", name: "Armenian", native: "\u0540\u0561\u0575\u0565\u0580\u0565\u0576" },
  { code: "ru-RU", name: "Russian", native: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  { code: "es-ES", name: "Spanish", native: "Espa\u00f1ol" },
  { code: "fr-FR", name: "French", native: "Fran\u00e7ais" },
  { code: "de-DE", name: "German", native: "Deutsch" },
  { code: "zh-CN", name: "Chinese", native: "\u4e2d\u6587" },
  { code: "ja-JP", name: "Japanese", native: "\u65e5\u672c\u8a9e" },
  { code: "ko-KR", name: "Korean", native: "\ud55c\uad6d\uc5b4" },
  { code: "ar-SA", name: "Arabic", native: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { code: "hi-IN", name: "Hindi", native: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "pt-BR", name: "Portuguese", native: "Portugu\u00eas" },
  { code: "it-IT", name: "Italian", native: "Italiano" },
  { code: "tr-TR", name: "Turkish", native: "T\u00fcrk\u00e7e" },
  { code: "pl-PL", name: "Polish", native: "Polski" },
  { code: "uk-UA", name: "Ukrainian", native: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430" },
  { code: "ka-GE", name: "Georgian", native: "\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8" },
]

interface Message {
  id: string
  conversation_id: string
  user_id: string
  role: string
  content: string
  created_at: string
  metadata?: {
    confidence?: number
    provider?: string
    mode?: string
  }
}

interface Conversation {
  id: string
  title: string
  user_id: string
}

export function ChatInterface({
  conversation,
  initialMessages,
  userId,
}: {
  conversation: Conversation
  initialMessages: Message[]
  userId: string
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const titleUpdatedRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [chatMode, setChatMode] = useState<ChatMode>("default")
  const [inputValue, setInputValue] = useState("")
  const inputValueRef = useRef("")

  // Keep ref in sync with state so submit and quick actions always see latest value
  useEffect(() => {
    inputValueRef.current = inputValue
  }, [inputValue])

  // Voice input state
  const [isListening, setIsListening] = useState(false)
  const [voiceLanguage, setVoiceLanguage] = useState("en-US")
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  // File upload state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  
  // Code copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
  // Tools menu state
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  
  // Copy code handler
  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    toast.success("Code copied to clipboard!")
    setTimeout(() => setCopiedCode(null), 2000)
  }, [])

  const copyMessage = useCallback((text: string, messageId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(messageId)
    toast.success("Message copied to clipboard")
    setTimeout(() => setCopiedMessageId(null), 2000)
  }, [])
  
  // Extract code blocks from message
  const extractCodeBlocks = useCallback((text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const blocks: { language: string; code: string; id: string }[] = []
    let match
    let index = 0
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
        id: `code-${index++}`
      })
    }
    return blocks
  }, [])
  
  // Remove code blocks for clean text display
  const removeCodeBlocks = useCallback((text: string) => {
    return text.replace(/```(\w+)?\n[\s\S]*?```/g, '').trim()
  }, [])

  // Render markdown text with full formatting support
  const renderMarkdownText = useCallback((text: string): React.ReactNode => {
    // Process text line by line for better control
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let keyIndex = 0
    let inList = false
    let listItems: React.ReactNode[] = []

    const processInlineMarkdown = (line: string, baseKey: string): React.ReactNode => {
      // Process inline elements: bold, italic, code, links, images
      const parts: React.ReactNode[] = []
      let remaining = line
      let partIndex = 0

      while (remaining.length > 0) {
        // Check for image: ![alt](url)
        const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
        if (imageMatch) {
          parts.push(
            <span key={`${baseKey}-img-${partIndex++}`} className="block my-2">
              <img src={imageMatch[2]} alt={imageMatch[1] || 'Image'} className="rounded-lg max-w-full h-auto max-h-96" />
            </span>
          )
          remaining = remaining.slice(imageMatch[0].length)
          continue
        }

        // Check for link: [text](url)
        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
        if (linkMatch) {
          parts.push(
            <a key={`${baseKey}-link-${partIndex++}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {linkMatch[1]}
            </a>
          )
          remaining = remaining.slice(linkMatch[0].length)
          continue
        }

        // Check for bold: **text** or __text__
        const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/)
        if (boldMatch) {
          parts.push(<strong key={`${baseKey}-bold-${partIndex++}`}>{boldMatch[2]}</strong>)
          remaining = remaining.slice(boldMatch[0].length)
          continue
        }

        // Check for italic: *text* or _text_
        const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/)
        if (italicMatch) {
          parts.push(<em key={`${baseKey}-italic-${partIndex++}`}>{italicMatch[2]}</em>)
          remaining = remaining.slice(italicMatch[0].length)
          continue
        }

        // Check for inline code: `code`
        const codeMatch = remaining.match(/^`([^`]+)`/)
        if (codeMatch) {
          parts.push(
            <code key={`${baseKey}-code-${partIndex++}`} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {codeMatch[1]}
            </code>
          )
          remaining = remaining.slice(codeMatch[0].length)
          continue
        }

        // No match, take next character
        const nextSpecial = remaining.search(/[!\[*_`]/)
        if (nextSpecial === -1) {
          parts.push(<span key={`${baseKey}-text-${partIndex++}`}>{remaining}</span>)
          break
        } else if (nextSpecial === 0) {
          parts.push(<span key={`${baseKey}-char-${partIndex++}`}>{remaining[0]}</span>)
          remaining = remaining.slice(1)
        } else {
          parts.push(<span key={`${baseKey}-text-${partIndex++}`}>{remaining.slice(0, nextSpecial)}</span>)
          remaining = remaining.slice(nextSpecial)
        }
      }

      return parts.length === 1 ? parts[0] : <>{parts}</>
    }

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(<ul key={`list-${keyIndex++}`} className="list-disc list-inside my-2 space-y-1">{listItems}</ul>)
        listItems = []
        inList = false
      }
    }

    for (const line of lines) {
      // Check for headers
      const h3Match = line.match(/^### (.+)$/)
      if (h3Match) {
        flushList()
        elements.push(<h3 key={`h3-${keyIndex++}`} className="text-lg font-semibold mt-4 mb-2">{processInlineMarkdown(h3Match[1], `h3-${keyIndex}`)}</h3>)
        continue
      }

      const h2Match = line.match(/^## (.+)$/)
      if (h2Match) {
        flushList()
        elements.push(<h2 key={`h2-${keyIndex++}`} className="text-xl font-semibold mt-4 mb-2">{processInlineMarkdown(h2Match[1], `h2-${keyIndex}`)}</h2>)
        continue
      }

      const h1Match = line.match(/^# (.+)$/)
      if (h1Match) {
        flushList()
        elements.push(<h1 key={`h1-${keyIndex++}`} className="text-2xl font-bold mt-4 mb-2">{processInlineMarkdown(h1Match[1], `h1-${keyIndex}`)}</h1>)
        continue
      }

      // Check for list items
      const listMatch = line.match(/^[-*+] (.+)$/)
      if (listMatch) {
        inList = true
        listItems.push(<li key={`li-${keyIndex++}`}>{processInlineMarkdown(listMatch[1], `li-${keyIndex}`)}</li>)
        continue
      }

      // Check for numbered list
      const numListMatch = line.match(/^\d+\. (.+)$/)
      if (numListMatch) {
        flushList()
        elements.push(<div key={`num-${keyIndex++}`} className="my-1">{processInlineMarkdown(line, `num-${keyIndex}`)}</div>)
        continue
      }

      // Check for horizontal rule
      if (line.match(/^[-*_]{3,}$/)) {
        flushList()
        elements.push(<hr key={`hr-${keyIndex++}`} className="my-4 border-border" />)
        continue
      }

      // Check for blockquote
      const quoteMatch = line.match(/^> (.+)$/)
      if (quoteMatch) {
        flushList()
        elements.push(
          <blockquote key={`quote-${keyIndex++}`} className="border-l-4 border-primary/50 pl-4 my-2 italic text-muted-foreground">
            {processInlineMarkdown(quoteMatch[1], `quote-${keyIndex}`)}
          </blockquote>
        )
        continue
      }

      // Empty line
      if (line.trim() === '') {
        flushList()
        elements.push(<div key={`br-${keyIndex++}`} className="h-2" />)
        continue
      }

      // Regular paragraph
      flushList()
      elements.push(<p key={`p-${keyIndex++}`} className="my-1">{processInlineMarkdown(line, `p-${keyIndex}`)}</p>)
    }

    flushList()
    return elements.length > 0 ? <div className="space-y-1">{elements}</div> : text
  }, [])

  const formattedInitialMessages = useMemo(() => initialMessages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    parts: [{ type: 'text' as const, text: m.content }],
  })), [initialMessages])

  // Memoize the body object to prevent unnecessary re-renders
  const chatBody = useMemo(() => ({
    conversationId: conversation.id,
    mode: chatMode,
  }), [conversation.id, chatMode])

  // AI SDK useChat hook - configured with conversation context
  // Use a stable ID to prevent re-initialization on re-renders
  // Create transport for @ai-sdk/react v3 API
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    body: async () => chatBody,
  }), [chatBody])
  
  const { messages, sendMessage, error, status } = useChat({
    id: conversation.id,
    messages: formattedInitialMessages,
    transport,
  })
  
  // Derive loading state: only show loading when request is in flight (submitted or streaming). 'ready' and 'error' are not loading.
  const isLoading = status === 'submitted' || status === 'streaming'

  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    }
  }, [])

  // Helper to extract text from message (v5 uses parts array)
  const getMessageText = useCallback((message: typeof messages[0]): string => {
    // First check for direct content property (AI SDK v6 standard format)
    if (typeof message.content === 'string') {
      return message.content
    }
    // Then check for parts array (alternative format)
    if (message.parts) {
      return message.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('\n')
    }

    return ''
  }, [])

  // Scroll when messages length changes (new message) or when last message content grows (streaming)
  const messagesCount = messages.length
  const lastMessageLength = messages.length > 0 ? getMessageText(messages[messages.length - 1]).length : 0
  useEffect(() => {
    scrollToBottom()
  }, [messagesCount, lastMessageLength, scrollToBottom, getMessageText])

  useEffect(() => {
    const updateTitle = async () => {
      if (titleUpdatedRef.current) return
      if (messages.length >= 1 && messages[0].role === "user" && conversation.title === "New Conversation") {
        titleUpdatedRef.current = true
        const supabase = createClient()
        const firstMessage = getMessageText(messages[0])
        const title = firstMessage.slice(0, 50) || "New Conversation"
        await supabase.from("conversations").update({ title }).eq("id", conversation.id)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("chat:conversations-refresh"))
        }
        router.refresh()
      }
    }
    updateTitle()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, conversation.id, conversation.title])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const textValue = inputValue
    if ((!textValue.trim() && attachedFiles.length === 0) || isLoading) return
    
    let messageContent = textValue
    
    // Upload files if any
    if (attachedFiles.length > 0) {
      setIsUploading(true)
      try {
        const uploadedUrls = await uploadFiles(attachedFiles)
        if (uploadedUrls.length > 0) {
          const fileInfo = attachedFiles.map((f, i) => `[Attached: ${f.name}](${uploadedUrls[i] || 'upload-failed'})`).join('\n')
          messageContent = fileInfo + (textValue ? '\n\n' + textValue : '')
        } else {
          // Upload failed for all files - abort send
          toast.error('Failed to upload files. Message not sent.')
          setIsUploading(false)
          return
        }
      } catch (error) {
        toast.error('Failed to upload files. Message not sent.')
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }
    
    try {
      // Save message to ref BEFORE clearing input (for recovery if send fails)
      inputValueRef.current = messageContent
      
      // Send message using the AI SDK sendMessage function
      console.log('[Chat] Sending message:', { content: messageContent, length: messageContent.length })
      if (typeof sendMessage === 'function') {
        // sendMessage expects an object with text property for @ai-sdk/react v3
        sendMessage({ text: messageContent })
        // Clear input only after successful send
        setInputValue("")
        setAttachedFiles([])
      } else {
        console.error('sendMessage is not a function:', sendMessage)
        toast.error("Failed to send message. Please try again.")
        return
      }
    } catch (error) {
      console.error("[Chat] Failed to send message:", error)
      toast.error("Failed to send message. Please try again.")
      // Don't clear input on error - let user retry
    }
  }, [inputValue, isLoading, sendMessage, attachedFiles])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const getMessageMetadata = (msgId: string) => {
    const initialMsg = initialMessages.find((m) => m.id === msgId)
    return initialMsg?.metadata
  }

  // Voice input handlers
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Voice input is not supported in this browser")
      return
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = voiceLanguage

    recognition.onstart = () => {
      setIsListening(true)
      toast.success(`Listening in ${VOICE_LANGUAGES.find(l => l.code === voiceLanguage)?.native || voiceLanguage}...`)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        setInputValue(prev => prev + finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone access.")
      } else {
        toast.error(`Voice input error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [voiceLanguage])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  // File upload handlers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown', 'application/json']
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} has unsupported format`)
        return false
      }
      return true
    })
    setAttachedFiles(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 files
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const removeFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', conversation.id)
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        if (response.ok) {
          const data = await response.json()
          uploadedUrls.push(data.file.url)
        } else {
          const errorData = await response.json()
          console.error('Upload failed:', errorData)
          toast.error(`Failed to upload ${file.name}: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    return uploadedUrls
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-transparent backdrop-blur-sm">
      <header className="h-14 shrink-0 border-b border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-between gap-2 px-4 sm:px-6">
        <h1 className="font-semibold text-foreground text-base truncate min-w-0 pl-16 lg:pl-0" title={conversation.title}>
          <AnimatedConversationTitle title={conversation.title} />
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 text-muted-foreground hover:text-foreground shadow-lg" aria-label="Settings">
            <Link href="/dashboard">
              <User className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Messages - smooth scroll for streaming */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className={cn(
                "h-16 w-16 mx-auto rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl",
                chatMode === "builder" ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
                chatMode === "learn" ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                "bg-gradient-to-br from-[#e052a0] to-[#00c9c8]"
              )}>
                {chatMode === "builder" ? <Code className="h-8 w-8 text-white" /> :
                 chatMode === "learn" ? <GraduationCap className="h-8 w-8 text-white" /> :
                 <Bot className="h-8 w-8 text-white" />}
              </div>
              
              {chatMode === "builder" ? (
                <>
                  <h2 className="text-xl font-semibold">{t.chat.builderModeTitle}</h2>
                  <p className="text-muted-foreground">Describe what you want to build. Nairi will generate complete, production-ready code.</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="outline" role="button" tabIndex={0} className="cursor-pointer bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 min-h-[44px] sm:min-h-0 inline-flex items-center px-3 py-2 sm:py-1 touch-manipulation shadow-lg" onClick={() => setInputValue("Create a React todo app with TypeScript")} onKeyDown={(e) => e.key === "Enter" && setInputValue("Create a React todo app with TypeScript")}>
                      <Code className="h-3 w-3 mr-1" /> Todo App
                    </Badge>
                    <Badge variant="outline" role="button" tabIndex={0} className="cursor-pointer bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 min-h-[44px] sm:min-h-0 inline-flex items-center px-3 py-2 sm:py-1 touch-manipulation shadow-lg" onClick={() => setInputValue("Build a REST API with Express and MongoDB")} onKeyDown={(e) => e.key === "Enter" && setInputValue("Build a REST API with Express and MongoDB")}>
                      <Layers className="h-3 w-3 mr-1" /> REST API
                    </Badge>
                    <Badge variant="outline" role="button" tabIndex={0} className="cursor-pointer bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 min-h-[44px] sm:min-h-0 inline-flex items-center px-3 py-2 sm:py-1 touch-manipulation shadow-lg" onClick={() => setInputValue("Create a landing page with Tailwind CSS")} onKeyDown={(e) => e.key === "Enter" && setInputValue("Create a landing page with Tailwind CSS")}>
                      <Palette className="h-3 w-3 mr-1" /> Landing Page
                    </Badge>
                  </div>
                </>
              ) : chatMode === "learn" ? (
                <>
                  <h2 className="text-xl font-semibold">{t.chat.learnModeTitle}</h2>
                  <p className="text-muted-foreground">Ask any question. Nairi will teach you interactively with examples and exercises.</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <Badge variant="outline" role="button" tabIndex={0} className="cursor-pointer bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 min-h-[44px] sm:min-h-0 inline-flex items-center px-3 py-2 sm:py-1 touch-manipulation shadow-lg" onClick={() => setInputValue("Explain how React hooks work")} onKeyDown={(e) => e.key === "Enter" && setInputValue("Explain how React hooks work")}>
                      <Lightbulb className="h-3 w-3 mr-1" /> React Hooks
                    </Badge>
                    <Badge variant="outline" role="button" tabIndex={0} className="cursor-pointer bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 min-h-[44px] sm:min-h-0 inline-flex items-center px-3 py-2 sm:py-1 touch-manipulation shadow-lg" onClick={() => setInputValue("Teach me about async/await in JavaScript")} onKeyDown={(e) => e.key === "Enter" && setInputValue("Teach me about async/await in JavaScript")}>
                      <BookOpen className="h-3 w-3 mr-1" /> Async/Await
                    </Badge>
                    <Badge variant="outline" role="button" tabIndex={0} className="cursor-pointer bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 min-h-[44px] sm:min-h-0 inline-flex items-center px-3 py-2 sm:py-1 touch-manipulation shadow-lg" onClick={() => setInputValue("How do databases work?")} onKeyDown={(e) => e.key === "Enter" && setInputValue("How do databases work?")}>
                      <Target className="h-3 w-3 mr-1" /> Databases
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{t.chat.howCanIHelp}</h2>
                  <p className="text-muted-foreground mb-4">Ask me anything or try one of these quick actions</p>
                  <QuickActions onSelectAction={setInputValue} className="mt-4 max-w-2xl" />
                  <p className="text-xs text-muted-foreground mt-2">Describe what you need. Nairi will execute.</p>
                  <p className="text-xs text-muted-foreground">
                    Execution mode: <span className="font-medium capitalize">{chatMode}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const metadata = getMessageMetadata(message.id)
          const messageText = getMessageText(message)
          const codeBlocks = message.role === "assistant" ? extractCodeBlocks(messageText) : []
          const cleanText = message.role === "assistant" && codeBlocks.length > 0 
            ? removeCodeBlocks(messageText) 
            : messageText
          
          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 transition-opacity duration-200",
                message.role === "user" ? "ml-auto flex-row-reverse max-w-3xl" : "max-w-4xl"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  message.role === "user"
                    ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8]"
                    : chatMode === "builder" ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                    : chatMode === "learn" ? "bg-gradient-to-br from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-[#00c9c8] to-[#4fd1c5]",
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : chatMode === "builder" ? (
                  <Code className="h-4 w-4 text-white" />
                ) : chatMode === "learn" ? (
                  <GraduationCap className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>

              <div
                className={cn(
                  "flex flex-col gap-2 min-w-0",
                  message.role === "user" ? "w-fit max-w-3xl items-end" : "flex-1"
                )}
              >
                {/* Text content */}
                {cleanText && (
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 overflow-visible transition-all duration-300 ease-out",
                      message.role === "user"
                        ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white w-fit max-w-full shadow-lg shadow-pink-500/20"
                        : "bg-white/10 border border-white/20 text-foreground backdrop-blur-md shadow-lg",
                      message.role === "assistant" && index === messages.length - 1 && "animate-in fade-in slide-in-from-bottom-2 duration-300",
                    )}
                  >
                    {message.role === "assistant" && index === messages.length - 1 ? (
                      <AnimatedMessageContent
                        text={cleanText}
                        isStreaming={status === "streaming"}
                        renderContent={renderMarkdownText}
                        messageId={message.id}
                      />
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words overflow-x-auto">
                        {renderMarkdownText(cleanText)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Code blocks for builder mode */}
                {message.role === "assistant" && codeBlocks.length > 0 && (
                  <div className="space-y-3">
                    {codeBlocks.map((block, blockIndex) => (
                      <Card key={block.id} className="overflow-hidden border-white/20 bg-white/10 backdrop-blur-md shadow-lg">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/20 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground capitalize">
                              {block.language}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => copyCode(block.code, `${message.id}-${blockIndex}`)}
                            className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 h-8 w-8 bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg rounded-lg"
                            aria-label={copiedCode === `${message.id}-${blockIndex}` ? t.chat.copied : t.chat.copyMessage}
                          >
                            {copiedCode === `${message.id}-${blockIndex}` ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                        <CardContent className="p-0 bg-white/5 backdrop-blur-sm">
                          <pre className="p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm max-w-full" style={{ WebkitOverflowScrolling: "touch" }}>
                            <code className={`language-${block.language}`}>
                              {block.code}
                            </code>
                          </pre>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Assistant message actions */}
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 px-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => copyMessage(messageText, message.id)}
                      className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 h-8 w-8 bg-transparent border-transparent hover:bg-white/10 touch-manipulation rounded-lg"
                      aria-label={copiedMessageId === message.id ? t.chat.copied : t.chat.copyMessage}
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <TextToSpeech text={messageText} />
                    {metadata?.confidence && (
                      <ConfidenceIndicator confidence={metadata.confidence} showLabel />
                    )}
                    {metadata?.provider && (
                      <span className="text-xs text-muted-foreground">via {metadata.provider}</span>
                    )}
                    {chatMode === "builder" && codeBlocks.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-white/10 border-white/20 backdrop-blur-md shadow-lg">
                        <Code className="h-3 w-3 mr-1" />
                        {codeBlocks.length} code block{codeBlocks.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {chatMode === "learn" && (
                      <Badge variant="outline" className="text-xs text-green-500 border-green-500/30 bg-white/10 backdrop-blur-md shadow-lg">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Learning
                      </Badge>
                    )}
                  </div>
                )}

                {/* User message actions - copy only */}
                {message.role === "user" && cleanText && (
                  <div className="flex items-center gap-2 px-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => copyMessage(messageText, message.id)}
                      className="min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 h-8 w-8 bg-transparent border-transparent hover:bg-white/10 touch-manipulation rounded-lg"
                      aria-label={copiedMessageId === message.id ? t.chat.copied : t.chat.copyMessage}
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Suggestion chips after assistant reply (like ChatGPT/Gemini) */}
        {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
          <div className="flex flex-wrap gap-2 max-w-4xl mt-2 pl-11">
            {[
              t.chat.suggestionContinue,
              t.chat.suggestionExplain,
              t.chat.suggestionSimplify,
              t.chat.suggestionExample,
            ].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setInputValue(label)}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20 hover:border-white/30 text-foreground transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3 max-w-4xl animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="h-8 w-8 rounded-full shrink-0 bg-gradient-to-r from-[#00c9c8] to-[#4fd1c5] flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <ThinkingSteps />
            </div>
          </div>
        )}

        {error && (
          <div className="text-center space-y-2 max-w-md mx-auto">
            <div className="text-sm text-destructive bg-white/10 border border-white/20 backdrop-blur-md rounded-lg p-3 shadow-lg">Error: {error.message}</div>
            <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2 min-h-[44px] bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg" aria-label="Retry">
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {/* ARIA Live Regions for Screen Readers */}
        {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && (
          <LiveRegion politeness="polite" role="log">
            Nairi: {getMessageText(messages[messages.length - 1]).substring(0, 200)}
            {getMessageText(messages[messages.length - 1]).length > 200 ? "..." : ""}
          </LiveRegion>
        )}

        {isLoading && (
          <LiveRegion politeness="polite" role="status">
            Nairi is thinking...
          </LiveRegion>
        )}

        {error && (
          <LiveRegion politeness="assertive" role="alert">
            Error: {error.message || "An error occurred"}
          </LiveRegion>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - glassmorphism, safe-area for iOS */}
      <div
        className="shrink-0 border-t border-white/20 bg-white/5 backdrop-blur-xl p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-lg px-3 py-1.5 text-sm shadow-lg"
                >
                  {getFileIcon(file)}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2 flex items-center justify-center rounded text-muted-foreground hover:text-foreground touch-manipulation"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="relative z-10 shrink-0">
            <Label htmlFor="chat-input" className="sr-only">
              Chat message input
            </Label>
            <Textarea
              id="chat-input"
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                // Keep input visible when keyboard opens on mobile
                const el = e.target
                if (typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                  setTimeout(() => el.scrollIntoView({ block: "nearest", behavior: "smooth" }), 100)
                }
              }}
              placeholder={
                chatMode === "builder"
                  ? t.chat.placeholderBuilder
                  : chatMode === "learn"
                    ? t.chat.placeholderLearn
                    : t.chat.placeholderDefault
              }
              aria-label={
                chatMode === "builder"
                  ? t.chat.placeholderBuilder
                  : chatMode === "learn"
                    ? t.chat.placeholderLearn
                    : t.chat.placeholderDefault
              }
              className="min-h-[60px] max-h-[200px] pr-28 sm:pr-36 resize-none bg-white/5 border border-white/10 rounded-2xl touch-manipulation select-text text-base placeholder:text-muted-foreground"
              style={{ userSelect: "text" }}
              disabled={isLoading}
              autoComplete="off"
              inputMode="text"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsListening(!isListening)}
                className={cn(
                  "h-10 w-10 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 text-foreground touch-manipulation",
                  isListening && "bg-rose-500/20 border-rose-400/30 text-rose-400"
                )}
                aria-label={t.chat.voiceInput}
              >
                {isListening ? <MicOff className="h-4 w-4 shrink-0" /> : <Mic className="h-4 w-4 shrink-0" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || attachedFiles.length >= 5}
                className="h-10 w-10 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 text-foreground touch-manipulation"
                aria-label={t.chat.attachFile}
              >
                <Paperclip className="h-4 w-4 shrink-0" />
              </Button>
              <ToolsMenu
                onSendMessage={(msg) => setInputValue(msg)}
                conversationId={conversation.id}
                onPinConversation={() => window.dispatchEvent(new CustomEvent("chat:conversations-refresh"))}
                mode={chatMode}
                onModeChange={setChatMode}
                triggerClassName="h-10 w-10 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 text-foreground touch-manipulation"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="h-10 w-10 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 px-0 rounded-xl bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90 touch-manipulation font-medium shadow-lg shadow-pink-500/20"
                aria-label={t.chat.send}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Send className="h-4 w-4 shrink-0" />}
              </Button>
            </div>
          </div>
          {/* Quick actions for builder/learn modes */}
          {(chatMode === "builder" || chatMode === "learn") && messages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {chatMode === "builder" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs min-h-[44px] sm:h-7 sm:min-h-0 bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg"
                    onClick={() => setInputValue("Add error handling to this code")}
                  >
                    <Wand2 className="h-3 w-3 mr-1" /> Add error handling
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs min-h-[44px] sm:h-7 sm:min-h-0 bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg"
                    onClick={() => setInputValue("Write tests for this code")}
                  >
                    <Target className="h-3 w-3 mr-1" /> Write tests
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs min-h-[44px] sm:h-7 sm:min-h-0 bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg"
                    onClick={() => setInputValue("Optimize this code for performance")}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Optimize
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs min-h-[44px] sm:h-7 sm:min-h-0 bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg"
                    onClick={() => setInputValue("Add TypeScript types")}
                  >
                    <Code className="h-3 w-3 mr-1" /> Add types
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs min-h-[44px] sm:h-7 sm:min-h-0 bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg"
                    onClick={() => setInputValue("Explain this in more detail")}
                  >
                    <BookOpen className="h-3 w-3 mr-1" /> More details
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs min-h-[44px] sm:h-7 sm:min-h-0 bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg"
                    onClick={() => setInputValue("Give me a practice exercise")}
                  >
                    <Target className="h-3 w-3 mr-1" /> Exercise
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs min-h-[44px] sm:h-7 sm:min-h-0 bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg"
                    onClick={() => setInputValue("Show me a real-world example")}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" /> Example
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs min-h-[44px] sm:h-7 sm:min-h-0 bg-white/10 border-white/20 backdrop-blur-md hover:bg-white/20 touch-manipulation shadow-lg"
                    onClick={() => setInputValue("Quiz me on this topic")}
                  >
                    <GraduationCap className="h-3 w-3 mr-1" /> Quiz me
                  </Button>
                </>
              )}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            {chatMode === "builder" 
              ? "Describe your app or feature. Nairi will generate complete code."
              : chatMode === "learn"
                ? "Ask questions to learn. Nairi will teach you interactively."
                : "Press Enter to send, Shift+Enter for new line"
            }
          </p>
        </form>
      </div>
    </div>
  )
}
