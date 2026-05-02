import { cn } from "@/lib/utils"
import { SlideDeck } from "./slide-deck"
import { Sandpack } from "@codesandbox/sandpack-react"

interface CanvasViewProps {
  content: string
  onClose?: () => void
}

export function CanvasView({ content, onClose }: CanvasViewProps) {
  // Detection logic: Look for JSON structure or code blocks
  let parsedPresentation = null
  try {
      if(content.includes('"type": "presentation"')) {
          parsedPresentation = JSON.parse(content.split('```json')[1]?.split('```')[0] || content)
      }
  } catch(e) {}

  const isCode = content.includes("```") && !parsedPresentation
  const isPresentation = !!parsedPresentation

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-white/10 shadow-2xl relative w-full">
      <div className="flex justify-between items-center p-3 border-b border-white/10">
          <h3 className="font-semibold text-sm text-slate-300">Canvas Preview</h3>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0 rounded-full">×</Button>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        {isCode && (
          <Sandpack 
            template="react" 
            files={{
              "App.js": content.split("```")[1].replace(/^(html|js|javascript|typescript|ts)/, "")
            }}
            options={{ showNavigator: true, editorHeight: 400 }}
          />
        )}
        
        {isPresentation && (
          <SlideDeck slides={parsedPresentation.slides} />
        )}

        {!isCode && !isPresentation && (
          <div className="flex items-center justify-center h-full text-slate-500 italic">
            No preview available
          </div>
        )}
      </div>
    </div>
  )
}
