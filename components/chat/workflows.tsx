"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Workflow,
  Play,
  Pause,
  Plus,
  Trash2,
  Copy,
  Settings,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText,
  Mail,
  MessageSquare,
  Image,
  Globe,
  Database,
  Code,
  Sparkles,
  MoreVertical,
  Edit,
  History
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: 'input' | 'ai' | 'output' | 'condition' | 'loop';
  name: string;
  config: Record<string, any>;
}

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'draft';
  runs: number;
  lastRun?: Date;
  schedule?: string;
  category: string;
}

const STEP_TYPES = [
  { type: 'input', icon: FileText, label: 'Input', color: 'bg-blue-500' },
  { type: 'ai', icon: Sparkles, label: 'AI Action', color: 'bg-purple-500' },
  { type: 'output', icon: Mail, label: 'Output', color: 'bg-green-500' },
  { type: 'condition', icon: Zap, label: 'Condition', color: 'bg-yellow-500' },
  { type: 'loop', icon: History, label: 'Loop', color: 'bg-orange-500' },
];

const TEMPLATES = [
  {
    id: '1',
    name: 'Blog Post Generator',
    description: 'Generate SEO-optimized blog posts from topics',
    category: 'Content',
    steps: 4
  },
  {
    id: '2',
    name: 'Email Campaign',
    description: 'Create personalized email sequences',
    category: 'Marketing',
    steps: 5
  },
  {
    id: '3',
    name: 'Social Media Scheduler',
    description: 'Generate and schedule social posts',
    category: 'Social',
    steps: 6
  },
  {
    id: '4',
    name: 'Code Review Assistant',
    description: 'Automated code review and suggestions',
    category: 'Development',
    steps: 3
  },
  {
    id: '5',
    name: 'Research Summary',
    description: 'Summarize research papers and articles',
    category: 'Research',
    steps: 4
  }
];

export function Workflows() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([
    {
      id: '1',
      name: 'Daily Content Pipeline',
      description: 'Generate daily blog posts and social media content',
      steps: [
        { id: '1', type: 'input', name: 'Topic Input', config: {} },
        { id: '2', type: 'ai', name: 'Generate Blog', config: { model: 'bitnet' } },
        { id: '3', type: 'ai', name: 'Create Social Posts', config: {} },
        { id: '4', type: 'output', name: 'Save to CMS', config: {} }
      ],
      status: 'active',
      runs: 45,
      lastRun: new Date(),
      schedule: 'Daily at 9:00 AM',
      category: 'Content'
    }
  ]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');

  const createWorkflow = (template?: typeof TEMPLATES[0]) => {
    const newWorkflow: WorkflowItem = {
      id: Date.now().toString(),
      name: template?.name || newWorkflowName || 'New Workflow',
      description: template?.description || '',
      steps: [],
      status: 'draft',
      runs: 0,
      category: template?.category || 'Custom'
    };
    setWorkflows([...workflows, newWorkflow]);
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
    setNewWorkflowName('');
  };

  const addStep = (type: WorkflowStep['type']) => {
    if (!selectedWorkflow) return;
    
    const stepType = STEP_TYPES.find(s => s.type === type);
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type,
      name: `${stepType?.label} ${selectedWorkflow.steps.length + 1}`,
      config: {}
    };
    
    const updated = {
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep]
    };
    setSelectedWorkflow(updated);
    setWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
  };

  const removeStep = (stepId: string) => {
    if (!selectedWorkflow) return;
    
    const updated = {
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.filter(s => s.id !== stepId)
    };
    setSelectedWorkflow(updated);
    setWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
  };

  const runWorkflow = (workflow: WorkflowItem) => {
    const updated = {
      ...workflow,
      status: 'active' as const,
      runs: workflow.runs + 1,
      lastRun: new Date()
    };
    setWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
    if (selectedWorkflow?.id === workflow.id) {
      setSelectedWorkflow(updated);
    }
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id));
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow(null);
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            Workflows
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automate your AI tasks
          </p>
        </div>

        <div className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="New workflow name..."
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
            />
            <Button onClick={() => createWorkflow()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {workflows.map(workflow => (
              <Card
                key={workflow.id}
                className={`cursor-pointer transition-colors ${
                  selectedWorkflow?.id === workflow.id ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setSelectedWorkflow(workflow);
                  setIsEditing(false);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{workflow.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {workflow.steps.length} steps • {workflow.runs} runs
                      </p>
                    </div>
                    <Badge
                      variant={workflow.status === 'active' ? 'default' :
                              workflow.status === 'paused' ? 'secondary' : 'outline'}
                    >
                      {workflow.status}
                    </Badge>
                  </div>
                  {workflow.schedule && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {workflow.schedule}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedWorkflow ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedWorkflow.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedWorkflow.description || 'No description'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => runWorkflow(selectedWorkflow)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteWorkflow(selectedWorkflow.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              {isEditing && (
                <div className="mb-6">
                  <Label className="mb-2 block">Add Step</Label>
                  <div className="flex gap-2 flex-wrap">
                    {STEP_TYPES.map(stepType => (
                      <Button
                        key={stepType.type}
                        variant="outline"
                        size="sm"
                        onClick={() => addStep(stepType.type as WorkflowStep['type'])}
                      >
                        <stepType.icon className="h-4 w-4 mr-2" />
                        {stepType.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {selectedWorkflow.steps.map((step, index) => {
                  const stepType = STEP_TYPES.find(s => s.type === step.type);
                  const Icon = stepType?.icon || Zap;
                  
                  return (
                    <div key={step.id} className="flex items-center gap-4">
                      <Card className="flex-1">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${stepType?.color} text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{step.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stepType?.label}
                            </p>
                          </div>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStep(step.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                      {index < selectedWorkflow.steps.length - 1 && (
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}

                {selectedWorkflow.steps.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No steps yet. Add steps to build your workflow.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 p-6">
            <h3 className="text-lg font-semibold mb-4">Templates</h3>
            <div className="grid grid-cols-2 gap-4">
              {TEMPLATES.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => createWorkflow(template)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{template.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {template.steps} steps
                      </span>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Workflows;
