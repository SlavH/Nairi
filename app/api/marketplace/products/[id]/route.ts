import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const PRODUCT_TYPES = ["prompt", "template", "tool", "workflow", "course", "design", "code"] as const

/**
 * GET - Fetch a single product. Public if published; owner can read own drafts.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const { data: product, error } = await supabase
      .from("marketplace_products")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const isPublished = product.is_published === true
    if (!isPublished && user) {
      const { data: creator } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (creator?.id !== product.creator_id) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    } else if (!isPublished) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (e) {
    console.error("Marketplace product GET error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH - Update a product. Only the creator can update.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!creatorProfile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 403 })
    }

    const { data: existing } = await supabase
      .from("marketplace_products")
      .select("id, creator_id, title")
      .eq("id", id)
      .single()

    if (!existing || existing.creator_id !== creatorProfile.id) {
      return NextResponse.json({ error: "Product not found or access denied" }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      title,
      description,
      product_type,
      price_cents,
      category,
      tags,
      preview_content,
      full_content,
      file_url,
      is_published,
    } = body

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = typeof title === "string" ? title.trim() : existing.title
    if (description !== undefined) updates.description = description === null || typeof description === "string" ? description?.trim() ?? null : undefined
    if (product_type !== undefined) {
      if (!PRODUCT_TYPES.includes(product_type)) {
        return NextResponse.json({ error: "Invalid product_type" }, { status: 400 })
      }
      updates.product_type = product_type
    }
    if (price_cents !== undefined) updates.price_cents = Math.max(0, Number(price_cents) || 0)
    if (category !== undefined) updates.category = category === null || typeof category === "string" ? category?.trim() ?? null : undefined
    if (Array.isArray(tags)) updates.tags = tags
    if (preview_content !== undefined) updates.preview_content = typeof preview_content === "string" ? preview_content.trim() || null : undefined
    if (full_content !== undefined) updates.full_content = typeof full_content === "string" ? full_content.trim() || null : undefined
    if (file_url !== undefined) updates.file_url = typeof file_url === "string" ? file_url.trim() || null : undefined
    if (typeof is_published === "boolean") updates.is_published = is_published

    const { data: product, error } = await supabase
      .from("marketplace_products")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (e) {
    console.error("Marketplace product PATCH error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
