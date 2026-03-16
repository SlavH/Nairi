/**
 * Nairi AI Workflow Builder - Node Palette
 * Sidebar component for dragging nodes onto the canvas
 */

"use client"

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Zap,
  Play,
  GitBranch,
  Database,
  Plug,
  AlertTriangle,
  Box,
  ChevronDown,
  ChevronRight,
  Star,
} from 'lucide-react'
import { NODE_DEFINITIONS, MiniNode, NODE_COLORS } from './nodes'
import { NodeType } from '@/lib/workflows/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// ============================================================================
// Category Icons
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'triggers': <Zap className="h-4 w-4" />,
  'actions': <Play className="h-4 w-4" />,
  'control-flow': <GitBranch className="h-4 w-4" />,
  'data': <Database className="h-4 w-4" />,
  'integrations': <Plug className="h-4 w-4" />,
  'error-handling': <AlertTriangle className="h-4 w-4" />,
  'utility': <Box className="h-4 w-4" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  'triggers': 'Triggers',
  'actions': 'Actions',
  'control-flow': 'Control Flow',
  'data': 'Data',
  'integrations': 'Integrations',
  'error-handling': 'Error Handling',
  'utility': 'Utility',
}

// ============================================================================
// Node Palette Component
// ============================================================================

interface NodePaletteProps {
  className?: string
  onNodeSelect?: (type: NodeType) => void
}

export function NodePalette({ className, onNodeSelect }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['triggers', 'actions', 'control-flow'])
  )
  const [favorites, setFavorites] = useState<Set<NodeType>>(new Set())

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return NODE_DEFINITIONS
    const query = searchQuery.toLowerCase()
    return NODE_DEFINITIONS.filter(
      node =>
        node.name.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query) ||
        node.category.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Group nodes by category
  const nodesByCategory = useMemo(() => {
    const grouped: Record<string, typeof NODE_DEFINITIONS> = {}
    filteredNodes.forEach(node => {
      if (!grouped[node.category]) {
        grouped[node.category] = []
      }
      grouped[node.category].push(node)
    })
    return grouped
  }, [filteredNodes])

  // Get favorite nodes
  const favoriteNodes = useMemo(() => {
    return NODE_DEFINITIONS.filter(node => favorites.has(node.type))
  }, [favorites])

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Toggle favorite
  const toggleFavorite = (type: NodeType) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('nodeType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="all" className="text-xs">
            All Nodes
          </TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            Favorites
            {favorites.size > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {favorites.size}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {Object.entries(nodesByCategory).map(([category, nodes]) => (
                <Collapsible
                  key={category}
                  open={expandedCategories.has(category)}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "p-1.5 rounded-md",
                        NODE_COLORS[category]?.split(' ')[0] || 'bg-muted'
                      )}>
                        {CATEGORY_ICONS[category]}
                      </span>
                      <span className="font-medium text-sm">
                        {CATEGORY_LABELS[category] || category}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {nodes.length}
                      </Badge>
                    </div>
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2 ml-2">
                    {nodes.map((node) => (
                      <div key={node.type} className="relative group">
                        <MiniNode
                          type={node.type}
                          name={node.name}
                          category={node.category}
                          description={node.description}
                          onDragStart={(e) => handleDragStart(e, node.type)}
                          onClick={() => onNodeSelect?.(node.type)}
                        />
                        <button
                          className={cn(
                            "absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                            favorites.has(node.type)
                              ? "text-yellow-500"
                              : "text-muted-foreground hover:text-yellow-500"
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(node.type)
                          }}
                        >
                          <Star className={cn(
                            "h-4 w-4",
                            favorites.has(node.type) && "fill-current"
                          )} />
                        </button>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}

              {filteredNodes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No nodes found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="favorites" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {favoriteNodes.length > 0 ? (
                favoriteNodes.map((node) => (
                  <div key={node.type} className="relative group">
                    <MiniNode
                      type={node.type}
                      name={node.name}
                      category={node.category}
                      description={node.description}
                      onDragStart={(e) => handleDragStart(e, node.type)}
                      onClick={() => onNodeSelect?.(node.type)}
                    />
                    <button
                      className="absolute top-2 right-2 p-1 rounded text-yellow-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(node.type)
                      }}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No favorites yet</p>
                  <p className="text-sm">Star nodes to add them here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
