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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Bot,
  User,
  Globe,
  Clock,
  Zap,
  MessageSquare,
  Headphones,
  Sparkles,
  Copy,
  ExternalLink,
  BarChart
} from "lucide-react";

interface VoiceAgent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  voice: string;
  language: string;
  personality: string;
  greeting: string;
  instructions: string;
  isActive: boolean;
  calls: number;
  avgDuration: number;
  satisfaction: number;
  createdAt: Date;
}

interface CallLog {
  id: string;
  agentId: string;
  agentName: string;
  duration: number;
  timestamp: Date;
  status: 'completed' | 'missed' | 'failed';
  transcript?: string;
}

const VOICES = [
  { id: 'alloy', name: 'Alloy', gender: 'neutral' },
  { id: 'echo', name: 'Echo', gender: 'male' },
  { id: 'fable', name: 'Fable', gender: 'female' },
  { id: 'onyx', name: 'Onyx', gender: 'male' },
  { id: 'nova', name: 'Nova', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female' },
];

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese' },
];

export function VoiceAgents() {
  const [agents, setAgents] = useState<VoiceAgent[]>([
    {
      id: '1',
      name: 'Customer Support',
      description: 'Handles customer inquiries and support requests',
      avatar: '',
      voice: 'nova',
      language: 'en-US',
      personality: 'Professional, helpful, and patient',
      greeting: 'Hello! Thank you for calling. How can I help you today?',
      instructions: 'Help customers with their questions. Be polite and professional. Escalate complex issues to human agents.',
      isActive: true,
      calls: 1250,
      avgDuration: 180,
      satisfaction: 4.5,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Sales Assistant',
      description: 'Qualifies leads and schedules demos',
      avatar: '',
      voice: 'alloy',
      language: 'en-US',
      personality: 'Friendly, enthusiastic, and persuasive',
      greeting: 'Hi there! Thanks for your interest in our product. I\'d love to tell you more!',
      instructions: 'Qualify leads by asking about their needs. Schedule demos for interested prospects. Collect contact information.',
      isActive: true,
      calls: 890,
      avgDuration: 240,
      satisfaction: 4.3,
      createdAt: new Date()
    }
  ]);
  
  const [callLogs, setCallLogs] = useState<CallLog[]>([
    { id: '1', agentId: '1', agentName: 'Customer Support', duration: 185, timestamp: new Date(), status: 'completed' },
    { id: '2', agentId: '2', agentName: 'Sales Assistant', duration: 320, timestamp: new Date(), status: 'completed' },
    { id: '3', agentId: '1', agentName: 'Customer Support', duration: 0, timestamp: new Date(), status: 'missed' },
  ]);
  
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([80]);
  
  const [newAgent, setNewAgent] = useState<Partial<VoiceAgent>>({
    name: '',
    description: '',
    voice: 'nova',
    language: 'en-US',
    personality: '',
    greeting: '',
    instructions: '',
    isActive: true
  });

  const createAgent = () => {
    if (!newAgent.name) return;
    
    const agent: VoiceAgent = {
      id: Date.now().toString(),
      name: newAgent.name,
      description: newAgent.description || '',
      avatar: '',
      voice: newAgent.voice || 'nova',
      language: newAgent.language || 'en-US',
      personality: newAgent.personality || '',
      greeting: newAgent.greeting || '',
      instructions: newAgent.instructions || '',
      isActive: true,
      calls: 0,
      avgDuration: 0,
      satisfaction: 0,
      createdAt: new Date()
    };
    
    setAgents([...agents, agent]);
    setNewAgent({
      name: '',
      description: '',
      voice: 'nova',
      language: 'en-US',
      personality: '',
      greeting: '',
      instructions: '',
      isActive: true
    });
    setIsCreating(false);
  };

  const deleteAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
    if (selectedAgent?.id === id) {
      setSelectedAgent(null);
    }
  };

  const toggleAgentStatus = (id: string) => {
    setAgents(agents.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const startCall = (agent: VoiceAgent) => {
    setSelectedAgent(agent);
    setIsInCall(true);
  };

  const endCall = () => {
    setIsInCall(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            Voice Agents
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered phone agents
          </p>
        </div>

        <div className="p-4 border-b">
          <Button 
            className="w-full" 
            onClick={() => setIsCreating(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {agents.map(agent => (
              <Card
                key={agent.id}
                className={`cursor-pointer transition-colors ${
                  selectedAgent?.id === agent.id ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setSelectedAgent(agent);
                  setIsCreating(false);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{agent.name}</h3>
                        <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {agent.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {agent.calls}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(agent.avgDuration)}
                        </span>
                      </div>
                    </div>
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
          <div className="flex-1 p-6 overflow-auto">
            <h3 className="text-lg font-semibold mb-6">Create Voice Agent</h3>
            
            <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Agent Name</Label>
                  <Input
                    placeholder="e.g., Customer Support"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Voice</Label>
                  <Select
                    value={newAgent.voice}
                    onValueChange={(value) => setNewAgent({ ...newAgent, voice: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICES.map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name} ({voice.gender})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  placeholder="What does this agent do?"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                />
              </div>

              <div>
                <Label>Language</Label>
                <Select
                  value={newAgent.language}
                  onValueChange={(value) => setNewAgent({ ...newAgent, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Personality</Label>
                <Input
                  placeholder="e.g., Professional, friendly, and helpful"
                  value={newAgent.personality}
                  onChange={(e) => setNewAgent({ ...newAgent, personality: e.target.value })}
                />
              </div>

              <div>
                <Label>Greeting Message</Label>
                <Textarea
                  placeholder="What should the agent say when answering?"
                  value={newAgent.greeting}
                  onChange={(e) => setNewAgent({ ...newAgent, greeting: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Instructions</Label>
                <Textarea
                  placeholder="Detailed instructions for the agent..."
                  value={newAgent.instructions}
                  onChange={(e) => setNewAgent({ ...newAgent, instructions: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={createAgent}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : selectedAgent ? (
          <>
            {/* Agent Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedAgent.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <Label htmlFor="agent-status" className="text-sm">Active</Label>
                  <Switch
                    id="agent-status"
                    checked={selectedAgent.isActive}
                    onCheckedChange={() => toggleAgentStatus(selectedAgent.id)}
                  />
                </div>
                <Button
                  variant={isInCall ? 'destructive' : 'default'}
                  onClick={() => isInCall ? endCall() : startCall(selectedAgent)}
                >
                  {isInCall ? (
                    <><PhoneOff className="h-4 w-4 mr-2" /> End Call</>
                  ) : (
                    <><PhoneCall className="h-4 w-4 mr-2" /> Test Call</>
                  )}
                </Button>
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => deleteAgent(selectedAgent.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Call Interface */}
            {isInCall && (
              <div className="p-6 border-b bg-muted/50">
                <div className="max-w-md mx-auto text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarFallback className="text-3xl bg-primary/10">
                      <Bot className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold">{selectedAgent.name}</h3>
                  <p className="text-muted-foreground">Call in progress...</p>
                  
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-14 w-14 rounded-full"
                      onClick={endCall}
                    >
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                    >
                      {volume[0] === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                  
                  <div className="mt-4 max-w-xs mx-auto">
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Agent Details */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <div className="border-b px-4">
                <TabsList className="mt-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="logs">Call Logs</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="flex-1 p-6 mt-0">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">Total Calls</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedAgent.calls}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Avg Duration</span>
                      </div>
                      <p className="text-2xl font-bold">{formatDuration(selectedAgent.avgDuration)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Zap className="h-4 w-4" />
                        <span className="text-sm">Satisfaction</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedAgent.satisfaction}/5</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Greeting</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg">{selectedAgent.greeting}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Instructions</Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                      {selectedAgent.instructions}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 p-6 mt-0">
                <div className="max-w-xl space-y-6">
                  <div>
                    <Label>Voice</Label>
                    <Select value={selectedAgent.voice}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICES.map(voice => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Select value={selectedAgent.language}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Personality</Label>
                    <Input value={selectedAgent.personality} readOnly />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {callLogs
                      .filter(log => log.agentId === selectedAgent.id)
                      .map(log => (
                        <Card key={log.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                log.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                log.status === 'missed' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-red-500/10 text-red-500'
                              }`}>
                                <Phone className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium capitalize">{log.status}</p>
                                <p className="text-sm text-muted-foreground">
                                  {log.timestamp.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatDuration(log.duration)}</p>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Transcript
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 p-6 mt-0">
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics not available yet. Usage and performance metrics will appear here in a future release.</p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select an agent or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceAgents;
