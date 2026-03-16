"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Code,
  Play,
  Terminal,
  FileCode,
  FolderOpen,
  GitBranch,
  Bug,
  Sparkles,
  Send,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Settings,
  Loader2,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Search,
  Wand2,
  MessageSquare,
  Zap,
  Eye,
  Edit,
  Save
} from "lucide-react";

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
  isOpen?: boolean;
}

interface CodeChange {
  id: string;
  file: string;
  type: 'add' | 'modify' | 'delete';
  description: string;
  diff: string;
  status: 'pending' | 'applied' | 'rejected';
}

interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  codeChanges?: CodeChange[];
  timestamp: Date;
}

const SAMPLE_FILES: FileNode[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    path: '/src',
    isOpen: true,
    children: [
      {
        id: '2',
        name: 'components',
        type: 'folder',
        path: '/src/components',
        isOpen: true,
        children: [
          { id: '3', name: 'Button.tsx', type: 'file', path: '/src/components/Button.tsx', language: 'typescript' },
          { id: '4', name: 'Card.tsx', type: 'file', path: '/src/components/Card.tsx', language: 'typescript' },
        ]
      },
      {
        id: '5',
        name: 'pages',
        type: 'folder',
        path: '/src/pages',
        children: [
          { id: '6', name: 'index.tsx', type: 'file', path: '/src/pages/index.tsx', language: 'typescript' },
          { id: '7', name: 'about.tsx', type: 'file', path: '/src/pages/about.tsx', language: 'typescript' },
        ]
      },
      { id: '8', name: 'App.tsx', type: 'file', path: '/src/App.tsx', language: 'typescript' },
      { id: '9', name: 'index.css', type: 'file', path: '/src/index.css', language: 'css' },
    ]
  },
  { id: '10', name: 'package.json', type: 'file', path: '/package.json', language: 'json' },
  { id: '11', name: 'tsconfig.json', type: 'file', path: '/tsconfig.json', language: 'json' },
];

export function CodeAgent() {
  const [files, setFiles] = useState<FileNode[]>(SAMPLE_FILES);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: '1',
      role: 'agent',
      content: 'Hi! I\'m your AI coding assistant. I can help you write, refactor, debug, and understand code. What would you like to work on?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<CodeChange[]>([]);
  const [codeContent, setCodeContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleFolder = (id: string) => {
    const updateNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };
    setFiles(updateNodes(files));
  };

  const selectFile = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      // Simulate loading file content
      setCodeContent(`// ${file.name}\n\nimport React from 'react';\n\nexport function ${file.name.replace('.tsx', '')}() {\n  return (\n    <div>\n      <h1>Hello from ${file.name}</h1>\n    </div>\n  );\n}\n`);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      // Determine action based on input
      let action = 'general';
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('explain')) action = 'explain';
      else if (lowerInput.includes('fix') || lowerInput.includes('bug') || lowerInput.includes('debug')) action = 'fix';
      else if (lowerInput.includes('refactor') || lowerInput.includes('improve') || lowerInput.includes('optimize')) action = 'refactor';
      else if (lowerInput.includes('test')) action = 'tests';

      const response = await fetch('/api/code-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          code: selectedFile ? codeContent : undefined,
          language: selectedFile?.language || 'typescript',
          action
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let codeChanges: CodeChange[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                fullContent += data.content;
              }
              
              if (data.complete && data.codeChanges) {
                codeChanges = data.codeChanges.map((change: { type: 'add' | 'modify' | 'delete'; description: string; diff: string }, idx: number) => ({
                  id: `${Date.now()}-${idx}`,
                  file: selectedFile?.path || '/src/NewFile.tsx',
                  type: change.type,
                  description: change.description,
                  diff: change.diff,
                  status: 'pending' as const
                }));
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      const agentMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: fullContent || 'I processed your request. Let me know if you need anything else.',
        codeChanges: codeChanges.length > 0 ? codeChanges : undefined,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      if (codeChanges.length > 0) {
        setPendingChanges(prev => [...prev, ...codeChanges]);
      }
    } catch (error) {
      console.error('Code agent error:', error);
      const errorMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyChange = (changeId: string) => {
    setPendingChanges(prev => prev.map(c => 
      c.id === changeId ? { ...c, status: 'applied' as const } : c
    ));
    setMessages(prev => prev.map(m => ({
      ...m,
      codeChanges: m.codeChanges?.map(c => 
        c.id === changeId ? { ...c, status: 'applied' as const } : c
      )
    })));
  };

  const rejectChange = (changeId: string) => {
    setPendingChanges(prev => prev.map(c => 
      c.id === changeId ? { ...c, status: 'rejected' as const } : c
    ));
    setMessages(prev => prev.map(m => ({
      ...m,
      codeChanges: m.codeChanges?.map(c => 
        c.id === changeId ? { ...c, status: 'rejected' as const } : c
      )
    })));
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-muted rounded text-sm ${
            selectedFile?.id === node.id ? 'bg-muted' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => node.type === 'folder' ? toggleFolder(node.id) : selectFile(node)}
        >
          {node.type === 'folder' ? (
            <>
              {node.isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 text-blue-500" />
            </>
          ) : (
            <>
              <span className="w-4" />
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === 'folder' && node.isOpen && node.children && (
          renderFileTree(node.children, depth + 1)
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-full bg-background">
      {/* File Explorer */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Explorer
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {renderFileTree(files)}
          </div>
        </ScrollArea>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col border-r">
        {selectedFile ? (
          <>
            <div className="p-2 border-b flex items-center justify-between bg-muted/50">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedFile.language}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                {isEditing ? (
                  <Textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    className="font-mono text-sm min-h-[500px] resize-none"
                  />
                ) : (
                  <pre className="font-mono text-sm">
                    <code>{codeContent}</code>
                  </pre>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a file to view</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat */}
      <div className="w-96 flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Code Agent
          </h3>
          <p className="text-xs text-muted-foreground">
            AI-powered coding assistant
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.map(message => (
              <div key={message.id} className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`max-w-[90%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.codeChanges && message.codeChanges.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.codeChanges.map(change => (
                        <Card key={change.id} className="bg-background">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  change.type === 'add' ? 'default' :
                                  change.type === 'modify' ? 'secondary' : 'destructive'
                                } className="text-xs">
                                  {change.type}
                                </Badge>
                                <span className="text-xs font-mono">{change.file}</span>
                              </div>
                              {change.status === 'pending' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={() => applyChange(change.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={() => rejectChange(change.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {change.status === 'applied' && (
                                <Badge variant="outline" className="text-xs text-green-500">
                                  Applied
                                </Badge>
                              )}
                              {change.status === 'rejected' && (
                                <Badge variant="outline" className="text-xs text-red-500">
                                  Rejected
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {change.description}
                            </p>
                            <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                              {change.diff}
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="p-2 border-t border-b">
          <div className="flex gap-1 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-transparent"
              onClick={() => setInput('Explain this code')}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Explain
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-transparent"
              onClick={() => setInput('Fix bugs in this code')}
            >
              <Bug className="h-3 w-3 mr-1" />
              Fix Bugs
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-transparent"
              onClick={() => setInput('Refactor this code')}
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Refactor
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-transparent"
              onClick={() => setInput('Add tests for this code')}
            >
              <Zap className="h-3 w-3 mr-1" />
              Add Tests
            </Button>
          </div>
        </div>

        {/* Input */}
        <div className="p-3">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              placeholder="Ask me to write, fix, or explain code..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="min-h-[60px] resize-none"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isProcessing}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeAgent;
