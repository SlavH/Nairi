'use client'

import { useState } from 'react'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key,
  Moon,
  Sun,
  Eye,
  Lock,
  Trash2,
  Download,
  ChevronLeft,
  Menu
} from 'lucide-react'
import Link from 'next/link'
import { AccessibleInput } from '@/components/ui/accessible-input'
import { AccessibleSelect } from '@/components/ui/accessible-select'
import { AccessibleToggle } from '@/components/ui/accessible-toggle'
import { AccessibleTextarea } from '@/components/ui/accessible-textarea'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    updates: false,
    marketing: false
  })
  const [privacy, setPrivacy] = useState({
    shareData: false,
    analytics: true,
    personalization: true
  })

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'api', label: 'API Keys', icon: Key },
  ]

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px]" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? "Close settings menu" : "Open settings menu"} aria-expanded={sidebarOpen}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 min-h-[44px]">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span className="text-border">/</span>
            <h1 className="text-lg sm:text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar - collapsible on mobile */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <div className={`
            fixed inset-y-0 left-0 z-40 w-72 bg-background border-r border-border p-4 pt-20 transition-transform duration-200
            md:static md:w-56 lg:w-64 md:shrink-0 md:border-0 md:p-0 md:pt-0 md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div
              key={activeTab}
              className="bg-card rounded-2xl p-4 sm:p-6 border border-border"
            >
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">General Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleSelect
                        label="Default Execution Mode"
                        description="Choose how Nairi executes tasks by default"
                        defaultValue="default"
                      >
                        <option value="default">Default</option>
                        <option value="fast">Fast</option>
                        <option value="quality">Quality</option>
                        <option value="creative">Creative</option>
                      </AccessibleSelect>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleToggle
                        label="Auto-save Conversations"
                        description="Automatically save all conversations"
                        checked={true}
                      />
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleToggle
                        label="Keyboard Shortcuts"
                        description="Enable keyboard shortcuts for quick actions"
                        checked={true}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Account Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleInput
                        label="Display Name"
                        type="text"
                        defaultValue="Test User"
                        autoComplete="name"
                      />
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleInput
                        label="Email"
                        type="email"
                        defaultValue="user@example.com"
                        autoComplete="email"
                        disabled
                        description="Contact support to change your email"
                      />
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleInput
                        label="Current Password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleInput
                        label="New Password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        description="Minimum 6 characters"
                      />
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleInput
                        label="Confirm New Password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleTextarea
                        label="Bio"
                        rows={3}
                        placeholder="Tell us about yourself..."
                        description="Brief description about yourself"
                        className="resize-none"
                      />
                    </div>

                    <Button className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                      { key: 'push', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                      { key: 'updates', label: 'Product Updates', desc: 'Get notified about new features' },
                      { key: 'marketing', label: 'Marketing Emails', desc: 'Receive promotional content' },
                    ].map((item) => (
                      <div key={item.key} className="p-4 bg-muted/50 rounded-lg">
                        <AccessibleToggle
                          label={item.label}
                          description={item.desc}
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications({...notifications, [item.key]: checked})}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Privacy & Security</h2>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <h3 className="font-medium">Two-Factor Authentication</h3>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="self-start sm:self-center bg-transparent">
                        Enable
                      </Button>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Eye className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <AccessibleToggle
                        label="Data Sharing"
                        description="Share usage data to improve Nairi"
                        checked={privacy.shareData}
                        onCheckedChange={(checked) => setPrivacy({...privacy, shareData: checked})}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <h3 className="font-medium">Export Your Data</h3>
                          <p className="text-sm text-muted-foreground">Download all your data</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="self-start sm:self-center bg-transparent">
                        Export
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-destructive shrink-0" />
                        <div>
                          <h3 className="font-medium text-destructive">Delete Account</h3>
                          <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" className="self-start sm:self-center">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Appearance</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        {darkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <AccessibleToggle
                        label="Dark Mode"
                        description="Toggle dark/light theme"
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                      />
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h3 className="font-medium mb-3">Accent Color</h3>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { color: '#06b6d4', label: 'Cyan' },
                          { color: '#8b5cf6', label: 'Violet' },
                          { color: '#ec4899', label: 'Pink' },
                          { color: '#10b981', label: 'Emerald' },
                          { color: '#f59e0b', label: 'Amber' },
                          { color: '#ef4444', label: 'Red' },
                        ].map((item) => (
                          <button
                            key={item.color}
                            className="w-10 h-10 rounded-full border-2 border-border hover:border-foreground/60 transition-colors min-h-[44px] min-w-[44px]"
                            style={{ backgroundColor: item.color }}
                            aria-label={`Select ${item.label} accent color`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleSelect
                        label="Font Size"
                        defaultValue="medium"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </AccessibleSelect>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Language & Region</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleSelect
                        label="Interface Language"
                        defaultValue="en"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                        <option value="zh">Chinese</option>
                        <option value="ko">Korean</option>
                        <option value="ru">Russian</option>
                      </AccessibleSelect>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleSelect
                        label="AI Response Language"
                        defaultValue="auto"
                        description="Language for AI responses"
                      >
                        <option value="auto">Auto-detect</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                        <option value="zh">Chinese</option>
                      </AccessibleSelect>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <AccessibleSelect
                        label="Timezone"
                        defaultValue="UTC"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                      </AccessibleSelect>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">API Keys</h2>
                  
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-amber-600 dark:text-amber-400 text-sm">
                      Keep your API keys secure. Never share them publicly.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-medium">Production Key</h3>
                          <p className="text-sm text-muted-foreground">For production use</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Regenerate
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-background px-3 py-2 rounded-lg text-sm font-mono border border-border overflow-x-auto">
                          nairi_pk_••••••••••••••••
                        </code>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-medium">Test Key</h3>
                          <p className="text-sm text-muted-foreground">For development and testing</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Regenerate
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-background px-3 py-2 rounded-lg text-sm font-mono border border-border overflow-x-auto">
                          nairi_tk_••••••••••••••••
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
