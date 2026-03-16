import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const PRODUCT_TYPES = ["prompt", "template", "tool", "workflow", "course", "design", "code"] as const

/**
 * POST - Create a marketplace product (any creation: text, website, template, etc.)
 * Ensures creator_profile exists for the user.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      product_type,
      price_cents = 0,
      category,
      tags = [],
      preview_content,
      full_content,
      file_url,
      is_published = false,
    } = body

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }
    if (!product_type || !PRODUCT_TYPES.includes(product_type)) {
      return NextResponse.json({
        error: "product_type is required and must be one of: " + PRODUCT_TYPES.join(", "),
      }, { status: 400 })
    }

    // Get or create creator profile
    let { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!creatorProfile) {
      const { data: inserted, error: insertError } = await supabase
        .from("creator_profiles")
        .insert({
          user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Creator",
          bio: null,
        })
        .select("id")
        .single()

      if (insertError) {
        return NextResponse.json({ error: "Failed to create creator profile: " + insertError.message }, { status: 500 })
      }
      creatorProfile = inserted
    }

    const { data: product, error } = await supabase
      .from("marketplace_products")
      .insert({
        creator_id: creatorProfile.id,
        title: title.trim(),
        description: description?.trim() || null,
        product_type,
        price_cents: Math.max(0, Number(price_cents) || 0),
        category: category?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        preview_content: preview_content?.trim() || null,
        full_content: full_content?.trim() || null,
        file_url: file_url?.trim() || null,
        is_published: Boolean(is_published),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (e) {
    console.error("Marketplace products POST error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
