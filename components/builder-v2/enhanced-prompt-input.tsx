"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Image, Mic, Sparkles, Wand2, Palette, Layout, 
  Zap, Settings2, ChevronDown, ChevronUp, X, Upload,
  MessageSquare, Lightbulb, History, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { analyzeIntent, type AnalyzedIntent, type ClarificationQuestion } from '@/lib/ai/intent-analyzer';
import { DESIGN_PRESETS, generateDesignSystemPrompt } from '@/lib/ai/design-system';
import { generateAnimationPrompt } from '@/lib/ai/micro-interactions';
import { loadPreferences, enhancePromptWithContext } from '@/lib/ai/context-memory';

interface EnhancedPromptInputProps {
  onSubmit: (prompt: string, options: PromptOptions) => void;
  onImageUpload?: (file: File) => void;
  isGenerating?: boolean;
  placeholder?: string;
}

export interface PromptOptions {
  designPreset: string;
  animationLevel: 'subtle' | 'moderate' | 'rich' | 'maximum';
  generateVariants: boolean;
  variantCount: number;
  useContextMemory: boolean;
  enhancedPrompt: string;
  analyzedIntent: AnalyzedIntent | null;
}

const STYLE_PRESETS = [
  { id: 'modern', name: 'Modern', icon: '✨', description: 'Clean, contemporary design' },
  { id: 'minimal', name: 'Minimal', icon: '◻️', description: 'Simple, lots of whitespace' },
  { id: 'dark', name: 'Dark Mode', icon: '🌙', description: 'Dark backgrounds, light text' },
  { id: 'glassmorphism', name: 'Glass', icon: '💎', description: 'Frosted glass effects' },
  { id: 'playful', name: 'Playful', icon: '🎨', description: 'Colorful, fun, vibrant' },
];

const ANIMATION_LEVELS = [
  { id: 'subtle', name: 'Subtle', description: 'Minimal hover effects' },
  { id: 'moderate', name: 'Moderate', description: 'Smooth transitions' },
  { id: 'rich', name: 'Rich', description: 'Entrance animations' },
  { id: 'maximum', name: 'Maximum', description: 'Full motion design' },
];

const QUICK_PROMPTS = [
  { icon: '🏠', text: 'Landing page with hero, features, and pricing' },
  { icon: '📊', text: 'Dashboard with stats, charts, and data table' },
  { icon: '🛒', text: 'E-commerce product page with gallery and cart' },
  { icon: '📝', text: 'Blog post layout with sidebar and comments' },
  { icon: '👤', text: 'User profile page with settings' },
  { icon: '🔐', text: 'Login/signup form with validation' },
];

export function EnhancedPromptInput({
  onSubmit,
  onImageUpload,
  isGenerating = false,
  placeholder = "Describe what you want to build..."
}: EnhancedPromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showClarifications, setShowClarifications] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [animationLevel, setAnimationLevel] = useState<'subtle' | 'moderate' | 'rich' | 'maximum'>('moderate');
  const [generateVariants, setGenerateVariants] = useState(false);
  const [variantCount, setVariantCount] = useState(3);
  const [useContextMemory, setUseContextMemory] = useState(true);
  const [analyzedIntent, setAnalyzedIntent] = useState<AnalyzedIntent | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze intent when prompt changes
  useEffect(() => {
    if (prompt.length > 10) {
      const analysis = analyzeIntent(prompt);
      setAnalyzedIntent(analysis);
      
      // Show clarifications if needed
      if (analysis.suggestedClarifications.length > 0 && analysis.confidence < 0.5) {
        setShowClarifications(true);
      }
    } else {
      setAnalyzedIntent(null);
      setShowClarifications(false);
    }
  }, [prompt]);

  // Load user preferences
  useEffect(() => {
    const prefs = loadPreferences();
    setSelectedStyle(prefs.preferredStyle || 'modern');
    const animationLevelValue = prefs.animationLevel as string;
    const validAnimationLevel: 'subtle' | 'moderate' | 'rich' | 'maximum' = 
      (animationLevelValue === 'subtle' || animationLevelValue === 'moderate' || animationLevelValue === 'rich' || animationLevelValue === 'maximum')
        ? (animationLevelValue as 'subtle' | 'moderate' | 'rich' | 'maximum')
        : 'moderate';
    setAnimationLevel(validAnimationLevel);
  }, []);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;

    // Build enhanced prompt
    let enhancedPrompt = prompt;
    
    // Add design system
    enhancedPrompt += '\n\n' + generateDesignSystemPrompt(selectedStyle as keyof typeof DESIGN_PRESETS);
    
    // Add animation instructions
    enhancedPrompt += '\n\n' + generateAnimationPrompt(animationLevel);
    
    // Add context memory if enabled
    if (useContextMemory) {
      enhancedPrompt = enhancePromptWithContext(enhancedPrompt);
    }
    
    // Add clarification answers
    if (Object.keys(clarificationAnswers).length > 0) {
      enhancedPrompt += '\n\n## Additional Requirements\n';
      Object.entries(clarificationAnswers).forEach(([key, value]) => {
        enhancedPrompt += `- ${key}: ${value}\n`;
      });
    }
    
    // Add intent analysis
    if (analyzedIntent) {
      enhancedPrompt += '\n\n' + analyzedIntent.enhancedPrompt;
    }

    const options: PromptOptions = {
      designPreset: selectedStyle,
      animationLevel,
      generateVariants,
      variantCount,
      useContextMemory,
      enhancedPrompt,
      analyzedIntent
    };

    onSubmit(prompt, options);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/') && onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser');
      return;
    }

    setIsRecording(true);
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(prev => prev + ' ' + transcript);
      setIsRecording(false);
    };
    
    recognition.onerror = () => {
      setIsRecording(false);
    };
    
    recognition.start();
  };

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
  };

  const handleClarificationAnswer = (questionId: string, answer: string) => {
    setClarificationAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  return (
    <div className="w-full space-y-3">
      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleQuickPrompt(qp.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-slate-700/50 rounded-full border border-slate-700/50 transition-colors"
          >
            <span>{qp.icon}</span>
            <span className="text-slate-300">{qp.text.slice(0, 30)}...</span>
          </button>
        ))}
      </div>

      {/* Main Input Area */}
      <div
        className={cn(
          "relative rounded-xl border transition-all",
          dragOver ? "border-violet-500 bg-violet-500/10" : "border-slate-700 bg-slate-900/50",
          "focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleImageDrop}
      >
        {/* Intent Analysis Badge */}
        {analyzedIntent && (
          <div className="absolute -top-3 left-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-violet-600/20 text-violet-300 border-violet-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              {analyzedIntent.type.charAt(0).toUpperCase() + analyzedIntent.type.slice(1)}
            </Badge>
            {analyzedIntent.designStyle && (
              <Badge variant="secondary" className="bg-pink-600/20 text-pink-300 border-pink-500/30">
                <Palette className="w-3 h-3 mr-1" />
                {analyzedIntent.designStyle}
              </Badge>
            )}
            {analyzedIntent.componentTypes[0] !== 'unknown' && (
              <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
                <Layout className="w-3 h-3 mr-1" />
                {analyzedIntent.componentTypes[0]}
              </Badge>
            )}
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Builder prompt input"
          className="min-h-[100px] bg-transparent border-0 resize-none focus-visible:ring-0 text-white placeholder:text-slate-500 pt-4"
          disabled={isGenerating}
        />

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between p-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            {/* Image Upload */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload image to recreate</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Voice Input */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      isRecording ? "text-red-500 animate-pulse" : "text-slate-400 hover:text-white"
                    )}
                    onClick={handleVoiceInput}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice input</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Style Preset Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white gap-1.5">
                  <Palette className="w-4 h-4" />
                  <span className="text-xs">{STYLE_PRESETS.find(s => s.id === selectedStyle)?.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Design Style</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STYLE_PRESETS.map(style => (
                  <DropdownMenuItem
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={cn(selectedStyle === style.id && "bg-violet-500/20")}
                  >
                    <span className="mr-2">{style.icon}</span>
                    <div>
                      <div className="font-medium">{style.name}</div>
                      <div className="text-xs text-slate-400">{style.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Animation Level Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs">{ANIMATION_LEVELS.find(a => a.id === animationLevel)?.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Animation Level</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ANIMATION_LEVELS.map(level => (
                  <DropdownMenuItem
                    key={level.id}
                    onClick={() => setAnimationLevel(level.id as any)}
                    className={cn(animationLevel === level.id && "bg-violet-500/20")}
                  >
                    <div>
                      <div className="font-medium">{level.name}</div>
                      <div className="text-xs text-slate-400">{level.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Options */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-slate-400 hover:text-white gap-1.5"
              onClick={() => setShowOptions(!showOptions)}
            >
              <Settings2 className="w-4 h-4" />
              <span className="text-xs">Options</span>
              {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Options */}
      {showOptions && (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Generate Variants */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={generateVariants}
                onChange={(e) => setGenerateVariants(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
              />
              <div>
                <div className="text-sm font-medium text-white">Generate Variants</div>
                <div className="text-xs text-slate-400">Create multiple design options</div>
              </div>
            </label>

            {/* Use Context Memory */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useContextMemory}
                onChange={(e) => setUseContextMemory(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
              />
              <div>
                <div className="text-sm font-medium text-white">Use Preferences</div>
                <div className="text-xs text-slate-400">Apply learned preferences</div>
              </div>
            </label>
          </div>

          {generateVariants && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Number of variants:</span>
              <Tabs value={String(variantCount)} onValueChange={(v) => setVariantCount(Number(v))}>
                <TabsList className="bg-slate-700/50">
                  <TabsTrigger value="2">2</TabsTrigger>
                  <TabsTrigger value="3">3</TabsTrigger>
                  <TabsTrigger value="4">4</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>
      )}

      {/* Clarification Questions */}
      {showClarifications && analyzedIntent && analyzedIntent.suggestedClarifications.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm font-medium">Help me understand better</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-amber-400 hover:text-amber-300"
              onClick={() => setShowClarifications(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {analyzedIntent.suggestedClarifications.slice(0, 3).map((question) => (
              <div key={question.id} className="space-y-2">
                <div className="text-sm text-slate-300">{question.question}</div>
                {question.options ? (
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleClarificationAnswer(question.id, option)}
                        className={cn(
                          "px-3 py-1 text-xs rounded-full border transition-colors",
                          clarificationAnswers[question.id] === option
                            ? "bg-violet-600 border-violet-500 text-white"
                            : "bg-slate-800 border-slate-600 text-slate-300 hover:border-violet-500"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                    onChange={(e) => handleClarificationAnswer(question.id, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Overlay */}
      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-violet-500/20 border-2 border-dashed border-violet-500 rounded-xl z-10">
          <div className="text-center">
            <Upload className="w-8 h-8 text-violet-400 mx-auto mb-2" />
            <div className="text-violet-300 font-medium">Drop image to analyze</div>
            <div className="text-violet-400 text-sm">We'll generate matching code</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedPromptInput;
