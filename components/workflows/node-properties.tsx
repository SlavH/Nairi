/**
 * Nairi AI Workflow Builder - Node Properties Panel
 * Configuration panel for selected nodes
 */

"use client"

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/lib/workflows/store'
import { WorkflowNode, NodeType } from '@/lib/workflows/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Settings,
  Code,
  Zap,
  Info,
  Copy,
  Trash2,
  Play,
  Bug,
  Plus,
  Minus,
  X,
} from 'lucide-react'
import { NODE_ICONS } from './nodes'

// ============================================================================
// Node Properties Panel
// ============================================================================

interface NodePropertiesProps {
  className?: string
}

export function NodeProperties({ className }: NodePropertiesProps) {
  const {
    currentWorkflow,
    selectedNodes,
    updateNode,
    deleteNode,
  } = useWorkflowStore()

  // Get selected node
  const selectedNode = selectedNodes.length === 1
    ? currentWorkflow?.nodes.find(n => n.id === selectedNodes[0])
    : null

  if (!selectedNode) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full p-4 text-center", className)}>
        <Settings className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Select a node to configure</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Click on a node in the canvas to view and edit its properties
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(NODE_ICONS[selectedNode.type] || Settings, {
              className: "h-5 w-5"
            })}
            <div>
              <h3 className="font-medium">{selectedNode.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedNode.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => deleteNode(selectedNode.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger value="config" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Config
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs">
              <Code className="h-3 w-3 mr-1" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs">
              <Info className="h-3 w-3 mr-1" />
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="p-4 space-y-4">
            {/* Basic Settings */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="node-name">Name</Label>
                <Input
                  id="node-name"
                  value={selectedNode.name}
                  onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="node-description">Description</Label>
                <Textarea
                  id="node-description"
                  value={selectedNode.description || ''}
                  onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                  placeholder="Add a description..."
                  rows={2}
                />
              </div>
            </div>

            {/* Node-specific configuration */}
            <Accordion type="single" collapsible defaultValue="config">
              <AccordionItem value="config">
                <AccordionTrigger>Configuration</AccordionTrigger>
                <AccordionContent>
                  <NodeConfigEditor
                    node={selectedNode}
                    onUpdate={(config) => updateNode(selectedNode.id, { config })}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-4">
            {/* Disable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Disabled</Label>
                <p className="text-xs text-muted-foreground">Skip this node during execution</p>
              </div>
              <Switch
                checked={selectedNode.isDisabled || false}
                onCheckedChange={(checked) => updateNode(selectedNode.id, { isDisabled: checked })}
              />
            </div>

            {/* Breakpoint toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Breakpoint</Label>
                <p className="text-xs text-muted-foreground">Pause execution at this node</p>
              </div>
              <Switch
                checked={selectedNode.isBreakpoint || false}
                onCheckedChange={(checked) => updateNode(selectedNode.id, { isBreakpoint: checked })}
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label>Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">X</Label>
                  <Input
                    type="number"
                    value={selectedNode.position.x}
                    onChange={(e) => updateNode(selectedNode.id, {
                      position: { ...selectedNode.position, x: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Y</Label>
                  <Input
                    type="number"
                    value={selectedNode.position.y}
                    onChange={(e) => updateNode(selectedNode.id, {
                      position: { ...selectedNode.position, y: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Node ID</Label>
              <code className="block p-2 bg-muted rounded text-xs font-mono">
                {selectedNode.id}
              </code>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Badge variant="secondary">{selectedNode.type}</Badge>
            </div>

            <div className="space-y-2">
              <Label>Inputs</Label>
              <div className="space-y-1">
                {selectedNode.inputs.map(port => (
                  <div key={port.id} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>{port.name}</span>
                    {port.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                  </div>
                ))}
                {selectedNode.inputs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No inputs</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Outputs</Label>
              <div className="space-y-1">
                {selectedNode.outputs.map(port => (
                  <div key={port.id} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{port.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Bug className="h-4 w-4 mr-2" />
            Test Node
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Run From Here
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Node Config Editor
// ============================================================================

interface NodeConfigEditorProps {
  node: WorkflowNode
  onUpdate: (config: Record<string, any>) => void
}

function NodeConfigEditor({ node, onUpdate }: NodeConfigEditorProps) {
  const updateConfig = (key: string, value: any) => {
    onUpdate({ ...node.config, [key]: value })
  }

  // Render config based on node type
  switch (node.type) {
    case 'trigger-webhook':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Method</Label>
            <Select
              value={node.config.method || 'POST'}
              onValueChange={(v) => updateConfig('method', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Path</Label>
            <Input
              value={node.config.path || ''}
              onChange={(e) => updateConfig('path', e.target.value)}
              placeholder="/webhook/my-endpoint"
            />
          </div>
          <div className="space-y-2">
            <Label>Authentication</Label>
            <Select
              value={node.config.authentication || 'none'}
              onValueChange={(v) => updateConfig('authentication', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="api-key">API Key</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    case 'trigger-schedule':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <Select
              value={node.config.type || 'cron'}
              onValueChange={(v) => updateConfig('type', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cron">Cron Expression</SelectItem>
                <SelectItem value="interval">Interval</SelectItem>
                <SelectItem value="once">Run Once</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {node.config.type === 'cron' && (
            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <Input
                value={node.config.cron || ''}
                onChange={(e) => updateConfig('cron', e.target.value)}
                placeholder="0 * * * *"
              />
              <p className="text-xs text-muted-foreground">e.g., "0 * * * *" for every hour</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={node.config.timezone || 'UTC'}
              onChange={(e) => updateConfig('timezone', e.target.value)}
            />
          </div>
        </div>
      )

    case 'action-http':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Method</Label>
            <Select
              value={node.config.method || 'GET'}
              onValueChange={(v) => updateConfig('method', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={node.config.url || ''}
              onChange={(e) => updateConfig('url', e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div className="space-y-2">
            <Label>Timeout (ms)</Label>
            <Input
              type="number"
              value={node.config.timeout || 30000}
              onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
            />
          </div>
        </div>
      )

    case 'action-code':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={node.config.language || 'javascript'}
              onValueChange={(v) => updateConfig('language', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Code</Label>
            <Textarea
              value={node.config.code || ''}
              onChange={(e) => updateConfig('code', e.target.value)}
              placeholder="// Your code here"
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>
      )

    case 'condition-if':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Condition</Label>
            <Input
              value={node.config.condition || ''}
              onChange={(e) => updateConfig('condition', e.target.value)}
              placeholder="input.status"
            />
          </div>
          <div className="space-y-2">
            <Label>Operator</Label>
            <Select
              value={node.config.operator || 'equals'}
              onValueChange={(v) => updateConfig('operator', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="notEquals">Not Equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="greaterThan">Greater Than</SelectItem>
                <SelectItem value="lessThan">Less Than</SelectItem>
                <SelectItem value="isEmpty">Is Empty</SelectItem>
                <SelectItem value="isNotEmpty">Is Not Empty</SelectItem>
                <SelectItem value="matches">Matches Regex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={node.config.value || ''}
              onChange={(e) => updateConfig('value', e.target.value)}
              placeholder="Compare value"
            />
          </div>
        </div>
      )

    case 'loop-foreach':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Array Expression</Label>
            <Input
              value={node.config.array || ''}
              onChange={(e) => updateConfig('array', e.target.value)}
              placeholder="{{input.items}}"
            />
          </div>
          <div className="space-y-2">
            <Label>Item Variable Name</Label>
            <Input
              value={node.config.itemVariable || 'item'}
              onChange={(e) => updateConfig('itemVariable', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Index Variable Name</Label>
            <Input
              value={node.config.indexVariable || 'index'}
              onChange={(e) => updateConfig('indexVariable', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Iterations</Label>
            <Input
              type="number"
              value={node.config.maxIterations || 1000}
              onChange={(e) => updateConfig('maxIterations', parseInt(e.target.value))}
            />
          </div>
        </div>
      )

    case 'delay':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Duration</Label>
            <Input
              type="number"
              value={node.config.duration || 1000}
              onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              value={node.config.unit || 'milliseconds'}
              onValueChange={(v) => updateConfig('unit', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="milliseconds">Milliseconds</SelectItem>
                <SelectItem value="seconds">Seconds</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )

    case 'action-ai':
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={node.config.model || 'bitnet'}
              onValueChange={(v) => updateConfig('model', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bitnet">Colab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              value={node.config.prompt || ''}
              onChange={(e) => updateConfig('prompt', e.target.value)}
              placeholder="Enter your prompt..."
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label>Temperature</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={node.config.temperature || 0.7}
              onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              value={node.config.maxTokens || 1000}
              onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
            />
          </div>
        </div>
      )

    default:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Configuration for this node type is not yet implemented.
          </p>
          <div className="space-y-2">
            <Label>Raw Config (JSON)</Label>
            <Textarea
              value={JSON.stringify(node.config, null, 2)}
              onChange={(e) => {
                try {
                  onUpdate(JSON.parse(e.target.value))
                } catch {}
              }}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>
      )
  }
}
