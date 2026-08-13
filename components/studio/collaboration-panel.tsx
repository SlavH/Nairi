'use client'

import { Users, Share2, MessageSquare, History, Copy, Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface CollaborationPanelProps {
  presentationId?: string
  onVersionRestore?: (versionId: string) => void
}

export function CollaborationPanel({ presentationId }: CollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<'collaborators' | 'versions' | 'comments'>('collaborators')
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  
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
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No collaborators yet</p>
                <p className="text-xs">Invite collaborators to start working together</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="space-y-2">
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No versions yet</p>
              <p className="text-xs">Version history is saved automatically as you edit</p>
            </div>
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
