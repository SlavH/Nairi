import { Metadata } from "next"
import { Sparkles } from "lucide-react"
import { StudioTabs } from "@/components/studio/studio-tabs"

export const metadata: Metadata = {
  title: "Nairi Studio - AI Content Generation",
  description: "Create images, videos, audio, and presentations with AI"
}

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-12 md:py-16">
        {/* Header - main page style */}
        <div className="text-center mb-10">
          <div className="section-badge mb-6">
            <Sparkles className="h-4 w-4 text-[#e879f9]" />
            <span>AI Content Generation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Nairi Studio</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Create stunning content with AI. Generate images, videos, audio, and presentations
            using free and open-source models.
          </p>
        </div>

        {/* Tabs - card style; generators lazy-loaded per tab */}
        <StudioTabs />

        {/* Info Footer - section card style */}
        <div className="mt-10 section-card p-6">
          <h3 className="text-sm font-medium text-foreground mb-2">About Nairi Studio</h3>
          <p className="text-xs text-muted-foreground">
            Nairi Studio uses a multi-tier fallback system to ensure content generation always works:
          </p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li>• <strong>Images:</strong> Pollinations.ai (free, no API key required)</li>
            <li>• <strong>Video:</strong> Replicate → HuggingFace → Pollinations → Image sequence fallback</li>
            <li>• <strong>Audio:</strong> Voicerss → Streamlabs Polly → Browser Speech API</li>
            <li>• <strong>Presentations:</strong> AI-generated slide content with export options</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
