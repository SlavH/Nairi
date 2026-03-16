"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Network, AlertTriangle, Lightbulb, Search, Link2, Brain, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface KnowledgeNode {
  id: string
  title: string
  content: string
  node_type: "fact" | "belief" | "question" | "insight"
  source_type: string
  confidence_score: number
  tags: string[]
  created_at: string
}

interface KnowledgeEdge {
  id: string
  source_node_id: string
  target_node_id: string
  relationship_type: string
  strength: number
}

interface BeliefContradiction {
  id: string
  node_a_id: string
  node_b_id: string
  description: string
  suggested_resolution: string
  resolved: boolean
}

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  contradictions: BeliefContradiction[]
  userId: string
}

export function KnowledgeGraph({ nodes: initialNodes, edges, contradictions, userId }: KnowledgeGraphProps) {
  const [nodes, setNodes] = useState(initialNodes)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [newNode, setNewNode] = useState({
    title: "",
    content: "",
    node_type: "fact" as const,
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState("")

  const supabase = createClient()

  const filteredNodes = nodes.filter(
    (node) =>
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case "fact":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "belief":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "question":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "insight":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getNodeTypeIcon = (type: string) => {
    switch (type) {
      case "fact":
        return <Network className="h-4 w-4" />
      case "belief":
        return <Brain className="h-4 w-4" />
      case "question":
        return <AlertTriangle className="h-4 w-4" />
      case "insight":
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Network className="h-4 w-4" />
    }
  }

  const handleAddNode = async () => {
    if (!newNode.title.trim() || !newNode.content.trim()) return

    setIsAddingNode(true)

    const { data, error } = await supabase
      .from("knowledge_nodes")
      .insert({
        user_id: userId,
        title: newNode.title.trim(),
        content: newNode.content.trim(),
        node_type: newNode.node_type,
        source_type: "manual",
        confidence_score: 0.8,
        tags: newNode.tags,
      })
      .select()
      .single()

    if (!error && data) {
      setNodes([data, ...nodes])
      setNewNode({ title: "", content: "", node_type: "fact", tags: [] })
    }

    setIsAddingNode(false)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !newNode.tags.includes(tagInput.trim().toLowerCase())) {
      setNewNode({
        ...newNode,
        tags: [...newNode.tags, tagInput.trim().toLowerCase()],
      })
      setTagInput("")
    }
  }

  const getConnectedNodes = (nodeId: string) => {
    const connectedIds = edges
      .filter((e) => e.source_node_id === nodeId || e.target_node_id === nodeId)
      .map((e) => (e.source_node_id === nodeId ? e.target_node_id : e.source_node_id))
    return nodes.filter((n) => connectedIds.includes(n.id))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Knowledge Graph</h1>
              <p className="text-muted-foreground">Your personal knowledge network</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90">
                  <Plus className="h-4 w-4" />
                  Add Knowledge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Knowledge Node</DialogTitle>
                  <DialogDescription>Add a new piece of knowledge to your graph</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newNode.node_type}
                      onValueChange={(v) => setNewNode({ ...newNode, node_type: v as typeof newNode.node_type })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fact">Fact</SelectItem>
                        <SelectItem value="belief">Belief</SelectItem>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="insight">Insight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="What is this knowledge about?"
                      value={newNode.title}
                      onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      placeholder="Describe this knowledge in detail..."
                      value={newNode.content}
                      onChange={(e) => setNewNode({ ...newNode, content: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tags..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag} className="bg-transparent">
                        Add
                      </Button>
                    </div>
                    {newNode.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newNode.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleAddNode}
                    disabled={!newNode.title.trim() || !newNode.content.trim() || isAddingNode}
                    className="w-full bg-gradient-to-r from-[#e052a0] to-[#00c9c8] hover:opacity-90"
                  >
                    {isAddingNode ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      "Add Knowledge"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your knowledge..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="nodes">
          <TabsList className="mb-6">
            <TabsTrigger value="nodes" className="gap-2">
              <Network className="h-4 w-4" />
              Knowledge Nodes ({filteredNodes.length})
            </TabsTrigger>
            <TabsTrigger value="contradictions" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Contradictions ({contradictions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nodes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNodes.map((node) => (
                <Card
                  key={node.id}
                  className={cn("cursor-pointer transition-all hover:shadow-md", getNodeTypeColor(node.node_type))}
                  onClick={() => setSelectedNode(node)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {getNodeTypeIcon(node.node_type)}
                      <Badge variant="outline" className="capitalize">
                        {node.node_type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{node.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{node.content}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-wrap gap-1">
                        {node.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        {getConnectedNodes(node.id).length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredNodes.length === 0 && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No knowledge yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your knowledge graph by adding facts, beliefs, and insights.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contradictions">
            <div className="space-y-4">
              {contradictions.map((contradiction) => {
                const nodeA = nodes.find((n) => n.id === contradiction.node_a_id)
                const nodeB = nodes.find((n) => n.id === contradiction.node_b_id)

                return (
                  <Card key={contradiction.id} className="border-yellow-500/20 bg-yellow-500/5">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">Belief Contradiction Detected</CardTitle>
                      </div>
                      <CardDescription>{contradiction.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-card">
                          <p className="font-medium text-sm">{nodeA?.title || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{nodeA?.content?.slice(0, 100)}...</p>
                        </div>
                        <div className="p-3 rounded-lg bg-card">
                          <p className="font-medium text-sm">{nodeB?.title || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground mt-1">{nodeB?.content?.slice(0, 100)}...</p>
                        </div>
                      </div>
                      {contradiction.suggested_resolution && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                            Suggested Resolution:
                          </p>
                          <p className="text-sm">{contradiction.suggested_resolution}</p>
                        </div>
                      )}
                      <Button className="mt-4 bg-transparent" variant="outline">
                        Resolve Contradiction
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}

              {contradictions.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Lightbulb className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No contradictions found</h3>
                    <p className="text-muted-foreground">Your knowledge graph is consistent!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Selected Node Detail */}
        {selectedNode && (
          <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {getNodeTypeIcon(selectedNode.node_type)}
                  <Badge variant="outline" className="capitalize">
                    {selectedNode.node_type}
                  </Badge>
                </div>
                <DialogTitle>{selectedNode.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-foreground">{selectedNode.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Confidence: {Math.round(selectedNode.confidence_score * 100)}%</span>
                  <span>Source: {selectedNode.source_type}</span>
                </div>
                {selectedNode.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Connected Nodes */}
                {getConnectedNodes(selectedNode.id).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Connected Knowledge</h4>
                    <div className="space-y-2">
                      {getConnectedNodes(selectedNode.id).map((connected) => (
                        <div
                          key={connected.id}
                          className="p-2 rounded bg-muted text-sm cursor-pointer hover:bg-muted/80"
                          onClick={() => setSelectedNode(connected)}
                        >
                          <div className="flex items-center gap-2">
                            {getNodeTypeIcon(connected.node_type)}
                            <span>{connected.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
