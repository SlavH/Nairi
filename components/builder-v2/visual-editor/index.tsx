"use client"

import { useState, useCallback } from "react"
import { DragDropCanvas, BuilderElement, ElementType } from "./drag-drop-canvas"
import { ComponentLibrary } from "./component-library"
import { LayerTree } from "./layer-tree"
import { PropertiesPanel } from "./properties-panel"
import { PreviewModal } from "./preview-modal"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Layers,
  LayoutGrid,
  Settings,
  Undo2,
  Redo2,
  Eye,
  Code,
  Smartphone,
  Tablet,
  Monitor,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Ruler,
  MousePointer,
  Hand,
  Sparkles
} from "lucide-react"

interface VisualEditorProps {
  onCodeChange?: (code: string) => void
  initialElements?: BuilderElement[]
}

export function VisualEditor({ onCodeChange, initialElements = [] }: VisualEditorProps) {
  // State
  const [elements, setElements] = useState<BuilderElement[]>(initialElements)
  const [selectedElement, setSelectedElement] = useState<BuilderElement | null>(null)
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop")
  const [zoom, setZoom] = useState(100)
  const [isEditMode, setIsEditMode] = useState(true)
  const [showGrid, setShowGrid] = useState(false)
  const [showRulers, setShowRulers] = useState(false)
  const [leftPanelTab, setLeftPanelTab] = useState<"components" | "layers">("components")
  const [showPreview, setShowPreview] = useState(false)
  
  // History for undo/redo
  const [history, setHistory] = useState<BuilderElement[][]>([initialElements])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Generate unique ID
  const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add element
  const handleAddElement = useCallback((element: Omit<BuilderElement, "id">) => {
    const newElement: BuilderElement = {
      ...element,
      id: generateId()
    }
    const newElements = [...elements, newElement]
    setElements(newElements)
    setSelectedElement(newElement)
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newElements)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [elements, history, historyIndex])

  // Update elements
  const handleUpdateElements = useCallback((newElements: BuilderElement[]) => {
    setElements(newElements)
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newElements)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  // Update single element
  const handleUpdateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    const newElements = elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    )
    handleUpdateElements(newElements)
    
    // Update selected element if it's the one being updated
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates })
    }
  }, [elements, selectedElement, handleUpdateElements])

  // Delete element
  const handleDeleteElement = useCallback((id: string) => {
    const newElements = elements.filter((el) => el.id !== id)
    handleUpdateElements(newElements)
    
    if (selectedElement?.id === id) {
      setSelectedElement(null)
    }
  }, [elements, selectedElement, handleUpdateElements])

  // Duplicate element
  const handleDuplicateElement = useCallback((id: string) => {
    const element = elements.find((el) => el.id === id)
    if (element) {
      const newElement: BuilderElement = {
        ...element,
        id: generateId(),
        label: `${element.label} (copy)`
      }
      const index = elements.findIndex((el) => el.id === id)
      const newElements = [
        ...elements.slice(0, index + 1),
        newElement,
        ...elements.slice(index + 1)
      ]
      handleUpdateElements(newElements)
      setSelectedElement(newElement)
    }
  }, [elements, handleUpdateElements])

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements(history[historyIndex - 1])
      setSelectedElement(null)
    }
  }, [history, historyIndex])

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements(history[historyIndex + 1])
      setSelectedElement(null)
    }
  }, [history, historyIndex])

  // Generate code from elements
  const generateCode = useCallback(() => {
    // This would generate actual React/HTML code from the elements
    // For now, return a placeholder
    const code = elements.map((el) => {
      switch (el.type) {
        case "heading":
          return `<${el.props.level || "h2"} className="${el.props.className || ""}">${el.props.text || "Heading"}</${el.props.level || "h2"}>`
        case "paragraph":
          return `<p className="${el.props.className || ""}">${el.props.text || "Paragraph"}</p>`
        case "button":
          return `<button className="${el.props.className || ""}">${el.props.text || "Button"}</button>`
        case "image":
          return `<img src="${el.props.src || ""}" alt="${el.props.alt || ""}" className="${el.props.className || ""}" />`
        default:
          return `<!-- ${el.type}: ${el.label} -->`
      }
    }).join("\n")
    
    onCodeChange?.(code)
    return code
  }, [elements, onCodeChange])

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleUndo}
              disabled={historyIndex === 0}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Tool Selection */}
          <div className="flex items-center gap-1">
            <Button
              variant={isEditMode ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditMode(true)}
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              variant={!isEditMode ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditMode(false)}
            >
              <Hand className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* View Options */}
          <div className="flex items-center gap-1">
            <Button
              variant={showGrid ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={showRulers ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowRulers(!showRulers)}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Center - Viewport */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-1">
            {[
              { value: "mobile" as const, icon: <Smartphone className="h-4 w-4" />, label: "375px" },
              { value: "tablet" as const, icon: <Tablet className="h-4 w-4" />, label: "768px" },
              { value: "desktop" as const, icon: <Monitor className="h-4 w-4" />, label: "1280px" }
            ].map((vp) => (
              <Button
                key={vp.value}
                variant={viewport === vp.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1 px-2"
                onClick={() => setViewport(vp.value)}
              >
                {vp.icon}
                <span className="text-xs text-muted-foreground">{vp.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Right - Zoom */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(100)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Preview/Code Toggle */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button variant="ghost" size="sm" className="gap-1" onClick={generateCode}>
              <Code className="h-4 w-4" />
              Code
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Components & Layers */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="flex h-full flex-col border-r">
              <Tabs value={leftPanelTab} onValueChange={(v) => setLeftPanelTab(v as any)} className="flex h-full flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
                  <TabsTrigger value="components" className="gap-1 text-xs">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Components
                  </TabsTrigger>
                  <TabsTrigger value="layers" className="gap-1 text-xs">
                    <Layers className="h-3.5 w-3.5" />
                    Layers
                    {elements.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                        {elements.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="components" className="flex-1 overflow-hidden">
                  <ComponentLibrary onAddElement={handleAddElement} />
                </TabsContent>

                <TabsContent value="layers" className="flex-1 overflow-hidden">
                  <LayerTree
                    elements={elements}
                    selectedElement={selectedElement}
                    onSelectElement={setSelectedElement}
                    onUpdateElements={handleUpdateElements}
                    onDeleteElement={handleDeleteElement}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center - Canvas */}
          <ResizablePanel defaultSize={55}>
            <div
              className={cn(
                "h-full overflow-auto bg-zinc-900/50 p-8",
                showGrid && "bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:20px_20px]"
              )}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              <DragDropCanvas
                elements={elements}
                selectedElement={selectedElement}
                onSelectElement={setSelectedElement}
                onUpdateElements={handleUpdateElements}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                viewport={viewport}
                isEditMode={isEditMode}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Properties */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full border-l">
              <PropertiesPanel
                element={selectedElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        elements={elements}
      />
    </div>
  )
}

export { DragDropCanvas, ComponentLibrary, LayerTree, PropertiesPanel }
export type { BuilderElement, ElementType }
