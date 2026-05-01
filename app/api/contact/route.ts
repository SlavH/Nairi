import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

interface ContactRequest {
  name: string
  email: string
  reason: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = checkRateLimit(`contact:${clientId}`, { maxRequests: 3, windowMs: 300000 })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many contact submissions. Please wait before trying again." },
        { status: 429 }
      )
    }

    const body: ContactRequest = await request.json()
    const { name, email, reason, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, subject, message" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    if (name.length > 100 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: "Input exceeds maximum length" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase
      .from("contact_submissions")
      .insert({
        name: name.trim(),
        email: email.trim(),
        reason: reason || "general",
        subject: subject.trim(),
        message: message.trim(),
        user_id: user?.id || null,
        status: "new",
      })

    if (insertError) {
      console.error("Contact submission error:", insertError)
      return NextResponse.json(
        { error: "Failed to submit contact form. Please try again later." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully. We'll respond within 24-48 hours.",
    })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
