import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Search,
  BookOpen,
  MessageSquare,
  Zap,
  Store,
  Shield,
  Code,
  Palette,
  Settings,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react"

const quickLinks = [
  {
    title: "Getting Started",
    description: "Learn the basics of Nairi and start creating",
    icon: Sparkles,
    href: "/docs/getting-started",
    color: "from-[#e879f9] to-[#22d3ee]"
  },
  {
    title: "AI Chat Guide",
    description: "Master conversational AI interactions",
    icon: MessageSquare,
    href: "/docs/chat",
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Credits System",
    description: "Understand how credits work and earn more",
    icon: Zap,
    href: "/docs/credits",
    color: "from-orange-500 to-amber-500"
  },
  {
    title: "Marketplace",
    description: "Discover and use AI agents",
    icon: Store,
    href: "/docs/marketplace",
    color: "from-blue-500 to-cyan-500"
  }
]

const categories = [
  {
    title: "Core Features",
    icon: BookOpen,
    articles: [
      { title: "Understanding Nairi", slug: "understanding-nairi" },
      { title: "AI Chat Modes", slug: "chat-modes" },
      { title: "Creating Content", slug: "creating-content" },
      { title: "Multi-format Creation", slug: "multi-format" },
      { title: "Master Prompts", slug: "master-prompts" }
    ]
  },
  {
    title: "Credits & Billing",
    icon: Zap,
    articles: [
      { title: "How Credits Work", slug: "how-credits-work" },
      { title: "Earning Free Credits", slug: "earning-credits" },
      { title: "Watch & Earn", slug: "watch-earn" },
      { title: "Referral Program", slug: "referrals" },
      { title: "Subscription Plans", slug: "plans" }
    ]
  },
  {
    title: "Marketplace",
    icon: Store,
    articles: [
      { title: "Browsing Agents", slug: "browsing-agents" },
      { title: "Purchasing Agents", slug: "purchasing" },
      { title: "Creating Agents", slug: "creating-agents" },
      { title: "Selling Your Work", slug: "selling" },
      { title: "Reviews & Ratings", slug: "reviews" }
    ]
  },
  {
    title: "Security & Trust",
    icon: Shield,
    articles: [
      { title: "Security Overview", slug: "security-overview" },
      { title: "Isolated Execution", slug: "isolated-execution" },
      { title: "Activity Logs", slug: "activity-logs" },
      { title: "Approval Gates", slug: "approval-gates" },
      { title: "Data Privacy", slug: "data-privacy" }
    ]
  },
  {
    title: "Creation Types",
    icon: Palette,
    articles: [
      { title: "Presentations", slug: "presentations" },
      { title: "Websites", slug: "websites" },
      { title: "Documents", slug: "documents" },
      { title: "Code Generation", slug: "code-generation" },
      { title: "Visual Concepts", slug: "visual-concepts" }
    ]
  },
  {
    title: "Account & Settings",
    icon: Settings,
    articles: [
      { title: "Profile Management", slug: "profile" },
      { title: "Notification Settings", slug: "notifications" },
      { title: "AI Preferences", slug: "ai-preferences" },
      { title: "Language Settings", slug: "language" },
      { title: "Deleting Account", slug: "delete-account" }
    ]
  }
]

const popularArticles = [
  { title: "How to earn 50 credits daily", views: "12.5k", category: "Credits", slug: "earn-credits" },
  { title: "Creating your first presentation", views: "8.2k", category: "Creation", slug: "first-presentation" },
  { title: "Understanding AI chat modes", views: "6.8k", category: "Features", slug: "chat-modes" },
  { title: "Selling agents in the marketplace", views: "5.4k", category: "Marketplace", slug: "sell-agents" },
  { title: "Security best practices", views: "4.1k", category: "Security", slug: "security-best-practices" }
  ]

export const metadata = {
  title: "Documentation | Nairi",
  description: "Learn how to use Nairi - your comprehensive guide to AI-powered creation"
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-xl gradient-text">
              Nairi
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-[#e879f9]/10 text-[#e879f9] border-0">
              <BookOpen className="w-3 h-3 mr-1" />
              Help Center
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Search our documentation or browse categories below
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                className="pl-12 h-14 text-lg bg-background border-border"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Start</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="group p-6 rounded-xl border border-border bg-card/50 hover:border-[#e879f9]/50 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${link.color} flex items-center justify-center mb-4`}>
                  <link.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-[#e879f9] transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {link.description}
                </p>
                <div className="flex items-center gap-1 text-sm text-[#e879f9] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-3">
          {/* Categories */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {categories.map((category) => (
                <Card key={category.title} className="bg-card/50 border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#e879f9]/10 flex items-center justify-center">
                        <category.icon className="h-5 w-5 text-[#e879f9]" />
                      </div>
                      <CardTitle className="text-foreground text-lg">{category.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.articles.map((article) => (
                        <li key={article.slug}>
                          <Link
                            href={`/docs/${article.slug}`}
                            className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-accent transition-colors group"
                          >
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              {article.title}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Articles */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-lg">Popular Articles</CardTitle>
                <CardDescription>Most viewed this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {popularArticles.map((article, index) => (
                    <li key={article.title}>
                      <Link
                        href={`/docs/${article.slug}`}
                        className="flex items-start gap-3 group cursor-pointer"
                      >
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-[#e879f9] transition-colors line-clamp-1">
                            {article.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs py-0">
                              {article.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{article.views} views</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Need Help */}
            <Card className="bg-gradient-to-br from-[#e879f9]/10 to-[#22d3ee]/10 border-border">
              <CardContent className="p-6">
                <MessageSquare className="h-8 w-8 text-[#e879f9] mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our support team is ready to assist you with any questions.
                </p>
                <Button asChild className="w-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* API Docs */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
                    <Code className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">API Documentation</h3>
                    <p className="text-xs text-muted-foreground">For developers</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Integrate Nairi into your own applications with our comprehensive API.
                </p>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/docs/api">
                    View API Docs
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Getting Started Section */}
        <section className="mt-16">
          <Card className="bg-gradient-to-r from-card to-card/50 border-border overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="max-w-2xl">
                <Badge className="mb-4 bg-[#22d3ee]/10 text-[#22d3ee] border-0">New to Nairi?</Badge>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Start your journey with Nairi
                </h2>
                <p className="text-muted-foreground mb-6">
                  Follow our step-by-step guide to set up your account, earn your first credits, 
                  and create your first AI-powered content in minutes.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button asChild className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-white">
                    <Link href="/docs/getting-started">
                      Start Tutorial
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent">
                    <Link href="/auth/sign-up">
                      Create Free Account
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Can&apos;t find what you&apos;re looking for?{" "}
              <Link href="/contact" className="text-[#e879f9] hover:underline">
                Contact us
              </Link>
            </p>
            <div className="flex items-center gap-6">
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground">
                FAQ
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                Support
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
