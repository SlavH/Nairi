"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Brain,
  Plus,
  Search,
  Trash2,
  Edit,
  MoreVertical,
  User,
  Briefcase,
  Heart,
  MapPin,
  Calendar,
  Star,
  Tag,
  Clock,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Settings,
  History,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Memory types
interface Memory {
  id: string;
  content: string;
  category: MemoryCategory;
  source: 'user' | 'inferred' | 'conversation';
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  conversationId?: string;
  tags: string[];
}

type MemoryCategory = 
  | 'personal'
  | 'preferences'
  | 'work'
  | 'interests'
  | 'relationships'
  | 'location'
  | 'schedule'
  | 'goals'
  | 'custom';

interface MemoryStats {
  total: number;
  active: number;
  byCategory: Record<MemoryCategory, number>;
  lastUpdated: Date;
}

const CATEGORY_CONFIG: Record<MemoryCategory, { icon: any; label: string; color: string }> = {
  personal: { icon: User, label: 'Personal Info', color: 'bg-blue-500' },
  preferences: { icon: Star, label: 'Preferences', color: 'bg-yellow-500' },
  work: { icon: Briefcase, label: 'Work & Career', color: 'bg-purple-500' },
  interests: { icon: Heart, label: 'Interests', color: 'bg-pink-500' },
  relationships: { icon: User, label: 'Relationships', color: 'bg-green-500' },
  location: { icon: MapPin, label: 'Location', color: 'bg-orange-500' },
  schedule: { icon: Calendar, label: 'Schedule', color: 'bg-cyan-500' },
  goals: { icon: Lightbulb, label: 'Goals', color: 'bg-amber-500' },
  custom: { icon: Tag, label: 'Custom', color: 'bg-gray-500' },
};

// Sample memories for demo
const SAMPLE_MEMORIES: Memory[] = [
  {
    id: '1',
    content: 'Prefers concise, technical explanations over verbose descriptions',
    category: 'preferences',
    source: 'inferred',
    confidence: 0.92,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    isActive: true,
    tags: ['communication', 'style']
  },
  {
    id: '2',
    content: 'Works as a software engineer at a tech startup',
    category: 'work',
    source: 'user',
    confidence: 1.0,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    isActive: true,
    tags: ['career', 'tech']
  },
  {
    id: '3',
    content: 'Interested in AI, machine learning, and automation',
    category: 'interests',
    source: 'inferred',
    confidence: 0.88,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
    isActive: true,
    tags: ['technology', 'AI']
  },
  {
    id: '4',
    content: 'Located in San Francisco, California',
    category: 'location',
    source: 'user',
    confidence: 1.0,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    isActive: true,
    tags: ['location', 'timezone']
  },
  {
    id: '5',
    content: 'Prefers dark mode interfaces and minimal UI',
    category: 'preferences',
    source: 'inferred',
    confidence: 0.75,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    isActive: true,
    tags: ['UI', 'design']
  },
  {
    id: '6',
    content: 'Learning Rust programming language',
    category: 'goals',
    source: 'conversation',
    confidence: 0.85,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
    isActive: true,
    conversationId: 'conv-123',
    tags: ['learning', 'programming']
  },
];

export function MemoryManager() {
  const [memories, setMemories] = useState<Memory[]>(SAMPLE_MEMORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [isMemoryEnabled, setIsMemoryEnabled] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [newMemory, setNewMemory] = useState({ content: '', category: 'custom' as MemoryCategory, tags: '' });

  // Filter memories
  const filteredMemories = memories.filter(memory => {
    const matchesSearch = memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || memory.category === selectedCategory;
    return matchesSearch && matchesCategory && memory.isActive;
  });

  // Calculate stats
  const stats: MemoryStats = {
    total: memories.length,
    active: memories.filter(m => m.isActive).length,
    byCategory: Object.keys(CATEGORY_CONFIG).reduce((acc, cat) => {
      acc[cat as MemoryCategory] = memories.filter(m => m.category === cat && m.isActive).length;
      return acc;
    }, {} as Record<MemoryCategory, number>),
    lastUpdated: new Date(Math.max(...memories.map(m => m.updatedAt.getTime())))
  };

  const addMemory = () => {
    if (!newMemory.content.trim()) return;
    
    const memory: Memory = {
      id: Date.now().toString(),
      content: newMemory.content,
      category: newMemory.category,
      source: 'user',
      confidence: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      tags: newMemory.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    setMemories([memory, ...memories]);
    setNewMemory({ content: '', category: 'custom', tags: '' });
    setShowAddDialog(false);
    toast.success('Memory added successfully');
  };

  const deleteMemory = (id: string) => {
    setMemories(memories.map(m => m.id === id ? { ...m, isActive: false } : m));
    toast.success('Memory removed');
  };

  const updateMemory = (id: string, content: string) => {
    setMemories(memories.map(m => 
      m.id === id ? { ...m, content, updatedAt: new Date() } : m
    ));
    setEditingMemory(null);
    toast.success('Memory updated');
  };

  const clearAllMemories = () => {
    setMemories(memories.map(m => ({ ...m, isActive: false })));
    toast.success('All memories cleared');
  };

  const exportMemories = () => {
    const data = JSON.stringify(memories.filter(m => m.isActive), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nairi-memories.json';
    a.click();
    toast.success('Memories exported');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Memory</h2>
              <p className="text-sm text-muted-foreground">
                {stats.active} memories • Last updated {stats.lastUpdated.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <Switch
                id="memory-toggle"
                checked={isMemoryEnabled}
                onCheckedChange={setIsMemoryEnabled}
              />
              <Label htmlFor="memory-toggle" className="text-sm">
                {isMemoryEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={exportMemories}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Memory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Memory</DialogTitle>
                  <DialogDescription>
                    Add information you want Nairi to remember about you.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>What should I remember?</Label>
                    <Textarea
                      placeholder="e.g., I prefer Python over JavaScript for backend development"
                      value={newMemory.content}
                      onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full mt-1 p-2 rounded-md border border-border bg-background"
                      value={newMemory.category}
                      onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value as MemoryCategory })}
                    >
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      placeholder="e.g., coding, preferences"
                      value={newMemory.tags}
                      onChange={(e) => setNewMemory({ ...newMemory, tags: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button onClick={addMemory}>Add Memory</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="p-4 border-b border-border">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="whitespace-nowrap"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              All ({stats.active})
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const count = stats.byCategory[key as MemoryCategory];
              if (count === 0) return null;
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key as MemoryCategory)}
                  className="whitespace-nowrap"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label} ({count})
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Memory List */}
      <ScrollArea className="flex-1 p-4">
        {!isMemoryEnabled ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Memory is disabled</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enable memory to let Nairi remember information about you.
            </p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No memories found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term' : 'Add your first memory to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map((memory) => {
              const categoryConfig = CATEGORY_CONFIG[memory.category];
              const Icon = categoryConfig.icon;
              
              return (
                <Card key={memory.id} className="group hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("p-2 rounded-lg", categoryConfig.color)}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingMemory?.id === memory.id ? (
                            <div className="flex gap-2">
                              <Input
                                value={editingMemory.content}
                                onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                                className="flex-1"
                              />
                              <Button size="sm" onClick={() => updateMemory(memory.id, editingMemory.content)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingMemory(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm">{memory.content}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {categoryConfig.label}
                                </Badge>
                                {memory.source === 'inferred' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Inferred ({Math.round(memory.confidence * 100)}%)
                                  </Badge>
                                )}
                                {memory.source === 'user' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <User className="h-3 w-3 mr-1" />
                                    Added by you
                                  </Badge>
                                )}
                                {memory.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingMemory(memory)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteMemory(memory.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer with actions */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Your memories are private and encrypted</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearAllMemories} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MemoryManager;
