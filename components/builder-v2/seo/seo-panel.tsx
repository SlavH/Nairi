"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Search,
  Globe,
  FileText,
  Image as ImageIcon,
  Link,
  Share2,
  Code,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Copy,
  ExternalLink,
  Eye,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react"

interface SEOSettings {
  // Basic Meta
  title: string
  description: string
  keywords: string[]
  canonicalUrl: string
  
  // Open Graph
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogType: string
  
  // Twitter Card
  twitterCard: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  
  // Technical
  robots: string
  sitemap: boolean
  structuredData: string
  
  // Advanced
  hreflang: { lang: string; url: string }[]
  redirects: { from: string; to: string; type: string }[]
}

interface SEOPanelProps {
  settings: SEOSettings
  onUpdateSettings: (settings: Partial<SEOSettings>) => void
  pageUrl?: string
}

// SEO Score calculation
function calculateSEOScore(settings: SEOSettings): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  // Title checks
  if (!settings.title) {
    issues.push("Missing page title")
    score -= 20
  } else if (settings.title.length < 30) {
    suggestions.push("Title is too short (recommended: 50-60 characters)")
    score -= 5
  } else if (settings.title.length > 60) {
    suggestions.push("Title is too long (recommended: 50-60 characters)")
    score -= 5
  }

  // Description checks
  if (!settings.description) {
    issues.push("Missing meta description")
    score -= 15
  } else if (settings.description.length < 120) {
    suggestions.push("Description is too short (recommended: 150-160 characters)")
    score -= 5
  } else if (settings.description.length > 160) {
    suggestions.push("Description is too long (recommended: 150-160 characters)")
    score -= 5
  }

  // Open Graph checks
  if (!settings.ogImage) {
    suggestions.push("Add an Open Graph image for better social sharing")
    score -= 5
  }

  // Canonical URL
  if (!settings.canonicalUrl) {
    suggestions.push("Consider adding a canonical URL to prevent duplicate content")
    score -= 3
  }

  // Keywords
  if (settings.keywords.length === 0) {
    suggestions.push("Add focus keywords for better targeting")
    score -= 3
  }

  return { score: Math.max(0, score), issues, suggestions }
}

export function SEOPanel({ settings, onUpdateSettings, pageUrl }: SEOPanelProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [keywordInput, setKeywordInput] = useState("")
  const [schemaValidation, setSchemaValidation] = useState<{
    valid: boolean
    message: string
    errors?: string[]
  } | null>(null)

  const seoAnalysis = calculateSEOScore(settings)

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !settings.keywords.includes(keywordInput.trim())) {
      onUpdateSettings({
        keywords: [...settings.keywords, keywordInput.trim()]
      })
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    onUpdateSettings({
      keywords: settings.keywords.filter((k) => k !== keyword)
    })
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Simulate analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsAnalyzing(false)
  }

  const handleGenerateSchema = () => {
    // Generate basic schema based on page settings
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": settings.title || "Untitled Page",
      "description": settings.description || "",
      "url": pageUrl || settings.canonicalUrl || ""
    }
    
    onUpdateSettings({ 
      structuredData: JSON.stringify(schema, null, 2) 
    })
    
    setSchemaValidation({
      valid: true,
      message: "Schema generated successfully!"
    })
    
    setTimeout(() => setSchemaValidation(null), 3000)
  }

  const handleValidateSchema = () => {
    try {
      if (!settings.structuredData.trim()) {
        setSchemaValidation({
          valid: false,
          message: "No schema data to validate",
          errors: ["Please add structured data or click Generate Schema"]
        })
        return
      }
      
      const parsed = JSON.parse(settings.structuredData)
      const errors: string[] = []
      
      // Basic validation
      if (!parsed["@context"]) {
        errors.push("Missing @context property")
      }
      if (!parsed["@type"]) {
        errors.push("Missing @type property")
      }
      
      if (errors.length > 0) {
        setSchemaValidation({
          valid: false,
          message: "Schema validation failed",
          errors
        })
      } else {
        setSchemaValidation({
          valid: true,
          message: "Schema is valid! ✓"
        })
        setTimeout(() => setSchemaValidation(null), 3000)
      }
    } catch (error) {
      setSchemaValidation({
        valid: false,
        message: "Invalid JSON format",
        errors: ["Please check your JSON syntax"]
      })
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">SEO Settings</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Analyze
          </Button>
        </div>
      </div>

      {/* SEO Score Card */}
      <div className="border-b p-4">
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SEO Score</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{seoAnalysis.score}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
              </div>
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full",
                  seoAnalysis.score >= 80
                    ? "bg-green-500/20 text-green-500"
                    : seoAnalysis.score >= 50
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "bg-red-500/20 text-red-500"
                )}
              >
                {seoAnalysis.score >= 80 ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : seoAnalysis.score >= 50 ? (
                  <AlertCircle className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
                )}
              </div>
            </div>
            <Progress value={seoAnalysis.score} className="mt-3 h-2" />
            
            {/* Issues & Suggestions */}
            {(seoAnalysis.issues.length > 0 || seoAnalysis.suggestions.length > 0) && (
              <div className="mt-4 space-y-2">
                {seoAnalysis.issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-red-400">
                    <XCircle className="h-4 w-4" />
                    {issue}
                  </div>
                ))}
                {seoAnalysis.suggestions.slice(0, 3).map((suggestion, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-yellow-400">
                    <AlertCircle className="h-4 w-4" />
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="basic" className="gap-1 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1 text-xs">
            <Share2 className="h-3.5 w-3.5" />
            Social
          </TabsTrigger>
          <TabsTrigger value="technical" className="gap-1 text-xs">
            <Code className="h-3.5 w-3.5" />
            Technical
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1 text-xs">
            <Settings className="h-3.5 w-3.5" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Page Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Page Title</Label>
                <span className={cn(
                  "text-xs",
                  settings.title.length > 60 ? "text-red-400" : "text-muted-foreground"
                )}>
                  {settings.title.length}/60
                </span>
              </div>
              <Input
                value={settings.title}
                onChange={(e) => onUpdateSettings({ title: e.target.value })}
                placeholder="Enter page title..."
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 50-60 characters. This appears in search results.
              </p>
            </div>

            {/* Meta Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Meta Description</Label>
                <span className={cn(
                  "text-xs",
                  settings.description.length > 160 ? "text-red-400" : "text-muted-foreground"
                )}>
                  {settings.description.length}/160
                </span>
              </div>
              <Textarea
                value={settings.description}
                onChange={(e) => onUpdateSettings({ description: e.target.value })}
                placeholder="Enter meta description..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 150-160 characters. Summarize your page content.
              </p>
            </div>

            {/* Focus Keywords */}
            <div className="space-y-2">
              <Label>Focus Keywords</Label>
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Add keyword..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                />
                <Button onClick={handleAddKeyword}>Add</Button>
              </div>
              {settings.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {settings.keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      {keyword}
                      <XCircle className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Canonical URL */}
            <div className="space-y-2">
              <Label>Canonical URL</Label>
              <Input
                value={settings.canonicalUrl}
                onChange={(e) => onUpdateSettings({ canonicalUrl: e.target.value })}
                placeholder="https://example.com/page"
              />
              <p className="text-xs text-muted-foreground">
                Specify the preferred URL for this page to avoid duplicate content.
              </p>
            </div>

            {/* Search Preview */}
            <div className="space-y-2">
              <Label>Search Preview</Label>
              <Card className="bg-white text-black">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-600 hover:underline">
                    {settings.title || "Page Title"}
                  </p>
                  <p className="text-xs text-green-700">
                    {pageUrl || "https://example.com/page"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {settings.description || "Meta description will appear here..."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Open Graph */}
            <div className="space-y-4">
              <h3 className="font-medium">Open Graph (Facebook, LinkedIn)</h3>
              
              <div className="space-y-2">
                <Label>OG Title</Label>
                <Input
                  value={settings.ogTitle}
                  onChange={(e) => onUpdateSettings({ ogTitle: e.target.value })}
                  placeholder={settings.title || "Same as page title"}
                />
              </div>

              <div className="space-y-2">
                <Label>OG Description</Label>
                <Textarea
                  value={settings.ogDescription}
                  onChange={(e) => onUpdateSettings({ ogDescription: e.target.value })}
                  placeholder={settings.description || "Same as meta description"}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input
                  value={settings.ogImage}
                  onChange={(e) => onUpdateSettings({ ogImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1200x630 pixels
                </p>
              </div>

              <div className="space-y-2">
                <Label>OG Type</Label>
                <Select
                  value={settings.ogType}
                  onValueChange={(value) => onUpdateSettings({ ogType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Twitter Card */}
            <div className="space-y-4">
              <h3 className="font-medium">Twitter Card</h3>
              
              <div className="space-y-2">
                <Label>Card Type</Label>
                <Select
                  value={settings.twitterCard}
                  onValueChange={(value) => onUpdateSettings({ twitterCard: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select card type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                    <SelectItem value="player">Player</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Twitter Title</Label>
                <Input
                  value={settings.twitterTitle}
                  onChange={(e) => onUpdateSettings({ twitterTitle: e.target.value })}
                  placeholder={settings.ogTitle || settings.title || "Same as OG title"}
                />
              </div>

              <div className="space-y-2">
                <Label>Twitter Image URL</Label>
                <Input
                  value={settings.twitterImage}
                  onChange={(e) => onUpdateSettings({ twitterImage: e.target.value })}
                  placeholder={settings.ogImage || "Same as OG image"}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Robots */}
            <div className="space-y-2">
              <Label>Robots Meta Tag</Label>
              <Select
                value={settings.robots}
                onValueChange={(value) => onUpdateSettings({ robots: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select robots directive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index, follow">Index, Follow (Default)</SelectItem>
                  <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                  <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                  <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Controls how search engines crawl and index this page.
              </p>
            </div>

            {/* Sitemap */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Include in Sitemap</Label>
                <p className="text-xs text-muted-foreground">
                  Add this page to the XML sitemap
                </p>
              </div>
              <Switch
                checked={settings.sitemap}
                onCheckedChange={(checked) => onUpdateSettings({ sitemap: checked })}
              />
            </div>

            {/* Structured Data */}
            <div className="space-y-2">
              <Label>Structured Data (JSON-LD)</Label>
              <Textarea
                value={settings.structuredData}
                onChange={(e) => onUpdateSettings({ structuredData: e.target.value })}
                placeholder='{"@context": "https://schema.org", ...}'
                rows={8}
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={handleGenerateSchema}
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Schema
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={handleValidateSchema}
                >
                  <ExternalLink className="h-4 w-4" />
                  Validate
                </Button>
              </div>
              {schemaValidation && (
                <div className={cn(
                  "mt-2 rounded-lg border p-3 text-sm",
                  schemaValidation.valid 
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : "border-red-500/50 bg-red-500/10 text-red-400"
                )}>
                  <div className="flex items-center gap-2">
                    {schemaValidation.valid ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="font-medium">{schemaValidation.message}</span>
                  </div>
                  {schemaValidation.errors && schemaValidation.errors.length > 0 && (
                    <ul className="mt-2 ml-6 list-disc space-y-1 text-xs">
                      {schemaValidation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Hreflang */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hreflang Tags (Multi-language)</Label>
                <Button variant="outline" size="sm">
                  Add Language
                </Button>
              </div>
              {settings.hreflang.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No alternate language versions configured.
                </p>
              ) : (
                <div className="space-y-2">
                  {settings.hreflang.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={item.lang} placeholder="en-US" className="w-24" />
                      <Input value={item.url} placeholder="https://..." className="flex-1" />
                      <Button variant="ghost" size="icon">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Redirects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Redirects</Label>
                <Button variant="outline" size="sm">
                  Add Redirect
                </Button>
              </div>
              {settings.redirects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No redirects configured for this page.
                </p>
              ) : (
                <div className="space-y-2">
                  {settings.redirects.map((redirect, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={redirect.from} placeholder="/old-path" className="flex-1" />
                      <span className="flex items-center text-muted-foreground">→</span>
                      <Input value={redirect.to} placeholder="/new-path" className="flex-1" />
                      <Select value={redirect.type}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="301">301</SelectItem>
                          <SelectItem value="302">302</SelectItem>
                          <SelectItem value="307">307</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
