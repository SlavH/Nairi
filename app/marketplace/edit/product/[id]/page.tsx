import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { CreateCreationForm } from "@/components/marketplace/create-creation-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function EditProductPage({
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

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!creatorProfile) {
    notFound()
  }

  const { data: product, error } = await supabase
    .from("marketplace_products")
    .select("*")
    .eq("id", id)
    .eq("creator_id", creatorProfile.id)
    .single()

  if (error || !product) {
    notFound()
  }

  const initialData = {
    title: product.title ?? "",
    description: product.description ?? "",
    product_type: product.product_type ?? "prompt",
    price_cents: product.price_cents ?? 0,
    category: product.category ?? "",
    preview_content: product.preview_content ?? "",
    full_content: product.full_content ?? "",
    file_url: product.file_url ?? "",
    is_published: product.is_published ?? false,
  }

  return (
    <div className="flex h-full flex-col min-h-0 overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0 text-foreground hover:bg-white/10" asChild>
            <Link href="/marketplace/creator" aria-label="Back to My creations">
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
              Edit creation
            </span>
          </Link>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Edit creation</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Update details, price, or publish status.</p>
          </div>
          <CreateCreationForm productId={id} initialData={initialData} />
        </div>
      </div>
    </div>
  )
}
