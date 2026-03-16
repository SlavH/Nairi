import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { AIGovernance } from "@/components/settings/ai-governance"
import { LanguageSettings } from "@/components/settings/language-settings"
import { User, Brain, Globe } from "lucide-react"
import { redirect } from "next/navigation"
import { getSessionOrBypass } from "@/lib/auth"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { user } = await getSessionOrBypass(() => supabase.auth.getUser())

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  let aiSettings = null
  try {
    const { data } = await supabase.from("user_ai_settings").select("*").eq("user_id", user.id).single()
    aiSettings = data
  } catch {
    // Table may not exist yet
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and AI preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Governance
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Globe className="h-4 w-4" />
            Language
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {user ? (
            <>
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm profile={profile} userId={user.id} />
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Account</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account ID</p>
                    <p className="text-foreground font-mono text-sm">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="text-foreground">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">Sign in to manage your profile settings.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai">
          {user ? (
            <AIGovernance userId={user.id} initialSettings={aiSettings?.settings} />
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">Sign in to manage AI governance settings.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="language">
          <LanguageSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
