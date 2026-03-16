/**
 * Nairi AI Workflow Builder - Workflow Canvas
 * Main drag-and-drop canvas for building workflows
 */

"use client"

import React, { useCallback, useRef, useState, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/lib/workflows/store'
import { WorkflowNode, WorkflowEdge, NodeType } from '@/lib/workflows/types'
import { createDefaultNode } from '@/lib/workflows/utils'
import { WorkflowNodeComponent, NODE_DEFINITIONS } from './nodes'
import { Button } from '@/components/ui/button'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Clipboard,
  Play,
  Pause,
  Square,
  Bug,
  Map,
} from 'lucide-react'

// ============================================================================
// Canvas Component
// ============================================================================

interface WorkflowCanvasProps {
  className?: string
}

export function WorkflowCanvas({ className }: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectionLine, setConnectionLine] = useState<{
    start: { x: number; y: number }
    end: { x: number; y: number }
  } | null>(null)

  // Store state
  const {
    currentWorkflow,
    selectedNodes,
    selectedEdges,
    zoom,
    panOffset,
    showGrid,
    snapToGrid,
    gridSize,
    isConnecting,
    connectionStart,
    isExecuting,
    isDebugMode,
    showMinimap,
    selectNode,
    clearSelection,
    deleteNode,
    deleteEdge,
    moveNode,
    setZoom,
    setPanOffset,
    toggleGrid,
    toggleSnapToGrid,
    toggleDebugMode,
    toggleMinimap,
    startConnection,
    endConnection,
    cancelConnection,
    addNode,
    undo,
    redo,
    copySelection,
    pasteClipboard,
  } = useWorkflowStore()

  // ============================================================================
  // Event Handlers
  // ============================================================================

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      clearSelection()
      if (isConnecting) {
        cancelConnection()
      }
    }
  }, [clearSelection, isConnecting, cancelConnection])

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      e.preventDefault()
    }
  }, [panOffset])

  // Handle mouse move for panning and dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }

    if (draggedNode && currentWorkflow) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - panOffset.x) / zoom - dragOffset.x
        const y = (e.clientY - rect.top - panOffset.y) / zoom - dragOffset.y
        moveNode(draggedNode, { x, y })
      }
    }

    if (isConnecting && connectionStart) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const node = currentWorkflow?.nodes.find(n => n.id === connectionStart.nodeId)
        if (node) {
          setConnectionLine({
            start: {
              x: node.position.x + 200, // Approximate node width
              y: node.position.y + 50,  // Approximate port position
            },
            end: {
              x: (e.clientX - rect.left - panOffset.x) / zoom,
              y: (e.clientY - rect.top - panOffset.y) / zoom,
            },
          })
        }
      }
    }
  }, [isPanning, panStart, draggedNode, dragOffset, currentWorkflow, panOffset, zoom, moveNode, isConnecting, connectionStart])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setDraggedNode(null)
    setConnectionLine(null)
  }, [])

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    }
  }, [zoom, setZoom])

  // Handle drop for new nodes
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('nodeType') as NodeType
    if (!nodeType) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = (e.clientX - rect.left - panOffset.x) / zoom
      const y = (e.clientY - rect.top - panOffset.y) / zoom

      const newNode = createDefaultNode(nodeType, { x, y })
      addNode(newNode)
    }
  }, [panOffset, zoom, addNode])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedNodes.forEach(id => deleteNode(id))
        selectedEdges.forEach(id => deleteEdge(id))
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        e.preventDefault()
      }

      // Copy/Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copySelection()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteClipboard()
      }

      // Escape to cancel connection
      if (e.key === 'Escape') {
        cancelConnection()
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes, selectedEdges, deleteNode, deleteEdge, undo, redo, copySelection, pasteClipboard, cancelConnection, clearSelection])

  // ============================================================================
  // Node Handlers
  // ============================================================================

  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    const node = currentWorkflow?.nodes.find(n => n.id === nodeId)
    if (!node) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      const x = (e.clientX - rect.left - panOffset.x) / zoom - node.position.x
      const y = (e.clientY - rect.top - panOffset.y) / zoom - node.position.y
      setDragOffset({ x, y })
      setDraggedNode(nodeId)
    }
  }, [currentWorkflow, panOffset, zoom])

  // ============================================================================
  // Render
  // ============================================================================

  if (!currentWorkflow) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/30", className)}>
        <div className="text-center">
          <p className="text-muted-foreground">No workflow selected</p>
          <p className="text-sm text-muted-foreground/70">Create or select a workflow to start building</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative h-full overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg border p-2">
        <Button variant="ghost" size="icon" onClick={() => setZoom(zoom - 0.1)} disabled={zoom <= 0.1}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" onClick={() => setZoom(zoom + 0.1)} disabled={zoom >= 2}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom(1)}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button variant={showGrid ? "secondary" : "ghost"} size="icon" onClick={toggleGrid}>
          <Grid className="h-4 w-4" />
        </Button>
        <Button variant={snapToGrid ? "secondary" : "ghost"} size="icon" onClick={toggleSnapToGrid}>
          {snapToGrid ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button variant="ghost" size="icon" onClick={undo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button variant={isDebugMode ? "secondary" : "ghost"} size="icon" onClick={toggleDebugMode}>
          <Bug className="h-4 w-4" />
        </Button>
        <Button variant={showMinimap ? "secondary" : "ghost"} size="icon" onClick={toggleMinimap}>
          <Map className="h-4 w-4" />
        </Button>
      </div>

      {/* Selection actions */}
      {selectedNodes.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg border p-2">
          <span className="text-sm text-muted-foreground px-2">
            {selectedNodes.length} selected
          </span>
          <Button variant="ghost" size="icon" onClick={copySelection}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => selectedNodes.forEach(id => deleteNode(id))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "h-full w-full cursor-grab",
          isPanning && "cursor-grabbing",
          showGrid && "bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)]"
        )}
        style={{
          backgroundSize: showGrid ? `${gridSize * zoom}px ${gridSize * zoom}px` : undefined,
          backgroundPosition: showGrid ? `${panOffset.x}px ${panOffset.y}px` : undefined,
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Transform container */}
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          }}
        >
          {/* Edges */}
          <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
            {currentWorkflow.edges.map((edge) => {
              const sourceNode = currentWorkflow.nodes.find(n => n.id === edge.source)
              const targetNode = currentWorkflow.nodes.find(n => n.id === edge.target)
              if (!sourceNode || !targetNode) return null

              const startX = sourceNode.position.x + 200
              const startY = sourceNode.position.y + 50
              const endX = targetNode.position.x
              const endY = targetNode.position.y + 50

              const isSelected = selectedEdges.includes(edge.id)

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all"
                  />
                  {/* Arrow */}
                  <circle
                    cx={endX}
                    cy={endY}
                    r={4}
                    fill={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  />
                </g>
              )
            })}

            {/* Connection line while dragging */}
            {connectionLine && (
              <path
                d={`M ${connectionLine.start.x} ${connectionLine.start.y} C ${connectionLine.start.x + 100} ${connectionLine.start.y}, ${connectionLine.end.x - 100} ${connectionLine.end.y}, ${connectionLine.end.x} ${connectionLine.end.y}`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* Nodes */}
          {currentWorkflow.nodes.map((node) => (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
            >
              <WorkflowNodeComponent
                node={node}
                isSelected={selectedNodes.includes(node.id)}
                onSelect={() => selectNode(node.id)}
                onDelete={() => deleteNode(node.id)}
                onDuplicate={() => {
                  const newNode = createDefaultNode(node.type, {
                    x: node.position.x + 50,
                    y: node.position.y + 50,
                  })
                  addNode({ ...newNode, name: `${node.name} (Copy)`, config: { ...node.config } })
                }}
                onStartConnection={(portId) => startConnection(node.id, portId)}
                onEndConnection={(portId) => endConnection(node.id, portId)}
                isConnecting={isConnecting}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div className="absolute bottom-4 right-4 w-48 h-32 bg-background/80 backdrop-blur-sm rounded-lg border overflow-hidden">
          <div className="relative w-full h-full p-2">
            {currentWorkflow.nodes.map((node) => (
              <div
                key={node.id}
                className={cn(
                  "absolute w-2 h-1 rounded-sm",
                  selectedNodes.includes(node.id) ? "bg-primary" : "bg-muted-foreground"
                )}
                style={{
                  left: `${(node.position.x / 2000) * 100}%`,
                  top: `${(node.position.y / 1000) * 100}%`,
                }}
              />
            ))}
            {/* Viewport indicator */}
            <div
              className="absolute border-2 border-primary/50 rounded"
              style={{
                left: `${(-panOffset.x / zoom / 2000) * 100}%`,
                top: `${(-panOffset.y / zoom / 1000) * 100}%`,
                width: `${(100 / zoom)}%`,
                height: `${(100 / zoom)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
