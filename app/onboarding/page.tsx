import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { getSessionOrBypass } from "@/lib/auth"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has already completed onboarding (skip for bypass)
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name")
    .eq("id", user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect("/dashboard")
  }

  return (
    <OnboardingFlow
      userId={user.id}
      userEmail={user.email || ""}
      userName={profile?.full_name || ""}
    />
  )
}
