"use client"

import React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, Sparkles, FileText, Globe, BarChart3, ArrowRight, Code, Palette, Play, BookOpen, Zap } from "lucide-react"
import { useTranslation } from "@/lib/i18n/context"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

const demoPrompts = [
  { 
    icon: FileText, 
    label: "Create a presentation", 
    prompt: "Create a presentation about renewable energy trends for 2026" 
  },
  { 
    icon: Globe, 
    label: "Build a website", 
    prompt: "Design a landing page for a new productivity app" 
  },
  { 
    icon: BarChart3, 
    label: "Analyze data", 
    prompt: "Analyze the key factors affecting startup success rates" 
  },
]

const sampleTemplates = [
  {
    id: "startup-pitch",
    title: "Startup Pitch Deck",
    description: "Create a compelling investor presentation",
    icon: FileText,
    category: "Presentation",
    prompt: "Create a 10-slide pitch deck for a sustainable fashion marketplace startup called 'EcoThread' that connects eco-conscious consumers with sustainable brands",
    color: "from-orange-500 to-red-500"
  },
  {
    id: "saas-landing",
    title: "SaaS Landing Page",
    description: "Design a conversion-optimized homepage",
    icon: Globe,
    category: "Website",
    prompt: "Design a landing page for 'TaskFlow', a project management tool with AI-powered task prioritization. Include hero, features, pricing, and testimonials sections",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "brand-identity",
    title: "Brand Identity Kit",
    description: "Create complete visual branding",
    icon: Palette,
    category: "Visual",
    prompt: "Design a brand identity for 'Aurora Wellness', a meditation and mental health app targeting young professionals. Include color palette, typography, and logo concepts",
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "api-code",
    title: "REST API Endpoint",
    description: "Generate production-ready code",
    icon: Code,
    category: "Code",
    prompt: "Create a TypeScript REST API endpoint for user authentication with JWT tokens, including login, register, and password reset functionality with proper validation",
    color: "from-slate-500 to-zinc-600"
  },
  {
    id: "market-analysis",
    title: "Market Analysis Report",
    description: "Comprehensive industry research",
    icon: BarChart3,
    category: "Analysis",
    prompt: "Analyze the electric vehicle market in Europe for 2026, including market size, key players, growth trends, and opportunities for new entrants",
    color: "from-indigo-500 to-violet-500"
  }
]

const guidedTutorials = [
  {
    id: "first-creation",
    title: "Create Your First Project",
    description: "Learn how to transform ideas into reality",
    icon: Sparkles,
    steps: ["Choose a creation type", "Describe your idea", "Review and refine", "Export or share"]
  },
  {
    id: "marketplace-intro",
    title: "Explore the Marketplace",
    description: "Discover AI agents for any task",
    icon: BookOpen,
    steps: ["Browse categories", "Preview agent capabilities", "Add to your workspace", "Start using"]
  },
  {
    id: "earn-credits",
    title: "Earn Free Credits",
    description: "Learn ways to get more credits",
    icon: Zap,
    steps: ["Daily login rewards", "Watch educational content", "Invite friends", "Complete challenges"]
  }
]

const demoResponses: Record<string, { typing: string; result: string[] }> = {
  "Create a presentation about renewable energy trends for 2026": {
    typing: "Creating your presentation on renewable energy trends...",
    result: [
      "Your 12-slide presentation is ready! It covers:",
      "- Global renewable energy market overview",
      "- Solar and wind capacity growth projections",
      "- Emerging technologies: green hydrogen & battery storage",
      "- Policy landscape and investment trends",
      "- Regional analysis with data visualizations",
      "- Key takeaways and future outlook"
    ]
  },
  "Design a landing page for a new productivity app": {
    typing: "Designing your landing page...",
    result: [
      "Your landing page design is complete! Features:",
      "- Hero section with compelling value proposition",
      "- Feature showcase with interactive elements",
      "- Social proof and testimonials section",
      "- Pricing comparison table",
      "- Mobile-responsive design",
      "- Call-to-action optimized for conversions"
    ]
  },
  "Analyze the key factors affecting startup success rates": {
    typing: "Analyzing startup success factors...",
    result: [
      "Analysis complete! Key findings:",
      "- Team composition: 23% impact on success",
      "- Market timing: 18% correlation with growth",
      "- Product-market fit indicators identified",
      "- Funding stage vs. survival rate analysis",
      "- Industry-specific success patterns",
      "- Actionable recommendations included"
    ]
  }
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("chat")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingText, setTypingText] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typingText])

  useEffect(() => {
    if (!isOpen) {
      setMessages([])
      setInput("")
      setTypingText("")
      setActiveTab("chat")
      setSelectedTemplate(null)
    }
  }, [isOpen])

  const simulateResponse = async (prompt: string) => {
    setMessages(prev => [...prev, { role: "user", content: prompt }])
    setIsTyping(true)
    setInput("")
    
    // Find matching response or use default
    const response = demoResponses[prompt] || {
      typing: "Processing your request...",
      result: [
        "I've understood your request and would create:",
        "- A comprehensive solution tailored to your needs",
        "- Professional quality output ready for use",
        "- Multiple format options for flexibility",
        "",
        "Sign up to experience the full power of Nairi!"
      ]
    }
    
    // Simulate typing indicator
    setTypingText(response.typing)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Type out response
    setTypingText("")
    const fullResponse = response.result.join("\n")
    let currentText = ""
    
    for (let i = 0; i < fullResponse.length; i++) {
      currentText += fullResponse[i]
      setTypingText(currentText)
      await new Promise(resolve => setTimeout(resolve, 15))
    }
    
    setMessages(prev => [...prev, { role: "assistant", content: fullResponse }])
    setTypingText("")
    setIsTyping(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return
    simulateResponse(input)
  }

  const handlePromptClick = (prompt: string) => {
    if (isTyping) return
    simulateResponse(prompt)
  }

  const handleTemplateSelect = (template: typeof sampleTemplates[0]) => {
    setSelectedTemplate(template.id)
    setActiveTab("chat")
    simulateResponse(template.prompt)
  }

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
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Try Chat
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Tutorials
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 flex flex-col min-h-[350px] max-h-[400px] rounded-xl border border-border bg-card/50 overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isTyping && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e879f9]/20 to-[#22d3ee]/20 flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-[#e879f9]" />
                    </div>
                    <p className="text-muted-foreground mb-6">Try one of these examples or type your own request:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {demoPrompts.map((demo) => (
                        <button
                          key={demo.label}
                          onClick={() => handlePromptClick(demo.prompt)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#e879f9]/10 to-[#22d3ee]/10 border border-border hover:border-[#e879f9]/50 transition-colors text-sm"
                        >
                          <demo.icon className="w-4 h-4 text-[#e879f9]" />
                          <span>{demo.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "user" 
                        ? "bg-gradient-to-r from-[#e879f9] to-[#22d3ee]"
                        : "bg-gradient-to-r from-[#22d3ee] to-[#4fd1c5]"
                    }`}>
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-background" />
                      ) : (
                        <Bot className="w-4 h-4 text-background" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background"
                        : "bg-muted text-foreground"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#22d3ee] to-[#4fd1c5] flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-background" />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3 max-w-[80%]">
                      {typingText ? (
                        <p className="text-sm whitespace-pre-wrap">{typingText}</p>
                      ) : (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4 bg-background/50">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Try: 'Create a business plan for a coffee shop'"
                  className="min-h-[44px] max-h-[100px] resize-none bg-background"
                  disabled={isTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isTyping}
                  className="h-[44px] w-[44px] bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 min-h-[350px] max-h-[400px] rounded-xl border border-border bg-card/50 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground mb-4">Select a template to try it in the chat:</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {sampleTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 rounded-xl border border-border bg-background/50 hover:border-[#e879f9]/50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center shrink-0`}>
                        <template.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{template.title}</span>
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {template.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 min-h-[350px] max-h-[400px] rounded-xl border border-border bg-card/50 overflow-y-auto p-4">
              <p className="text-sm text-muted-foreground mb-4">Learn how to get the most out of Nairi:</p>
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
                          <span className="font-medium text-foreground">{tutorial.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{tutorial.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {tutorial.steps.map((step, stepIdx) => (
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

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#e879f9]/10 to-[#22d3ee]/10 border border-border">
          <div>
            <p className="font-medium text-foreground">Ready to create with Nairi?</p>
            <p className="text-sm text-muted-foreground">Start with 1,000 free credits</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90">
            <Link href="/auth/sign-up">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
