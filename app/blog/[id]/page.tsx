import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

const blogPosts: Record<string, {
  title: string
  description: string
  content: string
  date: string
  readTime: string
  category: string
}> = {
  "introducing-nairi": {
    title: "Introducing Nairi: The Reality Executor",
    description: "Today we are launching Nairi, a new paradigm in human-computer interaction that transforms thoughts into complete realities.",
    content: `Today marks a significant milestone in the evolution of human-computer interaction. We are proud to announce the launch of Nairi — a platform that bridges the gap between intention and reality.

## The Vision

For decades, interacting with computers has meant translating our thoughts into the rigid structures that machines understand: menus, forms, commands, and code. What if we could simply express what we want, and let technology handle the rest?

Nairi makes this possible. By combining advanced AI reasoning with a comprehensive suite of generation capabilities, Nairi transforms natural language descriptions into working code, stunning visuals, compelling presentations, and much more.

## How It Works

The process is simple:
1. **Describe** what you want in natural language
2. **Refine** through conversation with our AI
3. **Deploy** the result with one click

Whether you need a React dashboard, a business presentation, a marketing video, or a complete website — Nairi executes your vision.

## Built on AMD GPUs

All of Nairi's AI inference runs on AMD GPU infrastructure, providing high-performance computing while maintaining cost efficiency. This means faster responses, higher quality outputs, and more affordable access for everyone.

## What's Next

We are just getting started. Our roadmap includes:
- Multi-modal AI agents that can collaborate on complex projects
- A marketplace for sharing and selling AI-generated content
- Community features for discovering and remixing creations
- Expanded language support and accessibility features

Welcome to the future of creation. Welcome to Nairi.`,
    date: "January 15, 2026",
    readTime: "5 min read",
    category: "Announcement",
  },
  "future-of-ai-interaction": {
    title: "The Future of AI Interaction",
    description: "How we are moving beyond chatbots and assistants to create truly autonomous AI that executes your intentions.",
    content: `The landscape of AI interaction is undergoing a fundamental transformation. We are moving past the era of simple chatbots and conversational assistants into a new paradigm: AI that doesn't just talk, but acts.

## Beyond Chatbots

Current AI assistants are limited to conversation. You ask a question, they provide an answer. While useful, this model leaves the execution burden entirely on the user. Nairi represents the next step — AI that takes your intentions and turns them into tangible results.

## The Execution Model

Instead of merely providing information, Nairi's AI agents can:
- Write and deploy code based on descriptions
- Generate visual content from text prompts
- Create presentations, documents, and reports
- Conduct research and compile findings
- Build complete applications from specifications

This shift from conversation to execution changes everything about how we work with AI.

## The Technical Foundation

Making this possible requires several technological breakthroughs:
- **Reasoning capabilities** that break down complex tasks into actionable steps
- **Multi-modal generation** across text, code, images, video, and audio
- **Context awareness** that maintains understanding across long, complex interactions
- **Quality assurance** built into every generation pipeline

## Why This Matters

The execution model democratizes creation. You no longer need to know how to code, design, or produce media to create professional-quality work. You just need to be able to describe what you want.

This is not about replacing human creativity — it's about amplifying it. Nairi handles the technical execution, leaving you free to focus on the creative vision.`,
    date: "January 12, 2026",
    readTime: "8 min read",
    category: "Vision",
  },
  "building-nairi-marketplace": {
    title: "Building the Nairi Marketplace",
    description: "Learn about our vision for a creator economy where AI-generated content can be shared, sold, and improved upon.",
    content: `The Nairi Marketplace is designed to be the central hub for AI-generated content, tools, and workflows. It represents our vision for a new kind of creator economy — one powered by artificial intelligence.

## The Concept

Imagine a marketplace where creators can:
- Sell AI-powered prompts and templates
- Share reusable workflows and agents
- License generated content and models
- Collaborate on complex projects

This isn't just a store — it's an ecosystem where AI capabilities are discoverable, shareable, and composable.

## Types of Products

The marketplace will support several types of products:
- **Prompts**: Optimized prompts for specific tasks
- **Templates**: Pre-built structures for presentations, websites, and documents
- **Tools**: Specialized AI agents for domain-specific tasks
- **Workflows**: Multi-step automation pipelines
- **Models**: Fine-tuned models for specific use cases

## The Creator Economy

Every creator who contributes to the marketplace earns credits and revenue. Our credit system ensures that both contributors and consumers benefit from the ecosystem.

Creators earn when:
- Someone purchases their product
- Their template is used in a workflow
- Their agent is deployed by other users

## Quality and Trust

To maintain quality, all marketplace products go through:
- Automated quality checks
- Community rating and review
- Verification of safety and compliance

The Nairi Marketplace is coming soon. Stay tuned for updates.`,
    date: "January 10, 2026",
    readTime: "6 min read",
    category: "Product",
  },
  "ai-ethics-transparency": {
    title: "Our Approach to AI Ethics and Transparency",
    description: "How Nairi is building trust through transparency, user control, and ethical AI governance.",
    content: `As AI becomes more powerful and capable, ethical considerations become paramount. At Nairi, we believe that transparency and user control are the foundations of trustworthy AI.

## Our Principles

We operate under four core ethical principles:
1. **Transparency**: Users should always understand what AI is doing and why
2. **User Control**: Users retain full ownership and control over their creations
3. **Privacy**: User data is never used for training without explicit consent
4. **Fairness**: Our systems are designed to be accessible and unbiased

## Transparency in Practice

Every AI generation on Nairi includes:
- **Execution traces**: Step-by-step logs of what the AI did
- **Source attribution**: When external data or references are used
- **Model disclosure**: Which AI models were used for each task
- **Confidence indicators**: When results may need verification

## User Control

Users have complete control over:
- What data is stored and for how long
- Whether their creations are shared publicly
- Which AI models process their requests
- How their content is used and distributed

## Data Privacy

We maintain strict data privacy standards:
- Data is encrypted at rest and in transit
- Session data is automatically purged after inactivity
- Users can export or delete all their data at any time
- No user data is shared with third parties without consent

## Looking Forward

As AI capabilities evolve, so will our ethical framework. We are committed to staying ahead of the curve and maintaining the highest standards of responsible AI development.`,
    date: "January 8, 2026",
    readTime: "7 min read",
    category: "Ethics",
  },
  "multi-language-support": {
    title: "Nairi Speaks Your Language",
    description: "Announcing support for English, Russian, and Armenian with more languages coming soon.",
    content: `Language should never be a barrier to creativity. That's why Nairi now supports multiple languages, starting with English, Russian, and Armenian.

## Current Language Support

Nairi can now interact with you in:
- **English**: Full support across all features
- **Russian**: Complete chat and generation capabilities
- **Armenian**: Eastern and Western Armenian support

## How It Works

Our multilingual capabilities are powered by advanced language models that:
- Understand context and nuance across languages
- Maintain cultural sensitivity in generated content
- Support code-switching and mixed-language inputs
- Translate between languages when needed

## Coming Soon

We are working to expand our language support to include:
- Spanish, French, German, and Portuguese
- Chinese (Simplified and Traditional)
- Japanese and Korean
- Arabic, Hindi, and Turkish

## Accessibility

Multilingual support is part of our broader accessibility mission. Everyone deserves access to powerful AI tools, regardless of the language they speak.

Try Nairi in your preferred language today.`,
    date: "January 5, 2026",
    readTime: "4 min read",
    category: "Feature",
  },
}

interface BlogPostPageProps {
  params: Promise<{ id: string }>
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params
  const post = blogPosts[id]

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen">
      <Header />
      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 min-h-[44px]">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <Card className="bg-card/50 border-border">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline">{post.category}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{post.title}</h1>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                {post.content.split("\n").map((paragraph, i) => {
                  if (paragraph.startsWith("## ")) {
                    return <h2 key={i} className="text-xl font-semibold mt-8 mb-4 text-foreground">{paragraph.slice(3)}</h2>
                  }
                  if (paragraph.startsWith("- **")) {
                    const match = paragraph.match(/- \*\*(.+?)\*\*:?\s*(.*)/)
                    if (match) {
                      return (
                        <li key={i} className="ml-4 list-disc text-muted-foreground">
                          <strong className="text-foreground">{match[1]}</strong>
                          {match[2] ? ` ${match[2]}` : null}
                        </li>
                      )
                    }
                  }
                  if (paragraph.startsWith("- ")) {
                    return <li key={i} className="ml-4 list-disc text-muted-foreground">{paragraph.slice(2)}</li>
                  }
                  if (paragraph === "") return <br key={i} />
                  return <p key={i} className="text-muted-foreground leading-relaxed mb-4">{paragraph}</p>
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </main>
  )
}

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((id) => ({ id }))
}
