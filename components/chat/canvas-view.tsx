import { cn } from "@/lib/utils"

interface CanvasViewProps {
  content: string
}

export function CanvasView({ content }: CanvasViewProps) {
  // Simple detection logic
  const isCode = content.includes("```")
  const isPresentation = content.includes("[PRESENTATION]")

  return (
    <div className="h-full flex flex-col bg-white/5 border-l border-white/20 p-4">
      <h3 className="font-semibold text-sm text-muted-foreground mb-4">Preview</h3>
      <div className="flex-1 overflow-y-auto">
        {isCode && (
          <div className="font-mono text-xs text-green-400 bg-black/50 p-4 rounded-lg">
            <pre>{content.split("```")[1]}</pre>
          </div>
        )}
        {isPresentation && (
          <div className="bg-white/10 p-6 rounded-lg text-center">
            <p className="text-lg">Presentation Preview</p>
            <p className="text-sm text-muted-foreground mt-2">{content.split("[PRESENTATION]")[1].split("[/PRESENTATION]")[0]}</p>
          </div>
        )}
        {!isCode && !isPresentation && (
          <p className="text-muted-foreground text-sm italic">No preview available for this content.</p>
        )}
      </div>
    </div>
  )
}
