/**
 * Nairi AI Workflow Builder - Main Page
 * Visual workflow builder with drag-and-drop canvas
 */

"use client"

import {
  Sparkles,
  Play,
  Pause,
  Square,
  Save,
  Download,
  Upload,
  Settings,
  MoreHorizontal,
  Plus,
  FolderOpen,
  Trash2,
  Copy,
  History,
  GitBranch,
  Rocket,
  LayoutTemplate,
  Boxes,
  Terminal,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelRightClose,
  PanelBottomClose,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExecutionLogs } from '@/components/workflows/execution-logs'
import { NodePalette } from '@/components/workflows/node-palette'
import { NodeProperties } from '@/components/workflows/node-properties'
import { TemplateGallery } from '@/components/workflows/template-gallery'
import { WorkflowCanvas } from '@/components/workflows/workflow-canvas'
import { cn } from '@/lib/utils'
import { createExecutor } from '@/lib/workflows/executor'
import { useWorkflowStore } from '@/lib/workflows/store'
import { exportWorkflow, importWorkflow, validateWorkflow } from '@/lib/workflows/utils'
import { versionControl } from '@/lib/workflows/version-control'

// ============================================================================
// Main Workflow Builder Page
// ============================================================================

interface SavedWorkflowRow {
  id: string
  name: string
  description?: string | null
  status?: string
  version?: string
  created_at?: string
  updated_at?: string
}

export default function WorkflowsPage() {
  const {
    currentWorkflow,
    workflows,
    isExecuting,
    currentExecution,
    leftPanelOpen,
    rightPanelOpen,
    bottomPanelOpen,
    activeLeftTab,
    setActiveLeftTab,
    toggleLeftPanel,
    toggleRightPanel,
    toggleBottomPanel,
    createWorkflow,
    setCurrentWorkflow,
    updateWorkflow,
    deleteWorkflow,
    startExecution,
    updateExecution,
    stopExecution,
  } = useWorkflowStore()

  const [isNewWorkflowDialogOpen, setIsNewWorkflowDialogOpen] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState('')
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflowRow[]>([])
  const [savingToServer, setSavingToServer] = useState(false)
  const serverIdsRef = useRef<Map<string, string>>(new Map())

  const refreshSavedWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows')
      if (!res.ok) return
      const rows = await res.json()
      if (Array.isArray(rows)) setSavedWorkflows(rows)
    } catch {
      // offline / not signed in — local-only mode
    }
  }, [])

  useEffect(() => {
    void refreshSavedWorkflows()
  }, [refreshSavedWorkflows])

  const serializeWorkflow = (wf: NonNullable<typeof currentWorkflow>) => ({
    name: wf.name,
    description: wf.description || '',
    nodes: wf.nodes,
    edges: wf.edges,
    variables: wf.variables,
    settings: wf.settings,
    triggers: wf.triggers,
  })

  // Save workflow to server (create or update), keeps local version history too
  const handleSaveWorkflow = async () => {
    if (!currentWorkflow || savingToServer) return
    setSavingToServer(true)
    try {
      versionControl.saveVersion(currentWorkflow, 'Manual save')
      const payload = serializeWorkflow(currentWorkflow)
      const existingId = serverIdsRef.current.get(currentWorkflow.id)

      let res: Response
      if (existingId) {
        res = await fetch('/api/workflows', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existingId, ...payload }),
        })
      } else {
        res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const row = await res.json()
          serverIdsRef.current.set(currentWorkflow.id, row.id)
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save workflow')
        return
      }

      void refreshSavedWorkflows()
      toast.success('Workflow saved')
    } catch {
      toast.error('Network error while saving')
    } finally {
      setSavingToServer(false)
    }
  }

  const handleOpenSavedWorkflow = async (row: SavedWorkflowRow) => {
    try {
      if (serverIdsRef.current.has(row.id)) {
        // already open in this session — just select it
        const local = workflows.find((w) => serverIdsRef.current.get(w.id) === row.id)
        if (local) {
          setCurrentWorkflow(local)
          return
        }
      }
      const res = await fetch(`/api/workflows?id=${encodeURIComponent(row.id)}`)
      if (!res.ok) {
        toast.error('Failed to load workflow')
        return
      }
      const data = await res.json()
      const wf: import('@/lib/workflows/types').Workflow = {
        id: data.id,
        name: data.name || 'Untitled Workflow',
        description: data.description || '',
        version: data.version || '1.0.0',
        status: data.status || 'draft',
        nodes: data.nodes || [],
        edges: data.edges || [],
        variables: data.variables || [],
        settings: data.settings || {},
        triggers: data.triggers || [],
        createdAt: new Date(data.created_at || Date.now()),
        updatedAt: new Date(data.updated_at || Date.now()),
      }
      serverIdsRef.current.set(wf.id, row.id)
      setCurrentWorkflow(wf)
      toast.success(`Opened "${wf.name}"`)
    } catch {
      toast.error('Network error while loading')
    }
  }

  // Create new workflow
  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) {
      toast.error('Please enter a workflow name')
      return
    }
    const workflow = createWorkflow({ name: newWorkflowName })
    setCurrentWorkflow(workflow)
    setNewWorkflowName('')
    setIsNewWorkflowDialogOpen(false)
    toast.success('Workflow created')
  }

  // Run workflow
  const handleRunWorkflow = async () => {
    if (!currentWorkflow) return

    // Validate workflow
    const validation = validateWorkflow(currentWorkflow)
    if (!validation.valid) {
      toast.error('Workflow validation failed', {
        description: validation.errors[0],
      })
      return
    }

    // Start execution
    startExecution('manual')

    try {
      const executor = createExecutor(currentWorkflow)
      
      // Listen for execution events
      executor.on('node:start', () => {})
      executor.on('node:complete', () => {})
      executor.on('node:error', () => {})

      const result = await executor.execute()
      
      updateExecution(result.id, result)
      
      if (result.status === 'completed') {
        toast.success('Workflow completed successfully')
      } else if (result.status === 'failed') {
        toast.error('Workflow failed', {
          description: result.error?.message,
        })
      }
    } catch (error: any) {
      toast.error('Execution error', {
        description: error.message,
      })
    }
  }

  // Stop workflow
  const handleStopWorkflow = () => {
    if (currentExecution) {
      stopExecution(currentExecution.id)
      toast.info('Workflow stopped')
    }
  }

  // Export workflow
  const handleExportWorkflow = () => {
    if (!currentWorkflow) return
    const json = exportWorkflow(currentWorkflow)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentWorkflow.name.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Workflow exported')
  }

  // Import workflow
  const handleImportWorkflow = () => {
    try {
      const workflow = importWorkflow(importJson)
      const created = createWorkflow(workflow)
      setCurrentWorkflow(created)
      setImportJson('')
      setIsImportDialogOpen(false)
      toast.success('Workflow imported')
    } catch (error: any) {
      toast.error('Import failed', {
        description: error.message,
      })
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Nairi Workflows</span>
          </Link>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>

        {/* Workflow Selector */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[200px] justify-between bg-transparent">
                <span className="truncate">
                  {currentWorkflow?.name || 'Select Workflow'}
                </span>
                <ChevronRight className="h-4 w-4 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[250px]">
              <DropdownMenuItem onClick={() => setIsNewWorkflowDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {savedWorkflows.length > 0 ? (
                savedWorkflows.map((row) => (
                  <DropdownMenuItem
                    key={row.id}
                    onClick={() => void handleOpenSavedWorkflow(row)}
                    className={cn(
                      currentWorkflow && serverIdsRef.current.get(currentWorkflow.id) === row.id && 'bg-muted'
                    )}
                  >
                    <Boxes className="h-4 w-4 mr-2" />
                    <span className="truncate">{row.name}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {row.status || 'draft'}
                    </Badge>
                  </DropdownMenuItem>
                ))
              ) : workflows.length > 0 ? (
                workflows.map((workflow) => (
                  <DropdownMenuItem
                    key={workflow.id}
                    onClick={() => setCurrentWorkflow(workflow)}
                    className={cn(
                      currentWorkflow?.id === workflow.id && 'bg-muted'
                    )}
                  >
                    <Boxes className="h-4 w-4 mr-2" />
                    <span className="truncate">{workflow.name}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {workflow.status}
                    </Badge>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No workflows yet
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {currentWorkflow && (
            <Badge
              variant={currentWorkflow.status === 'active' ? 'default' : 'secondary'}
            >
              {currentWorkflow.status}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Run/Stop */}
          {isExecuting ? (
            <Button variant="destructive" size="sm" onClick={handleStopWorkflow}>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleRunWorkflow}
              disabled={!currentWorkflow}
              className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600"
            >
              <Play className="h-4 w-4" />
              Run
            </Button>
          )}

          {/* Save */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSaveWorkflow()}
            disabled={!currentWorkflow || savingToServer}
          >
            <Save className="h-4 w-4 mr-2" />
            {savingToServer ? 'Saving...' : 'Save'}
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportWorkflow} disabled={!currentWorkflow}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!currentWorkflow}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!currentWorkflow}>
                <History className="h-4 w-4 mr-2" />
                Version History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                disabled={!currentWorkflow}
                onClick={async () => {
                  if (!currentWorkflow) return
                  const serverId = serverIdsRef.current.get(currentWorkflow.id)
                  try {
                    if (serverId) {
                      const res = await fetch(`/api/workflows?id=${encodeURIComponent(serverId)}`, { method: 'DELETE' })
                      if (!res.ok) {
                        toast.error('Failed to delete on server')
                        return
                      }
                      serverIdsRef.current.delete(currentWorkflow.id)
                      void refreshSavedWorkflows()
                    }
                    deleteWorkflow(currentWorkflow.id)
                    toast.success('Workflow deleted')
                  } catch {
                    toast.error('Network error while deleting')
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Deploy */}
          <Button
            size="sm"
            disabled={!currentWorkflow}
            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
          >
            <Rocket className="h-4 w-4" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel */}
          {leftPanelOpen && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="flex h-full flex-col border-r">
                  <Tabs
                    value={activeLeftTab}
                    onValueChange={(v) => setActiveLeftTab(v as any)}
                    className="flex h-full flex-col"
                  >
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2">
                      <TabsTrigger value="nodes" className="text-xs gap-1">
                        <Boxes className="h-3 w-3" />
                        Nodes
                      </TabsTrigger>
                      <TabsTrigger value="templates" className="text-xs gap-1">
                        <LayoutTemplate className="h-3 w-3" />
                        Templates
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="nodes" className="flex-1 m-0">
                      <NodePalette />
                    </TabsContent>
                    <TabsContent value="templates" className="flex-1 m-0">
                      <TemplateGallery />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Center - Canvas */}
          <ResizablePanel defaultSize={leftPanelOpen && rightPanelOpen ? 55 : 70}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={bottomPanelOpen ? 70 : 100}>
                <div className="relative h-full">
                  {/* Panel Toggle Buttons */}
                  <div className="absolute top-2 left-2 z-20 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleLeftPanel}
                    >
                      <PanelLeftClose className={cn(
                        "h-4 w-4 transition-transform",
                        !leftPanelOpen && "rotate-180"
                      )} />
                    </Button>
                  </div>
                  <div className="absolute top-2 right-2 z-20 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleRightPanel}
                    >
                      <PanelRightClose className={cn(
                        "h-4 w-4 transition-transform",
                        !rightPanelOpen && "rotate-180"
                      )} />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleBottomPanel}
                    >
                      <PanelBottomClose className={cn(
                        "h-4 w-4 transition-transform",
                        !bottomPanelOpen && "rotate-180"
                      )} />
                    </Button>
                  </div>

                  <WorkflowCanvas />
                </div>
              </ResizablePanel>

              {/* Bottom Panel - Logs */}
              {bottomPanelOpen && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                    <div className="h-full border-t">
                      <ExecutionLogs />
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Right Panel - Properties */}
          {rightPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                <div className="h-full border-l">
                  <NodeProperties />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Execution Status Bar */}
      {currentExecution && (
        <div className="flex items-center justify-between border-t px-4 py-2 bg-muted/30">
          <div className="flex items-center gap-3">
            {currentExecution.status === 'running' && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
            {currentExecution.status === 'completed' && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {currentExecution.status === 'failed' && (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              Execution: {currentExecution.status}
            </span>
            {currentExecution.duration && (
              <span className="text-sm text-muted-foreground">
                Duration: {currentExecution.duration}ms
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Nodes: {currentExecution.nodeResults.length}
            </span>
            <span className="text-sm text-muted-foreground">
              Logs: {currentExecution.logs.length}
            </span>
          </div>
        </div>
      )}

      {/* New Workflow Dialog */}
      <Dialog open={isNewWorkflowDialogOpen} onOpenChange={setIsNewWorkflowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Give your workflow a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Workflow name"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewWorkflowDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkflow}>
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Workflow</DialogTitle>
            <DialogDescription>
              Paste the workflow JSON to import.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full h-64 p-3 rounded-lg border bg-muted font-mono text-sm"
              placeholder="Paste workflow JSON here..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportWorkflow}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
