"use client"

import { useState } from "react"
import { Heart, RefreshCw, ExternalLink, Copy, Play, Image, Globe, Code2, Video, Sparkles, MoreHorizontal, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export type FlowCardType = "image" | "website" | "code" | "video" | "simulation"

export interface FlowCardData {
  id: string
  prompt: string
  result: string
  type: FlowCardType
  metadata?: {
    remix_count?: number
    likes_count?: number
    views_count?: number
    created_at?: string
    user_name?: string
    user_avatar?: string
    title?: string
  }
}

interface FlowCardProps {
  data: FlowCardData
  onRemix?: (prompt: string) => void
  onLike?: (id: string) => void
  onRunAgain?: (id: string) => void
  onOpenInChat?: (id: string) => void
  isLiked?: boolean
}

const typeConfig = {
  image: { icon: Image, label: "Image", gradient: "from-purple-500 to-pink-500" },
  website: { icon: Globe, label: "Website", gradient: "from-cyan-500 to-blue-500" },
  code: { icon: Code2, label: "Code", gradient: "from-green-500 to-emerald-500" },
  video: { icon: Video, label: "Video", gradient: "from-red-500 to-orange-500" },
  simulation: { icon: Sparkles, label: "Simulation", gradient: "from-yellow-500 to-amber-500" },
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative aspect-video bg-white/5 rounded-xl overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-[#e052a0] rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

function WebsitePreview({ url }: { url: string }) {
  return (
    <div className="relative aspect-video bg-white/5 rounded-xl overflow-hidden">
      <iframe
        src={url}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
        title="Website preview"
      />
    </div>
  )
}

function CodePreview({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="relative bg-[#0d0d0d] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-xs text-muted-foreground">Code Output</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-white/80 max-h-[300px] overflow-y-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function VideoPreview({ url }: { url: string }) {
  return (
    <div className="relative aspect-video bg-white/5 rounded-xl overflow-hidden">
      <video
        src={url}
        controls
        className="w-full h-full object-contain"
        preload="metadata"
      />
    </div>
  )
}

function SimulationPreview({ content }: { content: string }) {
  return (
    <div className="relative aspect-video bg-white/5 rounded-xl overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="h-12 w-12 mx-auto text-[#e052a0] mb-2" />
        <p className="text-sm text-muted-foreground">{content}</p>
      </div>
    </div>
  )
}

export function FlowCard({ data, onRemix, onLike, onRunAgain, onOpenInChat, isLiked = false }: FlowCardProps) {
  const [liked, setLiked] = useState(isLiked)
  const [likesCount, setLikesCount] = useState(data.metadata?.likes_count || 0)
  const [isHovered, setIsHovered] = useState(false)
  
  const config = typeConfig[data.type]
  const Icon = config.icon
  
  const handleLike = async () => {
    setLiked(!liked)
    setLikesCount(prev => liked ? prev - 1 : prev + 1)
    onLike?.(data.id)
  }
  
  const handleRemix = () => {
    if (onRemix) {
      onRemix(data.prompt)
    } else {
      navigator.clipboard.writeText(data.prompt)
      window.location.href = `/chat`
    }
  }
  
  const renderPreview = () => {
    switch (data.type) {
      case "image":
        return <ImagePreview src={data.result} alt={data.prompt} />
      case "website":
        return <WebsitePreview url={data.result} />
      case "code":
        return <CodePreview code={data.result} />
      case "video":
        return <VideoPreview url={data.result} />
      case "simulation":
        return <SimulationPreview content={data.result} />
      default:
        return (
          <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center">
            <Icon className="h-12 w-12 text-muted-foreground" />
          </div>
        )
    }
  }
  
  return (
    <div
      className={cn(
        "group relative bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden transition-all duration-300",
        isHovered && "border-white/30 shadow-xl shadow-black/20 scale-[1.01]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge
        className={cn(
          "absolute top-3 left-3 z-10 gap-1.5 bg-gradient-to-r",
          config.gradient,
          "text-white border-0 shadow-lg"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </Badge>
      
      {data.metadata?.remix_count && data.metadata.remix_count > 0 && (
        <Badge
          variant="secondary"
          className="absolute top-3 right-3 z-10 bg-white/10 backdrop-blur-md border-white/20"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          {data.metadata.remix_count} remixes
        </Badge>
      )}
      
      <div className="p-4">
        <p className="text-sm text-white/90 font-medium mb-2 line-clamp-2">{data.prompt}</p>
        {data.metadata?.title && (
          <p className="text-xs text-muted-foreground mb-2">{data.metadata.title}</p>
        )}
      </div>
      
      <div className="px-4 pb-4">
        {renderPreview()}
      </div>
      
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-lg transition-all",
              liked && "text-red-500 bg-red-500/10"
            )}
            onClick={handleLike}
          >
            <Heart className={cn("h-5 w-5", liked && "fill-current")} />
          </Button>
          <span className="text-xs text-muted-foreground ml-1">{likesCount}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 gap-1.5 bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20"
            onClick={handleRemix}
          >
            <RefreshCw className="h-4 w-4" />
            Remix
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20"
            onClick={() => onOpenInChat?.(data.id)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20"
            onClick={() => onRunAgain?.(data.id)}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {data.metadata?.created_at && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(data.metadata.created_at), { addSuffix: true })}
        </div>
      )}
    </div>
  )
}
