/**
 * Nairi AI Workflow Builder - Template Gallery
 * Browse and use pre-built workflow templates
 */

"use client"

import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useWorkflowStore } from '@/lib/workflows/store'
import {
  WORKFLOW_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  searchTemplates,
  getPopularTemplates,
  createWorkflowFromTemplate,
} from '@/lib/workflows/templates'
import { WorkflowTemplate } from '@/lib/workflows/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Search,
  LayoutTemplate,
  Star,
  TrendingUp,
  Clock,
  Zap,
  Globe,
  Bell,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Webhook,
  Database,
  Plus,
  Eye,
  Copy,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

// ============================================================================
// Category Icons
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'data-processing': <Database className="h-4 w-4" />,
  'api-integration': <Globe className="h-4 w-4" />,
  'notifications': <Bell className="h-4 w-4" />,
  'scheduling': <Clock className="h-4 w-4" />,
  'ai-automation': <Sparkles className="h-4 w-4" />,
  'error-handling': <AlertTriangle className="h-4 w-4" />,
  'data-sync': <RefreshCw className="h-4 w-4" />,
  'webhooks': <Webhook className="h-4 w-4" />,
}

// ============================================================================
// Template Gallery Component
// ============================================================================

interface TemplateGalleryProps {
  className?: string
  onSelectTemplate?: (template: WorkflowTemplate) => void
}

export function TemplateGallery({ className, onSelectTemplate }: TemplateGalleryProps) {
  const { createWorkflow, setCurrentWorkflow } = useWorkflowStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null)

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = WORKFLOW_TEMPLATES

    if (searchQuery) {
      templates = searchTemplates(searchQuery)
    }

    if (selectedCategory) {
      templates = templates.filter(t => t.category === selectedCategory)
    }

    return templates
  }, [searchQuery, selectedCategory])

  // Popular templates
  const popularTemplates = useMemo(() => getPopularTemplates(4), [])

  // Use template
  const handleUseTemplate = (template: WorkflowTemplate) => {
    const workflowData = createWorkflowFromTemplate(template)
    const workflow = createWorkflow(workflowData)
    setCurrentWorkflow(workflow)
    onSelectTemplate?.(template)
    toast.success(`Created workflow from "${template.name}" template`)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <LayoutTemplate className="h-5 w-5" />
          <h2 className="font-semibold">Template Gallery</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Popular Templates */}
          {!searchQuery && !selectedCategory && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <h3 className="font-medium text-sm">Popular Templates</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {popularTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                    onPreview={() => setPreviewTemplate(template)}
                    compact
                  />
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
          {!searchQuery && (
            <section>
              <h3 className="font-medium text-sm mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'secondary' : 'outline'}
                    size="sm"
                    className="gap-1"
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )}
                  >
                    {CATEGORY_ICONS[category.id]}
                    {category.name}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {/* Template List */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">
                {selectedCategory
                  ? TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.name
                  : searchQuery
                    ? 'Search Results'
                    : 'All Templates'}
              </h3>
              <Badge variant="secondary">{filteredTemplates.length}</Badge>
            </div>
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => handleUseTemplate(template)}
                  onPreview={() => setPreviewTemplate(template)}
                />
              ))}
              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <LayoutTemplate className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No templates found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          {previewTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {CATEGORY_ICONS[previewTemplate.category]}
                  <DialogTitle>{previewTemplate.name}</DialogTitle>
                </div>
                <DialogDescription>{previewTemplate.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Workflow Preview */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium text-sm mb-3">Workflow Structure</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="bg-green-500/20">
                        {previewTemplate.workflow.triggers?.length || 0} Triggers
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/20">
                        {previewTemplate.workflow.nodes.length} Nodes
                      </Badge>
                      <Badge variant="outline" className="bg-purple-500/20">
                        {previewTemplate.workflow.edges.length} Connections
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Nodes: {previewTemplate.workflow.nodes.map(n => n.name).join(' → ')}
                    </div>
                  </div>
                </div>

                {/* Settings Preview */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">Default Settings</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Timeout:</span>{' '}
                      {previewTemplate.workflow.settings.timeout}ms
                    </div>
                    <div>
                      <span className="text-muted-foreground">Retries:</span>{' '}
                      {previewTemplate.workflow.settings.retryCount}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Error Handling:</span>{' '}
                      {previewTemplate.workflow.settings.errorHandling}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Logging:</span>{' '}
                      {previewTemplate.workflow.settings.logging}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  handleUseTemplate(previewTemplate)
                  setPreviewTemplate(null)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// Template Card Component
// ============================================================================

interface TemplateCardProps {
  template: WorkflowTemplate
  onUse: () => void
  onPreview: () => void
  compact?: boolean
}

function TemplateCard({ template, onUse, onPreview, compact }: TemplateCardProps) {
  if (compact) {
    return (
      <button
        className="flex flex-col items-start p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
        onClick={onPreview}
      >
        <div className="flex items-center gap-2 mb-1">
          {CATEGORY_ICONS[template.category]}
          <span className="font-medium text-sm truncate">{template.name}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {template.description}
        </p>
      </button>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted">
              {CATEGORY_ICONS[template.category]}
            </div>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {template.isOfficial && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Official
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {template.category}
                </Badge>
              </div>
            </div>
          </div>
          {template.popularity && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {template.popularity}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription className="line-clamp-2">
          {template.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="secondary" className="text-[10px]">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" className="flex-1" onClick={onUse}>
            <Plus className="h-4 w-4 mr-1" />
            Use
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
