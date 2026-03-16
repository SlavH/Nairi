"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  GripVertical,
  Trash2,
  Copy,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Layers,
  Type,
  Image as ImageIcon,
  Square,
  Columns,
  LayoutGrid,
  Video,
  FileText,
  ShoppingCart,
  Mail,
  MapPin,
  Star,
  MessageSquare,
  Calendar,
  Users,
  BarChart3,
  Sparkles
} from "lucide-react"

// Element types for the builder
export type ElementType = 
  | "section"
  | "container"
  | "columns"
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "video"
  | "form"
  | "card"
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "cta"
  | "footer"
  | "navbar"
  | "gallery"
  | "blog"
  | "product"
  | "cart"
  | "contact"
  | "map"
  | "social"
  | "divider"
  | "spacer"
  | "custom"

export interface BuilderElement {
  id: string
  type: ElementType
  label: string
  props: Record<string, any>
  styles: Record<string, any>
  children?: BuilderElement[]
  isVisible: boolean
  isLocked: boolean
  parentId?: string
}

interface DragDropCanvasProps {
  elements: BuilderElement[]
  selectedElement: BuilderElement | null
  onSelectElement: (element: BuilderElement | null) => void
  onUpdateElements: (elements: BuilderElement[]) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  viewport: "mobile" | "tablet" | "desktop"
  isEditMode: boolean
}

// Element icons mapping
const ELEMENT_ICONS: Record<ElementType, React.ReactNode> = {
  section: <Layers className="h-4 w-4" />,
  container: <Square className="h-4 w-4" />,
  columns: <Columns className="h-4 w-4" />,
  heading: <Type className="h-4 w-4" />,
  paragraph: <FileText className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  button: <Square className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  form: <Mail className="h-4 w-4" />,
  card: <Square className="h-4 w-4" />,
  hero: <Sparkles className="h-4 w-4" />,
  features: <LayoutGrid className="h-4 w-4" />,
  testimonials: <MessageSquare className="h-4 w-4" />,
  pricing: <BarChart3 className="h-4 w-4" />,
  cta: <Sparkles className="h-4 w-4" />,
  footer: <Layers className="h-4 w-4" />,
  navbar: <Layers className="h-4 w-4" />,
  gallery: <LayoutGrid className="h-4 w-4" />,
  blog: <FileText className="h-4 w-4" />,
  product: <ShoppingCart className="h-4 w-4" />,
  cart: <ShoppingCart className="h-4 w-4" />,
  contact: <Mail className="h-4 w-4" />,
  map: <MapPin className="h-4 w-4" />,
  social: <Users className="h-4 w-4" />,
  divider: <Square className="h-4 w-4" />,
  spacer: <Square className="h-4 w-4" />,
  custom: <Sparkles className="h-4 w-4" />,
}

// Sortable Element Component
function SortableElement({
  element,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  onToggleLock,
  isEditMode,
  depth = 0
}: {
  element: BuilderElement
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggleVisibility: () => void
  onToggleLock: () => void
  isEditMode: boolean
  depth?: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: element.id, disabled: element.isLocked || !isEditMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: `${depth * 16}px`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border-2 transition-all",
        isSelected
          ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20"
          : "border-transparent hover:border-border",
        !element.isVisible && "opacity-50",
        element.isLocked && "cursor-not-allowed",
        isDragging && "z-50"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Element Header - Shows on hover or when selected */}
      <div
        className={cn(
          "absolute -top-8 left-0 right-0 flex items-center justify-between rounded-t-lg bg-zinc-900 px-2 py-1 text-xs transition-opacity",
          isSelected || isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          {isEditMode && !element.isLocked && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          
          {/* Element Icon & Label */}
          <span className="flex items-center gap-1 text-muted-foreground">
            {ELEMENT_ICONS[element.type]}
            <span className="font-medium text-foreground">{element.label}</span>
          </span>
          
          {/* Status Badges */}
          {element.isLocked && (
            <Badge variant="secondary" className="h-5 px-1 text-[10px]">
              <Lock className="h-3 w-3" />
            </Badge>
          )}
          {!element.isVisible && (
            <Badge variant="secondary" className="h-5 px-1 text-[10px]">
              <EyeOff className="h-3 w-3" />
            </Badge>
          )}
        </div>

        {/* Element Actions */}
        {isEditMode && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onToggleVisibility()
              }}
            >
              {element.isVisible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onToggleLock()
              }}
            >
              {element.isLocked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Unlock className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Element Content Preview */}
      <div className="min-h-[60px] p-4">
        <ElementPreview element={element} />
      </div>

      {/* Resize Handles (for selected elements) */}
      {isSelected && isEditMode && !element.isLocked && (
        <>
          <div className="absolute -bottom-1 -left-1 h-3 w-3 cursor-sw-resize rounded-full border-2 border-violet-500 bg-white" />
          <div className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-full border-2 border-violet-500 bg-white" />
          <div className="absolute -right-1 -top-1 h-3 w-3 cursor-ne-resize rounded-full border-2 border-violet-500 bg-white" />
          <div className="absolute -left-1 -top-1 h-3 w-3 cursor-nw-resize rounded-full border-2 border-violet-500 bg-white" />
        </>
      )}
    </div>
  )
}

// Element Preview Component
function ElementPreview({ element }: { element: BuilderElement }) {
  switch (element.type) {
    case "heading":
      return (
        <h2 className="text-2xl font-bold">
          {element.props.text || "Heading"}
        </h2>
      )
    case "paragraph":
      return (
        <p className="text-muted-foreground">
          {element.props.text || "Paragraph text goes here..."}
        </p>
      )
    case "button":
      return (
        <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          {element.props.text || "Button"}
        </button>
      )
    case "image":
      return (
        <div className="flex h-32 items-center justify-center rounded-lg bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Image</span>
        </div>
      )
    case "hero":
      return (
        <div className="rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 p-8 text-center">
          <h1 className="text-3xl font-bold">Hero Section</h1>
          <p className="mt-2 text-muted-foreground">Your compelling headline here</p>
        </div>
      )
    case "features":
      return (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg bg-muted p-4 text-center">
              <div className="mx-auto mb-2 h-8 w-8 rounded-full bg-primary/20" />
              <span className="text-sm">Feature {i}</span>
            </div>
          ))}
        </div>
      )
    case "testimonials":
      return (
        <div className="rounded-lg bg-muted p-4">
          <MessageSquare className="mb-2 h-6 w-6 text-primary" />
          <p className="italic text-muted-foreground">"Customer testimonial..."</p>
          <p className="mt-2 text-sm font-medium">- Customer Name</p>
        </div>
      )
    case "pricing":
      return (
        <div className="grid grid-cols-3 gap-4">
          {["Basic", "Pro", "Enterprise"].map((plan) => (
            <div key={plan} className="rounded-lg border p-4 text-center">
              <span className="font-medium">{plan}</span>
              <p className="text-2xl font-bold">$XX</p>
            </div>
          ))}
        </div>
      )
    case "form":
      return (
        <div className="space-y-2 rounded-lg border p-4">
          <div className="h-8 rounded bg-muted" />
          <div className="h-8 rounded bg-muted" />
          <div className="h-8 w-24 rounded bg-primary" />
        </div>
      )
    case "navbar":
      return (
        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
          <span className="font-bold">Logo</span>
          <div className="flex gap-4 text-sm">
            <span>Home</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        </div>
      )
    case "footer":
      return (
        <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
          © 2024 Your Company. All rights reserved.
        </div>
      )
    case "section":
    case "container":
      return (
        <div className="min-h-[100px] rounded-lg border-2 border-dashed border-muted-foreground/30 p-4">
          <span className="text-sm text-muted-foreground">Drop elements here</span>
        </div>
      )
    default:
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          {ELEMENT_ICONS[element.type]}
          <span>{element.label}</span>
        </div>
      )
  }
}

export function DragDropCanvas({
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElements,
  onDeleteElement,
  onDuplicateElement,
  viewport,
  isEditMode
}: DragDropCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((el) => el.id === active.id)
      const newIndex = elements.findIndex((el) => el.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newElements = [...elements]
        const [removed] = newElements.splice(oldIndex, 1)
        newElements.splice(newIndex, 0, removed)
        onUpdateElements(newElements)
      }
    }
  }, [elements, onUpdateElements])

  const handleToggleVisibility = useCallback((id: string) => {
    onUpdateElements(
      elements.map((el) =>
        el.id === id ? { ...el, isVisible: !el.isVisible } : el
      )
    )
  }, [elements, onUpdateElements])

  const handleToggleLock = useCallback((id: string) => {
    onUpdateElements(
      elements.map((el) =>
        el.id === id ? { ...el, isLocked: !el.isLocked } : el
      )
    )
  }, [elements, onUpdateElements])

  const activeElement = activeId
    ? elements.find((el) => el.id === activeId)
    : null

  // Viewport width classes
  const viewportClasses = {
    mobile: "max-w-[375px]",
    tablet: "max-w-[768px]",
    desktop: "max-w-full"
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={canvasRef}
        className={cn(
          "mx-auto min-h-full bg-background p-4 transition-all",
          viewportClasses[viewport]
        )}
        onClick={() => onSelectElement(null)}
      >
        {elements.length === 0 ? (
          <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
            <Layers className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Start Building
            </h3>
            <p className="mt-2 text-sm text-muted-foreground/70">
              Drag elements from the sidebar or use AI to generate
            </p>
          </div>
        ) : (
          <SortableContext
            items={elements.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {elements.map((element) => (
                <SortableElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElement?.id === element.id}
                  onSelect={() => onSelectElement(element)}
                  onDelete={() => onDeleteElement(element.id)}
                  onDuplicate={() => onDuplicateElement(element.id)}
                  onToggleVisibility={() => handleToggleVisibility(element.id)}
                  onToggleLock={() => handleToggleLock(element.id)}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeElement ? (
          <div className="rounded-lg border-2 border-violet-500 bg-background p-4 opacity-80 shadow-lg">
            <div className="flex items-center gap-2">
              {ELEMENT_ICONS[activeElement.type]}
              <span>{activeElement.label}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
