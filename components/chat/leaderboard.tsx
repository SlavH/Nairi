"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Brain,
  Code,
  MessageSquare,
  Image,
  Music,
  Video,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Users,
  Clock,
  BarChart,
  Crown,
  Sparkles
} from "lucide-react";

interface ModelRanking {
  id: string;
  name: string;
  provider: string;
  avatar: string;
  rank: number;
  previousRank: number;
  score: number;
  votes: { up: number; down: number };
  category: string;
  specialties: string[];
  responseTime: number;
  accuracy: number;
  creativity: number;
  reasoning: number;
}

interface BotRanking {
  id: string;
  name: string;
  creator: string;
  avatar: string;
  rank: number;
  previousRank: number;
  uses: number;
  rating: number;
  category: string;
  description: string;
}

const MODEL_RANKINGS: ModelRanking[] = [
  {
    id: '1',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    avatar: '/models/gpt4.png',
    rank: 1,
    previousRank: 1,
    score: 1420,
    votes: { up: 15420, down: 1230 },
    category: 'general',
    specialties: ['Reasoning', 'Coding', 'Writing'],
    responseTime: 2.3,
    accuracy: 94,
    creativity: 88,
    reasoning: 96
  },
  {
    id: '2',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    avatar: '/models/claude.png',
    rank: 2,
    previousRank: 3,
    score: 1385,
    votes: { up: 12300, down: 980 },
    category: 'general',
    specialties: ['Analysis', 'Writing', 'Safety'],
    responseTime: 2.8,
    accuracy: 93,
    creativity: 91,
    reasoning: 94
  },
  {
    id: '3',
    name: 'Gemini Ultra',
    provider: 'Google',
    avatar: '/models/gemini.png',
    rank: 3,
    previousRank: 2,
    score: 1350,
    votes: { up: 10500, down: 1100 },
    category: 'general',
    specialties: ['Multimodal', 'Research', 'Math'],
    responseTime: 2.1,
    accuracy: 92,
    creativity: 85,
    reasoning: 93
  },
  {
    id: '4',
    name: 'Llama 3 70B',
    provider: 'Meta',
    avatar: '/models/llama.png',
    rank: 4,
    previousRank: 5,
    score: 1280,
    votes: { up: 8900, down: 890 },
    category: 'general',
    specialties: ['Open Source', 'Coding', 'Fast'],
    responseTime: 1.5,
    accuracy: 88,
    creativity: 82,
    reasoning: 87
  },
  {
    id: '5',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    avatar: '/models/mistral.png',
    rank: 5,
    previousRank: 4,
    score: 1250,
    votes: { up: 7800, down: 920 },
    category: 'general',
    specialties: ['Efficiency', 'Multilingual', 'Coding'],
    responseTime: 1.8,
    accuracy: 87,
    creativity: 84,
    reasoning: 86
  },
  {
    id: '6',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    avatar: '/models/dalle.png',
    rank: 1,
    previousRank: 1,
    score: 1380,
    votes: { up: 11200, down: 780 },
    category: 'image',
    specialties: ['Photorealistic', 'Text in Images', 'Artistic'],
    responseTime: 8.5,
    accuracy: 91,
    creativity: 95,
    reasoning: 0
  },
  {
    id: '7',
    name: 'Midjourney v6',
    provider: 'Midjourney',
    avatar: '/models/midjourney.png',
    rank: 2,
    previousRank: 2,
    score: 1350,
    votes: { up: 10800, down: 650 },
    category: 'image',
    specialties: ['Artistic', 'Stylized', 'Aesthetic'],
    responseTime: 12.0,
    accuracy: 88,
    creativity: 98,
    reasoning: 0
  },
  {
    id: '8',
    name: 'Codex',
    provider: 'OpenAI',
    avatar: '/models/codex.png',
    rank: 1,
    previousRank: 1,
    score: 1400,
    votes: { up: 9500, down: 420 },
    category: 'code',
    specialties: ['Code Generation', 'Debugging', 'Explanation'],
    responseTime: 1.9,
    accuracy: 92,
    creativity: 78,
    reasoning: 90
  }
];

const BOT_RANKINGS: BotRanking[] = [
  {
    id: '1',
    name: 'Code Wizard',
    creator: 'DevTools',
    avatar: '/bots/code-wizard.png',
    rank: 1,
    previousRank: 2,
    uses: 125000,
    rating: 4.9,
    category: 'Development',
    description: 'Expert coding assistant for all languages'
  },
  {
    id: '2',
    name: 'Writing Coach',
    creator: 'ContentPro',
    avatar: '/bots/writing-coach.png',
    rank: 2,
    previousRank: 1,
    uses: 98000,
    rating: 4.8,
    category: 'Writing',
    description: 'Professional writing and editing assistant'
  },
  {
    id: '3',
    name: 'Math Tutor',
    creator: 'EduAI',
    avatar: '/bots/math-tutor.png',
    rank: 3,
    previousRank: 3,
    uses: 87000,
    rating: 4.8,
    category: 'Education',
    description: 'Step-by-step math problem solver'
  },
  {
    id: '4',
    name: 'Legal Advisor',
    creator: 'LawTech',
    avatar: '/bots/legal.png',
    rank: 4,
    previousRank: 5,
    uses: 65000,
    rating: 4.7,
    category: 'Legal',
    description: 'Legal document analysis and advice'
  },
  {
    id: '5',
    name: 'Health Guide',
    creator: 'MedAI',
    avatar: '/bots/health.png',
    rank: 5,
    previousRank: 4,
    uses: 58000,
    rating: 4.6,
    category: 'Health',
    description: 'Health information and wellness tips'
  }
];

const CATEGORIES = [
  { id: 'general', label: 'General', icon: Brain },
  { id: 'code', label: 'Coding', icon: Code },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'writing', label: 'Writing', icon: FileText },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'audio', label: 'Audio', icon: Music },
];

export function Leaderboard() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [selectedModel, setSelectedModel] = useState<ModelRanking | null>(null);

  const filteredModels = MODEL_RANKINGS.filter(
    model => model.category === selectedCategory
  ).sort((a, b) => a.rank - b.rank);

  const getRankChange = (current: number, previous: number) => {
    if (current < previous) return { icon: TrendingUp, color: 'text-green-500', change: previous - current };
    if (current > previous) return { icon: TrendingDown, color: 'text-red-500', change: current - previous };
    return { icon: Minus, color: 'text-muted-foreground', change: 0 };
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Rankings of AI models and community bots
        </p>
      </div>

      <Tabs defaultValue="models" className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="mt-2">
            <TabsTrigger value="models">AI Models</TabsTrigger>
            <TabsTrigger value="bots">Community Bots</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="models" className="flex-1 flex flex-col mt-0">
          {/* Category Filter */}
          <div className="border-b">
            <ScrollArea className="w-full">
              <div className="flex gap-2 p-4">
                {CATEGORIES.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex-shrink-0"
                  >
                    <category.icon className="h-4 w-4 mr-2" />
                    {category.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Rankings */}
          <div className="flex-1 flex overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {filteredModels.map(model => {
                  const rankChange = getRankChange(model.rank, model.previousRank);
                  const RankIcon = rankChange.icon;
                  
                  return (
                    <Card
                      key={model.id}
                      className={`cursor-pointer transition-colors ${
                        selectedModel?.id === model.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedModel(model)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 flex justify-center">
                            {getRankBadge(model.rank)}
                          </div>
                          
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10">
                              {model.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{model.name}</h3>
                              <Badge variant="outline">{model.provider}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {model.score} ELO
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {formatNumber(model.votes.up)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {model.responseTime}s
                              </span>
                            </div>
                          </div>
                          
                          <div className={`flex items-center gap-1 ${rankChange.color}`}>
                            <RankIcon className="h-4 w-4" />
                            {rankChange.change > 0 && (
                              <span className="text-sm">{rankChange.change}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 mt-3">
                          {model.specialties.map(specialty => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Model Details */}
            {selectedModel && (
              <div className="w-80 border-l p-4">
                <div className="text-center mb-6">
                  <Avatar className="h-20 w-20 mx-auto mb-3">
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {selectedModel.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold">{selectedModel.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedModel.provider}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {getRankBadge(selectedModel.rank)}
                    <span className="text-2xl font-bold">{selectedModel.score}</span>
                    <span className="text-muted-foreground">ELO</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Accuracy</span>
                      <span>{selectedModel.accuracy}%</span>
                    </div>
                    <Progress value={selectedModel.accuracy} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Creativity</span>
                      <span>{selectedModel.creativity}%</span>
                    </div>
                    <Progress value={selectedModel.creativity} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Reasoning</span>
                      <span>{selectedModel.reasoning}%</span>
                    </div>
                    <Progress value={selectedModel.reasoning} />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Votes</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-green-500">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{formatNumber(selectedModel.votes.up)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-500">
                      <ThumbsDown className="h-4 w-4" />
                      <span>{formatNumber(selectedModel.votes.down)}</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Try This Model
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bots" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {BOT_RANKINGS.map(bot => {
                const rankChange = getRankChange(bot.rank, bot.previousRank);
                const RankIcon = rankChange.icon;
                
                return (
                  <Card key={bot.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 flex justify-center">
                          {getRankBadge(bot.rank)}
                        </div>
                        
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10">
                            {bot.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{bot.name}</h3>
                            <Badge variant="secondary">{bot.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {bot.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {formatNumber(bot.uses)} uses
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {bot.rating}
                            </span>
                            <span>by {bot.creator}</span>
                          </div>
                        </div>
                        
                        <div className={`flex items-center gap-1 ${rankChange.color}`}>
                          <RankIcon className="h-4 w-4" />
                          {rankChange.change > 0 && (
                            <span className="text-sm">{rankChange.change}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Leaderboard;
