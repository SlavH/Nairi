"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ComingSoonSection } from "@/components/ui/coming-soon-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  TrendingUp,
  Users,
  Star,
  Plus,
  Eye,
  Edit,
  BarChart3,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Award,
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/context"

interface CreatorAgent {
  id: string
  name: string
  description: string
  is_published: boolean
  is_free: boolean
  price_cents: number
  usage_count?: number
  rating: number
  total_earnings?: number
  sales_count?: number
}

interface CreatorProduct {
  id: string
  title: string
  description: string | null
  product_type: string
  price_cents: number
  is_published: boolean
  purchase_count: number
  rating: number | null
}

interface CreatorStats {
  totalEarnings: number
  totalSales: number
  totalUsers: number
  averageRating: number
  earningsChange: number
  salesChange: number
}

interface ExpertBadgeRef {
  id: string
  name: string
  domain: string
  description: string | null
  icon: string | null
  color: string | null
}

interface CreatorBadge {
  id: string
  earned_at: string
  earned_via: string | null
  expert_badges: ExpertBadgeRef | null
}

interface CreatorDashboardProps {
  agents: CreatorAgent[]
  products?: CreatorProduct[]
  stats: CreatorStats
  badges?: CreatorBadge[]
}

const productTypeLabels: Record<string, string> = {
  prompt: "Text",
  template: "Template",
  tool: "Tool",
  workflow: "Workflow",
  course: "Course",
  design: "Design",
  code: "Website",
}

export function CreatorDashboard({ agents, products = [], stats, badges = [] }: CreatorDashboardProps) {
  const t = useTranslation()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.marketplace.creatorEconomy}</h1>
          <p className="text-muted-foreground mt-1">Manage your AI agents and track earnings</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]">
          <Link href="/marketplace/create">
            <Plus className="h-4 w-4 mr-2" />
            {t.marketplace.createAgent}
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#e052a0]/10 to-[#00c9c8]/10 border-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.marketplace.earnings}</p>
                <p className="text-2xl font-bold">${(stats.totalEarnings / 100).toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.earningsChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${stats.earningsChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {stats.earningsChange}% this month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.marketplace.sales}</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.salesChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${stats.salesChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {stats.salesChange}% this month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. {t.marketplace.rating}</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expert Badges */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Expert badges
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketplace/creator/badges">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Earn verification badges by completing exams or contributing.{" "}
              <Link href="/marketplace/creator/badges" className="text-primary hover:underline">
                Browse catalog
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.slice(0, 6).map((ub) => (
                <Badge
                  key={ub.id}
                  variant="secondary"
                  className="text-xs"
                  style={
                    ub.expert_badges?.color
                      ? { borderColor: ub.expert_badges.color, color: ub.expert_badges.color }
                      : undefined
                  }
                >
                  {ub.expert_badges?.name ?? "Badge"}
                </Badge>
              ))}
              {badges.length > 6 && (
                <Link href="/marketplace/creator/badges">
                  <Badge variant="outline">+{badges.length - 6}</Badge>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expert Badges */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Expert badges
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketplace/creator/badges">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Earn verification badges by completing exams or contributing.{" "}
              <Link href="/marketplace/creator/badges" className="text-primary hover:underline">
                Browse catalog
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.slice(0, 6).map((ub) => (
                <Badge
                  key={ub.id}
                  variant="secondary"
                  className="text-xs"
                  style={
                    ub.expert_badges?.color
                      ? { borderColor: ub.expert_badges.color, color: ub.expert_badges.color }
                      : undefined
                  }
                >
                  {ub.expert_badges?.name ?? "Badge"}
                </Badge>
              ))}
              {badges.length > 6 && (
                <Link href="/marketplace/creator/badges">
                  <Badge variant="outline">+{badges.length - 6}</Badge>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agents List */}
      <Tabs defaultValue="published">
        <TabsList>
          <TabsTrigger value="published">Agents</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="creations">Creations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="mt-6">
          <div className="grid gap-4">
            {agents
              .filter((a) => a.is_published)
              .map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-[#e052a0]/20 to-[#00c9c8]/20 flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{agent.name}</h3>
                            {agent.is_free ? (
                              <Badge className="bg-green-500/10 text-green-500 border-0">{t.marketplace.free}</Badge>
                            ) : (
                              <Badge variant="outline">${(agent.price_cents / 100).toFixed(2)}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{agent.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t.marketplace.sales}</p>
                          <p className="font-semibold">{agent.sales_count ?? agent.usage_count ?? 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t.marketplace.earnings}</p>
                          <p className="font-semibold">${((agent.total_earnings ?? 0) / 100).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t.marketplace.rating}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{agent.rating || "N/A"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm" className="bg-transparent">
                            <Link href={`/marketplace/${agent.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="bg-transparent">
                            <Link href={`/marketplace/edit/${agent.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {agents.filter((a) => a.is_published).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No published agents</h3>
                  <p className="text-muted-foreground mb-4">Create and publish your first AI agent to start earning</p>
                  <Button asChild className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]">
                    <Link href="/marketplace/create">
                      <Plus className="h-4 w-4 mr-2" />
                      {t.marketplace.createAgent}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <div className="grid gap-4">
            {agents
              .filter((a) => !a.is_published)
              .map((agent) => (
                <Card key={agent.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{agent.name || "Untitled Agent"}</h3>
                            <Badge variant="outline">{t.marketplace.draft}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {agent.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="bg-transparent">
                          <Link href={`/marketplace/edit/${agent.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Continue Editing
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {agents.filter((a) => !a.is_published).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No drafts</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="creations" className="mt-6">
          <div className="grid gap-4">
            {products
              .filter((p) => p.is_published)
              .map((product) => (
                <Card key={product.id} className="bg-white/5 backdrop-blur-md border-white/20 hover:border-[#00c9c8]/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                          <FileText className="h-6 w-6 text-[#00c9c8]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{product.title}</h3>
                            <Badge variant="secondary" className="text-xs bg-white/10 border-white/10">
                              {productTypeLabels[product.product_type] || product.product_type}
                            </Badge>
                            {product.price_cents === 0 ? (
                              <Badge className="bg-[#00c9c8]/20 text-[#00c9c8] border-0">{t.marketplace.free}</Badge>
                            ) : (
                              <Badge variant="outline">${(product.price_cents / 100).toFixed(2)}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{product.description || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t.marketplace.sales}</p>
                          <p className="font-semibold">{product.purchase_count ?? 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t.marketplace.rating}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{product.rating ?? "N/A"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm" className="bg-white/5 border-white/20">
                            <Link href={`/marketplace/product/${product.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="bg-white/5 border-white/20">
                            <Link href={`/marketplace/edit/product/${product.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {products.filter((p) => !p.is_published).map((product) => (
              <Card key={product.id} className="bg-white/5 backdrop-blur-md border-white/20 opacity-75 hover:opacity-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{product.title || "Untitled"}</h3>
                          <Badge variant="outline">{t.marketplace.draft}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.description || "—"}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="bg-white/5 border-white/20">
                      <Link href={`/marketplace/edit/product/${product.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {products.length === 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/20">
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No creations yet</h3>
                  <p className="text-muted-foreground mb-4">Sell text, templates, websites, and more from the Add & sell flow.</p>
                  <Button asChild className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
                    <Link href="/marketplace/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Add & sell
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card className="bg-white/5 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Detailed analytics for your agents and creations</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <ComingSoonSection message="Detailed analytics for your agents and creations are coming soon." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
