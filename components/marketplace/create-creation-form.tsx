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
import { Save, Eye, Loader2, FileText, Code, Layout, PenTool, Workflow, BookOpen, Palette } from "lucide-react"

const PRODUCT_TYPES = [
  { value: "prompt", label: "Text / document", icon: FileText },
  { value: "template", label: "Template", icon: Layout },
  { value: "tool", label: "Tool", icon: PenTool },
  { value: "workflow", label: "Workflow", icon: Workflow },
  { value: "course", label: "Course", icon: BookOpen },
  { value: "design", label: "Design", icon: Palette },
  { value: "code", label: "Website / code", icon: Code },
] as const

export interface CreateCreationFormInitialData {
  title: string
  description: string
  product_type: string
  price_cents: number
  category: string
  preview_content: string
  full_content: string
  file_url: string
  is_published: boolean
}

interface CreateCreationFormProps {
  productId?: string
  initialData?: CreateCreationFormInitialData
}

export function CreateCreationForm({ productId, initialData }: CreateCreationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    product_type: (initialData?.product_type ?? "prompt") as string,
    price_cents: initialData?.price_cents ?? 0,
    category: initialData?.category ?? "",
    preview_content: initialData?.preview_content ?? "",
    full_content: initialData?.full_content ?? "",
    file_url: initialData?.file_url ?? "",
    is_published: initialData?.is_published ?? false,
  })

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        product_type: formData.product_type,
        price_cents: formData.price_cents,
        category: formData.category || undefined,
        preview_content: formData.preview_content || undefined,
        full_content: formData.full_content || undefined,
        file_url: formData.file_url || undefined,
        is_published: publish,
      }
      const url = productId
        ? `/api/marketplace/products/${productId}`
        : "/api/marketplace/products"
      const res = await fetch(url, {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      const { product } = await res.json()
      if (productId) {
        router.push("/marketplace/creator")
        router.refresh()
      } else {
        router.push(`/marketplace?created=${product.id}`)
      }
    } catch (err) {
      console.error(productId ? "Update product error:" : "Create product error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, false)}>
      <Card className="bg-white/5 border-white/20">
        <CardHeader>
          <CardTitle>{productId ? "Edit creation" : "Your creation"}</CardTitle>
          <CardDescription>Title, type, and description. Buyers will see this on the marketplace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Landing page template, Copywriting prompt pack"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="bg-white/10 border-white/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.product_type}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, product_type: v }))}
            >
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is it and who is it for?"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-[100px] bg-white/10 border-white/20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                placeholder="e.g. Marketing, Dev"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="bg-white/10 border-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0 = free"
                className="bg-white/10 border-white/20"
                value={formData.price_cents / 100 || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price_cents: Math.round(Number.parseFloat(e.target.value || "0") * 100) }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview">Preview (optional)</Label>
            <Textarea
              id="preview"
              placeholder="Short preview or excerpt buyers see before purchase"
              value={formData.preview_content}
              onChange={(e) => setFormData((prev) => ({ ...prev, preview_content: e.target.value }))}
              className="min-h-[80px] bg-white/10 border-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_content">Full content (optional)</Label>
            <Textarea
              id="full_content"
              placeholder="Full text, code, or paste content. Delivered after purchase."
              value={formData.full_content}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_content: e.target.value }))}
              className="min-h-[120px] font-mono text-sm bg-white/10 border-white/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_url">File or link (optional)</Label>
            <Input
              id="file_url"
              type="url"
              placeholder="https://..."
              value={formData.file_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, file_url: e.target.value }))}
              className="bg-white/10 border-white/20"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/20 p-4">
            <div>
              <Label className="font-medium">Publish now</Label>
              <p className="text-sm text-muted-foreground">List this creation on the marketplace immediately</p>
            </div>
            <Switch
              checked={formData.is_published}
              onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_published: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/20">
        <Button type="button" variant="outline" onClick={() => router.back()} className="bg-white/5 border-white/20">
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="outline"
            disabled={isSubmitting}
            className="bg-white/5 border-white/20"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !formData.title}
            className="bg-gradient-to-r from-[#e052a0] to-[#00c9c8] text-white hover:opacity-90"
            onClick={(e) => handleSubmit(e, true)}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Publish
          </Button>
        </div>
      </div>
    </form>
  )
}
