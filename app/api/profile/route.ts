import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch current user's profile
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Profile fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update current user's profile
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // Allowed fields to update
    const allowedFields = [
      "full_name",
      "avatar_url",
      "bio",
      "website",
      "company",
      "location",
      "preferred_language",
      "timezone",
      "notification_preferences",
      "ai_preferences",
      "interests",
      "onboarding_completed"
    ]

    // Filter to only allowed fields
    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Always update the updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    try {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "profile_updated",
        category: "settings",
        description: `Updated profile fields: ${Object.keys(updates).filter(k => k !== "updated_at").join(", ")}`,
        metadata: { updatedFields: Object.keys(updates).filter(k => k !== "updated_at") },
        risk_level: "low"
      })
    } catch {
      // Activity log failure shouldn't fail the request
    }

    return NextResponse.json({ success: true, profile })

  } catch (error) {
    console.error("Profile PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Request account deletion (soft delete / mark for deletion)
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mark account for deletion (30 day grace period)
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30)

    const { error } = await supabase
      .from("profiles")
      .update({
        scheduled_deletion_date: deletionDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (error) {
      console.error("Profile deletion schedule error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    try {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "account_deletion_requested",
        category: "security",
        description: `Account scheduled for deletion on ${deletionDate.toLocaleDateString()}`,
        risk_level: "high"
      })
    } catch {
      // Activity log failure shouldn't fail the request
    }

    return NextResponse.json({ 
      success: true, 
      message: "Account scheduled for deletion",
      deletionDate: deletionDate.toISOString()
    })

  } catch (error) {
    console.error("Profile DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
