"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
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
  MessageSquare,
  BarChart3,
  Sparkles,
  Users,
  Trash2
} from "lucide-react"
import type { BuilderElement, ElementType } from "./drag-drop-canvas"

interface LayerTreeProps {
  elements: BuilderElement[]
  selectedElement: BuilderElement | null
  onSelectElement: (element: BuilderElement | null) => void
  onUpdateElements: (elements: BuilderElement[]) => void
  onDeleteElement: (id: string) => void
}

// Element icons mapping
const ELEMENT_ICONS: Record<ElementType, React.ReactNode> = {
  section: <Layers className="h-3.5 w-3.5" />,
  container: <Square className="h-3.5 w-3.5" />,
  columns: <Columns className="h-3.5 w-3.5" />,
  heading: <Type className="h-3.5 w-3.5" />,
  paragraph: <FileText className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  button: <Square className="h-3.5 w-3.5" />,
  video: <Video className="h-3.5 w-3.5" />,
  form: <Mail className="h-3.5 w-3.5" />,
  card: <Square className="h-3.5 w-3.5" />,
  hero: <Sparkles className="h-3.5 w-3.5" />,
  features: <LayoutGrid className="h-3.5 w-3.5" />,
  testimonials: <MessageSquare className="h-3.5 w-3.5" />,
  pricing: <BarChart3 className="h-3.5 w-3.5" />,
  cta: <Sparkles className="h-3.5 w-3.5" />,
  footer: <Layers className="h-3.5 w-3.5" />,
  navbar: <Layers className="h-3.5 w-3.5" />,
  gallery: <LayoutGrid className="h-3.5 w-3.5" />,
  blog: <FileText className="h-3.5 w-3.5" />,
  product: <ShoppingCart className="h-3.5 w-3.5" />,
  cart: <ShoppingCart className="h-3.5 w-3.5" />,
  contact: <Mail className="h-3.5 w-3.5" />,
  map: <MapPin className="h-3.5 w-3.5" />,
  social: <Users className="h-3.5 w-3.5" />,
  divider: <Square className="h-3.5 w-3.5" />,
  spacer: <Square className="h-3.5 w-3.5" />,
  custom: <Sparkles className="h-3.5 w-3.5" />,
}

interface LayerItemProps {
  element: BuilderElement
  isSelected: boolean
  onSelect: () => void
  onToggleVisibility: () => void
  onToggleLock: () => void
  onDelete: () => void
  depth?: number
}

function LayerItem({
  element,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  depth = 0
}: LayerItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = element.children && element.children.length > 0

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors",
          isSelected
            ? "bg-violet-500/20 text-violet-400"
            : "hover:bg-muted",
          !element.isVisible && "opacity-50"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={onSelect}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        {/* Drag Handle */}
        <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Icon */}
        <span className="text-muted-foreground">
          {ELEMENT_ICONS[element.type]}
        </span>

        {/* Label */}
        <span className="flex-1 truncate">{element.label}</span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
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
            className="h-5 w-5"
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
            className="h-5 w-5 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Status Indicators */}
        {element.isLocked && (
          <Lock className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {element.children!.map((child) => (
            <LayerItem
              key={child.id}
              element={child}
              isSelected={false}
              onSelect={() => {}}
              onToggleVisibility={() => {}}
              onToggleLock={() => {}}
              onDelete={() => {}}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function LayerTree({
  elements,
  selectedElement,
  onSelectElement,
  onUpdateElements,
  onDeleteElement
}: LayerTreeProps) {
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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-medium">Layers</h3>
        <span className="text-xs text-muted-foreground">
          {elements.length} elements
        </span>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
        {elements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Layers className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No elements yet</p>
            <p className="text-xs text-muted-foreground/70">
              Add elements from the library
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {elements.map((element) => (
              <LayerItem
                key={element.id}
                element={element}
                isSelected={selectedElement?.id === element.id}
                onSelect={() => onSelectElement(element)}
                onToggleVisibility={() => handleToggleVisibility(element.id)}
                onToggleLock={() => handleToggleLock(element.id)}
                onDelete={() => onDeleteElement(element.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
