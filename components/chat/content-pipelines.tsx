"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Layers,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  Edit,
  Copy,
  ArrowRight,
  FileText,
  Image,
  Video,
  Mail,
  MessageSquare,
  Globe,
  Sparkles,
  Clock,
  CheckCircle,
  Loader2,
  MoreVertical,
  Zap,
  Target,
  Users,
  BarChart
} from "lucide-react";

interface PipelineStep {
  id: string;
  name: string;
  type: 'input' | 'generate' | 'transform' | 'review' | 'publish';
  config: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  runs: number;
  lastRun?: Date;
  outputType: string;
  category: string;
}

interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: number;
  outputs: string[];
  startedAt: Date;
  completedAt?: Date;
}

const STEP_TYPES = [
  { type: 'input', label: 'Input', icon: FileText, color: 'bg-blue-500' },
  { type: 'generate', label: 'Generate', icon: Sparkles, color: 'bg-purple-500' },
  { type: 'transform', label: 'Transform', icon: Zap, color: 'bg-yellow-500' },
  { type: 'review', label: 'Review', icon: CheckCircle, color: 'bg-green-500' },
  { type: 'publish', label: 'Publish', icon: Globe, color: 'bg-pink-500' },
];

const PIPELINE_TEMPLATES = [
  {
    id: 't1',
    name: 'Blog Content Pipeline',
    description: 'Generate SEO-optimized blog posts from topics',
    category: 'Content',
    outputType: 'Blog Post',
    steps: ['Topic Input', 'Research', 'Outline', 'Draft', 'SEO Optimize', 'Review', 'Publish']
  },
  {
    id: 't2',
    name: 'Social Media Campaign',
    description: 'Create multi-platform social content',
    category: 'Social',
    outputType: 'Social Posts',
    steps: ['Campaign Brief', 'Generate Posts', 'Create Images', 'Schedule']
  },
  {
    id: 't3',
    name: 'Email Sequence',
    description: 'Build automated email nurture sequences',
    category: 'Email',
    outputType: 'Email Series',
    steps: ['Audience Input', 'Email Strategy', 'Write Emails', 'A/B Variants', 'Review']
  },
  {
    id: 't4',
    name: 'Product Launch',
    description: 'Complete product launch content package',
    category: 'Marketing',
    outputType: 'Launch Kit',
    steps: ['Product Info', 'Press Release', 'Landing Page', 'Social Posts', 'Email Announce']
  },
];

export function ContentPipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: '1',
      name: 'Weekly Blog Pipeline',
      description: 'Automated weekly blog post generation',
      steps: [
        { id: 's1', name: 'Topic Selection', type: 'input', config: {}, status: 'completed' },
        { id: 's2', name: 'Research & Outline', type: 'generate', config: {}, status: 'completed' },
        { id: 's3', name: 'Draft Generation', type: 'generate', config: {}, status: 'running' },
        { id: 's4', name: 'SEO Optimization', type: 'transform', config: {}, status: 'pending' },
        { id: 's5', name: 'Editorial Review', type: 'review', config: {}, status: 'pending' },
        { id: 's6', name: 'Publish to CMS', type: 'publish', config: {}, status: 'pending' },
      ],
      status: 'active',
      runs: 12,
      lastRun: new Date(),
      outputType: 'Blog Post',
      category: 'Content'
    }
  ]);
  
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [currentRun, setCurrentRun] = useState<PipelineRun | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createFromTemplate = (template: typeof PIPELINE_TEMPLATES[0]) => {
    const newPipeline: Pipeline = {
      id: Date.now().toString(),
      name: template.name,
      description: template.description,
      steps: template.steps.map((step, i) => ({
        id: `s${i}`,
        name: step,
        type: i === 0 ? 'input' : i === template.steps.length - 1 ? 'publish' : 'generate',
        config: {},
        status: 'pending' as const
      })),
      status: 'draft',
      runs: 0,
      outputType: template.outputType,
      category: template.category
    };
    
    setPipelines([...pipelines, newPipeline]);
    setSelectedPipeline(newPipeline);
    setIsCreating(false);
  };

  const runPipeline = (pipeline: Pipeline) => {
    const run: PipelineRun = {
      id: Date.now().toString(),
      pipelineId: pipeline.id,
      status: 'running',
      progress: 0,
      currentStep: 0,
      outputs: [],
      startedAt: new Date()
    };
    
    setCurrentRun(run);
    
    // Simulate pipeline execution
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = (step / pipeline.steps.length) * 100;
      
      setCurrentRun(prev => prev ? {
        ...prev,
        progress,
        currentStep: step,
        status: step >= pipeline.steps.length ? 'completed' : 'running'
      } : null);
      
      // Update step statuses
      setPipelines(prev => prev.map(p => {
        if (p.id !== pipeline.id) return p;
        return {
          ...p,
          steps: p.steps.map((s, i) => ({
            ...s,
            status: i < step ? 'completed' : i === step ? 'running' : 'pending'
          })),
          runs: step >= pipeline.steps.length ? p.runs + 1 : p.runs,
          lastRun: step >= pipeline.steps.length ? new Date() : p.lastRun,
          status: step >= pipeline.steps.length ? 'completed' : 'active'
        };
      }));
      
      if (step >= pipeline.steps.length) {
        clearInterval(interval);
      }
    }, 1500);
  };

  const deletePipeline = (id: string) => {
    setPipelines(pipelines.filter(p => p.id !== id));
    if (selectedPipeline?.id === id) {
      setSelectedPipeline(null);
    }
  };

  const getStepIcon = (type: string) => {
    return STEP_TYPES.find(s => s.type === type)?.icon || Zap;
  };

  const getStepColor = (type: string) => {
    return STEP_TYPES.find(s => s.type === type)?.color || 'bg-gray-500';
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Content Pipelines
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automated content workflows
          </p>
        </div>

        <div className="p-4 border-b">
          <Button className="w-full" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Pipeline
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {pipelines.map(pipeline => (
              <Card
                key={pipeline.id}
                className={`cursor-pointer transition-colors ${
                  selectedPipeline?.id === pipeline.id ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setSelectedPipeline(pipeline);
                  setIsCreating(false);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{pipeline.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pipeline.steps.length} steps
                      </p>
                    </div>
                    <Badge variant={
                      pipeline.status === 'active' ? 'default' :
                      pipeline.status === 'completed' ? 'secondary' : 'outline'
                    }>
                      {pipeline.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart className="h-3 w-3" />
                      {pipeline.runs} runs
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {pipeline.outputType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {isCreating ? (
          <div className="flex-1 p-6">
            <h3 className="text-lg font-semibold mb-6">Choose a Template</h3>
            <div className="grid grid-cols-2 gap-4">
              {PIPELINE_TEMPLATES.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => createFromTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{template.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {template.steps.length} steps
                      </span>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {template.steps.slice(0, 4).map((step, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {step}
                        </Badge>
                      ))}
                      {template.steps.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.steps.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : selectedPipeline ? (
          <>
            {/* Pipeline Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedPipeline.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPipeline.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => runPipeline(selectedPipeline)}
                    disabled={currentRun?.status === 'running'}
                  >
                    {currentRun?.status === 'running' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" /> Run Pipeline</>
                    )}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deletePipeline(selectedPipeline.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {currentRun && currentRun.pipelineId === selectedPipeline.id && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Step {currentRun.currentStep} of {selectedPipeline.steps.length}</span>
                    <span>{Math.round(currentRun.progress)}%</span>
                  </div>
                  <Progress value={currentRun.progress} />
                </div>
              )}
            </div>

            {/* Pipeline Steps */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="space-y-4">
                  {selectedPipeline.steps.map((step, index) => {
                    const StepIcon = getStepIcon(step.type);
                    const stepColor = getStepColor(step.type);
                    
                    return (
                      <div key={step.id} className="flex items-start gap-4">
                        {/* Step Number & Line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${stepColor} ${
                            step.status === 'completed' ? 'opacity-100' :
                            step.status === 'running' ? 'animate-pulse' : 'opacity-50'
                          }`}>
                            {step.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : step.status === 'running' ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <StepIcon className="h-5 w-5" />
                            )}
                          </div>
                          {index < selectedPipeline.steps.length - 1 && (
                            <div className={`w-0.5 h-12 ${
                              step.status === 'completed' ? 'bg-primary' : 'bg-muted'
                            }`} />
                          )}
                        </div>
                        
                        {/* Step Content */}
                        <Card className={`flex-1 ${
                          step.status === 'running' ? 'border-primary' : ''
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{step.name}</h4>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {step.type} step
                                </p>
                              </div>
                              <Badge variant={
                                step.status === 'completed' ? 'default' :
                                step.status === 'running' ? 'secondary' : 'outline'
                              }>
                                {step.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a pipeline or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentPipelines;
