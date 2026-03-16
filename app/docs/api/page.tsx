import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  Code,
  Key,
  ArrowLeft,
  Copy,
  Terminal,
  FileJson,
  Shield,
  Zap,
  MessageSquare,
  Store,
  Activity
} from "lucide-react"

const endpoints = [
  {
    category: "Authentication",
    icon: Key,
    routes: [
      {
        method: "POST",
        path: "/auth/sign-up",
        description: "Create a new user account",
        auth: false
      },
      {
        method: "POST",
        path: "/auth/sign-in",
        description: "Sign in with email and password",
        auth: false
      },
      {
        method: "POST",
        path: "/auth/sign-out",
        description: "Sign out current user",
        auth: true
      }
    ]
  },
  {
    category: "Chat",
    icon: MessageSquare,
    routes: [
      {
        method: "POST",
        path: "/api/chat",
        description: "Send a message to AI and stream response",
        auth: true
      }
    ]
  },
  {
    category: "Creation",
    icon: Zap,
    routes: [
      {
        method: "POST",
        path: "/api/create",
        description: "Generate content (presentations, websites, etc.)",
        auth: true
      }
    ]
  },
  {
    category: "Credits",
    icon: Activity,
    routes: [
      {
        method: "GET",
        path: "/api/credits",
        description: "Get user's credit balance and stats",
        auth: true
      },
      {
        method: "GET",
        path: "/api/credits/earn",
        description: "Get available rewards to claim",
        auth: true
      },
      {
        method: "POST",
        path: "/api/credits/earn",
        description: "Claim a reward",
        auth: true
      },
      {
        method: "POST",
        path: "/api/credits/referral",
        description: "Process referral signup",
        auth: true
      }
    ]
  },
  {
    category: "Marketplace",
    icon: Store,
    routes: [
      {
        method: "GET",
        path: "/api/marketplace/search",
        description: "Search for agents",
        auth: true
      },
      {
        method: "POST",
        path: "/api/marketplace/purchase",
        description: "Purchase an agent",
        auth: true
      },
      {
        method: "GET",
        path: "/api/marketplace/reviews",
        description: "Get agent reviews",
        auth: true
      },
      {
        method: "POST",
        path: "/api/marketplace/reviews",
        description: "Submit a review",
        auth: true
      }
    ]
  },
  {
    category: "Profile",
    icon: Shield,
    routes: [
      {
        method: "GET",
        path: "/api/profile",
        description: "Get current user's profile",
        auth: true
      },
      {
        method: "PATCH",
        path: "/api/profile",
        description: "Update profile information",
        auth: true
      },
      {
        method: "DELETE",
        path: "/api/profile",
        description: "Request account deletion",
        auth: true
      }
    ]
  },
  {
    category: "Execution Traces",
    icon: Terminal,
    routes: [
      {
        method: "GET",
        path: "/api/traces",
        description: "Get execution traces history",
        auth: true
      },
      {
        method: "POST",
        path: "/api/traces",
        description: "Start a new execution trace",
        auth: true
      },
      {
        method: "PATCH",
        path: "/api/traces",
        description: "Complete an execution trace",
        auth: true
      }
    ]
  }
]

const codeExamples = {
  chat: `// Send a chat message
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SESSION_TOKEN'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello, how are you?' }
    ],
    conversationId: 'optional-conversation-id',
    mode: 'default' // or 'debate', 'reasoning', 'tutor', 'creator'
  })
})

// Response is a stream
const reader = response.body.getReader()`,
  create: `// Create content
const response = await fetch('/api/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SESSION_TOKEN'
  },
  body: JSON.stringify({
    type: 'presentation', // or 'website', 'document', 'code', etc.
    prompt: 'Create a startup pitch deck for a fintech app',
    options: {
      style: 'professional',
      length: 'medium'
    }
  })
})

const { content, creationId } = await response.json()`,
  credits: `// Get credit balance
const response = await fetch('/api/credits', {
  headers: {
    'Authorization': 'Bearer YOUR_SESSION_TOKEN'
  }
})

const { balance, dailyLimit, resetIn, streak } = await response.json()

// Claim a reward
const claimResponse = await fetch('/api/credits/earn', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SESSION_TOKEN'
  },
  body: JSON.stringify({
    rewardType: 'watch' // or 'activity', 'streak'
  })
})`,
  marketplace: `// Search for agents
const response = await fetch('/api/marketplace/search?q=writing&category=productivity', {
  headers: {
    'Authorization': 'Bearer YOUR_SESSION_TOKEN'
  }
})

const { agents, total } = await response.json()

// Purchase an agent with credits
const purchaseResponse = await fetch('/api/marketplace/purchase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SESSION_TOKEN'
  },
  body: JSON.stringify({
    agentId: 'agent-uuid',
    useCredits: true
  })
})`
}

export const metadata = {
  title: "API Documentation | Nairi",
  description: "Complete API reference for integrating with Nairi"
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/docs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Docs
            </Link>
          </div>
          <Badge className="bg-[#e879f9]/10 text-[#e879f9] border-0">
            <Code className="w-3 h-3 mr-1" />
            API v1
          </Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">API Documentation</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Integrate Nairi into your applications with our REST API. All endpoints require authentication 
            unless otherwise noted.
          </p>
        </div>

        {/* Authentication Section */}
        <Card className="bg-card/50 border-border mb-12">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-[#e879f9]" />
              Authentication
            </CardTitle>
            <CardDescription>
              All API requests must include your session token in the Authorization header
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-background rounded-lg p-4 font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Header</span>
                <Button variant="ghost" size="sm" className="h-8 bg-transparent">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-[#22d3ee]">Authorization: Bearer YOUR_SESSION_TOKEN</code>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Session tokens are obtained through Supabase Auth after signing in. 
              Use the Supabase client library to manage authentication.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Endpoints List */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-bold text-foreground">Endpoints</h2>
            
            {endpoints.map((category) => (
              <Card key={category.category} className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <category.icon className="h-5 w-5 text-[#e879f9]" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.routes.map((route) => (
                    <div
                      key={`${route.method}-${route.path}`}
                      className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border border-border"
                    >
                      <Badge 
                        variant="outline" 
                        className={`font-mono text-xs shrink-0 ${
                          route.method === "GET" ? "border-green-500 text-green-500" :
                          route.method === "POST" ? "border-blue-500 text-blue-500" :
                          route.method === "PATCH" ? "border-orange-500 text-orange-500" :
                          "border-red-500 text-red-500"
                        }`}
                      >
                        {route.method}
                      </Badge>
                      <code className="text-sm text-foreground font-mono flex-1">{route.path}</code>
                      {route.auth && (
                        <Shield className="h-4 w-4 text-muted-foreground" aria-label="Requires authentication" />
                      )}
                    </div>
                  ))}
                  {category.routes.map((route) => (
                    <p key={`desc-${route.path}`} className="text-sm text-muted-foreground pl-[72px]">
                      {route.description}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Code Examples */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Code Examples</h2>
            
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="create">Create</TabsTrigger>
              </TabsList>
              <TabsContent value="chat">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Chat API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-background rounded-lg p-4 overflow-x-auto text-xs">
                      <code className="text-muted-foreground">{codeExamples.chat}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="create">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Create API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-background rounded-lg p-4 overflow-x-auto text-xs">
                      <code className="text-muted-foreground">{codeExamples.create}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Tabs defaultValue="credits" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              </TabsList>
              <TabsContent value="credits">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Credits API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-background rounded-lg p-4 overflow-x-auto text-xs">
                      <code className="text-muted-foreground">{codeExamples.credits}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="marketplace">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-foreground flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      Marketplace API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-background rounded-lg p-4 overflow-x-auto text-xs">
                      <code className="text-muted-foreground">{codeExamples.marketplace}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Rate Limits */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">Rate Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Free tier: 100 requests/minute</p>
                <p>Pro tier: 1000 requests/minute</p>
                <p>Business tier: Custom limits</p>
              </CardContent>
            </Card>

            {/* Response Format */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">Response Format</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-background rounded-lg p-4 text-xs overflow-x-auto">
                  <code className="text-muted-foreground">{`{
  "success": true,
  "data": { ... },
  "error": null
}`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
