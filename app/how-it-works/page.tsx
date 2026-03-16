import { Brain, Zap, Shield, Globe, Sparkles, MessageSquare, Image, Code, FileText, Mic } from 'lucide-react'

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Start a Conversation',
      description: 'Simply type your question, request, or idea. Nairi understands natural language in over 100 languages.',
      icon: MessageSquare
    },
    {
      number: '02',
      title: 'AI Processes Your Request',
      description: 'Our advanced AI analyzes your input, understands context, and determines the best way to help you.',
      icon: Brain
    },
    {
      number: '03',
      title: 'Get Intelligent Results',
      description: 'Receive accurate, helpful responses tailored to your needs - whether text, code, images, or analysis.',
      icon: Sparkles
    }
  ]

  const features = [
    {
      icon: MessageSquare,
      title: 'Natural Conversations',
      description: 'Chat naturally with AI that understands context and remembers your preferences.'
    },
    {
      icon: Image,
      title: 'Image Generation',
      description: 'Create stunning images from text descriptions using state-of-the-art AI models.'
    },
    {
      icon: Code,
      title: 'Code Assistant',
      description: 'Write, debug, and explain code in any programming language with AI help.'
    },
    {
      icon: FileText,
      title: 'Document Analysis',
      description: 'Upload and analyze documents, PDFs, and images for instant insights.'
    },
    {
      icon: Mic,
      title: 'Voice Interaction',
      description: 'Speak naturally and get voice responses with our advanced speech technology.'
    },
    {
      icon: Globe,
      title: 'Web Research',
      description: 'Get up-to-date information with AI-powered web search and analysis.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">Nairi</span> Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the power of advanced AI that understands you. From simple questions to complex tasks, Nairi is here to help.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Three Simple Steps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative p-6 rounded-xl bg-card border border-border">
                <div className="text-6xl font-bold text-primary/20 absolute top-4 right-4">
                  {step.number}
                </div>
                <step.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">What You Can Do</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Nairi combines multiple AI capabilities into one seamless experience
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-500/10 to-cyan-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who are already experiencing the future of AI.
          </p>
          <a
            href="/auth/sign-up"
            className="inline-flex items-center px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Start Free Trial
            <Zap className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  )
}
