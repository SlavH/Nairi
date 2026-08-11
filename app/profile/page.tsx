"use client"

import {
  User,
  Mail,
  Calendar,
  MapPin,
  Edit3,
  Award,
  Zap,
  MessageSquare,
  Code,
  ImageIcon,
  Video,
  FileText,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Stat {
  label: string
  value: number
  icon: typeof MessageSquare
}

interface Achievement {
  name: string
  desc: string
  color: string
  unlocked: boolean
}

interface Activity {
  type: string
  title: string
  time: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    joinedDate: "",
  })
  const [stats, setStats] = useState<Stat[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activity, setActivity] = useState<Activity[]>([])

  const fetchProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const { data: creations } = await supabase
      .from("creations")
      .select("type, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    const items = (creations || []) as Array<{ type?: string | null; title?: string | null; created_at: string }>
    const convCount = items.filter((c) => c.type === "chat").length
    const codeCount = items.filter((c) => c.type === "code").length
    const imgCount = items.filter((c) => c.type === "image").length
    const vidCount = items.filter((c) => c.type === "video").length

    setProfile({
      name: profileData?.name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      bio: profileData?.bio || "",
      location: profileData?.location || "",
      website: profileData?.website || "",
      joinedDate: new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    })

    setStats([
      { label: "Conversations", value: convCount, icon: MessageSquare },
      { label: "Code Generated", value: codeCount, icon: Code },
      { label: "Images Created", value: imgCount, icon: ImageIcon },
      { label: "Videos Made", value: vidCount, icon: Video },
    ])

    setAchievements([
      { name: "Early Adopter", desc: "Joined during beta", color: "from-blue-500 to-cyan-500", unlocked: true },
      { name: "Power User", desc: "100+ conversations", color: "from-amber-500 to-orange-500", unlocked: convCount >= 100 },
      { name: "Creative Mind", desc: "50+ images generated", color: "from-pink-500 to-rose-500", unlocked: imgCount >= 50 },
      { name: "Code Master", desc: "25+ code projects", color: "from-green-500 to-emerald-500", unlocked: codeCount >= 25 },
    ])

    setActivity(
      items.slice(0, 5).map((c) => ({
        type: c.type || "creation",
        title: c.title || `${c.type || "Created"} item`,
        time: timeAgo(c.created_at),
      }))
    )

    setLoading(false)
  }, [router])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSave = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name: profile.name, bio: profile.bio })

    if (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" })
    } else {
      toast({ title: "Saved", description: "Profile updated successfully" })
      setIsEditing(false)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#e052a0] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 min-h-[44px]">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span className="text-border">/</span>
            <h1 className="text-lg sm:text-2xl font-bold">Profile</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={saving}
            className="min-h-[44px] bg-transparent"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : isEditing ? "Save" : "Edit Profile"}
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 sm:p-8 border border-border mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="text-xl sm:text-2xl font-bold bg-muted border border-border rounded-lg px-3 py-1 mb-2 w-full"
                />
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-balance">{profile.name}</h2>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-muted-foreground text-sm mb-4">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4 shrink-0" />{profile.email}</span>
                {profile.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4 shrink-0" />{profile.location}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4 shrink-0" />Joined {profile.joinedDate}</span>
              </div>

              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground resize-none"
                  rows={2}
                  placeholder="Write a short bio..."
                />
              ) : (
                profile.bio && <p className="text-muted-foreground">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-4 border border-border text-center">
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-primary" />
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Achievements
            </h3>
            <div className="space-y-3">
              {achievements.map((a) => (
                <div key={a.name} className={`flex items-center gap-3 p-3 rounded-lg ${a.unlocked ? "bg-muted/50" : "bg-muted/20 opacity-50"}`}>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center shrink-0`}>
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-sm text-muted-foreground">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {a.type === "code" && <Code className="w-5 h-5 text-primary" />}
                      {a.type === "image" && <ImageIcon className="w-5 h-5 text-pink-500" />}
                      {a.type === "chat" && <MessageSquare className="w-5 h-5 text-green-500" />}
                      {a.type === "video" && <Video className="w-5 h-5 text-purple-500" />}
                      {a.type === "document" && <FileText className="w-5 h-5 text-amber-500" />}
                      {!["code", "image", "chat", "video", "document"].includes(a.type) && <Zap className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.title}</div>
                      <div className="text-sm text-muted-foreground">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60000) return "just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}
