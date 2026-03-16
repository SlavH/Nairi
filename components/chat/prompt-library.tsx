"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Star,
  StarOff,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  Share2,
  Download,
  Upload,
  Sparkles,
  Code,
  FileText,
  Briefcase,
  Palette,
  GraduationCap,
  MessageSquare,
  Zap,
  Globe,
  Heart,
  TrendingUp,
  Clock,
  Users,
  BookOpen,
  Lightbulb,
  Target,
  BarChart,
  Mail,
  PenTool
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: PromptCategory;
  tags: string[];
  isFavorite: boolean;
  isPublic: boolean;
  usageCount: number;
  author: string;
  createdAt: Date;
  variables?: string[];
}

type PromptCategory = 
  | 'writing'
  | 'coding'
  | 'analysis'
  | 'creative'
  | 'business'
  | 'education'
  | 'productivity'
  | 'custom';

const CATEGORY_CONFIG: Record<PromptCategory, { icon: any; label: string; color: string }> = {
  writing: { icon: PenTool, label: 'Writing', color: 'bg-blue-500' },
  coding: { icon: Code, label: 'Coding', color: 'bg-green-500' },
  analysis: { icon: BarChart, label: 'Analysis', color: 'bg-purple-500' },
  creative: { icon: Palette, label: 'Creative', color: 'bg-pink-500' },
  business: { icon: Briefcase, label: 'Business', color: 'bg-orange-500' },
  education: { icon: GraduationCap, label: 'Education', color: 'bg-cyan-500' },
  productivity: { icon: Zap, label: 'Productivity', color: 'bg-yellow-500' },
  custom: { icon: Sparkles, label: 'Custom', color: 'bg-gray-500' },
};

const SAMPLE_PROMPTS: PromptTemplate[] = [
  {
    id: '1',
    title: 'Code Review Expert',
    description: 'Get detailed code reviews with best practices and security suggestions',
    prompt: 'Act as a senior software engineer. Review the following code for:\n1. Code quality and readability\n2. Potential bugs or edge cases\n3. Performance optimizations\n4. Security vulnerabilities\n5. Best practices\n\nCode to review:\n{{code}}\n\nProvide specific, actionable feedback with examples.',
    category: 'coding',
    tags: ['code-review', 'best-practices', 'security'],
    isFavorite: true,
    isPublic: true,
    usageCount: 1523,
    author: 'Nairi Team',
    createdAt: new Date('2024-01-01'),
    variables: ['code']
  },
  {
    id: '2',
    title: 'Professional Email Writer',
    description: 'Craft professional emails for any business situation',
    prompt: 'Write a professional email with the following details:\n\nPurpose: {{purpose}}\nTone: {{tone}}\nKey points to include: {{key_points}}\nRecipient context: {{recipient}}\n\nMake it concise, clear, and actionable. Include a compelling subject line.',
    category: 'business',
    tags: ['email', 'professional', 'communication'],
    isFavorite: false,
    isPublic: true,
    usageCount: 2341,
    author: 'Nairi Team',
    createdAt: new Date('2024-01-05'),
    variables: ['purpose', 'tone', 'key_points', 'recipient']
  },
  {
    id: '3',
    title: 'Data Analysis Framework',
    description: 'Structured approach to analyzing any dataset',
    prompt: 'Analyze the following data using this framework:\n\n1. **Data Overview**: Summarize the dataset structure and key metrics\n2. **Patterns & Trends**: Identify significant patterns\n3. **Anomalies**: Flag any outliers or unusual data points\n4. **Insights**: Extract actionable insights\n5. **Recommendations**: Suggest next steps\n\nData:\n{{data}}\n\nContext: {{context}}',
    category: 'analysis',
    tags: ['data', 'analytics', 'insights'],
    isFavorite: true,
    isPublic: true,
    usageCount: 892,
    author: 'Nairi Team',
    createdAt: new Date('2024-01-10'),
    variables: ['data', 'context']
  },
  {
    id: '4',
    title: 'Creative Story Generator',
    description: 'Generate engaging stories with customizable elements',
    prompt: 'Write a {{genre}} story with the following elements:\n\nSetting: {{setting}}\nMain character: {{character}}\nConflict: {{conflict}}\nTone: {{tone}}\nLength: {{length}}\n\nMake it engaging with vivid descriptions and compelling dialogue.',
    category: 'creative',
    tags: ['story', 'fiction', 'creative-writing'],
    isFavorite: false,
    isPublic: true,
    usageCount: 1205,
    author: 'Nairi Team',
    createdAt: new Date('2024-01-15'),
    variables: ['genre', 'setting', 'character', 'conflict', 'tone', 'length']
  },
  {
    id: '5',
    title: 'Learning Path Creator',
    description: 'Create personalized learning paths for any topic',
    prompt: 'Create a comprehensive learning path for:\n\nTopic: {{topic}}\nCurrent level: {{level}}\nTime available: {{time}}\nLearning style: {{style}}\nGoal: {{goal}}\n\nInclude:\n- Prerequisites\n- Core concepts to master\n- Recommended resources (books, courses, tutorials)\n- Practice projects\n- Milestones and checkpoints\n- Estimated timeline',
    category: 'education',
    tags: ['learning', 'education', 'self-improvement'],
    isFavorite: true,
    isPublic: true,
    usageCount: 756,
    author: 'Nairi Team',
    createdAt: new Date('2024-01-20'),
    variables: ['topic', 'level', 'time', 'style', 'goal']
  },
  {
    id: '6',
    title: 'Meeting Summary & Action Items',
    description: 'Transform meeting notes into structured summaries',
    prompt: 'Transform these meeting notes into a structured summary:\n\nMeeting notes:\n{{notes}}\n\nProvide:\n1. **Executive Summary** (2-3 sentences)\n2. **Key Discussion Points**\n3. **Decisions Made**\n4. **Action Items** (with owners and deadlines)\n5. **Open Questions**\n6. **Next Steps**',
    category: 'productivity',
    tags: ['meetings', 'productivity', 'summary'],
    isFavorite: false,
    isPublic: true,
    usageCount: 1834,
    author: 'Nairi Team',
    createdAt: new Date('2024-01-25'),
    variables: ['notes']
  },
  {
    id: '7',
    title: 'Blog Post Outline',
    description: 'Create SEO-optimized blog post outlines',
    prompt: 'Create a detailed blog post outline for:\n\nTopic: {{topic}}\nTarget audience: {{audience}}\nKeyword focus: {{keywords}}\nDesired length: {{length}}\n\nInclude:\n- Compelling headline options (3-5)\n- Meta description\n- Introduction hook\n- Main sections with subheadings\n- Key points for each section\n- Call-to-action\n- Internal/external linking suggestions',
    category: 'writing',
    tags: ['blog', 'SEO', 'content'],
    isFavorite: false,
    isPublic: true,
    usageCount: 1456,
    author: 'Nairi Team',
    createdAt: new Date('2024-02-01'),
    variables: ['topic', 'audience', 'keywords', 'length']
  },
];

interface PromptLibraryProps {
  onSelectPrompt?: (prompt: string) => void;
}

export function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(SAMPLE_PROMPTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all' | 'favorites'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [newPrompt, setNewPrompt] = useState({
    title: '',
    description: '',
    prompt: '',
    category: 'custom' as PromptCategory,
    tags: '',
    isPublic: false
  });

  // Filter prompts
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategory === 'favorites') {
      return matchesSearch && prompt.isFavorite;
    }
    if (selectedCategory === 'all') {
      return matchesSearch;
    }
    return matchesSearch && prompt.category === selectedCategory;
  });

  const toggleFavorite = (id: string) => {
    setPrompts(prompts.map(p => 
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const copyPrompt = (prompt: PromptTemplate) => {
    navigator.clipboard.writeText(prompt.prompt);
    toast.success('Prompt copied to clipboard');
  };

  const usePrompt = (prompt: PromptTemplate) => {
    if (prompt.variables && prompt.variables.length > 0) {
      setSelectedPrompt(prompt);
      setVariableValues({});
    } else {
      onSelectPrompt?.(prompt.prompt);
      toast.success('Prompt added to chat');
    }
  };

  const applyPromptWithVariables = () => {
    if (!selectedPrompt) return;
    
    let finalPrompt = selectedPrompt.prompt;
    selectedPrompt.variables?.forEach(variable => {
      finalPrompt = finalPrompt.replace(
        new RegExp(`\\{\\{${variable}\\}\\}`, 'g'),
        variableValues[variable] || `[${variable}]`
      );
    });
    
    onSelectPrompt?.(finalPrompt);
    setSelectedPrompt(null);
    setVariableValues({});
    toast.success('Prompt added to chat');
  };

  const createPrompt = () => {
    if (!newPrompt.title || !newPrompt.prompt) return;
    
    // Extract variables from prompt ({{variable}})
    const variableMatches = newPrompt.prompt.match(/\{\{([^}]+)\}\}/g);
    const variables = variableMatches 
      ? variableMatches.map(v => v.replace(/\{\{|\}\}/g, ''))
      : [];
    
    const prompt: PromptTemplate = {
      id: Date.now().toString(),
      title: newPrompt.title,
      description: newPrompt.description,
      prompt: newPrompt.prompt,
      category: newPrompt.category,
      tags: newPrompt.tags.split(',').map(t => t.trim()).filter(Boolean),
      isFavorite: false,
      isPublic: newPrompt.isPublic,
      usageCount: 0,
      author: 'You',
      createdAt: new Date(),
      variables: variables.length > 0 ? variables : undefined
    };
    
    setPrompts([prompt, ...prompts]);
    setNewPrompt({ title: '', description: '', prompt: '', category: 'custom', tags: '', isPublic: false });
    setShowCreateDialog(false);
    toast.success('Prompt created successfully');
  };

  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
    toast.success('Prompt deleted');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Prompt Library</h2>
              <p className="text-sm text-muted-foreground">
                {prompts.length} prompts • {prompts.filter(p => p.isFavorite).length} favorites
              </p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500">
                <Plus className="h-4 w-4 mr-1" />
                Create Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Prompt</DialogTitle>
                <DialogDescription>
                  Create a reusable prompt template. Use {'{'}{'{'} variable {'}'}{'}'}  syntax for dynamic values.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Code Review Expert"
                    value={newPrompt.title}
                    onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief description of what this prompt does"
                    value={newPrompt.description}
                    onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Prompt Template</Label>
                  <Textarea
                    placeholder="Enter your prompt here. Use {{variable}} for dynamic values."
                    value={newPrompt.prompt}
                    onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                    className="mt-1 min-h-[150px] font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full mt-1 p-2 rounded-md border border-border bg-background"
                      value={newPrompt.category}
                      onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value as PromptCategory })}
                    >
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      placeholder="e.g., coding, review"
                      value={newPrompt.tags}
                      onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={createPrompt}>Create Prompt</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
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
              All
            </Button>
            <Button
              variant={selectedCategory === 'favorites' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('favorites')}
              className="whitespace-nowrap"
            >
              <Star className="h-3 w-3 mr-1" />
              Favorites
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key as PromptCategory)}
                  className="whitespace-nowrap"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Prompt List */}
      <ScrollArea className="flex-1 p-4">
        {filteredPrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No prompts found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term' : 'Create your first prompt to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPrompts.map((prompt) => {
              const categoryConfig = CATEGORY_CONFIG[prompt.category];
              const Icon = categoryConfig.icon;
              
              return (
                <Card key={prompt.id} className="group hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-md", categoryConfig.color)}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <CardTitle className="text-base">{prompt.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleFavorite(prompt.id)}
                        >
                          {prompt.isFavorite ? (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyPrompt(prompt)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deletePrompt(prompt.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      {prompt.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {prompt.variables && prompt.variables.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {prompt.variables.length} variables
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {prompt.usageCount.toLocaleString()}
                        </span>
                        <span>{prompt.author}</span>
                      </div>
                      <Button size="sm" onClick={() => usePrompt(prompt)}>
                        Use Prompt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Variable Input Dialog */}
      <Dialog open={!!selectedPrompt} onOpenChange={() => setSelectedPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fill in Variables</DialogTitle>
            <DialogDescription>
              Customize the prompt by filling in the variables below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPrompt?.variables?.map(variable => (
              <div key={variable}>
                <Label className="capitalize">{variable.replace(/_/g, ' ')}</Label>
                <Input
                  placeholder={`Enter ${variable.replace(/_/g, ' ')}...`}
                  value={variableValues[variable] || ''}
                  onChange={(e) => setVariableValues({ ...variableValues, [variable]: e.target.value })}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPrompt(null)}>Cancel</Button>
            <Button onClick={applyPromptWithVariables}>Apply Prompt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PromptLibrary;
