import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const PROFILE_UPDATE_LIMIT = { maxRequests: 5, windowMs: 60_000 }
const PROFILE_READ_LIMIT = { maxRequests: 30, windowMs: 60_000 }

// GET - Fetch current user's profile
export async function GET(req: Request) {
  const clientId = getClientIdentifier(req)
  const rateLimitResult = checkRateLimit(`profile:get:${clientId}`, PROFILE_READ_LIMIT)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
    )
  }

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
  const clientId = getClientIdentifier(req)
  const rateLimitResult = checkRateLimit(`profile:patch:${clientId}`, PROFILE_UPDATE_LIMIT)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // Allowed fields to update with validation rules
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

    // Filter to only allowed fields with length validation
    const updates: Record<string, any> = {}
    const maxLengths: Record<string, number> = {
      full_name: 100,
      bio: 500,
      website: 500,
      company: 200,
      location: 200,
      preferred_language: 10,
      timezone: 50,
    }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Length validation for string fields
        if (typeof body[field] === "string") {
          const maxLen = maxLengths[field]
          if (maxLen && body[field].length > maxLen) {
            return NextResponse.json(
              { error: `${field} too long. Maximum ${maxLen} characters.` },
              { status: 400 }
            )
          }
        }
        // URL validation for website and avatar_url
        if ((field === "website" || field === "avatar_url") && typeof body[field] === "string" && body[field].length > 0) {
          try {
            new URL(body[field])
          } catch {
            return NextResponse.json(
              { error: `${field} must be a valid URL.` },
              { status: 400 }
            )
          }
        }
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
export async function DELETE(req: Request) {
  const clientId = getClientIdentifier(req)
  const rateLimitResult = checkRateLimit(`profile:delete:${clientId}`, { maxRequests: 2, windowMs: 3600_000 })
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
    )
  }

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
