import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Star,
  Sparkles,
  Search,
  Code,
  PenTool,
  BarChart3,
  Share2,
  Headphones,
  DollarSign,
  FileText,
  TrendingUp,
  ChevronLeft,
  Plus,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  code: Code,
  "pen-tool": PenTool,
  "bar-chart": BarChart3,
  "share-2": Share2,
  headphones: Headphones,
  "dollar-sign": DollarSign,
  "file-text": FileText,
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

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string; type?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const listType = params.type || "all" // all | agents | creations

  // Get user owned agents - only if logged in
  let ownedAgentIds = new Set<string>()
  if (user) {
    const { data: userAgents } = await supabase.from("user_agents").select("agent_id").eq("user_id", user.id)
    ownedAgentIds = new Set(userAgents?.map((ua) => ua.agent_id) || [])
  }

  // --- Agents ---
  let agentsQuery = supabase.from("agents").select("*")
  if (params.category && params.category !== "all") agentsQuery = agentsQuery.eq("category", params.category)
  if (params.q) agentsQuery = agentsQuery.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  switch (params.sort) {
    case "newest": agentsQuery = agentsQuery.order("created_at", { ascending: false }); break
    case "price_asc": agentsQuery = agentsQuery.order("price_cents", { ascending: true }); break
    case "price_desc": agentsQuery = agentsQuery.order("price_cents", { ascending: false }); break
    case "rating": agentsQuery = agentsQuery.order("rating", { ascending: false, nullsFirst: false }); break
    default: agentsQuery = agentsQuery.order("is_featured", { ascending: false }).order("usage_count", { ascending: false })
  }
  const { data: agentsData } = listType === "creations" ? { data: [] } : await agentsQuery
  const allAgents = agentsData || []
  const featuredAgents = allAgents.filter((a: { is_featured?: boolean }) => a.is_featured)

  // --- Products (creations: text, website, template, etc.) ---
  let products: { id: string; title: string; description: string | null; product_type: string; price_cents: number; category: string | null; purchase_count: number; rating: number | null }[] = []
  if (listType !== "agents") {
    let productsQuery = supabase
      .from("marketplace_products")
      .select("id, title, description, product_type, price_cents, category, purchase_count, rating")
      .eq("is_published", true)
    if (params.category && params.category !== "all") {
      productsQuery = productsQuery.eq("category", params.category)
    }
    if (params.q) {
      productsQuery = productsQuery.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
    }
    switch (params.sort) {
      case "newest":
        productsQuery = productsQuery.order("created_at", { ascending: false })
        break
      case "price_asc":
        productsQuery = productsQuery.order("price_cents", { ascending: true })
        break
      case "price_desc":
        productsQuery = productsQuery.order("price_cents", { ascending: false })
        break
      case "rating":
        productsQuery = productsQuery.order("rating", { ascending: false, nullsFirst: false })
        break
      default:
        productsQuery = productsQuery.order("purchase_count", { ascending: false })
    }
    const { data: productsData } = await productsQuery
    products = productsData || []
  }

  // Categories from both
  const { data: allAgentsForCategories } = await supabase.from("agents").select("category")
  const { data: productCategories } = await supabase.from("marketplace_products").select("category").eq("is_published", true)
  const categories = [...new Set([
    ...(allAgentsForCategories?.map((a) => a.category) || []),
    ...(productCategories?.map((p) => p.category) || []),
  ].filter(Boolean))]

  const currentCategory = params.category || "all"
  const currentSort = params.sort || "popular"
  const totalItems = allAgents.length + products.length

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden">
      {/* Header: back to /nav + title + Create Agent */}
      <header className="flex items-center justify-between gap-4 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-white/10" asChild>
            <Link href="/nav" aria-label="Back to navigation">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link href="/nav" className="flex items-center gap-2 min-w-0">
            <Image
              src="/images/nairi-logo-header.jpg"
              alt="Nairi"
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg border border-white/20 shrink-0"
            />
            <span className="font-bold text-sm sm:text-base bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent truncate">
              Marketplace
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs text-muted-foreground">
            {totalItems} items {listType === "all" ? `(${allAgents.length} agents, ${products.length} creations)` : ""}
          </span>
          <Button asChild variant="outline" size="sm" className="border-white/20 bg-white/5 text-foreground hover:bg-white/10">
            <Link href="/marketplace/creator">My creations</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
            <Link href="/marketplace/create" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add & sell
            </Link>
          </Button>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Discover agents, websites, text, templates, and other creations. Sell your own.</p>
          </div>

          <MarketplaceFilters
            categories={categories}
            currentCategory={currentCategory}
            currentSort={currentSort}
            searchQuery={params.q || ""}
            currentListType={listType}
          />

          {featuredAgents.length > 0 && listType !== "creations" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-[#e052a0]" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Featured Agents</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredAgents.map((agent) => {
                  const IconComponent = iconMap[agent.icon] || Search
                  const isOwned = ownedAgentIds.has(agent.id) || agent.is_free

                  return (
                    <Card
                      key={agent.id}
                      className="bg-white/5 backdrop-blur-md border-white/20 hover:border-[#00c9c8]/50 transition-all group"
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-[#e052a0] to-[#00c9c8] flex items-center justify-center shrink-0">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          {agent.is_free ? (
                            <Badge className="bg-[#00c9c8]/20 text-[#00c9c8] border-0">Free</Badge>
                          ) : (
                            <Badge variant="outline" className="border-[#e052a0]/50 text-[#e052a0]">
                              ${(agent.price_cents / 100).toFixed(2)}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-foreground text-lg">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{agent.description}</p>

                        <div className="flex flex-wrap gap-1 mt-3">
                          {agent.capabilities?.slice(0, 3).map((cap: string) => (
                            <span key={cap} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/10">
                              {cap}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-foreground">{agent.rating || "N/A"}</span>
                            <span className="text-xs text-muted-foreground ml-1">({agent.usage_count} uses)</span>
                          </div>

                          {isOwned ? (
                            <Button asChild size="sm" variant="outline" className="bg-white/5 border-white/20 text-foreground hover:bg-white/10">
                              <Link href="/chat">Use Agent</Link>
                            </Button>
                          ) : (
                            <Button asChild size="sm" className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
                              <Link href={`/marketplace/${agent.id}`}>Get Agent</Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              {listType === "agents" ? "Agents" : listType === "creations" ? "Creations" : "All listings"}
            </h2>
            {listType === "creations" ? (
              products.length === 0 ? (
                <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-md p-8 sm:p-12 text-center">
                  <p className="text-muted-foreground">No creations match your filters yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Sell text, websites, templates, and more.</p>
                  <Button asChild variant="outline" className="mt-4 border-white/20 bg-white/5 hover:bg-white/10 text-foreground" size="sm">
                    <Link href="/marketplace/create">Add & sell</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((p) => (
                    <Card key={p.id} className="bg-white/5 backdrop-blur-md border-white/20 hover:border-[#00c9c8]/50 transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                            <FileText className="h-5 w-5 text-[#00c9c8]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-medium text-foreground truncate">{p.title}</h3>
                              {p.price_cents === 0 ? (
                                <Badge className="bg-[#00c9c8]/20 text-[#00c9c8] border-0 text-xs shrink-0">Free</Badge>
                              ) : (
                                <span className="text-sm font-medium text-[#e052a0] shrink-0">${(p.price_cents / 100).toFixed(0)}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description || "—"}</p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant="secondary" className="text-[10px] bg-white/10 text-muted-foreground border-white/10">
                                {productTypeLabels[p.product_type] || p.product_type}
                              </Badge>
                              <Button asChild size="sm" className="h-7 text-xs bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
                                <Link href={`/marketplace/product/${p.id}`}>View</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : totalItems === 0 ? (
              <div className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-md p-8 sm:p-12 text-center">
                <p className="text-muted-foreground">No listings match your filters yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different category or type, or add your own creation.</p>
                <Button asChild variant="outline" className="mt-4 border-white/20 bg-white/5 hover:bg-white/10 text-foreground" size="sm">
                  <Link href="/marketplace/create">Add & sell</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allAgents.map((agent) => {
                  const IconComponent = iconMap[agent.icon] || Search
                  const isOwned = ownedAgentIds.has(agent.id) || agent.is_free

                  return (
                    <Card key={agent.id} className="bg-white/5 backdrop-blur-md border-white/20 hover:border-[#00c9c8]/50 transition-all">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#e052a0]/30 to-[#00c9c8]/30 flex items-center justify-center shrink-0 border border-white/10">
                            <IconComponent className="h-5 w-5 text-[#00c9c8]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-medium text-foreground truncate">{agent.name}</h3>
                              {agent.is_free ? (
                                <Badge className="bg-[#00c9c8]/20 text-[#00c9c8] border-0 text-xs shrink-0">Free</Badge>
                              ) : (
                                <span className="text-sm font-medium text-[#e052a0] shrink-0">
                                  ${(agent.price_cents / 100).toFixed(0)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agent.description}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-muted-foreground">{agent.category}</span>
                              {isOwned ? (
                                <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-foreground hover:bg-white/10">
                                  <Link href="/chat">Use</Link>
                                </Button>
                              ) : (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-7 text-xs bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
                                >
                                  <Link href={`/marketplace/${agent.id}`}>Get</Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {listType === "all" && products.map((p) => (
                  <Card key={p.id} className="bg-white/5 backdrop-blur-md border-white/20 hover:border-[#00c9c8]/50 transition-all">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                          <FileText className="h-5 w-5 text-[#00c9c8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium text-foreground truncate">{p.title}</h3>
                            {p.price_cents === 0 ? (
                              <Badge className="bg-[#00c9c8]/20 text-[#00c9c8] border-0 text-xs shrink-0">Free</Badge>
                            ) : (
                              <span className="text-sm font-medium text-[#e052a0] shrink-0">${(p.price_cents / 100).toFixed(0)}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description || "—"}</p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="secondary" className="text-[10px] bg-white/10 text-muted-foreground border-white/10">
                              {productTypeLabels[p.product_type] || p.product_type}
                            </Badge>
                            <Button asChild size="sm" className="h-7 text-xs bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90">
                              <Link href={`/marketplace/product/${p.id}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
