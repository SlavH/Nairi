"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Database,
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  Link,
  Image,
  File,
  Folder,
  Tag,
  Clock,
  User,
  Globe,
  Lock,
  Upload,
  Download,
  Copy,
  MoreVertical,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface InfoItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'url' | 'file' | 'image';
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  source?: string;
  status: 'active' | 'outdated' | 'archived';
}

interface Category {
  id: string;
  name: string;
  icon: any;
  count: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Items', icon: Database, count: 0 },
  { id: 'company', name: 'Company Info', icon: Folder, count: 0 },
  { id: 'products', name: 'Products', icon: FileText, count: 0 },
  { id: 'brand', name: 'Brand Guidelines', icon: Tag, count: 0 },
  { id: 'competitors', name: 'Competitors', icon: Globe, count: 0 },
  { id: 'resources', name: 'Resources', icon: Link, count: 0 },
];

export function Infobase() {
  const [items, setItems] = useState<InfoItem[]>([
    {
      id: '1',
      title: 'Company Mission Statement',
      content: 'Our mission is to democratize AI and make it accessible to everyone. We believe in building technology that empowers people to achieve more.',
      type: 'text',
      category: 'company',
      tags: ['mission', 'values', 'about'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      status: 'active'
    },
    {
      id: '2',
      title: 'Brand Voice Guidelines',
      content: 'Our brand voice is: Professional yet approachable, Innovative but not jargon-heavy, Helpful and empowering, Clear and concise.',
      type: 'text',
      category: 'brand',
      tags: ['voice', 'tone', 'writing'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      status: 'active'
    },
    {
      id: '3',
      title: 'Product Documentation',
      content: 'https://docs.example.com/api',
      type: 'url',
      category: 'products',
      tags: ['docs', 'api', 'reference'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      source: 'docs.example.com',
      status: 'active'
    }
  ]);
  
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InfoItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InfoItem>>({
    title: '',
    content: '',
    type: 'text',
    category: 'company',
    tags: [],
    isPublic: false
  });
  const [newTag, setNewTag] = useState('');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addItem = () => {
    if (!newItem.title || !newItem.content) return;
    
    const item: InfoItem = {
      id: Date.now().toString(),
      title: newItem.title,
      content: newItem.content,
      type: newItem.type || 'text',
      category: newItem.category || 'company',
      tags: newItem.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: newItem.isPublic || false,
      status: 'active'
    };
    
    setItems([...items, item]);
    setNewItem({
      title: '',
      content: '',
      type: 'text',
      category: 'company',
      tags: [],
      isPublic: false
    });
    setIsAddDialogOpen(false);
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const addTag = () => {
    if (!newTag || newItem.tags?.includes(newTag)) return;
    setNewItem({
      ...newItem,
      tags: [...(newItem.tags || []), newTag]
    });
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setNewItem({
      ...newItem,
      tags: newItem.tags?.filter(t => t !== tag)
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'url': return Link;
      case 'file': return File;
      case 'image': return Image;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'outdated': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Infobase
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your knowledge repository
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-1"
                onClick={() => setSelectedCategory(category.id)}
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
                <Badge variant="outline" className="ml-auto">
                  {items.filter(i => category.id === 'all' || i.category === category.id).length}
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add to Infobase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="Enter title..."
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newItem.type}
                      onValueChange={(value) => setNewItem({ ...newItem, type: value as InfoItem['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="file">File</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.id !== 'all').map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Content</Label>
                  <Textarea
                    placeholder={newItem.type === 'url' ? 'Enter URL...' : 'Enter content...'}
                    value={newItem.content}
                    onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {newItem.tags && newItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newItem.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Infobase
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search infobase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Items Grid */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const TypeIcon = getTypeIcon(item.type);
                return (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-colors ${
                      selectedItem?.id === item.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-primary/10">
                            <TypeIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{item.title}</CardTitle>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                          {item.isPublic ? (
                            <Globe className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.content}
                      </p>
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first item
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-80 border-l flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Details</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteItem(selectedItem.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedItem.title}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Content</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedItem.content}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Type</Label>
                <Badge variant="secondary" className="mt-1">
                  {selectedItem.type}
                </Badge>
              </div>

              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="text-sm mt-1 capitalize">{selectedItem.category}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedItem.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedItem.status)}`} />
                  <span className="text-sm capitalize">{selectedItem.status}</span>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">
                  {selectedItem.createdAt.toLocaleDateString()}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Updated</Label>
                <p className="text-sm mt-1">
                  {selectedItem.updatedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <Button className="w-full" variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Use in Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Infobase;
