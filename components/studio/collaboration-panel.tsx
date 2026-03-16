'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, Share2, MessageSquare, History, Clock, User, Copy, Check } from 'lucide-react'

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'offline' | 'editing'
  lastActive?: Date
}

interface Version {
  id: string
  timestamp: Date
  author: string
  description: string
  slideCount: number
}

interface CollaborationPanelProps {
  presentationId?: string
  onVersionRestore?: (versionId: string) => void
}

export function CollaborationPanel({ presentationId, onVersionRestore }: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'versions' | 'comments'>('collaborators')
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  
  // Mock data for demonstration
  const [collaborators] = useState<Collaborator[]>([
    { id: '1', name: 'You', email: 'you@example.com', status: 'online' },
  ])
  
  const [versions] = useState<Version[]>([
    { 
      id: 'v1', 
      timestamp: new Date(), 
      author: 'You', 
      description: 'Initial version',
      slideCount: 10
    },
  ])
  
  const generateShareLink = () => {
    const link = `${window.location.origin}/share/${presentationId || 'demo'}`
    setShareLink(link)
  }
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const inviteCollaborator = () => {
    if (!inviteEmail) return
    // In a real implementation, this would send an invitation
    alert(`Invitation sent to ${inviteEmail} (Demo - not actually sent)`)
    setInviteEmail('')
  }
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Collaboration
        </CardTitle>
        <CardDescription>Share and collaborate in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4 border-b">
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'collaborators' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4 inline mr-1" />
            Team
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'versions' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4 inline mr-1" />
            Versions
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'comments' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Comments
          </button>
        </div>
        
        {/* Collaborators Tab */}
        {activeTab === 'collaborators' && (
          <div className="space-y-4">
            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex gap-2">
                {shareLink ? (
                  <>
                    <Input value={shareLink} readOnly className="flex-1 text-xs" />
                    <Button size="sm" variant="outline" onClick={copyShareLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={generateShareLink} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Generate Share Link
                  </Button>
                )}
              </div>
            </div>
            
            {/* Invite */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Invite Collaborator</label>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="email@example.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={inviteCollaborator} disabled={!inviteEmail}>
                  Invite
                </Button>
              </div>
            </div>
            
            {/* Collaborator List */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Active Collaborators</label>
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                        collab.status === 'online' ? 'bg-green-500' :
                        collab.status === 'editing' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{collab.name}</div>
                      <div className="text-xs text-muted-foreground">{collab.email}</div>
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">{collab.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{version.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {version.author} • {version.timestamp.toLocaleString()} • {version.slideCount} slides
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onVersionRestore?.(version.id)}
                >
                  Restore
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center py-2">
              Version history is saved automatically as you edit
            </p>
          </div>
        )}
        
        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs">Comments will appear here when collaborators add them</p>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add a comment..." className="flex-1" />
              <Button size="sm">Send</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CollaborationPanel
