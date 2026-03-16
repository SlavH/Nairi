import { 
  MessageSquare, Image, Code, FileText, Mic, Globe, Brain, Zap,
  Video, Music, Database, GitBranch, Users, Palette, BookOpen, Shield
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function CapabilitiesPage() {
  const capabilities = [
    {
      category: 'Conversation & Chat',
      items: [
        { icon: MessageSquare, title: 'Natural Language Chat', description: 'Have natural conversations with AI that understands context and nuance.' },
        { icon: Brain, title: 'Multiple Chat Modes', description: 'Choose from Default, Debate, Reasoning, Tutor, and Creator modes.' },
        { icon: Users, title: 'Group Chats', description: 'Collaborate with multiple AI models in the same conversation.' },
        { icon: Globe, title: '100+ Languages', description: 'Communicate in over 100 languages with automatic translation.' }
      ]
    },
    {
      category: 'Content Generation',
      items: [
        { icon: Image, title: 'Image Generation', description: 'Create stunning images from text descriptions using DALL-E, Midjourney, and more.', comingSoon: true },
        { icon: Video, title: 'Video Generation', description: 'Generate videos with AI using Runway, Veo, and Sora models.', comingSoon: true },
        { icon: Music, title: 'Audio & Voice', description: 'Text-to-speech, voice cloning, and audio generation capabilities.', comingSoon: true },
        { icon: Palette, title: 'Canvas Editor', description: 'Visual editing with AI-powered tools for diagrams and designs.' }
      ]
    },
    {
      category: 'Code & Development',
      items: [
        { icon: Code, title: 'Code Generation', description: 'Write code in any language with intelligent suggestions and explanations.' },
        { icon: GitBranch, title: 'GitHub Integration', description: 'Connect your repositories for context-aware coding assistance.' },
        { icon: Zap, title: 'Code Agent', description: 'Autonomous AI agent that can write, test, and debug code.' },
        { icon: FileText, title: 'Documentation', description: 'Generate documentation, comments, and technical writing.' }
      ]
    },
    {
      category: 'Research & Analysis',
      items: [
        { icon: Globe, title: 'Deep Research', description: 'Comprehensive research with web search and source citations.' },
        { icon: FileText, title: 'Document Analysis', description: 'Upload and analyze PDFs, documents, and images.' },
        { icon: Database, title: 'Data Tables', description: 'Create and analyze data with AI-powered spreadsheets.' },
        { icon: BookOpen, title: 'Knowledge Base', description: 'Build custom knowledge bases for specialized assistance.' }
      ]
    },
    {
      category: 'Productivity & Automation',
      items: [
        { icon: Zap, title: 'Workflows', description: 'Create automated workflows for repetitive tasks.' },
        { icon: FileText, title: 'Content Pipelines', description: 'Mass content generation with templates and variables.' },
        { icon: Users, title: 'Custom Assistants', description: 'Create specialized AI assistants for specific tasks.' },
        { icon: Shield, title: 'Enterprise Features', description: 'SSO, team management, and advanced security.' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">Capabilities</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover everything Nairi can do. From conversations to code, images to automation - all powered by cutting-edge AI.
          </p>
        </div>
      </section>

      {/* Capabilities Grid */}
      {capabilities.map((category) => (
        <section key={category.category} className="py-12 px-4 even:bg-card/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">
              {category.category}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.items.map((item) => (
                <div key={item.title} className="p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg relative">
                  <item.icon className="w-8 h-8 text-primary mb-3" />
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.comingSoon && (
                      <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-500/10 to-cyan-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Experience All Capabilities</h2>
          <p className="text-muted-foreground mb-8">
            Start your free trial and unlock the full power of Nairi AI.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/auth/sign-up"
              className="inline-flex items-center px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center px-8 py-3 rounded-full border border-border hover:bg-card transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
