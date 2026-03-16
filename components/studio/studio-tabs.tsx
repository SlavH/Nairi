"use client"

import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Image, Video, Volume2, Presentation } from "lucide-react"

const ImageGenerator = dynamic(
  () => import("@/components/studio/image-generator").then(m => ({ default: m.ImageGenerator })),
  { loading: () => <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">Loading...</div>, ssr: false }
)
const VideoGenerator = dynamic(
  () => import("@/components/studio/video-generator").then(m => ({ default: m.VideoGenerator })),
  { loading: () => <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">Loading...</div>, ssr: false }
)
const AudioGenerator = dynamic(
  () => import("@/components/studio/audio-generator").then(m => ({ default: m.AudioGenerator })),
  { loading: () => <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">Loading...</div>, ssr: false }
)
const PresentationGenerator = dynamic(
  () => import("@/components/studio/presentation-generator").then(m => ({ default: m.PresentationGenerator })),
  { loading: () => <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">Loading...</div>, ssr: false }
)

export function StudioTabs() {
  return (
    <Tabs defaultValue="image" className="w-full">
      <div className="section-card p-2 mb-6">
        <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Image</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Video</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span className="hidden sm:inline">Audio</span>
          </TabsTrigger>
          <TabsTrigger value="presentation" className="flex items-center gap-2">
            <Presentation className="h-4 w-4" />
            <span className="hidden sm:inline">Slides</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="image">
        <ImageGenerator />
      </TabsContent>

      <TabsContent value="video">
        <VideoGenerator />
      </TabsContent>

      <TabsContent value="audio">
        <AudioGenerator />
      </TabsContent>

      <TabsContent value="presentation">
        <PresentationGenerator />
      </TabsContent>
    </Tabs>
  )
}
