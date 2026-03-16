import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText } from "lucide-react"
import { ProductPurchaseButton } from "@/components/marketplace/product-purchase-button"
import { ProductReviews } from "@/components/marketplace/product-reviews"

const productTypeLabels: Record<string, string> = {
  prompt: "Text",
  template: "Template",
  tool: "Tool",
  workflow: "Workflow",
  course: "Course",
  design: "Design",
  code: "Website",
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: product } = await supabase
    .from("marketplace_products")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single()

  if (!product) {
    notFound()
  }

  const { data: purchase } = await supabase
    .from("product_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", id)
    .single()

  const owned = !!purchase

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden">
      <header className="flex items-center gap-4 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 shrink-0">
        <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:bg-white/10" asChild>
          <Link href="/marketplace">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="bg-white/5 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <FileText className="h-7 w-7 text-[#00c9c8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-foreground">{product.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className="bg-white/10 text-muted-foreground border-white/10">
                      {productTypeLabels[product.product_type] || product.product_type}
                    </Badge>
                    {product.category && (
                      <Badge variant="outline" className="border-white/20">{product.category}</Badge>
                    )}
                    {product.price_cents === 0 ? (
                      <Badge className="bg-[#00c9c8]/20 text-[#00c9c8] border-0">Free</Badge>
                    ) : (
                      <span className="text-lg font-semibold text-[#e052a0]">${(product.price_cents / 100).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
              {product.description && (
                <p className="text-muted-foreground mt-4">{product.description}</p>
              )}
              {product.preview_content && (
                <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{product.preview_content}</p>
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <ProductPurchaseButton
                  productId={product.id}
                  title={product.title}
                  priceCents={product.price_cents ?? 0}
                  fullContent={product.full_content}
                  fileUrl={product.file_url}
                  owned={owned}
                  userId={user.id}
                />
              </div>
            </CardContent>
          </Card>

          <ProductReviews productId={id} canReview={owned} />
        </div>
      </div>
    </div>
  )
}
