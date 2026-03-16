'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity, Clock, Zap, MessageSquare, Image, Code, Video, FileText, Filter, Calendar } from 'lucide-react'

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
  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'image',
      title: 'Generated Image',
      description: 'Created "Futuristic cityscape at sunset"',
      timestamp: '2 minutes ago',
      metadata: { model: 'Pollinations.ai', size: '1024x1024' }
    },
    {
      id: '2',
      type: 'chat',
      title: 'AI Conversation',
      description: 'Discussed machine learning concepts',
      timestamp: '15 minutes ago',
      metadata: { messages: '12', model: 'Groq LLM' }
    },
    {
      id: '3',
      type: 'code',
      title: 'Code Generation',
      description: 'Generated React component for dashboard',
      timestamp: '1 hour ago',
      metadata: { language: 'TypeScript', lines: '156' }
    },
    {
      id: '4',
      type: 'document',
      title: 'Document Created',
      description: 'Business proposal draft',
      timestamp: '2 hours ago',
      metadata: { pages: '5', format: 'PDF' }
    },
    {
      id: '5',
      type: 'agent',
      title: 'Agent Task',
      description: 'Code Helper analyzed repository',
      timestamp: '3 hours ago',
      metadata: { files: '24', issues: '3' }
    },
    {
      id: '6',
      type: 'video',
      title: 'Video Generation',
      description: 'Created product demo animation',
      timestamp: '5 hours ago',
      metadata: { duration: '4s', model: 'Veo 2' }
    },
    {
      id: '7',
      type: 'login',
      title: 'Login',
      description: 'Signed in from Chrome on Windows',
      timestamp: '1 day ago',
      metadata: { location: 'Seattle, WA', device: 'Desktop' }
    },
    {
      id: '8',
      type: 'settings',
      title: 'Settings Updated',
      description: 'Changed notification preferences',
      timestamp: '2 days ago'
    }
  ])

  const [filter, setFilter] = useState<'all' | ActivityType>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all')

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
    today: activities.filter(a => a.timestamp.includes('minute') || a.timestamp.includes('hour')).length,
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
          {filteredActivities.length === 0 ? (
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
