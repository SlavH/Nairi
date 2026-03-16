"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

const blogPosts = [
  {
    id: "introducing-nairi",
    title: "Introducing Nairi: The Reality Executor",
    description: "Today we are launching Nairi, a new paradigm in human-computer interaction that transforms thoughts into complete realities.",
    date: "January 15, 2026",
    readTime: "5 min read",
    category: "Announcement",
    featured: true,
  },
  {
    id: "future-of-ai-interaction",
    title: "The Future of AI Interaction",
    description: "How we are moving beyond chatbots and assistants to create truly autonomous AI that executes your intentions.",
    date: "January 12, 2026",
    readTime: "8 min read",
    category: "Vision",
    featured: false,
  },
  {
    id: "building-nairi-marketplace",
    title: "Building the Nairi Marketplace",
    description: "Learn about our vision for a creator economy where AI-generated content can be shared, sold, and improved upon.",
    date: "January 10, 2026",
    readTime: "6 min read",
    category: "Product",
    featured: false,
  },
  {
    id: "ai-ethics-transparency",
    title: "Our Approach to AI Ethics and Transparency",
    description: "How Nairi is building trust through transparency, user control, and ethical AI governance.",
    date: "January 8, 2026",
    readTime: "7 min read",
    category: "Ethics",
    featured: false,
  },
  {
    id: "multi-language-support",
    title: "Nairi Speaks Your Language",
    description: "Announcing support for English, Russian, and Armenian with more languages coming soon.",
    date: "January 5, 2026",
    readTime: "4 min read",
    category: "Feature",
    featured: false,
  },
]

export default function BlogPage() {
  const featuredPost = blogPosts.find(post => post.featured)
  const otherPosts = blogPosts.filter(post => !post.featured)
  
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Nairi <span className="gradient-text">Blog</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Insights, updates, and stories about the future of AI and human-computer interaction.
            </p>
          </div>
          
          {featuredPost && (
            <Card className="bg-gradient-to-br from-[#e879f9]/10 to-[#22d3ee]/10 border-[#e879f9]/30 mb-12">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-[#e879f9]/20 text-[#e879f9] border-[#e879f9]/30">Featured</Badge>
                  <Badge variant="outline">{featuredPost.category}</Badge>
                </div>
                <CardTitle className="text-3xl text-foreground hover:text-[#e879f9] transition-colors">
                  <Link href={`/blog/${featuredPost.id}`}>{featuredPost.title}</Link>
                </CardTitle>
                <CardDescription className="text-lg mt-2">{featuredPost.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {featuredPost.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {featuredPost.readTime}
                  </div>
                </div>
                <Link 
                  href={`/blog/${featuredPost.id}`}
                  className="inline-flex items-center gap-2 mt-6 text-[#e879f9] hover:text-[#22d3ee] transition-colors"
                >
                  Read article <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          )}
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <Card key={post.id} className="bg-card/50 border-border hover:border-[#e879f9]/50 transition-colors">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">{post.category}</Badge>
                  <CardTitle className="text-xl text-foreground hover:text-[#e879f9] transition-colors">
                    <Link href={`/blog/${post.id}`}>{post.title}</Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{post.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <p className="text-muted-foreground">
              More articles coming soon. Subscribe to our newsletter to stay updated.
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
