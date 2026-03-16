"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  UserPlus,
  Link2,
  Copy,
  Check,
  Mail,
  Crown,
  Eye,
  Edit3,
  MessageSquare,
  Circle,
  Settings,
  Share2,
  Globe,
  Lock,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'online' | 'offline' | 'away'
  cursor?: { x: number; y: number; file?: string }
  lastActive?: Date
}

interface CollaborationPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  currentUser?: { id: string; name: string; email: string }
}

const MOCK_COLLABORATORS: Collaborator[] = [
  {
    id: '1',
    name: 'You',
    email: 'you@example.com',
    role: 'owner',
    status: 'online',
  },
]

const STATUS_COLORS = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-amber-500'
}

const ROLE_LABELS = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-500' },
  editor: { label: 'Editor', icon: Edit3, color: 'text-blue-500' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-gray-500' }
}

export function CollaborationPanel({ isOpen, onOpenChange, projectId, currentUser }: CollaborationPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(MOCK_COLLABORATORS)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [shareLink, setShareLink] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  // Generate share link
  useEffect(() => {
    if (projectId) {
      setShareLink(`${window.location.origin}/builder-v2/share/${projectId}`)
    }
  }, [projectId])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }, [shareLink])

  const handleInvite = useCallback(() => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    // Simulate sending invite
    const newCollaborator: Collaborator = {
      id: `collab-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'offline',
    }

    setCollaborators(prev => [...prev, newCollaborator])
    setInviteEmail('')
    setShowInviteDialog(false)
    toast.success(`Invitation sent to ${inviteEmail}`)
  }, [inviteEmail, inviteRole])

  const handleRemoveCollaborator = useCallback((id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id))
    toast.success('Collaborator removed')
  }, [])

  const handleChangeRole = useCallback((id: string, newRole: Collaborator['role']) => {
    setCollaborators(prev => prev.map(c => 
      c.id === id ? { ...c, role: newRole } : c
    ))
    toast.success('Role updated')
  }, [])

  const onlineCount = collaborators.filter(c => c.status === 'online').length

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Users className="h-4 w-4 text-white" />
            </div>
            Collaboration
            <Badge variant="secondary" className="ml-auto">
              {onlineCount} online
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Invite team members to collaborate on this project in real-time
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Share Link Section */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Share Link</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {isPublic ? 'Public' : 'Private'}
                </span>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="text-xs font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isPublic ? (
                <>
                  <Globe className="h-3 w-3" />
                  Anyone with the link can view
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Only invited members can access
                </>
              )}
            </div>
          </div>

          {/* Invite Button */}
          <div className="p-4 border-b">
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Collaborator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Collaborator</DialogTitle>
                  <DialogDescription>
                    Send an invitation to collaborate on this project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={inviteRole === 'editor' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setInviteRole('editor')}
                      >
                        <Edit3 className="h-4 w-4" />
                        Editor
                      </Button>
                      <Button
                        variant={inviteRole === 'viewer' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setInviteRole('viewer')}
                      >
                        <Eye className="h-4 w-4" />
                        Viewer
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {inviteRole === 'editor' 
                        ? 'Editors can make changes to the project'
                        : 'Viewers can only view the project'
                      }
                    </p>
                  </div>
                  <Button className="w-full gap-2" onClick={handleInvite}>
                    <Mail className="h-4 w-4" />
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Collaborators List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              <Label className="text-xs text-muted-foreground">Team Members</Label>
              {collaborators.map((collaborator) => {
                const RoleIcon = ROLE_LABELS[collaborator.role].icon
                return (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback>
                          {collaborator.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                        STATUS_COLORS[collaborator.status]
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {collaborator.name}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <RoleIcon className={cn("h-3.5 w-3.5", ROLE_LABELS[collaborator.role].color)} />
                            </TooltipTrigger>
                            <TooltipContent>
                              {ROLE_LABELS[collaborator.role].label}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {collaborator.email}
                      </p>
                    </div>
                    {collaborator.role !== 'owner' && (
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleChangeRole(
                                  collaborator.id, 
                                  collaborator.role === 'editor' ? 'viewer' : 'editor'
                                )}
                              >
                                {collaborator.role === 'editor' ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <Edit3 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Change to {collaborator.role === 'editor' ? 'Viewer' : 'Editor'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveCollaborator(collaborator.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* Real-time Features Info */}
          <div className="p-4 border-t bg-muted/30">
            <div className="text-xs text-muted-foreground space-y-2">
              <p className="font-medium">Real-time Features:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  Live cursor tracking
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  Instant code sync
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  Chat & comments
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  Version conflict resolution
                </li>
              </ul>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Presence indicator for header
export function CollaborationPresence({ 
  collaborators,
  onClick 
}: { 
  collaborators: Collaborator[]
  onClick: () => void 
}) {
  const onlineCollaborators = collaborators.filter(c => c.status === 'online')
  const displayCount = Math.min(onlineCollaborators.length, 3)
  const extraCount = onlineCollaborators.length - displayCount

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 pl-1"
            onClick={onClick}
          >
            <div className="flex -space-x-2">
              {onlineCollaborators.slice(0, displayCount).map((c, i) => (
                <Avatar key={c.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={c.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {c.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {extraCount > 0 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-[10px]">+{extraCount}</span>
                </div>
              )}
            </div>
            <Users className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {onlineCollaborators.length} collaborator{onlineCollaborators.length !== 1 ? 's' : ''} online
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
