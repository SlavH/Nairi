"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Search, MessageCircle, BookOpen, CreditCard, Shield, Bot, Zap, HelpCircle } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"

const faqCategories = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting Started",
    questions: [
      {
        q: "What is Nairi?",
        a: "Nairi is a cognitive operating system that transforms your thoughts into reality. Unlike traditional AI assistants, Nairi doesn't just help you do things — it does them for you. Express your intention in natural language and receive finished results, whether that's a presentation, website, document, or complex analysis."
      },
      {
        q: "How do I create an account?",
        a: "Click the 'Start Creating' button on the homepage or navigate to the sign-up page. Enter your email address, create a password, and you'll receive a confirmation email. Once verified, you can start using Nairi immediately with free credits."
      },
      {
        q: "Is Nairi free to use?",
        a: "Nairi offers a generous free tier with 1,000 daily credits that reset every 24 hours. You can earn additional credits through various activities like watching educational content, inviting friends, and selling on the marketplace. Premium plans are available for users who need higher limits."
      },
      {
        q: "What can I create with Nairi?",
        a: "Nairi can create documents, presentations, websites, images, code, strategies, plans, and more. Simulations are under active development (SOON). The system continuously learns and expands its capabilities based on user interactions."
      }
    ]
  },
  {
    id: "credits",
    icon: CreditCard,
    title: "Credits & Billing",
    questions: [
      {
        q: "How do credits work?",
        a: "Credits are the currency that powers your Nairi experience. Different tasks consume different amounts of credits based on complexity. Simple tasks like text generation use fewer credits, while complex creations like websites or presentations use more. Your credit balance is displayed in your dashboard."
      },
      {
        q: "How can I earn more credits?",
        a: "There are several ways to earn credits: (1) Watch & Earn: View educational content for +50 credits daily, (2) Invite Friends: Get +500 credits for each friend who joins, (3) Stay Active: Maintain activity streaks for up to 2x multiplier, (4) Marketplace Sales: Earn 10% of your creation sales as credits."
      },
      {
        q: "When do my credits reset?",
        a: "Free credits reset every 24 hours at midnight UTC. You can see a countdown timer in your dashboard showing when your next reset occurs. Premium subscribers have different reset schedules based on their plan."
      },
      {
        q: "What happens if I run out of credits?",
        a: "When your credits are depleted, you can wait for the daily reset, earn more through activities, or upgrade to a premium plan. We'll always notify you when your credits are running low so you can plan accordingly."
      }
    ]
  },
  {
    id: "ai-features",
    icon: Bot,
    title: "AI Features",
    questions: [
      {
        q: "What chat modes are available?",
        a: "Nairi offers multiple specialized modes: Default (general conversation), Debate (explore multiple perspectives), Reasoning (step-by-step analysis), Tutor (guided learning), and Creator (creative assistance). Each mode optimizes the AI's behavior for specific types of interactions."
      },
      {
        q: "How does the confidence indicator work?",
        a: "The confidence indicator shows how certain the AI is about its response. Green (80%+) indicates high confidence based on reliable sources, yellow (50-80%) suggests moderate confidence, and orange (<50%) means lower confidence. You can click 'Explain Why' on any response to understand the reasoning."
      },
      {
        q: "Can Nairi remember our conversations?",
        a: "Yes, Nairi maintains context within conversations and can remember information across sessions based on your preferences. You control what the AI remembers through the Memory Permissions in Settings, including what to remember, for how long, and in which contexts."
      },
      {
        q: "How accurate are Nairi's responses?",
        a: "Nairi strives for high accuracy and includes confidence indicators with every response. However, like all AI systems, it can make mistakes. We recommend verifying important information, especially for critical decisions. The 'Explain Why' feature helps you understand the sources and reasoning behind responses."
      }
    ]
  },
  {
    id: "marketplace",
    icon: Zap,
    title: "Marketplace",
    questions: [
      {
        q: "What is the Nairi Marketplace?",
        a: "The Marketplace is where users can discover, purchase, and sell AI agents and creations. It's a creator economy where your work can be monetized and shared with the community. Featured agents are curated for quality and usefulness."
      },
      {
        q: "How do I sell my creations?",
        a: "Navigate to the Marketplace Creator Dashboard, click 'Create Agent', fill in the details including name, description, capabilities, and pricing. Once submitted, your creation will be reviewed and published to the marketplace. You'll earn revenue from each sale."
      },
      {
        q: "What's the revenue share for creators?",
        a: "Creators receive 90% of the sale price for their creations. Additionally, you earn bonus credits equal to 10% of sales volume, which can be used for your own Nairi usage. Payments are processed monthly for balances over $50."
      },
      {
        q: "Can I use purchased agents?",
        a: "Yes! Once you purchase an agent, it's added to your collection and available for unlimited use in your conversations. Free agents are also available and can be used without any purchase."
      }
    ]
  },
  {
    id: "security",
    icon: Shield,
    title: "Security & Privacy",
    questions: [
      {
        q: "How is my data protected?",
        a: "Nairi uses industry-standard encryption for data at rest and in transit. We follow strict data protection protocols compliant with GDPR and other privacy regulations. You can export or delete your data at any time from the Settings page."
      },
      {
        q: "Is my conversation data used for training?",
        a: "By default, conversation data may be used to improve Nairi's capabilities. However, you can opt out of this in your Privacy Settings. We never share individual conversations with third parties, and training data is anonymized and aggregated."
      },
      {
        q: "What is isolated execution?",
        a: "Nairi executes tasks in sandboxed environments that are completely isolated from your system and other users. This means that even if a task involves potentially sensitive operations, it cannot access or affect anything outside its sandbox."
      },
      {
        q: "How does critical confirmation work?",
        a: "For actions that could have significant consequences (like sending emails, making purchases, or modifying important files), Nairi will always ask for your explicit confirmation before proceeding. You control the sensitivity level in your AI Governance settings."
      }
    ]
  },
  {
    id: "technical",
    icon: HelpCircle,
    title: "Technical Support",
    questions: [
      {
        q: "Which browsers are supported?",
        a: "Nairi works best on modern browsers including Chrome (recommended), Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version for optimal performance and security."
      },
      {
        q: "Why is my response taking too long?",
        a: "Response times vary based on task complexity and current system load. Complex creations like websites or detailed analysis take longer than simple text responses. If responses consistently take over 60 seconds, try refreshing the page or contact support."
      },
      {
        q: "I'm getting an error message. What should I do?",
        a: "First, try refreshing the page. If the error persists, clear your browser cache and cookies. Check our status page for any ongoing issues. If the problem continues, contact support with a screenshot of the error and steps to reproduce it."
      },
      {
        q: "How do I report a bug?",
        a: "You can report bugs through the Contact page, selecting 'Technical Support' as the reason. Include as much detail as possible: what you were trying to do, what happened instead, any error messages, and your browser/device information."
      }
    ]
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const searchParams = useSearchParams()
  
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      qa => 
        qa.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qa.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Help <span className="gradient-text">Center</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Find answers to common questions about Nairi. Can&apos;t find what you&apos;re looking for? Contact our support team.
            </p>
          </div>
          
          {/* Search */}
          <div className="relative mb-12 max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-card/50 border-border text-base"
            />
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {faqCategories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border hover:border-[#e879f9]/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#e879f9]/10 to-[#22d3ee]/10 flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-[#e879f9]" />
                </div>
                <span className="font-medium text-foreground">{category.title}</span>
              </a>
            ))}
          </div>
          
          {/* FAQ Categories */}
          <div className="space-y-12">
            {(searchQuery ? filteredCategories : faqCategories).map((category) => (
              <div key={category.id} id={category.id}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#e879f9] to-[#22d3ee] flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-background" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">{category.title}</h2>
                </div>
                
                <Accordion type="single" collapsible className="space-y-3">
                  {category.questions.map((qa, index) => (
                    <AccordionItem
                      key={index}
                      value={`${category.id}-${index}`}
                      className="border border-border rounded-xl px-6 bg-card/50 data-[state=open]:border-[#e879f9]/50"
                    >
                      <AccordionTrigger className="text-left py-4 hover:no-underline">
                        <span className="font-medium text-foreground">{qa.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-muted-foreground leading-relaxed">
                        {qa.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
          
          {searchQuery && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No results found for &quot;{searchQuery}&quot;</p>
              <p className="text-sm text-muted-foreground mt-2">Try different keywords or browse categories above</p>
            </div>
          )}
          
          {/* Contact CTA */}
          <div className="mt-16 text-center p-8 rounded-2xl bg-gradient-to-r from-[#e879f9]/10 to-[#22d3ee]/10 border border-border">
            <MessageCircle className="w-12 h-12 mx-auto text-[#e879f9] mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help you get the most out of Nairi.
            </p>
            <Button asChild className="bg-gradient-to-r from-[#e879f9] to-[#22d3ee] text-background hover:opacity-90">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  )
}
