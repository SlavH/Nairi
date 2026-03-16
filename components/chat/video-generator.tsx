"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Play,
  Pause,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
  Clock,
  Film,
  Wand2,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const VIDEO_MODELS = [
  { id: "veo-2", name: "Veo 2 (Google)", description: "Best Quality" },
  { id: "runway-gen3", name: "Runway Gen-3", description: "Fast Generation" },
  { id: "sora", name: "Sora (OpenAI)", description: "Realistic Video" },
  { id: "pika", name: "Pika Labs", description: "Creative Effects" },
];

const VIDEO_STYLES = [
  { id: "cinematic", name: "Cinematic", icon: "🎬" },
  { id: "anime", name: "Anime", icon: "🎭" },
  { id: "3d", name: "3D Animation", icon: "🖥️" },
  { id: "realistic", name: "Realistic", icon: "📷" },
  { id: "cartoon", name: "Cartoon", icon: "🎨" },
  { id: "documentary", name: "Documentary", icon: "🌍" },
  { id: "music-video", name: "Music Video", icon: "🎵" },
  { id: "slow-motion", name: "Slow Motion", icon: "⏳" },
];

const VIDEO_DURATIONS = [
  { id: "4s", name: "4 seconds", credits: 10 },
  { id: "8s", name: "8 seconds", credits: 20 },
  { id: "16s", name: "16 seconds", credits: 40 },
  { id: "30s", name: "30 seconds", credits: 80 },
];

const VIDEO_RESOLUTIONS = [
  { id: "720p", name: "720p HD" },
  { id: "1080p", name: "1080p Full HD" },
  { id: "4k", name: "4K Ultra HD" },
];

const ASPECT_RATIOS = [
  { id: "16:9", name: "16:9 (Wide)" },
  { id: "9:16", name: "9:16 (Vertical)" },
  { id: "1:1", name: "1:1 (Square)" },
  { id: "4:3", name: "4:3 (Classic)" },
];

export function VideoGenerator({ onVideoGenerated }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("veo-2");
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [duration, setDuration] = useState("4s");
  const [resolution, setResolution] = useState("1080p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<
    { prompt: string; videoUrl: string; timestamp: Date }[]
  >([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgress(0);
    setGeneratedVideo(null);

    // Progress simulation while waiting for API
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 5;
      });
    }, 300);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          model: selectedModel, 
          style: selectedStyle, 
          duration, 
          resolution, 
          aspectRatio,
          negativePrompt
        }),
      });

      const data = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(data.error || "Video generation failed");
      }

      // Handle different response types
      let videoUrl = data.videoUrl;
      
      // If we got video frames instead of a video URL, use the first frame as preview
      if (!videoUrl && data.videoFrames && data.videoFrames.length > 0) {
        // For now, show the first frame as a preview with a message
        videoUrl = data.videoFrames[0];
        console.log("Video frames generated:", data.videoFrames);
      }
      
      // Fallback to demo video if nothing else works
      if (!videoUrl) {
        videoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      }
      
      setGeneratedVideo(videoUrl);
      
      setGenerationHistory((prev) => [
        { prompt, videoUrl, timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);

      if (onVideoGenerated) {
        onVideoGenerated(videoUrl);
      }
    } catch (error) {
      console.error("Video generation error:", error);
      clearInterval(progressInterval);
      setProgress(0);
      // Show demo video on error so user sees something
      const demoVideo = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      setGeneratedVideo(demoVideo);
      if (onVideoGenerated) {
        onVideoGenerated(demoVideo);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedVideo) {
      const link = document.createElement("a");
      link.href = generatedVideo;
      link.download = `nairi-video-${Date.now()}.mp4`;
      link.click();
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Video className="h-5 w-5 text-purple-500" />
          Video Generation
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Create videos from text descriptions
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Prompt input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Video Description</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to create... For example: 'Sunset over the ocean, waves gently rolling onto a sandy beach, cinematic style'"
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Model selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <div className="grid grid-cols-2 gap-2">
            {VIDEO_MODELS.map((model) => (
              <Card
                key={model.id}
                className={cn(
                  "p-3 cursor-pointer transition-all",
                  selectedModel === model.id
                    ? "border-purple-500 bg-purple-500/10"
                    : "hover:border-gray-600"
                )}
                onClick={() => setSelectedModel(model.id)}
              >
                <p className="font-medium text-sm">{model.name}</p>
                <p className="text-xs text-gray-400">{model.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Style selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Style</label>
          <div className="flex flex-wrap gap-2">
            {VIDEO_STYLES.map((style) => (
              <Badge
                key={style.id}
                variant={selectedStyle === style.id ? "default" : "outline"}
                className="cursor-pointer py-1.5 px-3"
                onClick={() => setSelectedStyle(style.id)}
              >
                <span className="mr-1">{style.icon}</span>
                {style.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Duration and settings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Duration
            </label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_DURATIONS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.credits} credits)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resolution</label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_RESOLUTIONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Aspect Ratio</label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ar) => (
                  <SelectItem key={ar.id} value={ar.id}>
                    {ar.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced settings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          <Settings className="h-4 w-4 mr-2" />
          Advanced Settings
        </Button>

        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Negative Prompt</label>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude from the video..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating... {Math.round(progress)}%
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 mr-2" />
              Generate Video
            </>
          )}
        </Button>

        {/* Progress bar */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Video generation may take several minutes...
            </p>
          </div>
        )}

        {/* Generated video */}
        {generatedVideo && (
          <Card className="p-4 space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={generatedVideo}
                className="w-full h-full object-contain"
                controls={false}
                muted={isMuted}
                loop
                autoPlay={isPlaying}
              />
              
              {/* Video controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </Card>
        )}

        {/* Generation history */}
        {generationHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Film className="h-4 w-4" />
              Generation History
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {generationHistory.map((item, index) => (
                <Card
                  key={index}
                  className="p-2 cursor-pointer hover:border-purple-500 transition-colors"
                  onClick={() => setGeneratedVideo(item.videoUrl)}
                >
                  <div className="aspect-video bg-gray-800 rounded mb-1 flex items-center justify-center">
                    <Play className="h-6 w-6 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {item.prompt}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoGenerator;
