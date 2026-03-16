"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Figma,
  Link2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Type,
  Image,
  Square,
  Circle,
  Code,
  Wand2,
  Settings2,
  Eye,
  Download,
  RefreshCw,
  ArrowRight,
  FileCode,
  Palette
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FigmaNode {
  id: string
  name: string
  type: 'FRAME' | 'GROUP' | 'TEXT' | 'RECTANGLE' | 'ELLIPSE' | 'VECTOR' | 'COMPONENT' | 'INSTANCE' | 'IMAGE'
  children?: FigmaNode[]
  selected: boolean
  styles?: {
    width?: number
    height?: number
    backgroundColor?: string
    color?: string
    fontSize?: number
    fontWeight?: string
  }
}

interface ImportSettings {
  generateTailwind: boolean
  createComponents: boolean
  extractColors: boolean
  extractTypography: boolean
  responsiveBreakpoints: boolean
  includeImages: boolean
}

interface FigmaImportProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onImport: (code: string, assets: string[]) => void
}

const NODE_ICONS: Record<FigmaNode['type'], React.ElementType> = {
  FRAME: Layers,
  GROUP: Layers,
  TEXT: Type,
  RECTANGLE: Square,
  ELLIPSE: Circle,
  VECTOR: Palette,
  COMPONENT: Code,
  INSTANCE: Code,
  IMAGE: Image,
}

export function FigmaImport({ isOpen, onOpenChange, onImport }: FigmaImportProps) {
  const [figmaUrl, setFigmaUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<'idle' | 'fetching' | 'parsing' | 'generating' | 'complete' | 'error'>('idle')
  const [nodes, setNodes] = useState<FigmaNode[]>([])
  const [generatedCode, setGeneratedCode] = useState('')
  const [activeTab, setActiveTab] = useState('import')
  const [settings, setSettings] = useState<ImportSettings>({
    generateTailwind: true,
    createComponents: true,
    extractColors: true,
    extractTypography: true,
    responsiveBreakpoints: true,
    includeImages: true,
  })

  const parseFileKey = (url: string): string | null => {
    // Parse Figma URL formats:
    // https://www.figma.com/file/XXXXX/...
    // https://www.figma.com/design/XXXXX/...
    const match = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/)
    return match ? match[2] : null
  }

  const handleFetchDesign = useCallback(async () => {
    const fileKey = parseFileKey(figmaUrl)
    if (!fileKey) {
      toast.error('Invalid Figma URL. Please paste a valid Figma file link.')
      return
    }

    setIsLoading(true)
    setImportStatus('fetching')
    setImportProgress(10)

    try {
      // Simulate API call to Figma
      // In production, this would call: https://api.figma.com/v1/files/{fileKey}
      await new Promise(resolve => setTimeout(resolve, 1500))
      setImportProgress(30)
      setImportStatus('parsing')

      // Mock parsed nodes from Figma
      const mockNodes: FigmaNode[] = [
        {
          id: '1',
          name: 'Hero Section',
          type: 'FRAME',
          selected: true,
          styles: { width: 1440, height: 800, backgroundColor: '#ffffff' },
          children: [
            { id: '1-1', name: 'Headline', type: 'TEXT', selected: true, styles: { fontSize: 48, fontWeight: 'bold', color: '#1a1a1a' } },
            { id: '1-2', name: 'Subheadline', type: 'TEXT', selected: true, styles: { fontSize: 18, color: '#666666' } },
            { id: '1-3', name: 'CTA Button', type: 'RECTANGLE', selected: true, styles: { width: 200, height: 50, backgroundColor: '#7c3aed' } },
            { id: '1-4', name: 'Hero Image', type: 'IMAGE', selected: true },
          ]
        },
        {
          id: '2',
          name: 'Features Section',
          type: 'FRAME',
          selected: true,
          styles: { width: 1440, height: 600, backgroundColor: '#f9fafb' },
          children: [
            { id: '2-1', name: 'Feature Card 1', type: 'COMPONENT', selected: true },
            { id: '2-2', name: 'Feature Card 2', type: 'COMPONENT', selected: true },
            { id: '2-3', name: 'Feature Card 3', type: 'COMPONENT', selected: true },
          ]
        },
        {
          id: '3',
          name: 'Footer',
          type: 'FRAME',
          selected: true,
          styles: { width: 1440, height: 300, backgroundColor: '#1a1a1a' },
          children: [
            { id: '3-1', name: 'Logo', type: 'IMAGE', selected: true },
            { id: '3-2', name: 'Links', type: 'GROUP', selected: true },
            { id: '3-3', name: 'Copyright', type: 'TEXT', selected: true, styles: { fontSize: 14, color: '#9ca3af' } },
          ]
        },
      ]

      await new Promise(resolve => setTimeout(resolve, 1000))
      setImportProgress(60)
      setNodes(mockNodes)
      setActiveTab('select')
      toast.success('Design fetched successfully!')

    } catch (error) {
      setImportStatus('error')
      toast.error('Failed to fetch Figma design. Check your URL and access token.')
    } finally {
      setIsLoading(false)
      setImportProgress(0)
      setImportStatus('idle')
    }
  }, [figmaUrl])

  const toggleNodeSelection = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return { ...node, selected: !node.selected }
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(child =>
            child.id === nodeId ? { ...child, selected: !child.selected } : child
          )
        }
      }
      return node
    }))
  }, [])

  const handleGenerateCode = useCallback(async () => {
    setIsLoading(true)
    setImportStatus('generating')
    setImportProgress(70)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setImportProgress(90)

      // Generate mock code based on selected nodes
      const selectedNodes = nodes.filter(n => n.selected)
      let code = `// Generated from Figma by Nairi Builder
// Components: ${selectedNodes.map(n => n.name).join(', ')}

import React from 'react'

`

      selectedNodes.forEach(node => {
        const componentName = node.name.replace(/\s+/g, '')
        code += `export function ${componentName}() {
  return (
    <section className="${node.styles?.backgroundColor === '#ffffff' ? 'bg-white' : node.styles?.backgroundColor === '#f9fafb' ? 'bg-gray-50' : 'bg-gray-900'} py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ${node.name} */}
${node.children?.map(child => {
  if (child.type === 'TEXT') {
    const textClass = child.styles?.fontSize && child.styles.fontSize > 30 
      ? 'text-4xl font-bold' 
      : child.styles?.fontSize && child.styles.fontSize > 16 
        ? 'text-lg text-muted-foreground'
        : 'text-sm text-muted-foreground'
    return `        <p className="${textClass}">${child.name}</p>`
  }
  if (child.type === 'RECTANGLE' && child.name.toLowerCase().includes('button')) {
    return `        <button className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
          Get Started
        </button>`
  }
  if (child.type === 'IMAGE') {
    return `        <img src="/placeholder.jpg" alt="${child.name}" className="rounded-lg" />`
  }
  if (child.type === 'COMPONENT') {
    return `        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold">${child.name}</h3>
          <p className="text-muted-foreground mt-2">Feature description goes here.</p>
        </div>`
  }
  return `        {/* ${child.name} */}`
}).join('\n')}
      </div>
    </section>
  )
}

`
      })

      // Add main page component
      code += `// Main Page Component
export default function Page() {
  return (
    <main>
${selectedNodes.map(n => `      <${n.name.replace(/\s+/g, '')} />`).join('\n')}
    </main>
  )
}
`

      setGeneratedCode(code)
      setImportProgress(100)
      setImportStatus('complete')
      setActiveTab('code')
      toast.success('Code generated successfully!')

    } catch (error) {
      setImportStatus('error')
      toast.error('Failed to generate code')
    } finally {
      setIsLoading(false)
    }
  }, [nodes])

  const handleImport = useCallback(() => {
    onImport(generatedCode, [])
    toast.success('Design imported to your project!')
    onOpenChange(false)
  }, [generatedCode, onImport, onOpenChange])

  const selectedCount = nodes.filter(n => n.selected).length +
    nodes.reduce((acc, n) => acc + (n.children?.filter(c => c.selected).length || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Figma className="h-4 w-4 text-white" />
            </div>
            Import from Figma
          </DialogTitle>
          <DialogDescription>
            Convert your Figma designs to React components with Tailwind CSS
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        {isLoading && (
          <div className="px-6 py-2 border-b">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                {importStatus === 'fetching' && 'Fetching design from Figma...'}
                {importStatus === 'parsing' && 'Parsing design elements...'}
                {importStatus === 'generating' && 'Generating React code...'}
              </span>
              <span className="text-muted-foreground">{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 w-fit">
            <TabsTrigger value="import">1. Import</TabsTrigger>
            <TabsTrigger value="select" disabled={nodes.length === 0}>2. Select</TabsTrigger>
            <TabsTrigger value="settings" disabled={nodes.length === 0}>3. Settings</TabsTrigger>
            <TabsTrigger value="code" disabled={!generatedCode}>4. Code</TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="flex-1 overflow-hidden m-0 p-6">
            <div className="max-w-lg mx-auto space-y-6">
              <div className="text-center mb-8">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                  <Figma className="h-8 w-8 text-violet-500" />
                </div>
                <h3 className="font-semibold text-lg">Connect to Figma</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste your Figma file URL to import your design
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Figma File URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://www.figma.com/file/..."
                      value={figmaUrl}
                      onChange={(e) => setFigmaUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Access Token (Optional)</Label>
                  <Input
                    type="password"
                    placeholder="figd_..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for private files. Get your token from Figma Settings → Account → Personal access tokens
                  </p>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleFetchDesign}
                  disabled={!figmaUrl || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Fetch Design
                </Button>
              </div>

              <div className="border-t pt-6">
                <p className="text-xs text-muted-foreground text-center">
                  Supported: Frames, Components, Text, Shapes, Images
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Select Tab */}
          <TabsContent value="select" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Select elements to import</Label>
                    <Badge variant="secondary">{selectedCount} selected</Badge>
                  </div>
                  {nodes.map(node => {
                    const NodeIcon = NODE_ICONS[node.type]
                    return (
                      <Card key={node.id} className={cn(node.selected && "border-violet-500")}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={node.selected}
                              onCheckedChange={() => toggleNodeSelection(node.id)}
                            />
                            <NodeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{node.name}</span>
                            <Badge variant="outline" className="text-xs ml-auto">
                              {node.type}
                            </Badge>
                          </div>
                          {node.children && node.children.length > 0 && (
                            <div className="ml-8 mt-2 space-y-1">
                              {node.children.map(child => {
                                const ChildIcon = NODE_ICONS[child.type]
                                return (
                                  <div key={child.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                      checked={child.selected}
                                      onCheckedChange={() => toggleNodeSelection(child.id)}
                                    />
                                    <ChildIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">{child.name}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-hidden m-0 p-6">
            <div className="max-w-lg mx-auto space-y-4">
              <Label className="text-sm font-semibold">Import Settings</Label>
              {[
                { key: 'generateTailwind', label: 'Generate Tailwind CSS classes', description: 'Convert Figma styles to Tailwind utility classes' },
                { key: 'createComponents', label: 'Create React components', description: 'Generate separate components for each frame' },
                { key: 'extractColors', label: 'Extract color palette', description: 'Create CSS variables for colors used in the design' },
                { key: 'extractTypography', label: 'Extract typography', description: 'Generate font styles and text classes' },
                { key: 'responsiveBreakpoints', label: 'Add responsive breakpoints', description: 'Include mobile and tablet variants' },
                { key: 'includeImages', label: 'Include images', description: 'Download and include image assets' },
              ].map(setting => (
                <div key={setting.key} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Checkbox
                    checked={settings[setting.key as keyof ImportSettings]}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      [setting.key]: checked
                    }))}
                  />
                  <div>
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                </div>
              ))}

              <Button
                className="w-full gap-2 mt-6"
                onClick={handleGenerateCode}
                disabled={isLoading || selectedCount === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Generate Code
              </Button>
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="flex-1 overflow-hidden m-0">
            <div className="flex flex-col h-full">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Code generated successfully</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode)
                    toast.success('Code copied!')
                  }}
                >
                  Copy Code
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <pre className="text-xs font-mono">
                  <code>{generatedCode}</code>
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
            onClick={handleImport}
            disabled={!generatedCode}
          >
            <FileCode className="h-4 w-4" />
            Import to Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Trigger button
export function FigmaImportTrigger({ onClick }: { onClick: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onClick}
          >
            <Figma className="h-4 w-4" />
            Figma
          </Button>
        </TooltipTrigger>
        <TooltipContent>Import from Figma</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
