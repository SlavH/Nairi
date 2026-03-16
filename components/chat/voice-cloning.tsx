"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  Upload,
  Play,
  Pause,
  Trash2,
  Plus,
  Volume2,
  Settings,
  Sparkles,
  User,
  Globe,
  Lock,
  Check,
  X,
  Loader2,
  Download,
  Copy,
  Share2
} from "lucide-react";

interface VoiceClone {
  id: string;
  name: string;
  description: string;
  samples: number;
  quality: number;
  language: string;
  isPublic: boolean;
  createdAt: Date;
  status: 'training' | 'ready' | 'failed';
  previewUrl?: string;
}

interface VoiceSample {
  id: string;
  name: string;
  duration: number;
  url: string;
}

export function VoiceCloning() {
  const [voices, setVoices] = useState<VoiceClone[]>([
    {
      id: '1',
      name: 'My Voice',
      description: 'Personal voice clone',
      samples: 5,
      quality: 85,
      language: 'en-US',
      isPublic: false,
      createdAt: new Date(),
      status: 'ready'
    }
  ]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceClone | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [testText, setTestText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceDescription, setNewVoiceDescription] = useState('');
  const [stability, setStability] = useState([50]);
  const [similarity, setSimilarity] = useState([75]);
  const [style, setStyle] = useState([0]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newSample: VoiceSample = {
          id: Date.now().toString(),
          name: `Recording ${samples.length + 1}`,
          duration: recordingTime,
          url
        };
        setSamples([...samples, newSample]);
        setRecordingTime(0);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const url = URL.createObjectURL(file);
        const newSample: VoiceSample = {
          id: Date.now().toString(),
          name: file.name,
          duration: 0,
          url
        };
        setSamples(prev => [...prev, newSample]);
      });
    }
  };

  const removeSample = (id: string) => {
    setSamples(samples.filter(s => s.id !== id));
  };

  const startTraining = async () => {
    if (samples.length < 3) {
      alert('Please add at least 3 voice samples');
      return;
    }
    
    setIsTraining(true);
    setTrainingProgress(0);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          
          const newVoice: VoiceClone = {
            id: Date.now().toString(),
            name: newVoiceName || 'New Voice',
            description: newVoiceDescription || 'Custom voice clone',
            samples: samples.length,
            quality: 85,
            language: 'en-US',
            isPublic: false,
            createdAt: new Date(),
            status: 'ready'
          };
          setVoices([...voices, newVoice]);
          setSamples([]);
          setNewVoiceName('');
          setNewVoiceDescription('');
          
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const testVoice = () => {
    if (!testText || !selectedVoice) return;
    setIsPlaying(true);
    
    // Use Web Speech API for demo
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.onend = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Voice Cloning
        </h2>
        <p className="text-sm text-muted-foreground">
          Create custom AI voices from your recordings
        </p>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <Tabs defaultValue="voices" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voices">My Voices</TabsTrigger>
            <TabsTrigger value="create">Create Voice</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="voices" className="flex-1 mt-4">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="grid gap-4">
                {voices.map(voice => (
                  <Card 
                    key={voice.id}
                    className={`cursor-pointer transition-colors ${
                      selectedVoice?.id === voice.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedVoice(voice)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {voice.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {voice.isPublic ? (
                            <Badge variant="secondary">
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                          <Badge 
                            variant={voice.status === 'ready' ? 'default' : 
                                    voice.status === 'training' ? 'secondary' : 'destructive'}
                          >
                            {voice.status === 'ready' && <Check className="h-3 w-3 mr-1" />}
                            {voice.status === 'training' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                            {voice.status === 'failed' && <X className="h-3 w-3 mr-1" />}
                            {voice.status}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{voice.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{voice.samples} samples</span>
                        <span>Quality: {voice.quality}%</span>
                        <span>{voice.language}</span>
                      </div>
                      {selectedVoice?.id === voice.id && voice.status === 'ready' && (
                        <div className="mt-4 space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter text to test voice..."
                              value={testText}
                              onChange={(e) => setTestText(e.target.value)}
                            />
                            <Button 
                              onClick={testVoice}
                              disabled={!testText || isPlaying}
                            >
                              {isPlaying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                            <Button variant="outline" size="sm">
                              <Copy className="h-4 w-4 mr-2" />
                              Clone
                            </Button>
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 mt-4">
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label>Voice Name</Label>
                  <Input
                    placeholder="My Custom Voice"
                    value={newVoiceName}
                    onChange={(e) => setNewVoiceName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Describe your voice..."
                    value={newVoiceDescription}
                    onChange={(e) => setNewVoiceDescription(e.target.value)}
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Voice Samples</CardTitle>
                  <CardDescription>
                    Add at least 3 samples (30+ seconds each recommended)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="flex-1"
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording ? `Recording ${formatTime(recordingTime)}` : 'Record'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {samples.length > 0 && (
                    <div className="space-y-2">
                      {samples.map(sample => (
                        <div 
                          key={sample.id}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            <span className="text-sm">{sample.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeSample(sample.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    {samples.length}/3 minimum samples added
                  </div>
                </CardContent>
              </Card>

              {isTraining ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Training voice model...</span>
                        <span>{trainingProgress}%</span>
                      </div>
                      <Progress value={trainingProgress} />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={startTraining}
                  disabled={samples.length < 3}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Voice Clone
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>
                  Adjust voice generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Stability</Label>
                    <span className="text-sm text-muted-foreground">{stability[0]}%</span>
                  </div>
                  <Slider
                    value={stability}
                    onValueChange={setStability}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher stability makes the voice more consistent but less expressive
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Similarity</Label>
                    <span className="text-sm text-muted-foreground">{similarity[0]}%</span>
                  </div>
                  <Slider
                    value={similarity}
                    onValueChange={setSimilarity}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher similarity makes the voice closer to the original samples
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Style Exaggeration</Label>
                    <span className="text-sm text-muted-foreground">{style[0]}%</span>
                  </div>
                  <Slider
                    value={style}
                    onValueChange={setStyle}
                    max={100}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Amplifies the style of the original speaker
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default VoiceCloning;
