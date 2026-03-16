import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { CreatorDashboard } from "@/components/marketplace/creator-dashboard"
import { getSessionOrBypass } from "@/lib/auth"
import { getCreatorBadges } from "@/lib/features/badges"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Plus } from "lucide-react"

export default async function CreatorPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch creator's agents
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  let products: { id: string; title: string; description: string | null; product_type: string; price_cents: number; is_published: boolean; purchase_count: number; rating: number | null }[] = []
  if (creatorProfile?.id) {
    const { data: productsData } = await supabase
      .from("marketplace_products")
      .select("id, title, description, product_type, price_cents, is_published, purchase_count, rating")
      .eq("creator_id", creatorProfile.id)
      .order("created_at", { ascending: false })
    products = productsData || []
  }

  const publishedAgents = agents?.filter((a) => a.is_published) || []
  const publishedProducts = products.filter((p) => p.is_published)
  const totalEarnings = publishedAgents.reduce((sum, a) => sum + (a.total_earnings || 0), 0)
  const totalSales = publishedAgents.reduce((sum, a) => sum + (a.sales_count || 0), 0) + publishedProducts.reduce((sum, p) => sum + (p.purchase_count || 0), 0)
  const totalUsers = publishedAgents.reduce((sum, a) => sum + (a.usage_count || 0), 0)
  const allRatings = [
    ...publishedAgents.map((a) => a.rating).filter(Boolean),
    ...publishedProducts.map((p) => p.rating).filter(Boolean),
  ]
  const avgRating = allRatings.length > 0 ? allRatings.reduce((s, r) => s + Number(r), 0) / allRatings.length : 0

  const stats = {
    totalEarnings,
    totalSales,
    totalUsers,
    averageRating: avgRating,
    earningsChange: 12,
    salesChange: 8,
  }

  const creatorBadges = await getCreatorBadges(user.id)

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-white/10" asChild>
            <Link href="/nav" aria-label="Back to navigation">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link href="/marketplace" className="flex items-center gap-2 min-w-0">
            <Image
              src="/images/nairi-logo-header.jpg"
              alt="Nairi"
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg border border-white/20 shrink-0"
            />
            <span className="font-bold text-sm sm:text-base bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent truncate">
              My creations
            </span>
          </Link>
        </div>
        <Button asChild size="sm" className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90 shrink-0">
          <Link href="/marketplace/create" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Add & sell
          </Link>
        </Button>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <CreatorDashboard agents={agents || []} products={products} stats={stats} badges={creatorBadges} />
      </div>
    </div>
  )
}
