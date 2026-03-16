"use client"

import { useState, type ComponentType } from "react"
import { Button } from "@/components/ui/button"
import { Video, Mic, ImageIcon, ChevronDown, Plus, Pin, MessageSquare, Scale, Brain, GraduationCap, Sparkles, Search, Code } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import type { ChatMode } from "./chat-mode-selector"
import { CHAT_MODES } from "./chat-mode-selector"
import { ImageGenerator } from "./image-generator"
import { VideoGenerator } from "./video-generator"
import { VoiceMode } from "./voice-mode"
import { cn } from "@/lib/utils"

type ToolType = "image" | "video" | "voice" | null

const MODE_ICONS: Record<ChatMode, ComponentType<{ className?: string }>> = {
  default: MessageSquare,
  builder: Code,
  learn: GraduationCap,
  debate: Scale,
  reasoning: Brain,
  tutor: GraduationCap,
  creator: Sparkles,
  research: Search,
}

interface ToolsMenuProps {
  onSendMessage?: (message: string) => void
  conversationId?: string | null
  onPinConversation?: (pinned: boolean) => void
  mode?: ChatMode
  onModeChange?: (mode: ChatMode) => void
  triggerClassName?: string
}

export function ToolsMenu({ onSendMessage, conversationId, onPinConversation, mode, onModeChange, triggerClassName }: ToolsMenuProps) {
  const [activeTool, setActiveTool] = useState<ToolType>(null)

  const handleCloseTool = () => setActiveTool(null)

  const handleImageGenerated = (imageUrl: string, prompt: string) => {
    if (onSendMessage) {
      onSendMessage(`Generated image: ${prompt}\n![Generated Image](${imageUrl})`)
    }
    setActiveTool(null)
  }

  const handleVoiceMessage = (message: string) => {
    if (onSendMessage) {
      onSendMessage(message)
    }
  }

  const handlePinFile = async () => {
    if (!conversationId || !onPinConversation) return
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: true }),
      })
      if (res.ok) {
        onPinConversation(true)
        toast.success("Chat pinned")
      } else {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error ?? "Could not pin")
      }
    } catch {
      toast.error("Could not pin")
    }
  }

  return (
    <>
      {/* Single dropdown: Image, Video, Voice - render next to attach in prompting field */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 text-muted-foreground hover:text-foreground touch-manipulation",
              (activeTool === "image" || activeTool === "video" || activeTool === "voice") && "bg-accent",
              triggerClassName
            )}
            aria-label="Create: Image, Video, Voice"
            aria-haspopup="menu"
          >
            <Plus className="h-4 w-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="min-w-[10rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DropdownMenuItem onClick={() => setActiveTool("image")} className="flex items-center gap-2 cursor-pointer">
            <ImageIcon className="h-4 w-4 text-purple-500" />
            <span>Image</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTool("video")} className="flex items-center gap-2 cursor-pointer">
            <Video className="h-4 w-4 text-blue-500" />
            <span>Video</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTool("voice")} className="flex items-center gap-2 cursor-pointer">
            <Mic className="h-4 w-4 text-green-500" />
            <span>Voice</span>
          </DropdownMenuItem>
          {conversationId != null && (
            <DropdownMenuItem onClick={handlePinFile} className="flex items-center gap-2 cursor-pointer">
              <Pin className="h-4 w-4 text-amber-500" />
              <span>Pin file</span>
            </DropdownMenuItem>
          )}
          {onModeChange != null && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Mode</DropdownMenuLabel>
              {CHAT_MODES.map((m) => {
                const ModeIcon = MODE_ICONS[m.id]
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => onModeChange(m.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {ModeIcon && <ModeIcon className="h-4 w-4 text-muted-foreground" />}
                    <span>{m.label}</span>
                  </DropdownMenuItem>
                )
              })}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tool Dialogs */}
      <Dialog open={activeTool === "image"} onOpenChange={(open) => !open && handleCloseTool()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <ImageGenerator 
            isOpen={true}
            onClose={handleCloseTool}
            onImageGenerated={handleImageGenerated}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeTool === "video"} onOpenChange={(open) => !open && handleCloseTool()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Video Generator</DialogTitle>
            <DialogDescription>Create AI-generated videos</DialogDescription>
          </DialogHeader>
          <VideoGenerator />
        </DialogContent>
      </Dialog>

      <Dialog open={activeTool === "voice"} onOpenChange={(open) => !open && handleCloseTool()}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-0">
          <VoiceMode 
            isOpen={true}
            onClose={handleCloseTool}
            onMessage={handleVoiceMessage}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
