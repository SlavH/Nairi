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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  User,
  Plus,
  Play,
  Pause,
  Upload,
  Download,
  Trash2,
  Edit,
  Sparkles,
  Mic,
  Volume2,
  Settings,
  Globe,
  Clock,
  Loader2,
  Check,
  Image,
  Camera,
  Film,
  Wand2
} from "lucide-react";

interface VideoAvatar {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  type: 'preset' | 'custom' | 'cloned';
  gender: 'male' | 'female' | 'neutral';
  style: string;
  languages: string[];
  createdAt: Date;
  status: 'ready' | 'processing' | 'failed';
}

interface GeneratedVideo {
  id: string;
  avatarId: string;
  avatarName: string;
  script: string;
  duration: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  videoUrl?: string;
  createdAt: Date;
}

const PRESET_AVATARS: VideoAvatar[] = [
  { id: 'p1', name: 'Alex', description: 'Professional business presenter', thumbnail: '', type: 'preset', gender: 'male', style: 'business', languages: ['en', 'es', 'fr'], createdAt: new Date(), status: 'ready' },
  { id: 'p2', name: 'Sarah', description: 'Friendly customer service rep', thumbnail: '', type: 'preset', gender: 'female', style: 'casual', languages: ['en', 'de', 'it'], createdAt: new Date(), status: 'ready' },
  { id: 'p3', name: 'James', description: 'Tech explainer and educator', thumbnail: '', type: 'preset', gender: 'male', style: 'tech', languages: ['en', 'ja', 'ko'], createdAt: new Date(), status: 'ready' },
  { id: 'p4', name: 'Emma', description: 'Marketing and sales specialist', thumbnail: '', type: 'preset', gender: 'female', style: 'marketing', languages: ['en', 'pt', 'zh'], createdAt: new Date(), status: 'ready' },
  { id: 'p5', name: 'Michael', description: 'News anchor style presenter', thumbnail: '', type: 'preset', gender: 'male', style: 'news', languages: ['en', 'ru', 'ar'], createdAt: new Date(), status: 'ready' },
  { id: 'p6', name: 'Lisa', description: 'Healthcare and wellness guide', thumbnail: '', type: 'preset', gender: 'female', style: 'healthcare', languages: ['en', 'es', 'fr'], createdAt: new Date(), status: 'ready' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
];

export function VideoAvatars() {
  const [avatars, setAvatars] = useState<VideoAvatar[]>(PRESET_AVATARS);
  const [selectedAvatar, setSelectedAvatar] = useState<VideoAvatar | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [script, setScript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('avatars');

  const generateVideo = async () => {
    if (!selectedAvatar || !script) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const newVideo: GeneratedVideo = {
      id: Date.now().toString(),
      avatarId: selectedAvatar.id,
      avatarName: selectedAvatar.name,
      script,
      duration: Math.ceil(script.length / 15),
      status: 'processing',
      progress: 0,
      createdAt: new Date()
    };
    
    setGeneratedVideos([newVideo, ...generatedVideos]);
    
    // Simulate generation progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setGeneratedVideos(videos => 
            videos.map(v => 
              v.id === newVideo.id 
                ? { ...v, status: 'completed' as const, progress: 100, videoUrl: '#' }
                : v
            )
          );
          setScript('');
          return 100;
        }
        
        setGeneratedVideos(videos => 
          videos.map(v => 
            v.id === newVideo.id ? { ...v, progress: prev + 2 } : v
          )
        );
        
        return prev + 2;
      });
    }, 100);
  };

  const deleteVideo = (id: string) => {
    setGeneratedVideos(generatedVideos.filter(v => v.id !== id));
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Avatar Selection */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Video Avatars
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create AI-powered video presenters
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-2 border-b">
            <TabsList className="w-full">
              <TabsTrigger value="avatars" className="flex-1">Avatars</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="avatars" className="flex-1 mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 grid grid-cols-2 gap-3">
                {avatars.filter(a => a.type === 'preset').map(avatar => (
                  <Card
                    key={avatar.id}
                    className={`cursor-pointer transition-all ${
                      selectedAvatar?.id === avatar.id 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-sm">{avatar.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {avatar.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="flex-1 mt-0 p-4">
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-1">Create Custom Avatar</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a photo or video to create your own avatar
                </p>
                <Button>
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Media
                </Button>
              </CardContent>
            </Card>

            <div className="mt-4 space-y-3">
              {avatars.filter(a => a.type === 'custom' || a.type === 'cloned').map(avatar => (
                <Card
                  key={avatar.id}
                  className={`cursor-pointer ${
                    selectedAvatar?.id === avatar.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{avatar.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {avatar.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedAvatar ? (
          <>
            {/* Avatar Info */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedAvatar.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedAvatar.description}</p>
                  <div className="flex gap-1 mt-1">
                    {selectedAvatar.languages.map(lang => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {LANGUAGES.find(l => l.code === lang)?.name || lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>

            {/* Script Input */}
            <div className="p-4 border-b">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Language</Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.filter(l => 
                          selectedAvatar.languages.includes(l.code)
                        ).map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Estimated Duration</Label>
                    <div className="h-10 flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      ~{Math.ceil(script.length / 15)} seconds
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Script</Label>
                  <Textarea
                    placeholder="Enter the text you want the avatar to speak..."
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {script.length} characters
                  </p>
                </div>

                {isGenerating ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generating video...</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} />
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={generateVideo}
                    disabled={!script}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Video
                  </Button>
                )}
              </div>
            </div>

            {/* Generated Videos */}
            <div className="flex-1 overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Generated Videos</h3>
              </div>
              <ScrollArea className="h-[calc(100%-50px)]">
                <div className="p-4 space-y-3">
                  {generatedVideos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No videos generated yet</p>
                    </div>
                  ) : (
                    generatedVideos.map(video => (
                      <Card key={video.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center">
                              {video.status === 'processing' ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                              ) : video.status === 'completed' ? (
                                <Play className="h-6 w-6" />
                              ) : (
                                <Video className="h-6 w-6" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{video.avatarName}</h4>
                                <Badge variant={
                                  video.status === 'completed' ? 'default' :
                                  video.status === 'processing' ? 'secondary' : 'destructive'
                                }>
                                  {video.status === 'completed' && <Check className="h-3 w-3 mr-1" />}
                                  {video.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                  {video.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {video.script}
                              </p>
                              {video.status === 'processing' && (
                                <Progress value={video.progress} className="mt-2" />
                              )}
                              {video.status === 'completed' && (
                                <div className="flex gap-2 mt-2">
                                  <Button variant="outline" size="sm">
                                    <Play className="h-3 w-3 mr-1" />
                                    Play
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => deleteVideo(video.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select an avatar to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoAvatars;
