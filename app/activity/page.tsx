'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, Clock, Zap, MessageSquare, Image, Code, Video, FileText, Filter, Calendar, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ActivityType = 'chat' | 'image' | 'code' | 'video' | 'document' | 'agent' | 'login' | 'settings'

interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, string>
}

export default function ActivityPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ActivityType>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all')

  const fetchActivities = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    let activitiesData: any[] = []
    try {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      activitiesData = data || []
    } catch {
      // Table might not exist yet
    }

    const formatted: ActivityItem[] = activitiesData.map((a: any) => ({
      id: a.id,
      type: a.type || 'login',
      title: a.action || 'Activity',
      description: a.description || '',
      timestamp: new Date(a.created_at).toLocaleString(),
      metadata: a.metadata || {},
    }))

    setActivities(formatted)
    setLoading(false)
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const filteredActivities = activities.filter(a => {
    if (filter !== 'all' && a.type !== filter) return false
    return true
  })

  const getTypeIcon = (type: ActivityType) => {
    const icons: Record<ActivityType, React.ReactNode> = {
      chat: <MessageSquare className="w-5 h-5" />,
      image: <Image className="w-5 h-5" />,
      code: <Code className="w-5 h-5" />,
      video: <Video className="w-5 h-5" />,
      document: <FileText className="w-5 h-5" />,
      agent: <Zap className="w-5 h-5" />,
      login: <Activity className="w-5 h-5" />,
      settings: <Activity className="w-5 h-5" />
    }
    return icons[type]
  }

  const getTypeColor = (type: ActivityType) => {
    const colors: Record<ActivityType, string> = {
      chat: 'from-blue-500 to-cyan-500',
      image: 'from-purple-500 to-pink-500',
      code: 'from-green-500 to-emerald-500',
      video: 'from-red-500 to-orange-500',
      document: 'from-yellow-500 to-amber-500',
      agent: 'from-indigo-500 to-purple-500',
      login: 'from-gray-500 to-slate-500',
      settings: 'from-gray-500 to-slate-500'
    }
    return colors[type]
  }

  const stats = {
    today: activities.filter(a => {
      const date = new Date(a.timestamp)
      const now = new Date()
      return date.toDateString() === now.toDateString()
    }).length,
    thisWeek: activities.length,
    totalGenerations: activities.filter(a => ['image', 'code', 'video', 'document'].includes(a.type)).length,
    totalChats: activities.filter(a => a.type === 'chat').length
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Activity</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchActivities} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors min-h-[44px]" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Today</span>
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold">{stats.today}</div>
            <div className="text-xs text-white/40">activities</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">This Week</span>
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <div className="text-xs text-white/40">activities</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Generations</span>
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold">{stats.totalGenerations}</div>
            <div className="text-xs text-white/40">total</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Conversations</span>
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold">{stats.totalChats}</div>
            <div className="text-xs text-white/40">total</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'chat', 'image', 'code', 'video', 'document', 'agent'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === f
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto text-white/20 mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">Loading activity...</h3>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto text-white/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
              <p className="text-white/60">Start using Nairi to see your activity here</p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="relative flex gap-4"
              >
                {/* Timeline line */}
                {index < filteredActivities.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-white/10" />
                )}
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTypeColor(activity.type)} flex items-center justify-center flex-shrink-0 z-10`}>
                  {getTypeIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{activity.title}</h3>
                      <p className="text-white/60 text-sm">{activity.description}</p>
                    </div>
                    <span className="text-xs text-white/40 flex-shrink-0">{activity.timestamp}</span>
                  </div>
                  
                  {activity.metadata && (
                    <div className="flex gap-3 mt-3">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <span key={key} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
