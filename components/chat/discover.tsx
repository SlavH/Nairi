"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  TrendingUp,
  Sparkles,
  Globe,
  Code,
  Briefcase,
  GraduationCap,
  Heart,
  Gamepad2,
  Music,
  Film,
  BookOpen,
  Newspaper,
  DollarSign,
  Microscope,
  Palette,
  ChefHat,
  Plane,
  Dumbbell,
  Star,
  Users,
  MessageSquare,
  ExternalLink,
  Clock,
  Eye
} from "lucide-react";

interface DiscoverItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  views: number;
  likes: number;
  author?: string;
  authorAvatar?: string;
  isNew?: boolean;
  isTrending?: boolean;
  type: 'prompt' | 'agent' | 'space' | 'thread';
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'tech', label: 'Technology', icon: Code },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'science', label: 'Science', icon: Microscope },
  { id: 'creative', label: 'Creative', icon: Palette },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'entertainment', label: 'Entertainment', icon: Film },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'food', label: 'Food', icon: ChefHat },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'news', label: 'News', icon: Newspaper },
];

const DISCOVER_ITEMS: DiscoverItem[] = [
  {
    id: '1',
    title: 'AI Code Review Assistant',
    description: 'Get instant code reviews with best practices and security suggestions',
    category: 'tech',
    icon: Code,
    views: 15420,
    likes: 892,
    author: 'DevTools',
    type: 'agent',
    isTrending: true
  },
  {
    id: '2',
    title: 'Market Analysis Pro',
    description: 'Real-time market analysis and investment insights',
    category: 'finance',
    icon: DollarSign,
    views: 12300,
    likes: 756,
    author: 'FinanceAI',
    type: 'agent',
    isTrending: true
  },
  {
    id: '3',
    title: 'Creative Writing Workshop',
    description: 'Interactive prompts for storytelling and creative writing',
    category: 'creative',
    icon: BookOpen,
    views: 9800,
    likes: 623,
    author: 'WritersHub',
    type: 'space',
    isNew: true
  },
  {
    id: '4',
    title: 'Research Paper Summarizer',
    description: 'Summarize and analyze academic papers in seconds',
    category: 'science',
    icon: Microscope,
    views: 8500,
    likes: 534,
    author: 'AcademicAI',
    type: 'agent'
  },
  {
    id: '5',
    title: 'Startup Pitch Generator',
    description: 'Create compelling pitch decks and business plans',
    category: 'business',
    icon: Briefcase,
    views: 7200,
    likes: 445,
    author: 'StartupKit',
    type: 'prompt',
    isNew: true
  },
  {
    id: '6',
    title: 'Language Learning Tutor',
    description: 'Practice conversations in 50+ languages with AI',
    category: 'education',
    icon: GraduationCap,
    views: 11000,
    likes: 678,
    author: 'LinguaAI',
    type: 'agent'
  },
  {
    id: '7',
    title: 'Recipe Generator',
    description: 'Create recipes based on ingredients you have',
    category: 'food',
    icon: ChefHat,
    views: 6500,
    likes: 412,
    author: 'FoodieAI',
    type: 'prompt'
  },
  {
    id: '8',
    title: 'Workout Planner',
    description: 'Personalized workout plans based on your goals',
    category: 'fitness',
    icon: Dumbbell,
    views: 5800,
    likes: 367,
    author: 'FitCoach',
    type: 'agent'
  },
  {
    id: '9',
    title: 'Travel Itinerary Builder',
    description: 'Plan your perfect trip with AI recommendations',
    category: 'travel',
    icon: Plane,
    views: 7800,
    likes: 489,
    author: 'TravelBot',
    type: 'space'
  },
  {
    id: '10',
    title: 'Game Design Assistant',
    description: 'Design game mechanics, stories, and characters',
    category: 'gaming',
    icon: Gamepad2,
    views: 4500,
    likes: 298,
    author: 'GameDevAI',
    type: 'agent',
    isNew: true
  }
];

export function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [items] = useState<DiscoverItem[]>(DISCOVER_ITEMS);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           selectedCategory === 'trending' && item.isTrending ||
                           item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Discover
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore popular prompts, agents, and spaces
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts, agents, spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
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

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="spaces">Spaces</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <Card key={item.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {item.title}
                              {item.isNew && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                              {item.isTrending && (
                                <Badge className="text-xs bg-orange-500">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Trending
                                </Badge>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      <CardDescription className="mt-2">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {item.author?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {item.author}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(item.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {formatNumber(item.likes)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="agents" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.filter(i => i.type === 'agent').map(item => (
                  <Card key={item.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{item.author}</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {formatNumber(item.likes)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="prompts" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.filter(i => i.type === 'prompt').map(item => (
                  <Card key={item.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{item.author}</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {formatNumber(item.likes)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="spaces" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.filter(i => i.type === 'space').map(item => (
                  <Card key={item.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{item.author}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatNumber(item.views)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

export default Discover;
