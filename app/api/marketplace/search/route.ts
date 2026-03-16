import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Search marketplace products and agents
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const url = new URL(req.url)
    
    const query = url.searchParams.get("q") || ""
    const category = url.searchParams.get("category")
    const type = url.searchParams.get("type") // 'agent' | 'product' | 'all'
    const minPrice = url.searchParams.get("minPrice")
    const maxPrice = url.searchParams.get("maxPrice")
    const sortBy = url.searchParams.get("sort") || "popular" // 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating'
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    // Search agents
    let agents: any[] = []
    if (!type || type === "all" || type === "agent") {
      let agentQuery = supabase
        .from("agents")
        .select("*, id, name, description, category, price_cents, rating, usage_count, is_featured, is_free, capabilities")
      
      if (query) {
        agentQuery = agentQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      }
      
      if (category) {
        agentQuery = agentQuery.eq("category", category)
      }
      
      if (minPrice) {
        agentQuery = agentQuery.gte("price_cents", parseInt(minPrice) * 100)
      }
      
      if (maxPrice) {
        agentQuery = agentQuery.lte("price_cents", parseInt(maxPrice) * 100)
      }
      
      // Sorting
      switch (sortBy) {
        case "newest":
          agentQuery = agentQuery.order("created_at", { ascending: false })
          break
        case "price_asc":
          agentQuery = agentQuery.order("price_cents", { ascending: true })
          break
        case "price_desc":
          agentQuery = agentQuery.order("price_cents", { ascending: false })
          break
        case "rating":
          agentQuery = agentQuery.order("rating", { ascending: false, nullsFirst: false })
          break
        default:
          agentQuery = agentQuery.order("usage_count", { ascending: false })
      }
      
      const { data: agentData } = await agentQuery.range(offset, offset + limit - 1)
      agents = (agentData || []).map(a => ({ ...a, itemType: "agent" }))
    }

    // Search marketplace products
    let products: any[] = []
    if (!type || type === "all" || type === "product") {
      let productQuery = supabase
        .from("marketplace_products")
        .select(`
          *,
          creator:creator_id (
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq("is_published", true)
      
      if (query) {
        productQuery = productQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      }
      
      if (category) {
        productQuery = productQuery.eq("category", category)
      }
      
      if (minPrice) {
        productQuery = productQuery.gte("price_cents", parseInt(minPrice) * 100)
      }
      
      if (maxPrice) {
        productQuery = productQuery.lte("price_cents", parseInt(maxPrice) * 100)
      }
      
      // Sorting
      switch (sortBy) {
        case "newest":
          productQuery = productQuery.order("created_at", { ascending: false })
          break
        case "price_asc":
          productQuery = productQuery.order("price_cents", { ascending: true })
          break
        case "price_desc":
          productQuery = productQuery.order("price_cents", { ascending: false })
          break
        case "rating":
          productQuery = productQuery.order("rating", { ascending: false, nullsFirst: false })
          break
        default:
          productQuery = productQuery.order("purchase_count", { ascending: false })
      }
      
      const { data: productData } = await productQuery.range(offset, offset + limit - 1)
      products = (productData || []).map(p => ({ ...p, itemType: "product" }))
    }

    // Combine and sort results
    let results = [...agents, ...products]
    
    // Re-sort combined results if needed
    if (type === "all") {
      switch (sortBy) {
        case "newest":
          results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break
        case "price_asc":
          results.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0))
          break
        case "price_desc":
          results.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0))
          break
        case "rating":
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          break
        default:
          results.sort((a, b) => (b.usage_count || b.purchase_count || 0) - (a.usage_count || a.purchase_count || 0))
      }
    }

    // Get unique categories for filtering
    const { data: agentCategories } = await supabase
      .from("agents")
      .select("category")
      .not("category", "is", null)
    
    const { data: productCategories } = await supabase
      .from("marketplace_products")
      .select("category")
      .eq("is_published", true)
      .not("category", "is", null)
    
    const allCategories = [
      ...new Set([
        ...(agentCategories?.map(c => c.category) || []),
        ...(productCategories?.map(c => c.category) || [])
      ])
    ].filter(Boolean).sort()

    return NextResponse.json({
      results,
      total: results.length,
      categories: allCategories,
      filters: {
        query,
        category,
        type,
        minPrice,
        maxPrice,
        sortBy
      }
    })

  } catch (error) {
    console.error("Marketplace search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
