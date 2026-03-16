import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Zap,
  Store,
  User,
  Shield,
  Play
} from "lucide-react"

const steps = [
  {
    number: 1,
    title: "Create Your Account",
    description: "Sign up with your email to get started. You'll receive 1,000 free credits immediately.",
    icon: User,
    details: [
      "Visit the sign-up page",
      "Enter your email and create a password",
      "Verify your email address",
      "Complete the quick onboarding flow"
    ],
    link: "/auth/sign-up",
    linkText: "Create Account"
  },
  {
    number: 2,
    title: "Explore the Chat Interface",
    description: "Start conversations with Nairi to get help with tasks, answer questions, and create content.",
    icon: MessageSquare,
    details: [
      "Navigate to the Chat section",
      "Type your first message or choose a prompt",
      "Try different chat modes (default, reasoning, tutor)",
      "Save important conversations for later"
    ],
    link: "/chat",
    linkText: "Open Chat"
  },
  {
    number: 3,
    title: "Create Your First Content",
    description: "Use the Create workspace to generate presentations, websites, documents, and more.",
    icon: Sparkles,
    details: [
      "Go to Workspace > Create",
      "Select a creation type (presentation, website, etc.)",
      "Describe what you want to create",
      "Download or share your creation"
    ],
    link: "/workspace/create",
    linkText: "Start Creating"
  },
  {
    number: 4,
    title: "Earn More Credits",
    description: "Learn how to earn free credits through daily activities, watching content, and referrals.",
    icon: Zap,
    details: [
      "Check the Credits panel in your dashboard",
      "Claim daily login rewards (+50 credits)",
      "Complete the Watch & Learn activities",
      "Invite friends for bonus credits"
    ],
    link: "/dashboard/credits",
    linkText: "View Credits"
  },
  {
    number: 5,
    title: "Discover AI Agents",
    description: "Browse the marketplace to find specialized AI agents that can help with specific tasks.",
    icon: Store,
    details: [
      "Visit the Marketplace",
      "Browse by category or search",
      "Read reviews and capabilities",
      "Add free agents to your workspace"
    ],
    link: "/marketplace",
    linkText: "Browse Marketplace"
  },
  {
    number: 6,
    title: "Understand Security Features",
    description: "Learn about Nairi's security and transparency features that keep you in control.",
    icon: Shield,
    details: [
      "Review your activity logs anytime",
      "Approve critical operations before execution",
      "All AI operations run in isolated environments",
      "Your data is encrypted and never shared"
    ],
    link: "/dashboard/activity",
    linkText: "View Activity"
  }
]

const tips = [
  {
    title: "Be Specific",
    description: "The more detailed your prompts, the better results you'll get. Include context, style preferences, and specific requirements."
  },
  {
    title: "Use Chat Modes",
    description: "Different modes are optimized for different tasks. Use 'reasoning' for complex problems, 'tutor' for learning, and 'creator' for content."
  },
  {
    title: "Save Your Work",
    description: "Download important creations and save valuable conversations. Your workspace keeps a history of everything you create."
  },
  {
    title: "Earn While You Learn",
    description: "Daily activities like watching educational content and maintaining streaks earn you free credits to use for creations."
  }
]

export const metadata = {
  title: "Getting Started | Nairi Documentation",
  description: "Learn how to get started with Nairi - your comprehensive guide to AI-powered creation"
}

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Documentation
          </Link>
          <Badge className="bg-[#e879f9]/10 text-[#e879f9] border-0">
            <Play className="w-3 h-3 mr-1" />
            Tutorial
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-[#22d3ee]/10 text-[#22d3ee] border-0">
            5 minute read
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">Getting Started with Nairi</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Welcome to Nairi! This guide will walk you through everything you need to know 
            to start creating amazing content with AI.
          </p>
        </div>

        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-[#e879f9]/10 to-[#22d3ee]/10 border-border mb-12">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-foreground mb-2">Your 1,000 Free Credits</h2>
                <p className="text-muted-foreground">
                  Every new account starts with 1,000 credits. That&apos;s enough to create several presentations, 
                  have dozens of chat conversations, or generate multiple website designs. Let&apos;s make the most of them!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-8 mb-16">
          <h2 className="text-2xl font-bold text-foreground">Follow These Steps</h2>
          
          {steps.map((step, index) => (
            <Card key={step.number} className="bg-card/50 border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Step Number & Icon */}
                  <div className="md:w-64 bg-gradient-to-br from-[#e879f9]/10 to-[#22d3ee]/10 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center text-white font-bold text-2xl mb-3">
                      {step.number}
                    </div>
                    <step.icon className="h-6 w-6 text-[#e879f9]" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    
                    <ul className="space-y-2 mb-4">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-[#22d3ee] shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button asChild size="sm" className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
                      <Link href={step.link}>
                        {step.linkText}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pro Tips */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Pro Tips</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tips.map((tip) => (
              <Card key={tip.title} className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <Card className="bg-gradient-to-r from-card to-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">What&apos;s Next?</CardTitle>
            <CardDescription>Continue learning with these resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link
                href="/docs/chat"
                className="p-4 rounded-lg border border-border bg-background/50 hover:border-[#e879f9]/50 transition-colors group"
              >
                <MessageSquare className="h-6 w-6 text-[#e879f9] mb-2" />
                <h4 className="font-medium text-foreground group-hover:text-[#e879f9] transition-colors">
                  AI Chat Guide
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Master conversational AI
                </p>
              </Link>
              
              <Link
                href="/docs/credits"
                className="p-4 rounded-lg border border-border bg-background/50 hover:border-[#22d3ee]/50 transition-colors group"
              >
                <Zap className="h-6 w-6 text-[#22d3ee] mb-2" />
                <h4 className="font-medium text-foreground group-hover:text-[#22d3ee] transition-colors">
                  Credits System
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Earn and manage credits
                </p>
              </Link>
              
              <Link
                href="/docs/marketplace"
                className="p-4 rounded-lg border border-border bg-background/50 hover:border-[#e879f9]/50 transition-colors group"
              >
                <Store className="h-6 w-6 text-[#e879f9] mb-2" />
                <h4 className="font-medium text-foreground group-hover:text-[#e879f9] transition-colors">
                  Marketplace
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Discover AI agents
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Ready to start creating?</p>
          <Button asChild size="lg" className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
            <Link href="/workspace/create">
              Create Your First Project
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
