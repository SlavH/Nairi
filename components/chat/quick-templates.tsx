"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  Mail,
  MessageSquare,
  Code,
  Briefcase,
  GraduationCap,
  Sparkles,
  Copy,
  Star,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  PenTool,
  Megaphone,
  Users,
  BarChart,
  Lightbulb,
  CheckSquare
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  icon: any;
  uses: number;
  isFavorite: boolean;
  variables?: string[];
}

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'writing', label: 'Writing', icon: PenTool },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'social', label: 'Social Media', icon: Users },
  { id: 'analysis', label: 'Analysis', icon: BarChart },
];

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    title: 'Blog Post Outline',
    description: 'Generate a structured outline for a blog post',
    prompt: 'Create a detailed blog post outline about {{topic}}. Include an introduction, 5-7 main sections with subpoints, and a conclusion. Target audience: {{audience}}.',
    category: 'writing',
    icon: FileText,
    uses: 1250,
    isFavorite: true,
    variables: ['topic', 'audience']
  },
  {
    id: '2',
    title: 'Email Response',
    description: 'Professional email reply generator',
    prompt: 'Write a professional email response to the following message: {{email}}. Tone: {{tone}}. Key points to address: {{points}}.',
    category: 'email',
    icon: Mail,
    uses: 980,
    isFavorite: false,
    variables: ['email', 'tone', 'points']
  },
  {
    id: '3',
    title: 'Social Media Post',
    description: 'Create engaging social media content',
    prompt: 'Create a {{platform}} post about {{topic}}. Include relevant hashtags and a call-to-action. Tone: {{tone}}.',
    category: 'social',
    icon: MessageSquare,
    uses: 2100,
    isFavorite: true,
    variables: ['platform', 'topic', 'tone']
  },
  {
    id: '4',
    title: 'Code Review',
    description: 'Get AI-powered code review suggestions',
    prompt: 'Review the following {{language}} code and provide suggestions for improvement, potential bugs, and best practices:\n\n{{code}}',
    category: 'code',
    icon: Code,
    uses: 750,
    isFavorite: false,
    variables: ['language', 'code']
  },
  {
    id: '5',
    title: 'Marketing Copy',
    description: 'Generate compelling marketing copy',
    prompt: 'Write marketing copy for {{product}}. Target audience: {{audience}}. Key benefits: {{benefits}}. Desired action: {{cta}}.',
    category: 'marketing',
    icon: Megaphone,
    uses: 1500,
    isFavorite: true,
    variables: ['product', 'audience', 'benefits', 'cta']
  },
  {
    id: '6',
    title: 'Meeting Summary',
    description: 'Summarize meeting notes into action items',
    prompt: 'Summarize the following meeting notes into key points, decisions made, and action items with owners:\n\n{{notes}}',
    category: 'business',
    icon: CheckSquare,
    uses: 890,
    isFavorite: false,
    variables: ['notes']
  },
  {
    id: '7',
    title: 'Lesson Plan',
    description: 'Create educational lesson plans',
    prompt: 'Create a lesson plan for teaching {{subject}} to {{level}} students. Duration: {{duration}}. Learning objectives: {{objectives}}.',
    category: 'education',
    icon: GraduationCap,
    uses: 620,
    isFavorite: false,
    variables: ['subject', 'level', 'duration', 'objectives']
  },
  {
    id: '8',
    title: 'SWOT Analysis',
    description: 'Generate a SWOT analysis for any business',
    prompt: 'Perform a SWOT analysis for {{company}} in the {{industry}} industry. Consider current market conditions and competition.',
    category: 'analysis',
    icon: BarChart,
    uses: 540,
    isFavorite: false,
    variables: ['company', 'industry']
  },
  {
    id: '9',
    title: 'Product Description',
    description: 'Write compelling product descriptions',
    prompt: 'Write a compelling product description for {{product}}. Key features: {{features}}. Target customer: {{customer}}. Tone: {{tone}}.',
    category: 'marketing',
    icon: Lightbulb,
    uses: 1100,
    isFavorite: true,
    variables: ['product', 'features', 'customer', 'tone']
  },
  {
    id: '10',
    title: 'Story Starter',
    description: 'Get creative writing prompts and story starters',
    prompt: 'Write a creative story opening in the {{genre}} genre. Setting: {{setting}}. Main character: {{character}}. Mood: {{mood}}.',
    category: 'writing',
    icon: BookOpen,
    uses: 780,
    isFavorite: false,
    variables: ['genre', 'setting', 'character', 'mood']
  }
];

export function QuickTemplates({ onSelectTemplate }: { onSelectTemplate?: (prompt: string) => void }) {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const useTemplate = () => {
    if (!selectedTemplate) return;
    
    let prompt = selectedTemplate.prompt;
    Object.entries(variableValues).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
    });
    
    if (onSelectTemplate) {
      onSelectTemplate(prompt);
    }
    
    // Update uses count
    setTemplates(templates.map(t => 
      t.id === selectedTemplate.id ? { ...t, uses: t.uses + 1 } : t
    ));
    
    setSelectedTemplate(null);
    setVariableValues({});
  };

  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.prompt);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Templates
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ready-to-use prompts for common tasks
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="border-b">
        <ScrollArea className="w-full">
          <div className="flex gap-2 p-4">
            {TEMPLATE_CATEGORIES.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex-shrink-0"
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Templates List */}
        <ScrollArea className="flex-1 border-r">
          <div className="p-4 space-y-3">
            {/* Favorites Section */}
            {filteredTemplates.some(t => t.isFavorite) && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Favorites
                </h3>
                <div className="space-y-2">
                  {filteredTemplates.filter(t => t.isFavorite).map(template => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id ? 'border-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setVariableValues({});
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <template.icon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{template.title}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(template.id);
                            }}
                          >
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Templates */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                All Templates
              </h3>
              <div className="space-y-2">
                {filteredTemplates.filter(t => !t.isFavorite).map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? 'border-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setVariableValues({});
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <template.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{template.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(template.id);
                          }}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.uses} uses
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Template Detail */}
        {selectedTemplate && (
          <div className="w-96 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{selectedTemplate.title}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyTemplate(selectedTemplate)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {selectedTemplate.description}
            </p>

            {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-medium">Fill in the blanks:</h4>
                {selectedTemplate.variables.map(variable => (
                  <div key={variable}>
                    <label className="text-sm text-muted-foreground capitalize">
                      {variable.replace(/_/g, ' ')}
                    </label>
                    <Input
                      placeholder={`Enter ${variable}...`}
                      value={variableValues[variable] || ''}
                      onChange={(e) => setVariableValues({
                        ...variableValues,
                        [variable]: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="bg-muted p-3 rounded-lg mb-4 flex-1 overflow-auto">
              <h4 className="text-sm font-medium mb-2">Preview:</h4>
              <p className="text-sm whitespace-pre-wrap">
                {(() => {
                  let preview = selectedTemplate.prompt;
                  Object.entries(variableValues).forEach(([key, value]) => {
                    preview = preview.replace(
                      new RegExp(`{{${key}}}`, 'g'),
                      value || `[${key}]`
                    );
                  });
                  return preview;
                })()}
              </p>
            </div>

            <Button onClick={useTemplate} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Use Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickTemplates;
