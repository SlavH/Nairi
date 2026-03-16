"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Settings,
  X,
  Waves,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VoiceModeProps {
  onMessage?: (message: string) => void;
  onResponse?: (response: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const VOICES = [
  { id: "alloy", name: "Alloy", gender: "neutral" },
  { id: "echo", name: "Echo", gender: "male" },
  { id: "fable", name: "Fable", gender: "female" },
  { id: "onyx", name: "Onyx", gender: "male" },
  { id: "nova", name: "Nova", gender: "female" },
  { id: "shimmer", name: "Shimmer", gender: "female" },
];

const LANGUAGES = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "ru-RU", name: "Русский" },
  { code: "hy-AM", name: "Հայերեն" },
  { code: "es-ES", name: "Español" },
  { code: "fr-FR", name: "Français" },
  { code: "de-DE", name: "Deutsch" },
  { code: "zh-CN", name: "中文" },
  { code: "ja-JP", name: "日本語" },
  { code: "ko-KR", name: "한국어" },
];

export function VoiceMode({ onMessage, onResponse, isOpen = true, onClose }: VoiceModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [volume, setVolume] = useState([80]);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = selectedLanguage;

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(interimTranscript || finalTranscript);

          if (finalTranscript) {
            handleUserMessage(finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setIsListening(false);
          }
        };

        recognitionRef.current.onend = () => {
          if (isListening && isConnected && !isMuted) {
            recognitionRef.current?.start();
          }
        };
      }

      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedLanguage]);

  // Audio level visualization
  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, []);

  const stopAudioVisualization = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  }, []);

  const handleUserMessage = async (message: string) => {
    if (onMessage) onMessage(message);
    setTranscript("");

    // Simulate AI response (in real app, this would call the API)
    setAiResponse("Обрабатываю ваш запрос...");
    
    // Here you would call your AI API
    // const response = await fetch('/api/chat', { ... });
    
    // For demo, simulate response
    setTimeout(() => {
      const demoResponse = `Я получил ваше сообщение: "${message}". Как я могу помочь?`;
      setAiResponse(demoResponse);
      if (onResponse) onResponse(demoResponse);
      if (isSpeakerOn) {
        speakResponse(demoResponse);
      }
    }, 1000);
  };

  const speakResponse = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume[0] / 100;
      utterance.lang = selectedLanguage;
      
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };

  const startCall = async () => {
    setIsConnected(true);
    setIsListening(true);
    await startAudioVisualization();
    if (recognitionRef.current && !isMuted) {
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
    }
  };

  const endCall = () => {
    setIsConnected(false);
    setIsListening(false);
    stopAudioVisualization();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setTranscript("");
    setAiResponse("");
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && isConnected) {
      recognitionRef.current?.start();
    } else {
      recognitionRef.current?.stop();
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (!isSpeakerOn && synthRef.current) {
      synthRef.current.cancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="relative w-full max-w-md p-6 bg-gradient-to-b from-gray-900 to-black border-gray-800">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Settings button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 text-gray-400 hover:text-white"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* Main content */}
        <div className="flex flex-col items-center space-y-6 pt-8">
          {/* Voice visualization */}
          <div className="relative">
            <div
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
                isConnected
                  ? isAiSpeaking
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500"
                  : "bg-gray-800"
              )}
              style={{
                transform: `scale(${1 + audioLevel * 0.3})`,
                boxShadow: isConnected
                  ? `0 0 ${30 + audioLevel * 50}px ${isAiSpeaking ? "rgba(168, 85, 247, 0.5)" : "rgba(6, 182, 212, 0.5)"}`
                  : "none",
              }}
            >
              <Waves className={cn(
                "h-12 w-12 text-white",
                isConnected && "animate-pulse"
              )} />
            </div>
            
            {/* Audio level rings */}
            {isConnected && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <div
                  className="absolute inset-0 rounded-full border border-cyan-500/20"
                  style={{
                    transform: `scale(${1.2 + audioLevel * 0.5})`,
                    opacity: 0.5 - audioLevel * 0.3,
                  }}
                />
              </>
            )}
          </div>

          {/* Status text */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              {isConnected
                ? isAiSpeaking
                  ? "Nairi is speaking..."
                  : isMuted
                  ? "Microphone muted"
                  : "Listening..."
                : "Voice Mode"}
            </h3>
            <p className="text-gray-400 text-sm">
              {isConnected
                ? "Speak naturally, Nairi is listening"
                : "Press the button to start a conversation"}
            </p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="w-full p-3 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 text-sm italic">"{transcript}"</p>
            </div>
          )}

          {/* AI Response */}
          {aiResponse && (
            <div className="w-full p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
              <p className="text-purple-200 text-sm">{aiResponse}</p>
            </div>
          )}

          {/* Settings panel */}
          {showSettings && (
            <div className="w-full space-y-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Voice</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.gender})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Volume: {volume[0]}%</label>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Control buttons */}
          <div className="flex items-center space-x-4">
            {isConnected && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full w-12 h-12",
                    isMuted && "bg-red-500/20 border-red-500"
                  )}
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <MicOff className="h-5 w-5 text-red-500" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "rounded-full w-12 h-12",
                    !isSpeakerOn && "bg-red-500/20 border-red-500"
                  )}
                  onClick={toggleSpeaker}
                >
                  {isSpeakerOn ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-red-500" />
                  )}
                </Button>
              </>
            )}

            <Button
              size="lg"
              className={cn(
                "rounded-full w-16 h-16 transition-all",
                isConnected
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              )}
              onClick={isConnected ? endCall : startCall}
            >
              {isConnected ? (
                <PhoneOff className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default VoiceMode;
