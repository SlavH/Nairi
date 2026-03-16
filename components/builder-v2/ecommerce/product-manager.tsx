"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ComingSoonSection } from "@/components/ui/coming-soon-badge"
import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  Package,
  DollarSign,
  Truck,
  Tag,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Copy,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Percent,
  Box,
  Layers
} from "lucide-react"

// Product Types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  sku: string
  barcode?: string
  inventory: number
  trackInventory: boolean
  weight?: number
  weightUnit: "kg" | "lb" | "oz" | "g"
  images: string[]
  category: string
  tags: string[]
  status: "active" | "draft" | "archived"
  variants?: ProductVariant[]
  seo: {
    title: string
    description: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  inventory: number
  options: { name: string; value: string }[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  parentId?: string
}

interface ProductManagerProps {
  products: Product[]
  categories: Category[]
  onAddProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  onUpdateProduct: (id: string, updates: Partial<Product>) => void
  onDeleteProduct: (id: string) => void
}

// Stats Card Component
function StatCard({ title, value, change, icon: Icon, trend }: {
  title: string
  value: string
  change?: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className={cn(
                "text-xs",
                trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
              )}>
                {change}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductManager({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: ProductManagerProps) {
  const [activeTab, setActiveTab] = useState("products")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || product.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.status === "active").length
  const totalInventory = products.reduce((sum, p) => sum + p.inventory, 0)
  const lowStockProducts = products.filter((p) => p.inventory < 10 && p.inventory > 0).length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Ecommerce</h2>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm
                categories={categories}
                onSubmit={(product) => {
                  onAddProduct(product)
                  setIsAddDialogOpen(false)
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 border-b p-4">
        <StatCard
          title="Total Products"
          value={totalProducts.toString()}
          icon={Package}
        />
        <StatCard
          title="Active"
          value={activeProducts.toString()}
          change={`${Math.round((activeProducts / totalProducts) * 100)}% of total`}
          icon={CheckCircle2}
          trend="neutral"
        />
        <StatCard
          title="Total Inventory"
          value={totalInventory.toLocaleString()}
          icon={Box}
        />
        <StatCard
          title="Low Stock"
          value={lowStockProducts.toString()}
          change="Items need restock"
          icon={AlertCircle}
          trend={lowStockProducts > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <div className="border-b px-4">
          <TabsList className="bg-transparent">
            <TabsTrigger value="products" className="gap-1">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1">
              <Layers className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1">
              <Box className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-1">
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-1">
              <Truck className="h-4 w-4" />
              Shipping
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Products Tab */}
        <TabsContent value="products" className="flex-1 overflow-hidden p-0">
          <div className="flex h-full flex-col">
            {/* Filters */}
            <div className="flex items-center gap-4 border-b p-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
                        <p className="mt-2 text-muted-foreground">No products found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full rounded object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">${product.price.toFixed(2)}</p>
                            {product.compareAtPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                ${product.compareAtPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={product.inventory === 0 ? "destructive" : product.inventory < 10 ? "secondary" : "default"}
                          >
                            {product.inventory} in stock
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === "active"
                                ? "default"
                                : product.status === "draft"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => onDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Product Categories</h3>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
            {categories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Layers className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-2 text-muted-foreground">No categories yet</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Create your first category
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-full w-full rounded object-cover"
                            />
                          ) : (
                            <Layers className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">/{category.slug}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-4">
            <h3 className="font-medium">Inventory Management</h3>
            <Card>
              <CardContent className="p-4">
                <ComingSoonSection message="Inventory tracking and management features coming soon." />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-4">
            <h3 className="font-medium">Pricing Rules</h3>
            <Card>
              <CardContent className="p-4">
                <ComingSoonSection message="Pricing rules, discounts, and promotions coming soon." />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-zinc-500 scrollbar-track-zinc-800/50">
          <div className="space-y-4">
            <h3 className="font-medium">Shipping Options</h3>
            <Card>
              <CardContent className="p-4">
                <ComingSoonSection message="Shipping zones, rates, and carriers coming soon." />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Product Form Component
function ProductForm({
  product,
  categories,
  onSubmit,
  onCancel
}: {
  product?: Product
  categories: Category[]
  onSubmit: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice || undefined,
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    inventory: product?.inventory || 0,
    trackInventory: product?.trackInventory ?? true,
    weight: product?.weight || undefined,
    weightUnit: product?.weightUnit || "kg" as const,
    images: product?.images || [],
    category: product?.category || "",
    tags: product?.tags || [],
    status: product?.status || "draft" as const,
    seo: product?.seo || { title: "", description: "" }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Product Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter product description"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Price</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Compare at Price</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                value={formData.compareAtPrice || ""}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || undefined })}
                className="pl-9"
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="SKU-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Inventory</Label>
            <Input
              type="number"
              value={formData.inventory}
              onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "draft" | "archived") => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>Track Inventory</Label>
          <Switch
            checked={formData.trackInventory}
            onCheckedChange={(checked) => setFormData({ ...formData, trackInventory: checked })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {product ? "Update Product" : "Add Product"}
        </Button>
      </div>
    </form>
  )
}
