import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge"
import Link from "next/link"
import {
  ArrowLeft,
  Presentation,
  Sparkles,
  Download,
  FileText,
  Image,
  Palette,
  Settings,
  Share2,
  Edit,
  Play,
  CheckCircle2
} from "lucide-react"

export const metadata = {
  title: "Presentations | Nairi Documentation",
  description: "Learn how to create professional AI-powered presentations with Nairi"
}

export default function PresentationsDocPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/docs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Docs
              </Link>
            </Button>
          </div>
          <Button asChild>
            <Link href="/presentations">
              <Presentation className="h-4 w-4 mr-2" />
              Try It Now
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Presentation className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Creating Presentations</h1>
              <p className="text-muted-foreground mt-1">
                Generate professional slide decks with AI-powered content and design
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Create your first presentation in under 2 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Navigate to the Presentation Generator</p>
                <p className="text-sm text-muted-foreground">
                  Go to <Link href="/presentations" className="text-primary hover:underline">/presentations</Link> or click "Try It Now" above
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Describe your presentation</p>
                <p className="text-sm text-muted-foreground">
                  Enter a topic like "Introduction to Machine Learning for business executives"
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Customize settings</p>
                <p className="text-sm text-muted-foreground">
                  Choose slide count (5, 8, 10, or 15), style, and theme
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Generate and download</p>
                <p className="text-sm text-muted-foreground">
                  Click "Generate Presentation" and download your slides in HTML format
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI-Powered Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automatically generates slide titles, bullet points, and structured content based on your topic
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Customizable Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Choose from 5 presentation styles, 3 themes, and multiple slide counts to match your needs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5 text-pink-500" />
                  Professional Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Clean, modern layouts with consistent styling and professional typography
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-500" />
                  Easy Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Download presentations as HTML files or copy content to clipboard as markdown
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Customization Options */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Customization Options</h2>
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Slide Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Choose the number of slides for your presentation:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span><strong>5 slides</strong> - Quick overviews and summaries</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span><strong>8 slides</strong> - Standard presentations (default)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span><strong>10 slides</strong> - Detailed presentations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span><strong>15 slides</strong> - Comprehensive decks</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Presentation Styles</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Professional</strong> - Clean, business-focused design for corporate settings
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Creative</strong> - Bold, engaging layouts for creative projects
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Minimal</strong> - Simple, distraction-free design
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Corporate</strong> - Formal, executive-level presentations
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Educational</strong> - Clear, instructional layouts for teaching
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-slate-900 border" />
                  <span><strong>Dark</strong> - Dark background with light text</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-white border" />
                  <span><strong>Light</strong> - Light background with dark text</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-gradient-to-br from-purple-600 to-blue-500" />
                  <span><strong>Gradient</strong> - Colorful gradient backgrounds</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Tips & Best Practices */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Tips & Best Practices</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Be specific with your topic</strong> - Include target audience and key points you want to cover
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Choose the right slide count</strong> - 8-10 slides work best for most presentations
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Match style to audience</strong> - Use Professional/Corporate for business, Educational for training
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Review and customize</strong> - Use the preview to navigate through slides before downloading
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Regenerate if needed</strong> - Don't hesitate to adjust settings and regenerate for better results
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Example Prompts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Example Prompts</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-mono text-sm">
                    "Introduction to Machine Learning for business executives"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Great for: Corporate training, executive briefings
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-mono text-sm">
                    "Quarterly sales review Q4 2025 with revenue analysis and growth projections"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Great for: Business reviews, stakeholder meetings
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-mono text-sm">
                    "Climate change solutions for sustainable cities"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Great for: Educational presentations, conferences
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="font-mono text-sm">
                    "Product launch strategy for new mobile app targeting Gen Z users"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Great for: Marketing pitches, product launches
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Available Features</h2>
          <Card className="border-green-500/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                The presentation generator includes the following features:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  PowerPoint (PPTX) export - Full PPTX format support
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Image generation and integration - AI-generated images for slides
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  In-app slide editing - Edit titles, content, and notes directly
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  Document import (Word, PDF, Markdown) <ComingSoonBadge />
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Speaker notes generation - Automatic speaker notes for each slide
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  Charts and data visualizations <ComingSoonBadge />
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  Collaboration and sharing features <ComingSoonBadge />
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How many credits does it cost to generate a presentation?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Presentation generation costs vary based on slide count and complexity. Typically 50-100 credits per presentation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Can I edit the slides after generation?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Currently, in-app editing is not available. You can download the HTML file and edit it manually, or regenerate with different settings. In-app editing is planned for a future release.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Can I export to PowerPoint format?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  PPTX export is not yet available but is a high-priority feature in development. Currently, you can download as HTML or copy as markdown.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">How long does it take to generate a presentation?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Most presentations generate in 2-4 seconds, making Nairi one of the fastest AI presentation generators available.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Can I add images to my presentations?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Image integration is currently in development. For now, presentations are text-based with professional typography and layouts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
          <CardContent className="pt-6 text-center">
            <Presentation className="h-12 w-12 mx-auto mb-4 text-purple-500" />
            <h3 className="text-2xl font-bold mb-2">Ready to Create Your First Presentation?</h3>
            <p className="text-muted-foreground mb-6">
              Generate professional slide decks in seconds with AI-powered content
            </p>
            <Button asChild size="lg">
              <Link href="/presentations">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Creating
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Related Articles */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Related Articles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link href="/docs/getting-started" className="hover:text-primary">
                    Getting Started with Nairi
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn the basics of using Nairi's AI-powered platform
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link href="/docs/credits" className="hover:text-primary">
                    Understanding Credits
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn how credits work and how to earn more
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
