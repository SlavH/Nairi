"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Languages,
  Upload,
  Play,
  Pause,
  Download,
  Trash2,
  Video,
  Volume2,
  Subtitles,
  Mic,
  Globe,
  Clock,
  Loader2,
  Check,
  X,
  FileVideo,
  Sparkles,
  Settings,
  RefreshCw
} from "lucide-react";

interface DubbingProject {
  id: string;
  name: string;
  originalLanguage: string;
  targetLanguages: string[];
  duration: number;
  status: 'uploading' | 'transcribing' | 'translating' | 'dubbing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  createdAt: Date;
  outputs: DubbingOutput[];
}

interface DubbingOutput {
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  subtitlesUrl?: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
];

export function VideoDubbing() {
  const [projects, setProjects] = useState<DubbingProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DubbingProject | null>(null);
  const [originalLanguage, setOriginalLanguage] = useState('en');
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [preserveVoice, setPreserveVoice] = useState(true);
  const [generateSubtitles, setGenerateSubtitles] = useState(true);
  const [lipSync, setLipSync] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (targetLanguages.length === 0) {
      alert('Please select at least one target language');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload and processing
    const newProject: DubbingProject = {
      id: Date.now().toString(),
      name: file.name,
      originalLanguage,
      targetLanguages,
      duration: 0,
      status: 'uploading',
      progress: 0,
      createdAt: new Date(),
      outputs: targetLanguages.map(lang => ({
        language: lang,
        status: 'pending' as const
      }))
    };
    
    setProjects([newProject, ...projects]);
    setSelectedProject(newProject);
    
    // Simulate progress
    const stages = ['uploading', 'transcribing', 'translating', 'dubbing', 'completed'] as const;
    let stageIndex = 0;
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += 2;
      
      if (progress >= 100 && stageIndex < stages.length - 1) {
        stageIndex++;
        progress = 0;
      }
      
      const updatedProject = {
        ...newProject,
        status: stages[stageIndex],
        progress: stageIndex === stages.length - 1 ? 100 : progress,
        outputs: newProject.outputs.map((output, i) => ({
          ...output,
          status: stageIndex >= 3 ? (stageIndex === 4 ? 'completed' as const : 'processing' as const) : 'pending' as const,
          videoUrl: stageIndex === 4 ? '#' : undefined
        }))
      };
      
      setProjects(prev => prev.map(p => p.id === newProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
      
      if (stageIndex === stages.length - 1) {
        clearInterval(interval);
        setIsUploading(false);
        setTargetLanguages([]);
      }
    }, 150);
  };

  const toggleTargetLanguage = (code: string) => {
    if (code === originalLanguage) return;
    
    if (targetLanguages.includes(code)) {
      setTargetLanguages(targetLanguages.filter(l => l !== code));
    } else {
      setTargetLanguages([...targetLanguages, code]);
    }
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: DubbingProject['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading video...';
      case 'transcribing': return 'Transcribing audio...';
      case 'translating': return 'Translating content...';
      case 'dubbing': return 'Generating dubbed audio...';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Video Dubbing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Translate videos to any language
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileVideo className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No projects yet</p>
              </div>
            ) : (
              projects.map(project => (
                <Card
                  key={project.id}
                  className={`cursor-pointer transition-colors ${
                    selectedProject?.id === project.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {LANGUAGES.find(l => l.code === project.originalLanguage)?.flag}
                            {' → '}
                            {project.targetLanguages.map(l => 
                              LANGUAGES.find(lang => lang.code === l)?.flag
                            ).join(' ')}
                          </Badge>
                        </div>
                      </div>
                      {getStatusIcon(project.status)}
                    </div>
                    {project.status !== 'completed' && project.status !== 'failed' && (
                      <Progress value={project.progress} className="mt-2 h-1" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            {/* Project Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedProject.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getStatusLabel(selectedProject.status)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedProject.status === 'completed' && (
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteProject(selectedProject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {selectedProject.status !== 'completed' && selectedProject.status !== 'failed' && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{getStatusLabel(selectedProject.status)}</span>
                    <span>{selectedProject.progress}%</span>
                  </div>
                  <Progress value={selectedProject.progress} />
                </div>
              )}
            </div>

            {/* Outputs */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                <h4 className="font-medium mb-4">Dubbed Versions</h4>
                <div className="grid gap-4">
                  {selectedProject.outputs.map(output => {
                    const lang = LANGUAGES.find(l => l.code === output.language);
                    return (
                      <Card key={output.language}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center">
                              {output.status === 'completed' ? (
                                <Play className="h-6 w-6" />
                              ) : output.status === 'processing' ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                              ) : (
                                <Video className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{lang?.flag}</span>
                                <h4 className="font-medium">{lang?.name}</h4>
                                <Badge variant={
                                  output.status === 'completed' ? 'default' :
                                  output.status === 'processing' ? 'secondary' :
                                  output.status === 'failed' ? 'destructive' : 'outline'
                                }>
                                  {output.status}
                                </Badge>
                              </div>
                              {output.status === 'completed' && (
                                <div className="flex gap-2 mt-3">
                                  <Button variant="outline" size="sm">
                                    <Play className="h-3 w-3 mr-1" />
                                    Preview
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-3 w-3 mr-1" />
                                    Video
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Subtitles className="h-3 w-3 mr-1" />
                                    Subtitles
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          /* Upload New Video */
          <div className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-6">Create New Dubbing Project</h3>
              
              <div className="space-y-6">
                {/* Original Language */}
                <div>
                  <Label>Original Language</Label>
                  <Select value={originalLanguage} onValueChange={setOriginalLanguage}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Languages */}
                <div>
                  <Label>Target Languages</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select languages to dub your video into
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.filter(l => l.code !== originalLanguage).map(lang => (
                      <Button
                        key={lang.code}
                        variant={targetLanguages.includes(lang.code) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleTargetLanguage(lang.code)}
                      >
                        {lang.flag} {lang.name}
                      </Button>
                    ))}
                  </div>
                  {targetLanguages.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {targetLanguages.length} language(s) selected
                    </p>
                  )}
                </div>

                {/* Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Preserve Original Voice</Label>
                        <p className="text-sm text-muted-foreground">
                          Clone the speaker's voice for dubbed versions
                        </p>
                      </div>
                      <Switch checked={preserveVoice} onCheckedChange={setPreserveVoice} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Generate Subtitles</Label>
                        <p className="text-sm text-muted-foreground">
                          Create subtitle files for each language
                        </p>
                      </div>
                      <Switch checked={generateSubtitles} onCheckedChange={setGenerateSubtitles} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Lip Sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Adjust video to match dubbed audio timing
                        </p>
                      </div>
                      <Switch checked={lipSync} onCheckedChange={setLipSync} />
                    </div>
                  </CardContent>
                </Card>

                {/* Upload */}
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Upload Video</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop or click to upload
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={targetLanguages.length === 0 || isUploading}
                    >
                      {isUploading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="h-4 w-4 mr-2" /> Select Video</>
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <p className="text-xs text-muted-foreground mt-4">
                      Supported: MP4, MOV, AVI, MKV (max 500MB)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoDubbing;
