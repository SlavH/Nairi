"use client"

import { useState, useCallback } from "react"
import { VisualEditor, BuilderElement } from "@/components/builder-v2/visual-editor"
import { SEOPanel } from "@/components/builder-v2/seo/seo-panel"
import { GlobalStyles, DEFAULT_DESIGN_SYSTEM, DesignSystem } from "@/components/builder-v2/design-system/global-styles"
import { ProductManager, Product, Category } from "@/components/builder-v2/ecommerce/product-manager"
import { DeployPanel, Deployment, Domain, DeploySettings } from "@/components/builder-v2/publishing/deploy-panel"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  Sparkles,
  Palette,
  Search,
  ShoppingCart,
  Rocket,
  Settings,
  LayoutGrid,
  Code,
  Eye,
  Undo2,
  Redo2,
  Save,
  Menu,
  ChevronLeft,
  Smartphone,
  Tablet,
  Monitor,
  Zap,
  Globe,
  Shield,
  Users,
  BarChart3,
  FileText,
  Layers,
  MessageSquare
} from "lucide-react"

// Initial SEO Settings
const INITIAL_SEO_SETTINGS = {
  title: "",
  description: "",
  keywords: [] as string[],
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "",
  twitterDescription: "",
  twitterImage: "",
  robots: "index, follow",
  sitemap: true,
  structuredData: "",
  hreflang: [] as { lang: string; url: string }[],
  redirects: [] as { from: string; to: string; type: string }[]
}

// Initial Deploy Settings
const INITIAL_DEPLOY_SETTINGS: DeploySettings = {
  autoDeploy: true,
  productionBranch: "main",
  buildCommand: "npm run build",
  outputDirectory: ".next",
  environmentVariables: []
}

export default function VisualBuilderPage() {
  // State
  const [elements, setElements] = useState<BuilderElement[]>([])
  const [designSystem, setDesignSystem] = useState<DesignSystem>(DEFAULT_DESIGN_SYSTEM)
  const [seoSettings, setSeoSettings] = useState(INITIAL_SEO_SETTINGS)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [deploySettings, setDeploySettings] = useState<DeploySettings>(INITIAL_DEPLOY_SETTINGS)
  
  const [activeRightPanel, setActiveRightPanel] = useState<"seo" | "design" | "ecommerce" | "deploy" | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Handlers
  const handleCodeChange = useCallback((_code: string) => {
    setHasUnsavedChanges(true)
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setHasUnsavedChanges(false)
  }, [])

  const handleAddProduct = useCallback((product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setProducts((prev) => [...prev, newProduct])
  }, [])

  const handleUpdateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p))
    )
  }, [])

  const handleDeleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleDeploy = useCallback((environment: "production" | "staging" | "preview") => {
    const newDeployment: Deployment = {
      id: `deploy_${Date.now()}`,
      status: "building",
      environment,
      url: `https://${environment === "production" ? "www" : environment}.example.com`,
      branch: "main",
      commit: Math.random().toString(36).substring(7),
      createdAt: new Date()
    }
    setDeployments((prev) => [newDeployment, ...prev])
    
    // Simulate deployment completion
    setTimeout(() => {
      setDeployments((prev) =>
        prev.map((d) =>
          d.id === newDeployment.id
            ? { ...d, status: "success", completedAt: new Date(), duration: 45 }
            : d
        )
      )
    }, 5000)
  }, [])

  const handleAddDomain = useCallback((domain: string) => {
    const newDomain: Domain = {
      id: `domain_${Date.now()}`,
      domain,
      status: "pending",
      ssl: false,
      primary: domains.length === 0,
      createdAt: new Date()
    }
    setDomains((prev) => [...prev, newDomain])
    
    // Simulate SSL activation
    setTimeout(() => {
      setDomains((prev) =>
        prev.map((d) =>
          d.id === newDomain.id ? { ...d, status: "active", ssl: true } : d
        )
      )
    }, 3000)
  }, [domains.length])

  const handleRemoveDomain = useCallback((id: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Link href="/builder" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Nairi Builder</span>
          </Link>
          <Badge variant="secondary" className="text-xs">Visual Editor</Badge>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs text-yellow-500">
              Unsaved changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={activeRightPanel === "design" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setActiveRightPanel(activeRightPanel === "design" ? null : "design")}
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Design</span>
            </Button>
            <Button
              variant={activeRightPanel === "seo" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setActiveRightPanel(activeRightPanel === "seo" ? null : "seo")}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">SEO</span>
            </Button>
            <Button
              variant={activeRightPanel === "ecommerce" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setActiveRightPanel(activeRightPanel === "ecommerce" ? null : "ecommerce")}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Shop</span>
            </Button>
            <Button
              variant={activeRightPanel === "deploy" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2"
              onClick={() => setActiveRightPanel(activeRightPanel === "deploy" ? null : "deploy")}
            >
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Deploy</span>
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Save & Deploy */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            className="gap-1 bg-gradient-to-r from-violet-500 to-purple-600"
            onClick={() => handleDeploy("production")}
          >
            <Rocket className="h-4 w-4" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Visual Editor */}
          <ResizablePanel defaultSize={activeRightPanel ? 70 : 100}>
            <VisualEditor
              onCodeChange={handleCodeChange}
              initialElements={elements}
            />
          </ResizablePanel>

          {/* Right Panel (conditional) */}
          {activeRightPanel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                <div className="h-full border-l">
                  {activeRightPanel === "design" && (
                    <GlobalStyles
                      designSystem={designSystem}
                      onUpdateDesignSystem={(updates) =>
                        setDesignSystem((prev) => ({ ...prev, ...updates }))
                      }
                    />
                  )}
                  {activeRightPanel === "seo" && (
                    <SEOPanel
                      settings={seoSettings}
                      onUpdateSettings={(updates) =>
                        setSeoSettings((prev) => ({ ...prev, ...updates }))
                      }
                    />
                  )}
                  {activeRightPanel === "ecommerce" && (
                    <ProductManager
                      products={products}
                      categories={categories}
                      onAddProduct={handleAddProduct}
                      onUpdateProduct={handleUpdateProduct}
                      onDeleteProduct={handleDeleteProduct}
                    />
                  )}
                  {activeRightPanel === "deploy" && (
                    <DeployPanel
                      deployments={deployments}
                      domains={domains}
                      settings={deploySettings}
                      onDeploy={handleDeploy}
                      onUpdateSettings={(updates) =>
                        setDeploySettings((prev) => ({ ...prev, ...updates }))
                      }
                      onAddDomain={handleAddDomain}
                      onRemoveDomain={handleRemoveDomain}
                    />
                  )}
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Bottom Status Bar */}
      <footer className="flex h-8 items-center justify-between border-t bg-muted/30 px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {elements.length} elements
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            1 page
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {domains.length > 0 ? domains[0].domain : "No domain"}
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-green-500" />
            SSL Active
          </span>
          <span>v2.0.0</span>
        </div>
      </footer>
    </div>
  )
}
