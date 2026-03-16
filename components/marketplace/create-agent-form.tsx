"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Sparkles, DollarSign, Settings, Eye, Save, Plus, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTranslation } from "@/lib/i18n/context"

interface AgentInitialData {
  id: string
  name: string
  description: string
  category: string
  icon: string
  capabilities: string[]
  system_prompt: string | null
  is_free: boolean
  price_cents: number
  is_published: boolean
}

interface CreateAgentFormProps {
  userId: string
  /** When editing, pass the agent id and its current data */
  agentId?: string
  initialData?: AgentInitialData
}

const categories = ["Research", "Writing", "Code", "Data", "Creative", "Education", "Business", "Personal"]

const iconOptions = ["search", "code", "pen-tool", "bar-chart", "share-2", "headphones", "dollar-sign", "file-text"]

export function CreateAgentForm({ userId, agentId, initialData }: CreateAgentFormProps) {
  const router = useRouter()
  const t = useTranslation()
  const supabase = createClient()
  const isEdit = Boolean(agentId && initialData)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [newCapability, setNewCapability] = useState("")

  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    icon: initialData?.icon ?? "search",
    capabilities: Array.isArray(initialData?.capabilities) ? initialData.capabilities : [],
    systemPrompt: initialData?.system_prompt ?? "",
    isFree: initialData?.is_free ?? true,
    priceCents: initialData?.price_cents ?? 0,
    isPublished: initialData?.is_published ?? false,
  })

  const handleAddCapability = () => {
    if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
      setFormData((prev) => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()],
      }))
      setNewCapability("")
    }
  }

  const handleRemoveCapability = (cap: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.filter((c) => c !== cap),
    }))
  }

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault()
    setIsSubmitting(true)

    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      icon: formData.icon,
      capabilities: formData.capabilities,
      system_prompt: formData.systemPrompt,
      is_free: formData.isFree,
      price_cents: formData.isFree ? 0 : formData.priceCents,
      is_published: publish,
    }

    try {
      if (isEdit && agentId) {
        const { data, error } = await supabase
          .from("agents")
          .update(payload)
          .eq("id", agentId)
          .eq("creator_id", userId)
          .select()
          .single()
        if (error) throw error
        router.push(`/marketplace/${data.id}`)
      } else {
        const { data, error } = await supabase
          .from("agents")
          .insert({
            creator_id: userId,
            ...payload,
            is_featured: false,
          })
          .select()
          .single()
        if (error) throw error
        router.push(`/marketplace/${data.id}`)
      }
    } catch (error) {
      console.error(isEdit ? "Error updating agent:" : "Error creating agent:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, false)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="basic" className="gap-2">
            <Bot className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="behavior" className="gap-2">
            <Settings className="h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
        </TabsList>

        {/* Basic Info */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set up the core details of your AI agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Research Assistant Pro"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your agent does and who it's for..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                      className={
                        formData.icon === icon ? "bg-gradient-to-r from-[#e052a0] to-[#00c9c8]" : "bg-transparent"
                      }
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capabilities */}
        <TabsContent value="capabilities">
          <Card>
            <CardHeader>
              <CardTitle>Agent Capabilities</CardTitle>
              <CardDescription>Define what your agent can do</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Add Capabilities</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Web Research, Data Analysis"
                    value={newCapability}
                    onChange={(e) => setNewCapability(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCapability())}
                  />
                  <Button type="button" onClick={handleAddCapability} variant="outline" className="bg-transparent">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary" className="gap-1 px-3 py-1.5">
                    {cap}
                    <button
                      type="button"
                      onClick={() => handleRemoveCapability(cap)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {formData.capabilities.length === 0 && (
                  <p className="text-sm text-muted-foreground">No capabilities added yet</p>
                )}
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Suggested capabilities:</p>
                <div className="flex flex-wrap gap-2">
                  {["Research", "Analysis", "Writing", "Code Review", "Brainstorming", "Summarization"].map((sug) => (
                    <Button
                      key={sug}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!formData.capabilities.includes(sug)) {
                          setFormData((prev) => ({
                            ...prev,
                            capabilities: [...prev.capabilities, sug],
                          }))
                        }
                      }}
                      disabled={formData.capabilities.includes(sug)}
                    >
                      + {sug}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior */}
        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>Agent Behavior</CardTitle>
              <CardDescription>Configure how your agent responds and behaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Define your agent's personality, expertise, and behavior guidelines..."
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt defines your agent's core behavior. Be specific about expertise areas, tone, and
                  limitations.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Prompt Tips:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Define the agent's expertise and knowledge domains</li>
                  <li>Specify the tone and communication style</li>
                  <li>Include any limitations or things the agent should avoid</li>
                  <li>Add examples of ideal responses if helpful</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Publishing</CardTitle>
              <CardDescription>Set your agent's price and publish settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label className="font-medium">Free Agent</Label>
                  <p className="text-sm text-muted-foreground">Make this agent available for free</p>
                </div>
                <Switch
                  checked={formData.isFree}
                  onCheckedChange={(v) => setFormData((prev) => ({ ...prev, isFree: v }))}
                />
              </div>

              {!formData.isFree && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10"
                      value={formData.priceCents / 100 || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priceCents: Math.round(Number.parseFloat(e.target.value || "0") * 100),
                        }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You'll receive 80% of each sale. Nairi takes a 20% platform fee.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-gradient-to-r from-[#e052a0]/10 to-[#00c9c8]/10 border border-[#e052a0]/20">
                <h4 className="font-medium mb-2">Creator Economy Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 80% revenue share on all sales</li>
                  <li>• Analytics dashboard for your agents</li>
                  <li>• Featured placement for top performers</li>
                  <li>• Direct user feedback and ratings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
        <Button type="button" variant="outline" onClick={() => router.back()} className="bg-transparent">
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button type="submit" variant="outline" disabled={isSubmitting} className="bg-transparent">
            <Save className="h-4 w-4 mr-2" />
            {isEdit ? "Save changes" : t.marketplace.draft}
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSubmitting || !formData.name || !formData.description}
            className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEdit ? "Updating..." : "Publishing..."}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                {isEdit ? "Save & publish" : t.marketplace.publish}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
