"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Rocket,
  Globe,
  Server,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw,
  Settings,
  Eye,
  GitBranch,
  History,
  Zap,
  Lock,
  Unlock,
  Link,
  Unlink,
  Cloud,
  HardDrive,
  Activity,
  BarChart3
} from "lucide-react"

// Deployment Types
export interface Deployment {
  id: string
  status: "pending" | "building" | "deploying" | "success" | "failed"
  environment: "production" | "staging" | "preview"
  url: string
  branch: string
  commit: string
  createdAt: Date
  completedAt?: Date
  duration?: number
  error?: string
}

export interface Domain {
  id: string
  domain: string
  status: "pending" | "active" | "error"
  ssl: boolean
  primary: boolean
  createdAt: Date
}

export interface DeploySettings {
  autoDeploy: boolean
  productionBranch: string
  buildCommand: string
  outputDirectory: string
  environmentVariables: { key: string; value: string; isSecret: boolean }[]
}

interface DeployPanelProps {
  deployments: Deployment[]
  domains: Domain[]
  settings: DeploySettings
  onDeploy: (environment: "production" | "staging" | "preview") => void
  onUpdateSettings: (settings: Partial<DeploySettings>) => void
  onAddDomain: (domain: string) => void
  onRemoveDomain: (id: string) => void
}

export function DeployPanel({
  deployments,
  domains,
  settings,
  onDeploy,
  onUpdateSettings,
  onAddDomain,
  onRemoveDomain
}: DeployPanelProps) {
  const [activeTab, setActiveTab] = useState("deploy")
  const [isDeploying, setIsDeploying] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [deployProgress, setDeployProgress] = useState(0)

  const latestDeployment = deployments[0]
  const productionDomain = domains.find((d) => d.primary)

  const handleDeploy = async (environment: "production" | "staging" | "preview") => {
    setIsDeploying(true)
    setDeployProgress(0)
    
    // Simulate deployment progress
    const interval = setInterval(() => {
      setDeployProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsDeploying(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
    
    onDeploy(environment)
  }

  const handleAddDomain = () => {
    if (newDomain.trim()) {
      onAddDomain(newDomain.trim())
      setNewDomain("")
    }
  }

  const getStatusIcon = (status: Deployment["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "building":
      case "deploying":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Publishing</h2>
          </div>
          <div className="flex items-center gap-2">
            {latestDeployment?.status === "success" && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Quick Deploy Card */}
      <div className="border-b p-4">
        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Deploy to Production</h3>
                <p className="text-sm text-muted-foreground">
                  {productionDomain ? productionDomain.domain : "No domain configured"}
                </p>
              </div>
              <Button
                onClick={() => handleDeploy("production")}
                disabled={isDeploying}
                className="gap-2"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Deploy Now
                  </>
                )}
              </Button>
            </div>
            
            {isDeploying && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Building...</span>
                  <span>{deployProgress}%</span>
                </div>
                <Progress value={deployProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="deploy" className="gap-1 text-xs">
            <Rocket className="h-3.5 w-3.5" />
            Deploy
          </TabsTrigger>
          <TabsTrigger value="domains" className="gap-1 text-xs">
            <Globe className="h-3.5 w-3.5" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1 text-xs">
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1 text-xs">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Deploy Tab */}
        <TabsContent value="deploy" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Environment Cards */}
            <div className="grid grid-cols-3 gap-4">
              {/* Production */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Production</CardTitle>
                    <Badge variant="default">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    {productionDomain?.domain || "No domain"}
                  </p>
                  <Button
                    size="sm"
                    className="w-full gap-1"
                    onClick={() => handleDeploy("production")}
                    disabled={isDeploying}
                  >
                    <Rocket className="h-3 w-3" />
                    Deploy
                  </Button>
                </CardContent>
              </Card>

              {/* Staging */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Staging</CardTitle>
                    <Badge variant="secondary">Preview</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    staging.yoursite.com
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                    onClick={() => handleDeploy("staging")}
                    disabled={isDeploying}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Preview</CardTitle>
                    <Badge variant="outline">Branch</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    Temporary preview URL
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1"
                    onClick={() => handleDeploy("preview")}
                    disabled={isDeploying}
                  >
                    <Zap className="h-3 w-3" />
                    Quick Preview
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Latest Deployment */}
            {latestDeployment && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Latest Deployment</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(latestDeployment.status)}
                        <div>
                          <p className="font-medium capitalize">{latestDeployment.status}</p>
                          <p className="text-xs text-muted-foreground">
                            {latestDeployment.createdAt.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <GitBranch className="h-3 w-3" />
                          {latestDeployment.branch}
                        </Badge>
                        {latestDeployment.url && (
                          <Button variant="ghost" size="sm" className="gap-1">
                            <ExternalLink className="h-4 w-4" />
                            Visit
                          </Button>
                        )}
                      </div>
                    </div>
                    {latestDeployment.error && (
                      <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {latestDeployment.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Performance Stats */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Performance</h3>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Activity className="mx-auto h-8 w-8 text-green-500" />
                    <p className="mt-2 text-2xl font-bold">99.9%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Zap className="mx-auto h-8 w-8 text-yellow-500" />
                    <p className="mt-2 text-2xl font-bold">1.2s</p>
                    <p className="text-xs text-muted-foreground">Load Time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="mx-auto h-8 w-8 text-blue-500" />
                    <p className="mt-2 text-2xl font-bold">95</p>
                    <p className="text-xs text-muted-foreground">Performance Score</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Add Domain */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Add Custom Domain</h3>
              <div className="flex gap-2">
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="flex-1"
                />
                <Button onClick={handleAddDomain}>Add Domain</Button>
              </div>
            </div>

            {/* Domain List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Your Domains</h3>
              {domains.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Globe className="h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-2 text-muted-foreground">No domains configured</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <Card key={domain.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            domain.status === "active" ? "bg-green-500/10" : "bg-yellow-500/10"
                          )}>
                            {domain.status === "active" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{domain.domain}</p>
                              {domain.primary && (
                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {domain.ssl ? (
                                <span className="flex items-center gap-1 text-green-500">
                                  <Lock className="h-3 w-3" />
                                  SSL Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-yellow-500">
                                  <Unlock className="h-3 w-3" />
                                  SSL Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => onRemoveDomain(domain.id)}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* SSL Info */}
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="flex items-center gap-3 p-4">
                <Shield className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">Automatic SSL</p>
                  <p className="text-sm text-muted-foreground">
                    All domains automatically receive free SSL certificates
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Deployment History</h3>
            {deployments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <History className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-2 text-muted-foreground">No deployments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {deployments.map((deployment) => (
                  <Card key={deployment.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium capitalize">{deployment.environment}</p>
                            <Badge variant="outline" className="text-xs">
                              {deployment.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {deployment.createdAt.toLocaleString()}
                            {deployment.duration && ` • ${deployment.duration}s`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <GitBranch className="h-3 w-3" />
                          {deployment.branch}
                        </Badge>
                        <code className="text-xs text-muted-foreground">
                          {deployment.commit.slice(0, 7)}
                        </code>
                        {deployment.url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-6">
            {/* Auto Deploy */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Deploy</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically deploy when pushing to production branch
                </p>
              </div>
              <Switch
                checked={settings.autoDeploy}
                onCheckedChange={(checked) => onUpdateSettings({ autoDeploy: checked })}
              />
            </div>

            {/* Production Branch */}
            <div className="space-y-2">
              <Label>Production Branch</Label>
              <Input
                value={settings.productionBranch}
                onChange={(e) => onUpdateSettings({ productionBranch: e.target.value })}
                placeholder="main"
              />
            </div>

            {/* Build Command */}
            <div className="space-y-2">
              <Label>Build Command</Label>
              <Input
                value={settings.buildCommand}
                onChange={(e) => onUpdateSettings({ buildCommand: e.target.value })}
                placeholder="npm run build"
                className="font-mono"
              />
            </div>

            {/* Output Directory */}
            <div className="space-y-2">
              <Label>Output Directory</Label>
              <Input
                value={settings.outputDirectory}
                onChange={(e) => onUpdateSettings({ outputDirectory: e.target.value })}
                placeholder=".next"
                className="font-mono"
              />
            </div>

            {/* Environment Variables */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Environment Variables</Label>
                <Button variant="outline" size="sm">
                  Add Variable
                </Button>
              </div>
              {settings.environmentVariables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No environment variables configured
                </p>
              ) : (
                <div className="space-y-2">
                  {settings.environmentVariables.map((env, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={env.key} placeholder="KEY" className="flex-1 font-mono" />
                      <Input
                        value={env.isSecret ? "••••••••" : env.value}
                        placeholder="value"
                        type={env.isSecret ? "password" : "text"}
                        className="flex-1 font-mono"
                      />
                      <Button variant="ghost" size="icon">
                        {env.isSecret ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
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
