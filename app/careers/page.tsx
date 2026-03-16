"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const departments = [
  { id: "engineering", name: "Engineering", count: 5 },
  { id: "product", name: "Product", count: 2 },
  { id: "design", name: "Design", count: 2 },
  { id: "ai-research", name: "AI Research", count: 3 },
  { id: "operations", name: "Operations", count: 1 },
]

const openPositions = [
  {
    id: "senior-fullstack",
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build the core platform that powers Nairi's reality execution capabilities.",
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    department: "AI Research",
    location: "Remote",
    type: "Full-time",
    description: "Develop and optimize AI models that understand and execute user intentions.",
  },
  {
    id: "product-designer",
    title: "Senior Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Design intuitive interfaces for complex AI interactions.",
  },
  {
    id: "devops-engineer",
    title: "DevOps / Platform Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build and maintain the infrastructure that powers millions of AI executions.",
  },
  {
    id: "ai-researcher",
    title: "AI Research Scientist",
    department: "AI Research",
    location: "Remote",
    type: "Full-time",
    description: "Push the boundaries of what's possible in AI reasoning and execution.",
  },
  {
    id: "product-manager",
    title: "Product Manager",
    department: "Product",
    location: "Remote",
    type: "Full-time",
    description: "Shape the future of Nairi's product strategy and roadmap.",
  },
]

const benefits = [
  "Competitive salary & equity",
  "Remote-first culture",
  "Unlimited PTO",
  "Health, dental & vision",
  "Learning budget",
  "Home office setup",
  "Team retreats",
  "Parental leave",
]

export default function CareersPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#e879f9]/30 bg-[#e879f9]/10 mb-6">
              <Sparkles className="w-4 h-4 text-[#e879f9]" />
              <span className="text-sm text-[#e879f9]">We&apos;re hiring</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Join the <span className="gradient-text">Nairi</span> team
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Help us build the future of human-AI interaction. We&apos;re looking for passionate people who want to make a real impact.
            </p>
          </div>
          
          <div className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Why Nairi?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="p-4 rounded-xl bg-card/50 border border-border text-center">
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Open Positions</h2>
            <div className="flex flex-wrap gap-2 mb-8">
              <Badge variant="outline" className="cursor-pointer hover:bg-[#e879f9]/10 hover:border-[#e879f9]">
                All ({openPositions.length})
              </Badge>
              {departments.map((dept) => (
                <Badge 
                  key={dept.id} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-[#e879f9]/10 hover:border-[#e879f9]"
                >
                  {dept.name} ({dept.count})
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {openPositions.map((position) => (
              <Card key={position.id} className="bg-card/50 border-border hover:border-[#e879f9]/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl text-foreground mb-1">{position.title}</CardTitle>
                      <CardDescription>{position.description}</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      className="shrink-0 border-[#e879f9]/50 text-[#e879f9] hover:bg-[#e879f9]/10 bg-transparent"
                    >
                      Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">{position.department}</Badge>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {position.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {position.type}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-br from-[#e879f9]/10 to-[#22d3ee]/10 border border-[#e879f9]/30">
            <h3 className="text-xl font-semibold mb-3 text-foreground">Don&apos;t see a perfect fit?</h3>
            <p className="text-muted-foreground mb-6">
              We&apos;re always looking for talented people. Send us your resume and tell us how you&apos;d like to contribute.
            </p>
            <Button asChild className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90">
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
