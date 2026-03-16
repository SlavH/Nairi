'use client'

import { useState } from 'react'
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Edit3,
  Camera,
  Award,
  Zap,
  MessageSquare,
  Code,
  ImageIcon,
  Video,
  FileText,
  ChevronLeft
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Test User',
    email: 'test@example.com',
    bio: 'AI enthusiast and creative technologist. Building the future with Nairi.',
    location: 'San Francisco, CA',
    website: 'https://example.com',
    joinedDate: 'January 2026'
  })

  const stats = [
    { label: 'Conversations', value: '156', icon: MessageSquare },
    { label: 'Code Generated', value: '89', icon: Code },
    { label: 'Images Created', value: '234', icon: ImageIcon },
    { label: 'Videos Made', value: '12', icon: Video },
  ]

  const achievements = [
    { name: 'Early Adopter', desc: 'Joined during beta', color: 'from-blue-500 to-cyan-500' },
    { name: 'Power User', desc: '100+ conversations', color: 'from-amber-500 to-orange-500' },
    { name: 'Creative Mind', desc: '50+ images generated', color: 'from-pink-500 to-rose-500' },
    { name: 'Code Master', desc: '25+ code projects', color: 'from-green-500 to-emerald-500' },
  ]

  const recentActivity = [
    { type: 'code', title: 'React Dashboard Component', time: '2 hours ago' },
    { type: 'image', title: 'Sunset landscape artwork', time: '5 hours ago' },
    { type: 'chat', title: 'AI Strategy Discussion', time: '1 day ago' },
    { type: 'document', title: 'Project Proposal Draft', time: '2 days ago' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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
            onClick={() => setIsEditing(!isEditing)}
            className="min-h-[44px] bg-transparent"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'Save' : 'Edit Profile'}
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 sm:p-8 border border-border mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#e052a0] to-[#00c9c8] flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
                {profile.name.charAt(0)}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 bg-muted rounded-full hover:bg-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Change avatar">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="text-xl sm:text-2xl font-bold bg-muted border border-border rounded-lg px-3 py-1 mb-2 w-full"
                  aria-label="Display name"
                />
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-balance">{profile.name}</h2>
              )}
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-muted-foreground text-sm mb-4">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {profile.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 shrink-0" />
                  Joined {profile.joinedDate}
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground resize-none"
                  rows={2}
                  aria-label="Bio"
                />
              ) : (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-4 border border-border text-center"
            >
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-primary" />
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Achievements */}
          <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Achievements
            </h3>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.name} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${achievement.color} flex items-center justify-center shrink-0`}>
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-sm text-muted-foreground">{achievement.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {activity.type === 'code' && <Code className="w-5 h-5 text-primary" />}
                    {activity.type === 'image' && <ImageIcon className="w-5 h-5 text-pink-500" />}
                    {activity.type === 'chat' && <MessageSquare className="w-5 h-5 text-green-500" />}
                    {activity.type === 'document' && <FileText className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{activity.title}</div>
                    <div className="text-sm text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
