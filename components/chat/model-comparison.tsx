"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Settings,
  Sparkles,
  Zap,
  Clock,
  DollarSign,
  BarChart,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Bot,
  Brain,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  color: string;
  description: string;
  strengths: string[];
  speed: 'fast' | 'medium' | 'slow';
  cost: 'low' | 'medium' | 'high';
  contextWindow: string;
  isEnabled: boolean;
}

interface ModelResponse {
  modelId: string;
  content: string;
  isLoading: boolean;
  error?: string;
  metrics: {
    latency: number;
    tokens: number;
    cost: number;
  };
  rating?: 'up' | 'down';
}

const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    icon: '🟢',
    color: 'border-green-500',
    description: 'Most capable OpenAI model',
    strengths: ['Reasoning', 'Coding', 'Analysis'],
    speed: 'medium',
    cost: 'high',
    contextWindow: '128K',
    isEnabled: true
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    icon: '🟠',
    color: 'border-orange-500',
    description: 'Best balance of speed and intelligence',
    strengths: ['Writing', 'Analysis', 'Coding'],
    speed: 'fast',
    cost: 'medium',
    contextWindow: '200K',
    isEnabled: true
  },
  {
    id: 'gemini-2-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    icon: '🔵',
    color: 'border-blue-500',
    description: 'Fast multimodal model',
    strengths: ['Speed', 'Multimodal', 'Reasoning'],
    speed: 'fast',
    cost: 'low',
    contextWindow: '1M',
    isEnabled: true
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    provider: 'Meta',
    icon: '🟣',
    color: 'border-purple-500',
    description: 'Open source powerhouse',
    strengths: ['Open Source', 'Coding', 'General'],
    speed: 'medium',
    cost: 'low',
    contextWindow: '8K',
    isEnabled: false
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    icon: '🔴',
    color: 'border-red-500',
    description: 'European AI excellence',
    strengths: ['Multilingual', 'Reasoning', 'Coding'],
    speed: 'fast',
    cost: 'medium',
    contextWindow: '32K',
    isEnabled: false
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    icon: '⚪',
    color: 'border-gray-500',
    description: 'Cost-effective reasoning',
    strengths: ['Coding', 'Math', 'Reasoning'],
    speed: 'medium',
    cost: 'low',
    contextWindow: '64K',
    isEnabled: false
  },
];

export function ModelComparison() {
  const [models, setModels] = useState<AIModel[]>(AVAILABLE_MODELS);
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const enabledModels = models.filter(m => m.isEnabled);

  const toggleModel = (modelId: string) => {
    setModels(models.map(m => 
      m.id === modelId ? { ...m, isEnabled: !m.isEnabled } : m
    ));
  };

  const runComparison = async () => {
    if (!prompt.trim() || enabledModels.length === 0) return;
    
    setIsComparing(true);
    
    // Initialize responses for all enabled models
    const initialResponses: ModelResponse[] = enabledModels.map(model => ({
      modelId: model.id,
      content: '',
      isLoading: true,
      metrics: { latency: 0, tokens: 0, cost: 0 }
    }));
    setResponses(initialResponses);

    // Simulate API calls to each model (in real implementation, these would be actual API calls)
    for (const model of enabledModels) {
      const startTime = Date.now();
      
      try {
        // Simulated response - in production, call actual API
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const latency = Date.now() - startTime;
        const tokens = Math.floor(100 + Math.random() * 400);
        const costPerToken = model.cost === 'high' ? 0.00003 : model.cost === 'medium' ? 0.00001 : 0.000003;
        
        // Simulated response content
        const responseContent = generateSimulatedResponse(model, prompt);
        
        setResponses(prev => prev.map(r => 
          r.modelId === model.id 
            ? {
                ...r,
                content: responseContent,
                isLoading: false,
                metrics: {
                  latency,
                  tokens,
                  cost: tokens * costPerToken
                }
              }
            : r
        ));
      } catch (error) {
        setResponses(prev => prev.map(r => 
          r.modelId === model.id 
            ? { ...r, isLoading: false, error: 'Failed to get response' }
            : r
        ));
      }
    }
    
    setIsComparing(false);
  };

  const generateSimulatedResponse = (model: AIModel, userPrompt: string): string => {
    // This is a simulation - in production, call actual APIs
    const responses: Record<string, string> = {
      'gpt-4o': `**GPT-4o Response:**\n\nI'll analyze your request carefully.\n\n${userPrompt.length > 50 ? 'This is a comprehensive query that requires detailed analysis.' : 'Let me provide a concise answer.'}\n\n**Key Points:**\n1. First consideration based on the context\n2. Secondary analysis with supporting details\n3. Practical recommendations\n\n*This response demonstrates GPT-4o's analytical capabilities and structured thinking.*`,
      'claude-3-5-sonnet': `I'd be happy to help with that!\n\n${userPrompt.length > 50 ? 'This is an interesting and nuanced question.' : 'Here\'s a direct answer:'}\n\nLet me break this down:\n\n• **Understanding**: First, let's establish the core concepts\n• **Analysis**: Examining the key factors involved\n• **Recommendation**: Based on my analysis\n\nI hope this helps! Let me know if you'd like me to elaborate on any point.`,
      'gemini-2-flash': `Here's my analysis:\n\n${userPrompt}\n\n**Quick Summary:**\n- Point 1: Key insight from the query\n- Point 2: Supporting information\n- Point 3: Actionable recommendation\n\n💡 **Pro tip:** Consider these additional factors for a complete picture.\n\n*Generated with Gemini 2.0 Flash - optimized for speed and accuracy.*`,
      'llama-3-70b': `## Response\n\nBased on your query, here's my analysis:\n\n### Overview\n${userPrompt.substring(0, 100)}...\n\n### Details\n- Analysis point 1\n- Analysis point 2\n- Analysis point 3\n\n### Conclusion\nThis response was generated by Llama 3 70B, an open-source model.`,
      'mistral-large': `Voici mon analyse:\n\n**Réponse:**\n\n${userPrompt.length > 30 ? 'Cette question mérite une réponse détaillée.' : 'Voici une réponse concise.'}\n\n1. Premier point d'analyse\n2. Deuxième considération\n3. Recommandation finale\n\n*Mistral Large - Excellence européenne en IA*`,
      'deepseek-v3': `**DeepSeek V3 Analysis:**\n\n\`\`\`\nProcessing query: ${userPrompt.substring(0, 50)}...\n\`\`\`\n\n**Findings:**\n1. Technical analysis complete\n2. Reasoning chain validated\n3. Output generated\n\n**Result:** Comprehensive response based on deep reasoning capabilities.`
    };
    
    return responses[model.id] || `Response from ${model.name}: Analysis of "${userPrompt.substring(0, 50)}..."`;
  };

  const rateResponse = (modelId: string, rating: 'up' | 'down') => {
    setResponses(prev => prev.map(r => 
      r.modelId === modelId ? { ...r, rating } : r
    ));
    toast.success(`Feedback recorded for ${models.find(m => m.id === modelId)?.name}`);
  };

  const copyResponse = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Response copied to clipboard');
  };

  const resetComparison = () => {
    setResponses([]);
    setPrompt('');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <BarChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Model Comparison</h2>
              <p className="text-sm text-muted-foreground">
                Compare responses from {enabledModels.length} AI models side-by-side
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Models
            </Button>
            {responses.length > 0 && (
              <Button variant="outline" size="sm" onClick={resetComparison}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Model Selection */}
        {showSettings && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {models.map(model => (
                  <div
                    key={model.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      model.isEnabled 
                        ? `${model.color} bg-accent/50` 
                        : "border-border hover:border-muted-foreground/50"
                    )}
                    onClick={() => toggleModel(model.id)}
                  >
                    <Checkbox checked={model.isEnabled} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{model.icon}</span>
                        <span className="font-medium text-sm truncate">{model.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{model.provider}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prompt Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Enter your prompt to compare across models..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                runComparison();
              }
            }}
          />
          <Button
            onClick={runComparison}
            disabled={isComparing || !prompt.trim() || enabledModels.length === 0}
            className="h-auto bg-gradient-to-r from-indigo-500 to-purple-500"
          >
            {isComparing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Ctrl+Enter to compare • {enabledModels.length} models selected
        </p>
      </div>

      {/* Responses Grid */}
      <ScrollArea className="flex-1 p-4">
        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="flex gap-2 mb-4">
              {enabledModels.slice(0, 3).map(model => (
                <div key={model.id} className="text-3xl">{model.icon}</div>
              ))}
            </div>
            <h3 className="text-lg font-medium">Compare AI Models</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Enter a prompt above to see how different AI models respond.
              Compare quality, speed, and style side-by-side.
            </p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-4",
            expandedModel ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
          )}>
            {responses
              .filter(r => !expandedModel || r.modelId === expandedModel)
              .map(response => {
                const model = models.find(m => m.id === response.modelId)!;
                
                return (
                  <Card 
                    key={response.modelId} 
                    className={cn(
                      "flex flex-col",
                      model.color,
                      expandedModel === response.modelId && "col-span-full"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{model.icon}</span>
                          <div>
                            <CardTitle className="text-sm">{model.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{model.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setExpandedModel(
                              expandedModel === response.modelId ? null : response.modelId
                            )}
                          >
                            {expandedModel === response.modelId ? (
                              <Minimize2 className="h-3.5 w-3.5" />
                            ) : (
                              <Maximize2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      {response.isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Generating response...</p>
                        </div>
                      ) : response.error ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8">
                          <XCircle className="h-8 w-8 text-destructive mb-2" />
                          <p className="text-sm text-destructive">{response.error}</p>
                        </div>
                      ) : (
                        <>
                          <ScrollArea className={cn(
                            "flex-1 rounded-md bg-muted/50 p-3",
                            expandedModel ? "max-h-[400px]" : "max-h-[200px]"
                          )}>
                            <div className="text-sm whitespace-pre-wrap">
                              {response.content}
                            </div>
                          </ScrollArea>
                          
                          {/* Metrics */}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {(response.metrics.latency / 1000).toFixed(1)}s
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {response.metrics.tokens} tokens
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${response.metrics.cost.toFixed(4)}
                            </span>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-1">
                              <Button
                                variant={response.rating === 'up' ? 'default' : 'ghost'}
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => rateResponse(response.modelId, 'up')}
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant={response.rating === 'down' ? 'default' : 'ghost'}
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => rateResponse(response.modelId, 'down')}
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyResponse(response.content)}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </ScrollArea>

      {/* Summary Footer */}
      {responses.length > 0 && responses.every(r => !r.isLoading) && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>
                Fastest: {models.find(m => m.id === responses.reduce((a, b) => 
                  a.metrics.latency < b.metrics.latency ? a : b
                ).modelId)?.name}
              </span>
              <span>
                Cheapest: {models.find(m => m.id === responses.reduce((a, b) => 
                  a.metrics.cost < b.metrics.cost ? a : b
                ).modelId)?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelComparison;