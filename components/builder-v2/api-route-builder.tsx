"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Route,
  Plus,
  Trash2,
  Copy,
  Check,
  Code,
  Play,
  Shield,
  Database,
  Zap,
  FileJson,
  Lock,
  Globe,
  Settings2,
  Wand2,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

interface Parameter {
  id: string
  name: string
  type: "string" | "number" | "boolean" | "object" | "array"
  required: boolean
  description: string
  defaultValue?: string
}

interface ApiRoute {
  id: string
  path: string
  method: HttpMethod
  description: string
  parameters: Parameter[]
  queryParams: Parameter[]
  bodySchema?: string
  responseSchema?: string
  requiresAuth: boolean
  rateLimit?: number
  caching?: boolean
  cacheDuration?: number
}

interface ApiRouteBuilderProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onGenerateRoutes: (routes: string) => void
}

const HTTP_METHODS: { value: HttpMethod; color: string }[] = [
  { value: "GET", color: "bg-green-500" },
  { value: "POST", color: "bg-blue-500" },
  { value: "PUT", color: "bg-amber-500" },
  { value: "PATCH", color: "bg-purple-500" },
  { value: "DELETE", color: "bg-red-500" },
]

const ROUTE_TEMPLATES = [
  {
    name: "CRUD Resource",
    description: "Complete CRUD operations for a resource",
    routes: [
      { path: "/api/items", method: "GET" as HttpMethod, description: "List all items" },
      { path: "/api/items", method: "POST" as HttpMethod, description: "Create new item" },
      { path: "/api/items/[id]", method: "GET" as HttpMethod, description: "Get item by ID" },
      { path: "/api/items/[id]", method: "PUT" as HttpMethod, description: "Update item" },
      { path: "/api/items/[id]", method: "DELETE" as HttpMethod, description: "Delete item" },
    ]
  },
  {
    name: "Authentication",
    description: "User authentication endpoints",
    routes: [
      { path: "/api/auth/login", method: "POST" as HttpMethod, description: "User login" },
      { path: "/api/auth/register", method: "POST" as HttpMethod, description: "User registration" },
      { path: "/api/auth/logout", method: "POST" as HttpMethod, description: "User logout" },
      { path: "/api/auth/me", method: "GET" as HttpMethod, description: "Get current user" },
      { path: "/api/auth/refresh", method: "POST" as HttpMethod, description: "Refresh token" },
    ]
  },
  {
    name: "File Upload",
    description: "File upload and management",
    routes: [
      { path: "/api/upload", method: "POST" as HttpMethod, description: "Upload file" },
      { path: "/api/files", method: "GET" as HttpMethod, description: "List files" },
      { path: "/api/files/[id]", method: "DELETE" as HttpMethod, description: "Delete file" },
    ]
  },
  {
    name: "Search & Filter",
    description: "Search and filtering endpoints",
    routes: [
      { path: "/api/search", method: "GET" as HttpMethod, description: "Search items" },
      { path: "/api/filter", method: "POST" as HttpMethod, description: "Filter with complex criteria" },
    ]
  }
]

export function ApiRouteBuilder({ isOpen, onOpenChange, onGenerateRoutes }: ApiRouteBuilderProps) {
  const [routes, setRoutes] = useState<ApiRoute[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("routes")
  const [copied, setCopied] = useState(false)
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set())

  const currentRoute = routes.find(r => r.id === selectedRoute)

  const addRoute = useCallback(() => {
    const newRoute: ApiRoute = {
      id: `route-${Date.now()}`,
      path: "/api/new-route",
      method: "GET",
      description: "",
      parameters: [],
      queryParams: [],
      requiresAuth: false,
    }
    setRoutes(prev => [...prev, newRoute])
    setSelectedRoute(newRoute.id)
  }, [])

  const deleteRoute = useCallback((routeId: string) => {
    setRoutes(prev => prev.filter(r => r.id !== routeId))
    if (selectedRoute === routeId) {
      setSelectedRoute(null)
    }
    toast.success("Route deleted")
  }, [selectedRoute])

  const updateRoute = useCallback((routeId: string, updates: Partial<ApiRoute>) => {
    setRoutes(prev => prev.map(r => 
      r.id === routeId ? { ...r, ...updates } : r
    ))
  }, [])

  const addParameter = useCallback((routeId: string, type: 'parameters' | 'queryParams') => {
    const newParam: Parameter = {
      id: `param-${Date.now()}`,
      name: "newParam",
      type: "string",
      required: false,
      description: ""
    }
    setRoutes(prev => prev.map(r => 
      r.id === routeId 
        ? { ...r, [type]: [...r[type], newParam] }
        : r
    ))
  }, [])

  const updateParameter = useCallback((routeId: string, paramId: string, type: 'parameters' | 'queryParams', updates: Partial<Parameter>) => {
    setRoutes(prev => prev.map(r => 
      r.id === routeId 
        ? { 
            ...r, 
            [type]: r[type].map(p => 
              p.id === paramId ? { ...p, ...updates } : p
            )
          }
        : r
    ))
  }, [])

  const deleteParameter = useCallback((routeId: string, paramId: string, type: 'parameters' | 'queryParams') => {
    setRoutes(prev => prev.map(r => 
      r.id === routeId 
        ? { ...r, [type]: r[type].filter(p => p.id !== paramId) }
        : r
    ))
  }, [])

  const loadTemplate = useCallback((template: typeof ROUTE_TEMPLATES[0]) => {
    const newRoutes: ApiRoute[] = template.routes.map((r, i) => ({
      id: `route-${Date.now()}-${i}`,
      path: r.path,
      method: r.method,
      description: r.description,
      parameters: [],
      queryParams: [],
      requiresAuth: false,
    }))
    setRoutes(prev => [...prev, ...newRoutes])
    toast.success(`Added ${template.name} routes`)
  }, [])

  const toggleExpanded = useCallback((routeId: string) => {
    setExpandedRoutes(prev => {
      const next = new Set(prev)
      if (next.has(routeId)) {
        next.delete(routeId)
      } else {
        next.add(routeId)
      }
      return next
    })
  }, [])

  const generateCode = useCallback(() => {
    let code = `// API Routes generated by Nairi Builder
// Place these files in your app/api directory

`
    
    routes.forEach(route => {
      const fileName = route.path.replace('/api/', '').replace(/\[(\w+)\]/g, '[$1]')
      code += `// ===== ${route.path} (${route.method}) =====
// File: app/api/${fileName}/route.ts

import { NextRequest, NextResponse } from "next/server"
${route.requiresAuth ? 'import { createClient } from "@/lib/supabase/server"\nimport { getUserIdOrBypassForApi } from "@/lib/auth"' : ''}

export async function ${route.method}(request: NextRequest${route.path.includes('[') ? ', { params }: { params: { id: string } }' : ''}) {
  try {
${route.requiresAuth ? `    // Check authentication (Supabase + optional bypass in dev)
    const supabase = await createClient()
    const userId = await getUserIdOrBypassForApi(() => supabase.auth.getUser())
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

` : ''}${route.method === 'GET' ? `    // Get query parameters
${route.queryParams.map(p => `    const ${p.name} = request.nextUrl.searchParams.get("${p.name}")${p.required ? '' : ' || undefined'}`).join('\n')}
` : ''}${['POST', 'PUT', 'PATCH'].includes(route.method) ? `    // Parse request body
    const body = await request.json()
${route.parameters.map(p => `    const { ${p.name} } = body`).join('\n')}
` : ''}
    // Implement your logic here: ${route.description || route.method + ' ' + route.path}
    
    return NextResponse.json({
      success: true,
      message: "${route.description || 'Operation completed'}",
      data: null
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

`
    })

    return code
  }, [routes])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generateCode())
    setCopied(true)
    toast.success("Code copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }, [generateCode])

  const handleGenerate = useCallback(() => {
    onGenerateRoutes(generateCode())
    toast.success("API routes generated and added to project!")
    onOpenChange(false)
  }, [generateCode, onGenerateRoutes, onOpenChange])

  const getMethodColor = (method: HttpMethod) => {
    return HTTP_METHODS.find(m => m.value === method)?.color || "bg-gray-500"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Route className="h-4 w-4 text-white" />
            </div>
            API Route Builder
          </DialogTitle>
          <DialogDescription>
            Design your API endpoints visually and generate Next.js route handlers
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList>
              <TabsTrigger value="routes">Routes</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="code">Generated Code</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="routes" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              {/* Routes List */}
              <div className="w-72 border-r flex flex-col">
                <div className="p-4 border-b">
                  <Button onClick={addRoute} className="w-full gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Add Route
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {routes.map(route => (
                      <div
                        key={route.id}
                        className={cn(
                          "p-2 rounded-md cursor-pointer transition-colors",
                          selectedRoute === route.id 
                            ? "bg-violet-500/10 border border-violet-500/30" 
                            : "hover:bg-muted"
                        )}
                        onClick={() => setSelectedRoute(route.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[10px] px-1.5", getMethodColor(route.method))}>
                            {route.method}
                          </Badge>
                          <span className="text-sm font-mono truncate flex-1">{route.path}</span>
                        </div>
                        {route.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {route.description}
                          </p>
                        )}
                        <div className="flex gap-1 mt-1">
                          {route.requiresAuth && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              <Lock className="h-2.5 w-2.5 mr-0.5" />
                              Auth
                            </Badge>
                          )}
                          {route.rateLimit && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              <Shield className="h-2.5 w-2.5 mr-0.5" />
                              Rate
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {routes.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No routes yet.<br />Click "Add Route" to start.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Route Editor */}
              <div className="flex-1 flex flex-col">
                {currentRoute ? (
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6 max-w-2xl">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-28">
                            <Label className="text-xs">Method</Label>
                            <Select
                              value={currentRoute.method}
                              onValueChange={(value: HttpMethod) => updateRoute(currentRoute.id, { method: value })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {HTTP_METHODS.map(m => (
                                  <SelectItem key={m.value} value={m.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={cn("w-2 h-2 rounded-full", m.color)} />
                                      {m.value}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Path</Label>
                            <Input
                              value={currentRoute.path}
                              onChange={(e) => updateRoute(currentRoute.id, { path: e.target.value })}
                              placeholder="/api/your-route"
                              className="h-9 font-mono text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={currentRoute.description}
                            onChange={(e) => updateRoute(currentRoute.id, { description: e.target.value })}
                            placeholder="What does this endpoint do?"
                            className="h-9"
                          />
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold">Options</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Requires Auth</span>
                            </div>
                            <Switch
                              checked={currentRoute.requiresAuth}
                              onCheckedChange={(checked) => updateRoute(currentRoute.id, { requiresAuth: checked })}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Rate Limiting</span>
                            </div>
                            <Switch
                              checked={!!currentRoute.rateLimit}
                              onCheckedChange={(checked) => updateRoute(currentRoute.id, { rateLimit: checked ? 100 : undefined })}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Caching</span>
                            </div>
                            <Switch
                              checked={!!currentRoute.caching}
                              onCheckedChange={(checked) => updateRoute(currentRoute.id, { caching: checked })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Query Parameters (for GET) */}
                      {currentRoute.method === "GET" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Query Parameters</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addParameter(currentRoute.id, 'queryParams')}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          {currentRoute.queryParams.map(param => (
                            <Card key={param.id}>
                              <CardContent className="p-3">
                                <div className="flex gap-2">
                                  <Input
                                    value={param.name}
                                    onChange={(e) => updateParameter(currentRoute.id, param.id, 'queryParams', { name: e.target.value })}
                                    placeholder="name"
                                    className="h-8 text-sm flex-1"
                                  />
                                  <Select
                                    value={param.type}
                                    onValueChange={(value: Parameter['type']) => updateParameter(currentRoute.id, param.id, 'queryParams', { type: value })}
                                  >
                                    <SelectTrigger className="h-8 w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="string">string</SelectItem>
                                      <SelectItem value="number">number</SelectItem>
                                      <SelectItem value="boolean">boolean</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant={param.required ? "default" : "outline"}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => updateParameter(currentRoute.id, param.id, 'queryParams', { required: !param.required })}
                                  >
                                    Req
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive"
                                    onClick={() => deleteParameter(currentRoute.id, param.id, 'queryParams')}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Body Parameters (for POST/PUT/PATCH) */}
                      {['POST', 'PUT', 'PATCH'].includes(currentRoute.method) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Body Parameters</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addParameter(currentRoute.id, 'parameters')}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          {currentRoute.parameters.map(param => (
                            <Card key={param.id}>
                              <CardContent className="p-3">
                                <div className="flex gap-2">
                                  <Input
                                    value={param.name}
                                    onChange={(e) => updateParameter(currentRoute.id, param.id, 'parameters', { name: e.target.value })}
                                    placeholder="name"
                                    className="h-8 text-sm flex-1"
                                  />
                                  <Select
                                    value={param.type}
                                    onValueChange={(value: Parameter['type']) => updateParameter(currentRoute.id, param.id, 'parameters', { type: value })}
                                  >
                                    <SelectTrigger className="h-8 w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="string">string</SelectItem>
                                      <SelectItem value="number">number</SelectItem>
                                      <SelectItem value="boolean">boolean</SelectItem>
                                      <SelectItem value="object">object</SelectItem>
                                      <SelectItem value="array">array</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant={param.required ? "default" : "outline"}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => updateParameter(currentRoute.id, param.id, 'parameters', { required: !param.required })}
                                  >
                                    Req
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive"
                                    onClick={() => deleteParameter(currentRoute.id, param.id, 'parameters')}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Delete Route */}
                      <div className="pt-4 border-t">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteRoute(currentRoute.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Route
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold">No route selected</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select a route from the list or create a new one
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-6">
              <div className="grid grid-cols-2 gap-4">
                {ROUTE_TEMPLATES.map((template, i) => (
                  <Card
                    key={i}
                    className="cursor-pointer hover:border-violet-500/50 transition-colors"
                    onClick={() => loadTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-violet-500" />
                        {template.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {template.routes.map((route, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs">
                            <Badge className={cn("text-[10px] px-1", getMethodColor(route.method))}>
                              {route.method}
                            </Badge>
                            <span className="font-mono text-muted-foreground">{route.path}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="code" className="flex-1 overflow-hidden m-0">
            <div className="flex flex-col h-full">
              <div className="p-3 border-b flex items-center justify-between">
                <Label className="font-semibold">Generated Next.js API Routes</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <pre className="text-xs font-mono">
                  <code>{generateCode()}</code>
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generate Button */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
            onClick={handleGenerate}
            disabled={routes.length === 0}
          >
            <Wand2 className="h-4 w-4" />
            Generate & Add to Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Trigger button
export function ApiRouteBuilderTrigger({ onClick }: { onClick: () => void }) {
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
            <Route className="h-4 w-4" />
            API
          </Button>
        </TooltipTrigger>
        <TooltipContent>API Route Builder</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
