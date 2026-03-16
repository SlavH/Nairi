'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Check, Trash2, Settings, Filter } from 'lucide-react'
import { LiveRegion } from '@/components/ui/live-region'

type NotificationType = 'generation' | 'credit' | 'system' | 'agent' | 'collaboration' | 'security'
type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  read: boolean
  timestamp: string
  actionUrl?: string
  actionLabel?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'generation',
      title: 'Image Generation Complete',
      message: 'Your image "Futuristic cityscape" has been generated successfully.',
      priority: 'medium',
      read: false,
      timestamp: '2 minutes ago',
      actionUrl: '/chat/abc123',
      actionLabel: 'View Image'
    },
    {
      id: '2',
      type: 'credit',
      title: 'Credit Usage Alert',
      message: 'You have used 80% of your monthly image generation credits (400/500).',
      priority: 'high',
      read: false,
      timestamp: '1 hour ago',
      actionUrl: '/billing',
      actionLabel: 'Upgrade Plan'
    },
    {
      id: '3',
      type: 'system',
      title: 'New Feature Available',
      message: 'Voice Mode is now available! Have real-time voice conversations with Nairi.',
      priority: 'low',
      read: true,
      timestamp: '3 hours ago',
      actionUrl: '/chat',
      actionLabel: 'Try Voice Mode'
    },
    {
      id: '4',
      type: 'agent',
      title: 'Agent Task Completed',
      message: 'Your Code Helper agent has finished analyzing the repository.',
      priority: 'medium',
      read: true,
      timestamp: '5 hours ago',
      actionUrl: '/marketplace',
      actionLabel: 'View Results'
    },
    {
      id: '5',
      type: 'security',
      title: 'New Login Detected',
      message: 'A new login was detected from Chrome on Windows in Seattle, WA.',
      priority: 'high',
      read: false,
      timestamp: '1 day ago',
      actionUrl: '/security',
      actionLabel: 'Review Activity'
    },
    {
      id: '6',
      type: 'generation',
      title: 'Website Generation Complete',
      message: 'Your landing page "SaaS Product Launch" is ready to preview.',
      priority: 'medium',
      read: true,
      timestamp: '2 days ago',
      actionUrl: '/builder',
      actionLabel: 'Open Builder'
    }
  ])

  const [filter, setFilter] = useState<'all' | NotificationType>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const filteredNotifications = notifications.filter(n => {
    if (showUnreadOnly && n.read) return false
    if (filter !== 'all' && n.type !== filter) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
    setStatusMessage('Notification marked as read')
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    setStatusMessage('All notifications marked as read')
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
    setStatusMessage('Notification deleted')
  }

  const getTypeIcon = (type: NotificationType) => {
    const icons = {
      generation: '🎨',
      credit: '💳',
      system: '⚙️',
      agent: '🤖',
      collaboration: '👥',
      security: '🔒'
    }
    return icons[type]
  }

  const getTypeColor = (type: NotificationType) => {
    const colors = {
      generation: 'from-purple-500 to-pink-500',
      credit: 'from-yellow-500 to-orange-500',
      system: 'from-blue-500 to-cyan-500',
      agent: 'from-green-500 to-emerald-500',
      collaboration: 'from-indigo-500 to-purple-500',
      security: 'from-red-500 to-rose-500'
    }
    return colors[type]
  }

  const getPriorityBadge = (priority: NotificationPriority) => {
    const styles = {
      low: 'bg-gray-500/20 text-gray-400',
      medium: 'bg-blue-500/20 text-blue-400',
      high: 'bg-orange-500/20 text-orange-400',
      critical: 'bg-red-500/20 text-red-400'
    }
    return styles[priority]
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <LiveRegion politeness="polite" role="status">
        {statusMessage}
      </LiveRegion>
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            <Link
              href="/settings?tab=notifications"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'generation', 'credit', 'system', 'agent', 'security'].map((f) => (
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
          <label className="flex items-center gap-2 ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm text-white/60">Unread only</span>
          </label>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto text-white/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No notifications</h3>
              <p className="text-white/60">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative bg-white/5 rounded-xl p-4 border transition-all ${
                  notification.read
                    ? 'border-white/10 opacity-60'
                    : 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTypeColor(notification.type)} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-white/40">{notification.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-3">{notification.message}</p>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {notification.actionUrl && (
                        <Link
                          href={notification.actionUrl}
                          className="px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition-colors"
                        >
                          {notification.actionLabel}
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="px-3 py-1 bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 text-sm rounded-lg transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-500 rounded-full" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
