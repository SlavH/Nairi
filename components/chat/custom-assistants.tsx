"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Share2,
  Sparkles,
  MessageSquare,
  Star,
  StarOff,
  Search,
  Zap,
  Brain,
  Code,
  Palette,
  BookOpen,
  Briefcase,
  Heart,
  Music,
  Camera,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomAssistant {
  id: string;
  name: string;
  description: string;
  avatar: string;
  systemPrompt: string;
  welcomeMessage: string;
  category: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isFavorite: boolean;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

interface CustomAssistantsProps {
  assistants: CustomAssistant[];
  activeAssistantId?: string;
  onSelectAssistant: (assistantId: string) => void;
  onCreateAssistant: (assistant: Omit<CustomAssistant, "id" | "createdAt" | "updatedAt" | "usageCount">) => void;
  onUpdateAssistant: (assistantId: string, updates: Partial<CustomAssistant>) => void;
  onDeleteAssistant: (assistantId: string) => void;
  onDuplicateAssistant: (assistantId: string) => void;
}

const CATEGORIES = [
  { value: "general", label: "Общие", icon: Sparkles },
  { value: "coding", label: "Программирование", icon: Code },
  { value: "creative", label: "Творчество", icon: Palette },
  { value: "education", label: "Образование", icon: BookOpen },
  { value: "business", label: "Бизнес", icon: Briefcase },
  { value: "lifestyle", label: "Лайфстайл", icon: Heart },
  { value: "music", label: "Музыка", icon: Music },
  { value: "visual", label: "Визуал", icon: Camera },
  { value: "research", label: "Исследования", icon: Brain },
];

const AVATARS = [
  "🤖", "🧠", "💡", "🎯", "🚀", "⚡", "🔮", "🎨",
  "📚", "💻", "🎵", "📷", "🌟", "🔬", "✨", "🎭",
  "🦾", "🧬", "🎪", "🌈", "🔥", "💎", "🎲", "🧩",
];

const MODELS = [
  { value: "bitnet", label: "Colab" },
];

const PRESET_ASSISTANTS = [
  {
    name: "Код-ревьюер",
    description: "Проверяет код, находит баги и предлагает улучшения",
    avatar: "💻",
    category: "coding",
    systemPrompt: "Ты опытный код-ревьюер. Анализируй код, находи потенциальные проблемы, предлагай улучшения по производительности, читаемости и безопасности.",
    welcomeMessage: "Привет! Я готов проверить ваш код. Вставьте код, который нужно проанализировать.",
    tags: ["код", "ревью", "программирование"],
  },
  {
    name: "Креативный писатель",
    description: "Помогает писать истории, сценарии и творческие тексты",
    avatar: "✍️",
    category: "creative",
    systemPrompt: "Ты талантливый писатель с богатым воображением. Помогай создавать увлекательные истории, развивать персонажей и строить захватывающие сюжеты.",
    welcomeMessage: "Здравствуйте! Давайте создадим что-то удивительное вместе. О чём вы хотите написать?",
    tags: ["писательство", "истории", "творчество"],
  },
  {
    name: "Бизнес-консультант",
    description: "Советы по стратегии, маркетингу и развитию бизнеса",
    avatar: "📊",
    category: "business",
    systemPrompt: "Ты опытный бизнес-консультант с MBA. Давай стратегические советы, анализируй рынок, помогай с бизнес-планами и маркетинговыми стратегиями.",
    welcomeMessage: "Добрый день! Я готов помочь с вашими бизнес-вопросами. Расскажите о вашей ситуации.",
    tags: ["бизнес", "стратегия", "маркетинг"],
  },
  {
    name: "Учитель языков",
    description: "Помогает изучать иностранные языки",
    avatar: "🌍",
    category: "education",
    systemPrompt: "Ты терпеливый и опытный преподаватель языков. Объясняй грамматику, помогай с произношением, давай упражнения и исправляй ошибки мягко и конструктивно.",
    welcomeMessage: "Hello! Bonjour! Hola! Какой язык вы хотите изучать сегодня?",
    tags: ["языки", "обучение", "практика"],
  },
];

export function CustomAssistants({
  assistants,
  activeAssistantId,
  onSelectAssistant,
  onCreateAssistant,
  onUpdateAssistant,
  onDeleteAssistant,
  onDuplicateAssistant,
}: CustomAssistantsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<CustomAssistant | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [newAssistant, setNewAssistant] = useState({
    name: "",
    description: "",
    avatar: "🤖",
    systemPrompt: "",
    welcomeMessage: "",
    category: "general",
    model: "bitnet",
    temperature: 0.7,
    maxTokens: 4096,
    isFavorite: false,
    isPublic: false,
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  const filteredAssistants = assistants.filter((assistant) => {
    const matchesSearch =
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || assistant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const favoriteAssistants = filteredAssistants.filter((a) => a.isFavorite);
  const regularAssistants = filteredAssistants.filter((a) => !a.isFavorite);

  const handleCreateAssistant = () => {
    if (!newAssistant.name.trim()) return;
    onCreateAssistant(newAssistant);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const handleUpdateAssistant = () => {
    if (!editingAssistant) return;
    onUpdateAssistant(editingAssistant.id, editingAssistant);
    setEditingAssistant(null);
  };

  const resetForm = () => {
    setNewAssistant({
      name: "",
      description: "",
      avatar: "🤖",
      systemPrompt: "",
      welcomeMessage: "",
      category: "general",
      model: "bitnet",
      temperature: 0.7,
      maxTokens: 4096,
      isFavorite: false,
      isPublic: false,
      tags: [],
    });
  };

  const applyPreset = (preset: typeof PRESET_ASSISTANTS[0]) => {
    setNewAssistant({
      ...newAssistant,
      ...preset,
    });
    setShowPresets(false);
  };

  const addTag = () => {
    if (newTag.trim() && !newAssistant.tags.includes(newTag.trim())) {
      setNewAssistant({
        ...newAssistant,
        tags: [...newAssistant.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setNewAssistant({
      ...newAssistant,
      tags: newAssistant.tags.filter((t) => t !== tag),
    });
  };

  const toggleFavorite = (assistant: CustomAssistant) => {
    onUpdateAssistant(assistant.id, { isFavorite: !assistant.isFavorite });
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat ? cat.icon : Sparkles;
  };

  const AssistantCard = ({ assistant }: { assistant: CustomAssistant }) => {
    const CategoryIcon = getCategoryIcon(assistant.category);
    
    return (
      <Card
        className={cn(
          "p-4 cursor-pointer transition-all hover:shadow-lg border-2",
          activeAssistantId === assistant.id
            ? "border-primary bg-primary/5"
            : "border-transparent hover:border-gray-700"
        )}
        onClick={() => onSelectAssistant(assistant.id)}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-2xl">
            {assistant.avatar}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white truncate">{assistant.name}</h3>
              <Badge variant="outline" className="text-xs">
                <CategoryIcon className="h-3 w-3 mr-1" />
                {CATEGORIES.find((c) => c.value === assistant.category)?.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 line-clamp-2 mt-1">
              {assistant.description}
            </p>
            
            {/* Tags */}
            {assistant.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {assistant.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {assistant.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{assistant.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(assistant);
              }}
            >
              {assistant.isFavorite ? (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4 text-gray-500" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAssistant(assistant);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateAssistant(assistant.id);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Дублировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Поделиться
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAssistant(assistant.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {assistant.usageCount} использований
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {assistant.model}
          </span>
        </div>
      </Card>
    );
  };

  const AssistantForm = ({
    assistant,
    setAssistant,
    onSubmit,
    submitLabel,
  }: {
    assistant: typeof newAssistant;
    setAssistant: (assistant: typeof newAssistant) => void;
    onSubmit: () => void;
    submitLabel: string;
  }) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Presets button */}
      {!editingAssistant && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowPresets(!showPresets)}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Использовать шаблон
        </Button>
      )}

      {/* Presets list */}
      {showPresets && (
        <div className="grid grid-cols-2 gap-2">
          {PRESET_ASSISTANTS.map((preset, index) => (
            <Card
              key={index}
              className="p-3 cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={() => applyPreset(preset)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{preset.avatar}</span>
                <div>
                  <p className="font-medium text-sm">{preset.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">
                    {preset.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Название</label>
          <Input
            value={assistant.name}
            onChange={(e) => setAssistant({ ...assistant, name: e.target.value })}
            placeholder="Мой ассистент"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Категория</label>
          <Select
            value={assistant.category}
            onValueChange={(value) => setAssistant({ ...assistant, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-4 w-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Описание</label>
        <Textarea
          value={assistant.description}
          onChange={(e) => setAssistant({ ...assistant, description: e.target.value })}
          placeholder="Краткое описание ассистента..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Аватар</label>
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              className={cn(
                "w-10 h-10 rounded-lg text-xl hover:bg-gray-700 transition-colors",
                assistant.avatar === avatar && "bg-primary/20 ring-2 ring-primary"
              )}
              onClick={() => setAssistant({ ...assistant, avatar })}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Системный промпт</label>
        <Textarea
          value={assistant.systemPrompt}
          onChange={(e) => setAssistant({ ...assistant, systemPrompt: e.target.value })}
          placeholder="Опишите роль и поведение ассистента..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Приветственное сообщение</label>
        <Textarea
          value={assistant.welcomeMessage}
          onChange={(e) => setAssistant({ ...assistant, welcomeMessage: e.target.value })}
          placeholder="Сообщение при начале чата..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Модель</label>
          <Select
            value={assistant.model}
            onValueChange={(value) => setAssistant({ ...assistant, model: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Температура: {assistant.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={assistant.temperature}
            onChange={(e) =>
              setAssistant({ ...assistant, temperature: parseFloat(e.target.value) })
            }
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Теги</label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Добавить тег..."
            onKeyPress={(e) => e.key === "Enter" && addTag()}
          />
          <Button type="button" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {assistant.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {assistant.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button onClick={onSubmit} className="w-full">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Ассистенты
          </h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Создать
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать ассистента</DialogTitle>
              </DialogHeader>
              <AssistantForm
                assistant={newAssistant}
                setAssistant={setNewAssistant}
                onSubmit={handleCreateAssistant}
                submitLabel="Создать ассистента"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск ассистентов..."
            className="pl-10"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Все
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              <cat.icon className="h-4 w-4 mr-1" />
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Assistants list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Favorites */}
        {favoriteAssistants.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Избранные
            </h3>
            <div className="space-y-2">
              {favoriteAssistants.map((assistant) => (
                <AssistantCard key={assistant.id} assistant={assistant} />
              ))}
            </div>
          </div>
        )}

        {/* All assistants */}
        {regularAssistants.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Все ассистенты
            </h3>
            <div className="space-y-2">
              {regularAssistants.map((assistant) => (
                <AssistantCard key={assistant.id} assistant={assistant} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredAssistants.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Ассистентов нет
            </h3>
            <p className="text-gray-500 mb-4">
              Создайте своего первого AI-ассистента
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать ассистента
            </Button>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingAssistant} onOpenChange={() => setEditingAssistant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать ассистента</DialogTitle>
          </DialogHeader>
          {editingAssistant && (
            <AssistantForm
              assistant={editingAssistant}
              setAssistant={(a) => setEditingAssistant({ ...editingAssistant, ...a } as CustomAssistant)}
              onSubmit={handleUpdateAssistant}
              submitLabel="Сохранить изменения"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CustomAssistants;
