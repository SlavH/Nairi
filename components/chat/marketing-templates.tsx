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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Megaphone,
  Search,
  Star,
  FileText,
  Mail,
  MessageSquare,
  Image,
  Video,
  Globe,
  Target,
  Users,
  TrendingUp,
  Sparkles,
  Copy,
  Download,
  Share2,
  Bookmark,
  Clock,
  Zap,
  PenTool,
  BarChart,
  ShoppingCart,
  Newspaper,
  Mic,
  Play
} from "lucide-react";

interface MarketingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  icon: any;
  fields: TemplateField[];
  example: string;
  uses: number;
  isFavorite: boolean;
}

interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select';
  placeholder: string;
  options?: string[];
  required: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Megaphone },
  { id: 'ads', name: 'Advertising', icon: Target },
  { id: 'social', name: 'Social Media', icon: MessageSquare },
  { id: 'email', name: 'Email Marketing', icon: Mail },
  { id: 'content', name: 'Content Marketing', icon: FileText },
  { id: 'seo', name: 'SEO', icon: TrendingUp },
  { id: 'video', name: 'Video Scripts', icon: Video },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
  { id: 'pr', name: 'PR & Press', icon: Newspaper },
];

const TEMPLATES: MarketingTemplate[] = [
  {
    id: '1',
    name: 'Facebook Ad Copy',
    description: 'High-converting Facebook ad copy with hook, body, and CTA',
    category: 'ads',
    subcategory: 'Facebook',
    icon: Target,
    fields: [
      { id: 'product', name: 'Product/Service', type: 'text', placeholder: 'e.g., Online Course', required: true },
      { id: 'audience', name: 'Target Audience', type: 'text', placeholder: 'e.g., Entrepreneurs', required: true },
      { id: 'benefit', name: 'Main Benefit', type: 'text', placeholder: 'e.g., Save 10 hours/week', required: true },
      { id: 'tone', name: 'Tone', type: 'select', placeholder: 'Select tone', options: ['Professional', 'Casual', 'Urgent', 'Friendly'], required: true },
    ],
    example: '🚀 Tired of wasting hours on manual tasks?\n\nOur AI automation tool helps entrepreneurs save 10+ hours every week...\n\n✅ Easy setup\n✅ No coding required\n✅ 24/7 support\n\nClick below to start your free trial →',
    uses: 15420,
    isFavorite: true
  },
  {
    id: '2',
    name: 'Google Ads Headlines',
    description: 'Generate multiple headline variations for Google Ads',
    category: 'ads',
    subcategory: 'Google',
    icon: Target,
    fields: [
      { id: 'product', name: 'Product/Service', type: 'text', placeholder: 'e.g., CRM Software', required: true },
      { id: 'keyword', name: 'Target Keyword', type: 'text', placeholder: 'e.g., best CRM', required: true },
      { id: 'usp', name: 'Unique Selling Point', type: 'text', placeholder: 'e.g., Free forever plan', required: true },
    ],
    example: '1. Best CRM Software 2024 | Free Forever Plan\n2. #1 Rated CRM for Small Business\n3. Try Our CRM Free - No Credit Card',
    uses: 12300,
    isFavorite: false
  },
  {
    id: '3',
    name: 'Instagram Caption',
    description: 'Engaging Instagram captions with hashtags',
    category: 'social',
    subcategory: 'Instagram',
    icon: MessageSquare,
    fields: [
      { id: 'topic', name: 'Post Topic', type: 'text', placeholder: 'e.g., Product launch', required: true },
      { id: 'mood', name: 'Mood/Vibe', type: 'select', placeholder: 'Select mood', options: ['Inspirational', 'Fun', 'Educational', 'Behind-the-scenes'], required: true },
      { id: 'cta', name: 'Call to Action', type: 'text', placeholder: 'e.g., Link in bio', required: false },
    ],
    example: '✨ Big news dropping tomorrow...\n\nWe\'ve been working on something special for months, and we can\'t wait to share it with you! 🎉\n\nDrop a 🔥 if you\'re ready!\n\n#newproduct #launch #excited #comingsoon',
    uses: 9800,
    isFavorite: true
  },
  {
    id: '4',
    name: 'Email Subject Lines',
    description: 'A/B test-ready email subject lines',
    category: 'email',
    subcategory: 'Subject Lines',
    icon: Mail,
    fields: [
      { id: 'purpose', name: 'Email Purpose', type: 'select', placeholder: 'Select purpose', options: ['Promotion', 'Newsletter', 'Welcome', 'Re-engagement', 'Announcement'], required: true },
      { id: 'offer', name: 'Main Offer/Topic', type: 'text', placeholder: 'e.g., 50% off sale', required: true },
      { id: 'urgency', name: 'Urgency Level', type: 'select', placeholder: 'Select urgency', options: ['Low', 'Medium', 'High', 'FOMO'], required: true },
    ],
    example: '1. ⏰ Last chance: 50% off ends tonight\n2. You\'re missing out on half-price everything\n3. [Name], your exclusive deal expires in 3 hours\n4. Don\'t open this email (unless you want 50% off)',
    uses: 8500,
    isFavorite: false
  },
  {
    id: '5',
    name: 'Blog Post Outline',
    description: 'SEO-optimized blog post structure',
    category: 'content',
    subcategory: 'Blog',
    icon: FileText,
    fields: [
      { id: 'topic', name: 'Blog Topic', type: 'text', placeholder: 'e.g., How to start a podcast', required: true },
      { id: 'keyword', name: 'Target Keyword', type: 'text', placeholder: 'e.g., start a podcast', required: true },
      { id: 'audience', name: 'Target Audience', type: 'text', placeholder: 'e.g., Beginners', required: true },
      { id: 'length', name: 'Content Length', type: 'select', placeholder: 'Select length', options: ['Short (500-800)', 'Medium (1000-1500)', 'Long (2000+)'], required: true },
    ],
    example: '# How to Start a Podcast in 2024: Complete Guide\n\n## Introduction\n- Hook: Why podcasting is booming\n- What you\'ll learn\n\n## 1. Choose Your Niche\n...',
    uses: 7200,
    isFavorite: true
  },
  {
    id: '6',
    name: 'Product Description',
    description: 'Compelling e-commerce product descriptions',
    category: 'ecommerce',
    subcategory: 'Products',
    icon: ShoppingCart,
    fields: [
      { id: 'product', name: 'Product Name', type: 'text', placeholder: 'e.g., Wireless Earbuds', required: true },
      { id: 'features', name: 'Key Features', type: 'textarea', placeholder: 'List main features...', required: true },
      { id: 'audience', name: 'Target Customer', type: 'text', placeholder: 'e.g., Fitness enthusiasts', required: true },
      { id: 'tone', name: 'Brand Tone', type: 'select', placeholder: 'Select tone', options: ['Premium', 'Casual', 'Technical', 'Fun'], required: true },
    ],
    example: '🎧 ProSound X3 Wireless Earbuds\n\nExperience crystal-clear audio wherever life takes you...\n\n✓ 40-hour battery life\n✓ Active noise cancellation\n✓ IPX7 waterproof\n✓ Premium comfort fit',
    uses: 6800,
    isFavorite: false
  },
  {
    id: '7',
    name: 'Press Release',
    description: 'Professional press release format',
    category: 'pr',
    subcategory: 'Announcements',
    icon: Newspaper,
    fields: [
      { id: 'headline', name: 'Announcement', type: 'text', placeholder: 'e.g., New product launch', required: true },
      { id: 'company', name: 'Company Name', type: 'text', placeholder: 'e.g., Acme Inc', required: true },
      { id: 'details', name: 'Key Details', type: 'textarea', placeholder: 'Main points to cover...', required: true },
      { id: 'quote', name: 'Executive Quote', type: 'textarea', placeholder: 'Quote from CEO/spokesperson', required: false },
    ],
    example: 'FOR IMMEDIATE RELEASE\n\nAcme Inc Launches Revolutionary AI Platform\n\nSAN FRANCISCO, CA - Acme Inc today announced...',
    uses: 4500,
    isFavorite: false
  },
  {
    id: '8',
    name: 'Video Script',
    description: 'YouTube/TikTok video script with hooks',
    category: 'video',
    subcategory: 'YouTube',
    icon: Video,
    fields: [
      { id: 'topic', name: 'Video Topic', type: 'text', placeholder: 'e.g., 5 productivity tips', required: true },
      { id: 'length', name: 'Video Length', type: 'select', placeholder: 'Select length', options: ['Short (< 1 min)', 'Medium (3-5 min)', 'Long (10+ min)'], required: true },
      { id: 'style', name: 'Content Style', type: 'select', placeholder: 'Select style', options: ['Educational', 'Entertainment', 'Tutorial', 'Vlog'], required: true },
    ],
    example: '[HOOK - 0:00]\n"Stop wasting 3 hours every day on tasks that should take 30 minutes..."\n\n[INTRO - 0:10]\nHey everyone, today I\'m sharing 5 productivity hacks...\n\n[MAIN CONTENT]\n...',
    uses: 5600,
    isFavorite: true
  },
];

export function MarketingTemplates() {
  const [templates, setTemplates] = useState<MarketingTemplate[]>(TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MarketingTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string) => {
    setTemplates(templates.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const generateContent = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let content = selectedTemplate.example;
    Object.entries(fieldValues).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\[${key}\\]`, 'gi'), value);
    });
    
    setGeneratedContent(content);
    setIsGenerating(false);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Marketing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Templates & generators
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {CATEGORIES.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-1"
                onClick={() => setSelectedCategory(category.id)}
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Template List */}
      <div className="w-80 border-r flex flex-col">
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

        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredTemplates.map(template => (
              <Card
                key={template.id}
                className={`mb-2 cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setSelectedTemplate(template);
                  setFieldValues({});
                  setGeneratedContent('');
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <template.icon className="h-4 w-4 text-primary" />
                      <h3 className="font-medium text-sm">{template.name}</h3>
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
                      <Star className={`h-4 w-4 ${
                        template.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                      }`} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {template.subcategory}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.uses.toLocaleString()} uses
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Template Editor */}
      {selectedTemplate ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <selectedTemplate.icon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedTemplate.description}
            </p>
          </div>

          <div className="flex-1 flex">
            {/* Input Fields */}
            <div className="w-1/2 border-r p-4 overflow-auto">
              <h4 className="font-medium mb-4">Fill in the details</h4>
              <div className="space-y-4">
                {selectedTemplate.fields.map(field => (
                  <div key={field.id}>
                    <Label>
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => setFieldValues({
                          ...fieldValues,
                          [field.id]: e.target.value
                        })}
                        className="mt-1"
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        value={fieldValues[field.id] || ''}
                        onValueChange={(value) => setFieldValues({
                          ...fieldValues,
                          [field.id]: value
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => setFieldValues({
                          ...fieldValues,
                          [field.id]: e.target.value
                        })}
                        className="mt-1"
                      />
                    )}
                  </div>
                ))}

                <Button
                  className="w-full"
                  onClick={generateContent}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Generate Content</>
                  )}
                </Button>
              </div>
            </div>

            {/* Output */}
            <div className="w-1/2 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Generated Content</h4>
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyContent}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                )}
              </div>
              
              {generatedContent ? (
                <div className="flex-1 bg-muted rounded-lg p-4 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                </div>
              ) : (
                <div className="flex-1 bg-muted rounded-lg p-4 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Fill in the fields and click Generate</p>
                  </div>
                </div>
              )}

              {/* Example */}
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Example Output</h5>
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <pre className="whitespace-pre-wrap">{selectedTemplate.example}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a template to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingTemplates;
